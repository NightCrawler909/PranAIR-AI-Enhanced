"""
PranAIR Medical Drone Backend
==============================
Main FastAPI application for medical drone project.

Features:
- Image dispatch and analysis (BLIP on CPU)
- Drone telemetry simulation
- Patient Voice Assistant (Gemini API - text only)

Architecture:
- CUDA disabled globally for stability
- CPU-only inference for BLIP model
- Simulation fallback if model fails to load
- Proper async file handling to prevent UnicodeDecodeError
"""

# ============================================================================
# 🔥 CUDA SAFETY - MUST BE FIRST (BEFORE ANY IMPORTS)
# ============================================================================
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""  # HARD DISABLE ALL CUDA ACCESS
# This prevents CUDA-related crashes and forces CPU inference
# ============================================================================

import logging
import random
import io
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image

# ============================================================================
# AI MODEL IMPORTS (with error handling)
# ============================================================================
try:
    from transformers import pipeline, AutoProcessor, BlipForConditionalGeneration
    TRANSFORMERS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Transformers not available: {e}")
    TRANSFORMERS_AVAILABLE = False

# ============================================================================
# IMPORT PATIENT VOICE ASSISTANT ROUTER
# ============================================================================
try:
    from patient_gemini_assistant import router as patient_router
    PATIENT_ROUTER_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Patient router not available: {e}")
    PATIENT_ROUTER_AVAILABLE = False


# ============================================================================
# LOGGING SETUP
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================
app = FastAPI(
    title="PranAIR Medical Drone Backend",
    description="AI-powered medical drone dispatch and patient assistance system",
    version="2.0.0"
)

# ============================================================================
# CORS MIDDLEWARE - ALLOW ALL ORIGINS
# ============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)
logger.info("CORS enabled for all origins")

# ============================================================================
# REGISTER PATIENT VOICE ASSISTANT ROUTER
# ============================================================================
if PATIENT_ROUTER_AVAILABLE:
    app.include_router(patient_router)
    logger.info("✅ Patient Voice Assistant router registered at /patient/*")
else:
    logger.warning("⚠️  Patient router not available - /patient/* endpoints disabled")

# ============================================================================
# GLOBAL DRONE TELEMETRY STATE
# ============================================================================
DRONE_TELEMETRY = {
    'battery': 98.5,      # Percentage (0-100)
    'altitude': 120.0,    # Meters
    'status': 'AIRBORNE', # AIRBORNE, LANDING, GROUNDED
    'lat': 28.61,         # Latitude
    'lng': 77.20          # Longitude
}

# Device configuration
device_name = "CPU"

# ============================================================================
# AI MODEL LOADING (BLIP IMAGE CAPTIONING - CPU ONLY)
# ============================================================================
image_to_text = None
blip_model = None
blip_processor = None
AI_MODE = "SIMULATION"  # Default to simulation

