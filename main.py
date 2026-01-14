import os
import logging
import random
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image
import torch
from transformers import AutoProcessor, BlipForConditionalGeneration, pipeline

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="PranAIR Medical Drone Backend")

# CORS configuration - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Force CPU device for stable inference
device = -1
device_name = "cpu"
logger.info("Forcing CPU inference (stable mode)")
logger.info("GPU disabled to avoid torch.load CVE issues")

# Load BLIP model at startup with CPU
blip_model = None
blip_processor = None
image_to_text = None

try:
    logger.info("Loading BLIP model: Salesforce/blip-image-captioning-base")
    logger.info("Using safetensors with CPU inference")
    
    # Step 1: Load processor explicitly
    logger.info("Loading AutoProcessor...")
    blip_processor = AutoProcessor.from_pretrained(
        "Salesforce/blip-image-captioning-base",
        use_fast=True
    )
    logger.info("Processor loaded successfully")
    
    # Step 2: Load model explicitly with safetensors on CPU
    logger.info("Loading BlipForConditionalGeneration with safetensors...")
    blip_model = BlipForConditionalGeneration.from_pretrained(
        "Salesforce/blip-image-captioning-base",
        torch_dtype=torch.float32,
        use_safetensors=True
    )
    logger.info("Model loaded successfully on CPU")
    
    # Step 3: Create pipeline with loaded model and processor
    logger.info("Creating pipeline on CPU...")
    image_to_text = pipeline(
        "image-to-text",
        model=blip_model,
        tokenizer=blip_processor.tokenizer,
        image_processor=blip_processor.image_processor,
        device=-1
    )
    
    logger.info("BLIP pipeline initialized successfully on CPU")
    logger.info("Model uses safetensors format (secure)")
    
except Exception as e:
    logger.error(f"CRITICAL: Failed to load BLIP model: {e}")
    logger.error(f"Error type: {type(e).__name__}")
    import traceback
    logger.error(f"Traceback: {traceback.format_exc()}")
    logger.error("Model will use SIMULATION mode only")
    image_to_text = None
    blip_model = None
    blip_processor = None

# Global telemetry state
DRONE_TELEMETRY = {
    'battery': 98.5,
    'altitude': 120.0,
    'status': 'AIRBORNE',
    'lat': 28.61,
    'lng': 77.20
}


def analyze_image_with_blip(image_bytes: bytes) -> dict:
    """
    Analyzes image using local BLIP model via transformers pipeline.
    
    Args:
        image_bytes: Raw image bytes from frontend
        
    Returns:
        dict: Medical triage data with injury_type, severity_score, confidence, mode
    """
    try:
        # Check if model loaded successfully
        if image_to_text is None:
            raise Exception("BLIP model not loaded")
        
        logger.info(f"Analyzing image: {len(image_bytes)} bytes")
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Image size: {image.size}, mode: {image.mode}")
        
        # Run inference with BLIP model
        result = image_to_text(image)
        
        # Extract caption from result
        caption = ""
        if isinstance(result, list) and len(result) > 0:
            caption = result[0].get("generated_text", "")
        
        logger.info(f"BLIP Caption: {caption}")
        
        # Convert caption to medical triage
        return caption_to_triage(caption, mode="AI")
            
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        # Return simulation mode
        return get_simulation_data()


def caption_to_triage(caption: str, mode: str = "AI") -> dict:
    """
    Converts BLIP caption into medical triage data.
    
    Logic:
    - If caption contains: injured, lying, fallen, ground -> severity 7
    - Else -> severity 2
    
    Args:
        caption: Image caption from BLIP model
        mode: AI or SIMULATION
        
    Returns:
        dict: Triage data
    """
    caption_lower = caption.lower()
    
    # Check for critical keywords
    critical_keywords = ["injured", "lying", "fallen", "ground"]
    
    if any(keyword in caption_lower for keyword in critical_keywords):
        injury_type = "Potential injury detected - person on ground"
        severity_score = 7
        confidence = 0.85
        logger.info(f"Critical condition detected in caption: {caption}")
    else:
        injury_type = "Scene appears stable"
        severity_score = 2
        confidence = 0.70
    
    return {
        "injury_type": injury_type,
        "severity_score": severity_score,
        "confidence": confidence,
        "mode": mode
    }


def get_simulation_data() -> dict:
    """
    Returns fallback simulation data when AI is unavailable.
    
    Returns:
        dict: Simulated medical triage data
    """
    return {
        "injury_type": "Detected Fracture and Bleeding (Simulated)",
        "severity_score": 8,
        "confidence": 0.95,
        "mode": "SIMULATION"
    }


@app.post("/dispatch")
async def dispatch(file: UploadFile = File(...)):
    """
    Main dispatch endpoint - receives image from frontend.
    
    Frontend sends FormData with key 'file'.
    
    Returns:
        JSON with analysis and telemetry data
    """
    logger.info(f"Dispatch request received: {file.filename}")
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Validate image
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        logger.info(f"Image size: {len(image_bytes)} bytes")
        
        # Analyze image with BLIP
        analysis_result = analyze_image_with_blip(image_bytes)
        
        # Log result
        mode = analysis_result.get("mode", "UNKNOWN")
        severity = analysis_result.get("severity_score", 0)
        logger.info(f"Analysis complete - Mode: {mode}, Severity: {severity}")
        
        # Return response
        return {
            "analysis": {
                "injury_type": analysis_result["injury_type"],
                "severity_score": analysis_result["severity_score"],
                "confidence": analysis_result["confidence"],
                "mode": analysis_result["mode"]
            },
            "telemetry": DRONE_TELEMETRY
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dispatch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/drone-status")
def get_drone_status():
    """
    Returns current drone telemetry with simulated updates.
    """
    global DRONE_TELEMETRY
    
    # Simulate battery drain
    DRONE_TELEMETRY['battery'] = round(max(0, DRONE_TELEMETRY['battery'] - 0.05), 2)
    
    # Simulate altitude variation
    DRONE_TELEMETRY['altitude'] = round(120.0 + random.uniform(-2.0, 2.0), 2)
    
    return DRONE_TELEMETRY


@app.get("/")
def root():
    """
    Health check endpoint
    """
    return {
        "service": "PranAIR Medical Drone Backend",
        "status": "operational",
        "version": "2.0.0",
        "ai_model": "Salesforce/blip-image-captioning-base",
        "inference": "Local GPU/CPU",
        "device": device_name,
        "model_loaded": image_to_text is not None,
        "mode": "AI with Simulation Fallback"
    }


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("PranAIR Medical Drone Backend Starting")
    logger.info("AI Model: Salesforce/blip-image-captioning-base")
    logger.info("Inference: Local GPU/CPU via transformers.pipeline")
    logger.info(f"Device: {device_name}")
    logger.info("Fallback: Simulation Mode Enabled")
    logger.info("Server: http://localhost:8000")
    logger.info("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)