if TRANSFORMERS_AVAILABLE:
    try:
        logger.info("=" * 70)
        logger.info("🤖 Loading BLIP Model: Salesforce/blip-image-captioning-base")
        logger.info("📦 Using safetensors format for security")
        logger.info("💻 Device: CPU (CUDA disabled)")
        logger.info("=" * 70)
        
        # Step 1: Load processor
        logger.info("Loading AutoProcessor...")
        blip_processor = AutoProcessor.from_pretrained(
            "Salesforce/blip-image-captioning-base",
            use_fast=True
        )
        logger.info("✅ Processor loaded")
        
        # Step 2: Load model with safetensors on CPU
        logger.info("Loading BlipForConditionalGeneration...")
        blip_model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base",
            use_safetensors=True
        )
        # Explicitly move to CPU
        blip_model = blip_model.to("cpu")
        blip_model.eval()  # Set to evaluation mode
        logger.info("✅ Model loaded on CPU")
        
        # Step 3: Create pipeline
        logger.info("Creating inference pipeline...")
        image_to_text = pipeline(
            "image-to-text",
            model=blip_model,
            tokenizer=blip_processor.tokenizer,
            image_processor=blip_processor.image_processor,
            device=-1  # Force CPU (-1 means CPU in transformers)
        )
        
        AI_MODE = "AI"
        logger.info("=" * 70)
        logger.info("✅ BLIP Model Ready")
        logger.info(f"🎯 Mode: {AI_MODE}")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error("=" * 70)
        logger.error(f"❌ CRITICAL: Failed to load BLIP model")
        logger.error(f"Error: {e}")
        logger.error(f"Type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        logger.error("🔄 Falling back to SIMULATION mode")
        logger.error("=" * 70)
        image_to_text = None
        blip_model = None
        blip_processor = None
        AI_MODE = "SIMULATION"
else:
    logger.warning("⚠️  Transformers library not available - using SIMULATION mode")
    AI_MODE = "SIMULATION"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_simulation_data(source: str = "live_video_frame") -> dict:
    """
    Returns fallback simulation data when AI is unavailable.
    
    Args:
        source: Source of the request (live_video_frame or uploaded_image)
        
    Returns:
        dict: Simulated medical triage data
    """
    # Random severity for variety in simulation
    severity_options = [2, 5, 7, 8]
    severity = random.choice(severity_options)
    
    injury_types = {
        2: "Scene appears stable - no immediate danger",
        5: "Minor injury detected - monitoring required",
        7: "Moderate injury - person on ground",
        8: "Severe injury detected - immediate attention needed"
    }
    
    return {
        "injury_type": injury_types.get(severity, "Unknown"),
        "severity_score": severity,
        "confidence": 0.92,
        "mode": "SIMULATION",
        "source": source
    }


def caption_to_triage(caption: str, mode: str = "AI", source: str = "live_video_frame") -> dict:
    """
    Converts BLIP caption into medical triage data.
    
    Triage Logic:
    - If caption contains: injured, lying, fallen, ground → severity 7
    - Otherwise → severity 2
    
    Args:
        caption: Image caption from BLIP model
        mode: AI or SIMULATION
        source: live_video_frame or uploaded_image
        
    Returns:
        dict: Triage data with injury_type, severity_score, confidence
    """
    caption_lower = caption.lower()
    
    # Critical keywords indicating potential injury
    critical_keywords = ["injured", "lying", "fallen", "ground", "fall", "hurt"]
    
    # Default to low severity
    severity_score = 2
    confidence = 0.70
    injury_type = "Scene appears stable"
    
    # Check for critical conditions
    if any(keyword in caption_lower for keyword in critical_keywords):
        injury_type = "Potential injury detected - person on ground"
        severity_score = 7
        confidence = 0.85
        logger.info(f"⚠️  Critical condition detected in caption: '{caption}'")
    else:
        logger.info(f"✅ No critical keywords in caption: '{caption}'")
    
    # Boost confidence for uploaded images (assumed higher quality)
    if source == "uploaded_image":
        confidence = min(0.99, confidence + 0.10)
        logger.info("📸 Boosting confidence for uploaded image")
    
    return {
        "injury_type": injury_type,
        "severity_score": severity_score,
        "confidence": round(confidence, 2),
        "mode": mode,
        "source": source,
        "caption": caption  # Include original caption for debugging
    }


def analyze_image_with_blip(image_bytes: bytes, source: str = "live_video_frame") -> dict:
    """
    Analyzes image using BLIP model or simulation fallback.
    
    Args:
        image_bytes: Raw image bytes from upload
        source: Source of the image (live_video_frame or uploaded_image)
        
    Returns:
        dict: Medical triage data with injury analysis
    """
    try:
        # Check if AI model is available
        if image_to_text is None:
            logger.warning("AI model not available - using simulation")
            return get_simulation_data(source)
        
        logger.info(f"📊 Analyzing image: {len(image_bytes)} bytes from {source}")
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary (BLIP expects RGB)
        if image.mode != "RGB":
            image = image.convert("RGB")
            logger.info(f"Converted image from {image.mode} to RGB")
        
        logger.info(f"Image size: {image.size}, mode: {image.mode}")
        
        # Run BLIP inference
        logger.info("🤖 Running BLIP inference...")
        result = image_to_text(image)
        
        # Extract caption
        caption = ""
        if isinstance(result, list) and len(result) > 0:
            caption = result[0].get("generated_text", "")
        
        if not caption:
            logger.warning("Empty caption from BLIP - using simulation")
            return get_simulation_data(source)
        
        logger.info(f"✅ BLIP Caption: '{caption}'")
        
        # Convert caption to triage
        return caption_to_triage(caption, mode="AI", source=source)
        
    except Exception as e:
        logger.error(f"❌ AI analysis failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Fallback to simulation
        return get_simulation_data(source)


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.post("/dispatch")
async def dispatch(
    file: UploadFile = File(..., description="Image file (JPG, PNG, WebP)"),
    source: str = Form("live_video_frame", description="Source: live_video_frame or uploaded_image")
):
    """
    Main dispatch endpoint - receives image for medical triage analysis.
    
    **Flow**:
    1. Receives multipart/form-data with image file
    2. Reads image bytes asynchronously (prevents UnicodeDecodeError)
    3. Runs BLIP AI analysis or simulation fallback
    4. Applies triage logic (keywords → severity score)
    5. Returns analysis + current drone telemetry
    
    **Request**:
    - file: UploadFile (binary image data)
    - source: str (optional, default: "live_video_frame")
    
    **Response**:
    ```json
    {
      "analysis": {
        "injury_type": "Potential injury detected - person on ground",
        "severity_score": 7,
        "confidence": 0.85,
        "mode": "AI",
        "source": "live_video_frame",
        "caption": "a person lying on the ground"
      },
      "telemetry": {
        "battery": 98.5,
        "altitude": 120.0,
        "status": "AIRBORNE",
        "lat": 28.61,
        "lng": 77.20
      }
    }
    ```
    """
    logger.info("=" * 70)
    logger.info(f"📡 Dispatch request received")
    logger.info(f"   Filename: {file.filename}")
    logger.info(f"   Content-Type: {file.content_type}")
    logger.info(f"   Source: {source}")
    logger.info("=" * 70)
    
    try:
        # Explicitly read bytes asynchronously
        # This prevents UnicodeDecodeError during validation
        image_bytes = await file.read()
        
        # Validate image data
        if len(image_bytes) == 0:
            logger.error("❌ Empty image file received")
            raise HTTPException(status_code=400, detail="Empty image file")
        
        if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
            logger.error(f"❌ Image too large: {len(image_bytes)} bytes")
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
        
        logger.info(f"✅ Image validated: {len(image_bytes)} bytes")
        
        # Analyze image
        analysis_result = analyze_image_with_blip(image_bytes, source)
        
        # Log result
        mode = analysis_result.get("mode", "UNKNOWN")
        severity = analysis_result.get("severity_score", 0)
        injury = analysis_result.get("injury_type", "Unknown")
        
        logger.info("=" * 70)
        logger.info(f"📊 Analysis Complete")
        logger.info(f"   Mode: {mode}")
        logger.info(f"   Severity: {severity}/10")
        logger.info(f"   Injury: {injury}")
        logger.info(f"   Confidence: {analysis_result.get('confidence', 0)}")
        logger.info("=" * 70)
        
        # Return combined response
        return {
            "analysis": analysis_result,
            "telemetry": DRONE_TELEMETRY.copy()
        }
        
    except HTTPException:
        raise
        
    except Exception as e:
        logger.error(f"❌ Dispatch failed: {e}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    
    finally:
        # Always close the file properly
        await file.close()
        logger.info("🔒 File closed")


@app.get("/drone-status")
def get_drone_status():
    """
    Returns current drone telemetry with simulated updates.
    
    **Simulation**:
    - Battery drains by 0.05% per request
    - Altitude varies by ±2 meters randomly
    
    **Response**:
    ```json
    {
      "battery": 98.45,
      "altitude": 121.3,
      "status": "AIRBORNE",
      "lat": 28.61,
      "lng": 77.20
    }
    ```
    """
    global DRONE_TELEMETRY
    
    # Simulate battery drain (0.05% per call)
    DRONE_TELEMETRY['battery'] = round(
        max(0.0, DRONE_TELEMETRY['battery'] - 0.05),
        2
    )
    
    # Simulate altitude variation (±2 meters)
    DRONE_TELEMETRY['altitude'] = round(
        120.0 + random.uniform(-2.0, 2.0),
        2
    )
    
    # Update status based on battery
    if DRONE_TELEMETRY['battery'] < 20:
        DRONE_TELEMETRY['status'] = 'LOW_BATTERY'
    elif DRONE_TELEMETRY['battery'] < 10:
        DRONE_TELEMETRY['status'] = 'CRITICAL_BATTERY'
    
    logger.info(
        f"📡 Telemetry: Battery={DRONE_TELEMETRY['battery']}%, "
        f"Altitude={DRONE_TELEMETRY['altitude']}m"
    )
    
    return DRONE_TELEMETRY


@app.get("/")
def root():
    """
    Health check and system info endpoint.
    
    **Response**:
    ```json
    {
      "service": "PranAIR Medical Drone Backend",
      "status": "operational",
      "version": "2.0.0",
      "ai_model": "Salesforce/blip-image-captioning-base",
      "device": "CPU",
      "mode": "AI",
      "model_loaded": true,
      "patient_router": true
    }
    ```
    """
    return {
        "service": "PranAIR Medical Drone Backend",
        "status": "operational",
        "version": "2.0.0",
        "ai_model": "Salesforce/blip-image-captioning-base",
        "device": "CPU (CUDA disabled)",
        "mode": AI_MODE,
        "model_loaded": image_to_text is not None,
        "patient_router": PATIENT_ROUTER_AVAILABLE,
        "endpoints": {
            "dispatch": "POST /dispatch",
            "drone_status": "GET /drone-status",
            "patient_assistant": "POST /patient/voice-assistant",
            "patient_status": "GET /patient/status"
        }
    }


@app.get("/health")
def health_check():
    """
    Simple health check endpoint for monitoring.
    
    **Response**:
    ```json
    {
      "status": "healthy",
      "ai_ready": true
    }
    ```
    """
    return {
        "status": "healthy",
        "ai_ready": AI_MODE == "AI",
        "mode": AI_MODE
    }


# ============================================================================
# SERVER STARTUP
# ============================================================================
if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("🚁 PranAIR Medical Drone Backend Starting")
    logger.info("=" * 70)
    logger.info(f"📦 AI Model: Salesforce/blip-image-captioning-base")
    logger.info(f"💻 Device: CPU (CUDA disabled)")
    logger.info(f"🎯 Mode: {AI_MODE}")
    logger.info(f"🤖 Model Loaded: {image_to_text is not None}")
    logger.info(f"🏥 Patient Router: {PATIENT_ROUTER_AVAILABLE}")
    logger.info(f"🌐 Server: http://0.0.0.0:8000")
    logger.info(f"📚 Docs: http://0.0.0.0:8000/docs")
    logger.info("=" * 70)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )