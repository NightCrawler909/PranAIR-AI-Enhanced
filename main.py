import os
import logging
import random
import io
import numpy as np
from scipy.io import wavfile
from scipy import signal
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image
import torch
from transformers import AutoProcessor, BlipForConditionalGeneration, pipeline, AutoModelForCausalLM, AutoTokenizer
from pydantic import BaseModel
from faster_whisper import WhisperModel

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

# --- WHISPER SETUP ---
whisper_model = None
try:
    logger.info("Loading Faster-Whisper Model: small.en")
    w_device = "cuda" if torch.cuda.is_available() else "cpu"
    w_compute_type = "float16" if w_device == "cuda" else "int8"
    
    whisper_model = WhisperModel("small.en", device=w_device, compute_type=w_compute_type)
    logger.info(f"Whisper Model loaded on {w_device} ({w_compute_type})")
except Exception as e:
    logger.error(f"Failed to load Whisper: {e}")

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

# --- PHI-3 VOICE ASSISTANT SETUP ---
voice_model = None
voice_tokenizer = None

try:
    logger.info("Loading Phi-3 Mini 4K Instruct for Voice Assistant...")
    model_id = "microsoft/Phi-3-mini-4k-instruct"
    
    # Check for GPU availability
    voice_device = "cuda" if torch.cuda.is_available() else "cpu"
    voice_dtype = torch.float16 if voice_device == "cuda" else torch.float32
    
    logger.info(f"Using device: {voice_device} ({voice_dtype}) for Voice Assistant")

    voice_tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    voice_model = AutoModelForCausalLM.from_pretrained(
        model_id, 
        device_map=voice_device, 
        torch_dtype=voice_dtype, 
        trust_remote_code=True,
        _attn_implementation="eager" # Use eager for better compatibility if flash-attn is missing
    )
    voice_model.eval() # Set to evaluation mode
    
    logger.info("Phi-3 Voice Assistant Model Loaded Successfully")

except Exception as e:
    logger.error(f"Failed to load Voice Assistant Model: {e}")
    logger.warning("Voice Assistant will be unavailable (or use simulated responses)")
    voice_model = None

# Global telemetry state
DRONE_TELEMETRY = {
    'battery': 98.5,
    'altitude': 120.0,
    'status': 'AIRBORNE',
    'lat': 28.61,
    'lng': 77.20
}


def analyze_image_with_blip(image_bytes: bytes, source: str = "live_video_frame") -> dict:
    """
    Analyzes image using local BLIP model via transformers pipeline.
    
    Args:
        image_bytes: Raw image bytes from frontend
        source: Source of the image (live_video_frame or uploaded_image)
        
    Returns:
        dict: Medical triage data with injury_type, severity_score, confidence, mode
    """
    try:
        # Check if model loaded successfully
        if image_to_text is None:
            raise Exception("BLIP model not loaded")
        
        logger.info(f"Analyzing image: {len(image_bytes)} bytes, Source: {source}")
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Image size: {image.size}, mode: {image.mode}")
        
        # Run inference with BLIP model
        # For uploaded images, we ideally want to add context, but pipeline API varies.
        # We will rely on higher confidence scoring for uploaded images.
        result = image_to_text(image)
        
        # Extract caption from result
        caption = ""
        if isinstance(result, list) and len(result) > 0:
            caption = result[0].get("generated_text", "")
        
        logger.info(f"BLIP Caption: {caption}")
        
        # Convert caption to medical triage
        return caption_to_triage(caption, mode="AI", source=source)
            
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        # Return simulation data with source info
        sim_data = get_simulation_data()
        if source == "uploaded_image":
            sim_data["confidence"] = min(0.99, sim_data["confidence"] + 0.05)
        return sim_data


def caption_to_triage(caption: str, mode: str = "AI", source: str = "live_video_frame") -> dict:
    """
    Converts BLIP caption into medical triage data.
    
    Logic:
    - If caption contains: injured, lying, fallen, ground -> severity 7
    - Else -> severity 2
    
    Args:
        caption: Image caption from BLIP model
        mode: AI or SIMULATION
        source: live_video_frame or uploaded_image
        
    Returns:
        dict: Triage data
    """
    caption_lower = caption.lower()
    
    # Check for critical keywords
    critical_keywords = ["injured", "lying", "fallen", "ground"]
    
    severity_score = 2
    confidence = 0.70
    injury_type = "Scene appears stable"

    if any(keyword in caption_lower for keyword in critical_keywords):
        injury_type = "Potential injury detected - person on ground"
        severity_score = 7
        confidence = 0.85
        logger.info(f"Critical condition detected in caption: {caption}")
    
    # Boost confidence for uploaded images (higher clarity assumption)
    if source == "uploaded_image":
        confidence = min(0.99, confidence + 0.10)
        logger.info("Boosting confidence for uploaded image source")

    return {
        "injury_type": injury_type,
        "severity_score": severity_score,
        "confidence": confidence,
        "mode": mode,
        "source": source
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


# --- VOICE ASSISTANT ENDPOINT ---

@app.post("/patient/voice-assistant")
async def voice_assistant_chat(
    file: UploadFile = File(None),
    user_text: str = Form(None),
    blip_context: str = Form("Unknown context"),
    vitals: str = Form("{}")
):
    """
    Real-time voice assistant endpoint using Faster-Whisper + Phi-3.
    Accepts EITHER 'file' (audio) OR 'user_text' (fallback).
    """
    import json
    
    # 1. Parse Vitals
    try:
        vitals_dict = json.loads(vitals)
    except:
        vitals_dict = {"note": "Invalid vitals data"}

    # 2. Get User Input (Audio -> Text or Direct Text)
    input_text = ""
    
    # Check if audio file provided
    if file:
        if not whisper_model:
            logger.warning("Whisper model not loaded, ignoring audio")
        else:
            try:
                # Read Audio Bytes
                audio_bytes = await file.read()
                
                # Check Duration/Size (Rough check on bytes before decoding)
                if len(audio_bytes) < 1000: # < 1KB is definitely noise/silence
                    logger.info("Audio too short/empty")
                    return {"assistant_text": "Could not understand speech (too short)."}

                # Decode WAV using SciPy (Optimized for WAV)
                # Note: This assumes WAV format. If WebM (browser default), this fails.
                use_direct_transcribe = False
                try:
                    sr, audio_data = wavfile.read(io.BytesIO(audio_bytes))
                    
                    # Convert to Float32 [-1, 1]
                    if audio_data.dtype == np.int16:
                        audio_data = audio_data.astype(np.float32) / 32768.0
                    elif audio_data.dtype == np.int32:
                        audio_data = audio_data.astype(np.float32) / 2147483648.0
                    elif audio_data.dtype == np.uint8:
                         audio_data = (audio_data.astype(np.float32) - 128) / 128.0

                    # Convert Stereo to Mono
                    if len(audio_data.shape) > 1:
                        audio_data = np.mean(audio_data, axis=1)

                    # Resample to 16kHz if needed
                    if sr != 16000:
                        num_samples = int(len(audio_data) * 16000 / sr)
                        audio_data = signal.resample(audio_data, num_samples)
                        sr = 16000

                    # Check Duration (> 0.5s)
                    duration = len(audio_data) / sr
                    if duration < 0.5:
                        logger.info(f"Rejected audio duration: {duration}s")
                        return {"assistant_text": "Could not understand speech (too short)."}

                    # Check RMS (Silence)
                    rms = np.sqrt(np.mean(audio_data**2))
                    logger.info(f"Audio RMS: {rms}")
                    if rms < 0.005: # Threshold for silence
                        return {"assistant_text": "Could not understand speech (silence)."}
                        
                    # Prepare for Whisper
                    transcribe_input = audio_data

                except Exception as wav_err:
                     logger.warning(f"WAV read failed (likely WebM/Opus): {wav_err}. Falling back to direct Whisper decode.")
                     use_direct_transcribe = True
                     transcribe_input = io.BytesIO(audio_bytes)

                # Transcribe with Faster-Whisper
                # model.transcribe accepts numpy array OR file-like object
                segments, info = whisper_model.transcribe(
                    transcribe_input,
                    beam_size=5,
                    language="en",
                    temperature=0,
                    vad_filter=True
                )
                
                # If direct transcribe, check duration from info
                if use_direct_transcribe:
                    if info.duration < 0.5:
                         return {"assistant_text": "Could not understand speech (too short)."}
                
                transcribed_text = " ".join([segment.text for segment in segments]).strip()
                logger.info(f"Whisper Transcription: '{transcribed_text}'")
                
                if not transcribed_text:
                     return {"assistant_text": "Could not understand speech."}
                
                input_text = transcribed_text

            except Exception as e:
                logger.error(f"Transcription failed: {e}")
                return {"assistant_text": "I heard you, but could not understand clearly. Please speak again."}

    # Fallback/Merge with text input
    if not input_text and user_text:
        input_text = user_text
        
    if not input_text:
        # If we got here with no text from audio or string
        return {"assistant_text": "I am listening."}


    # 3. Generate AI Response (Phi-3)
    if not voice_model or not voice_tokenizer:
        return {"assistant_text": "I understand. Help is on the way. (Offline Mode)"}
    
    try:
        # Construct Prompt
        system_prompt = (
            "You are a calm emergency medical voice assistant. "
            "Rules:\n"
            "- Do NOT diagnose medical conditions\n"
            "- Do NOT estimate survival or death\n"
            "- Do NOT speculate or assume unseen injuries\n"
            "- Avoid complex medical terminology\n"
            "- Always be calm and reassuring\n"
            "- Encourage stillness and slow breathing\n"
            "- If unsure, say: 'Help is on the way'\n"
            "\n"
            "Context:\n"
            "- A medical drone is already dispatched\n"
            "- Doctors are monitoring vitals remotely\n"
            "- The patient may be injured or panicking\n"
            "\n"
            "Tone: Calm, Short sentences, Reassuring, Human-like but controlled"
        )
        
        vitals_str = ", ".join([f"{k}: {v}" for k, v in vitals_dict.items()])
        
        full_conversation = (
            f"<|system|>\n{system_prompt}\n"
            f"Visual Context: {blip_context}\n"
            f"Vitals: {vitals_str}<|end|>\n"
            f"<|user|>\n{input_text}<|end|>\n"
            f"<|assistant|>"
        )
        
        # Tokenize (Using same logic as before)
        inputs = voice_tokenizer(full_conversation, return_tensors="pt").to(voice_model.device)
        
        with torch.no_grad():
            outputs = voice_model.generate(
                **inputs, 
                max_new_tokens=80,      
                temperature=0.6,        
                top_p=0.9,
                do_sample=True,
                repetition_penalty=1.1, 
                use_cache=True          
            )
            
        generated_text = voice_tokenizer.decode(outputs[0], skip_special_tokens=True)
        # simplistic extraction
        response_text = generated_text[len(voice_tokenizer.decode(inputs.input_ids[0], skip_special_tokens=True)):]
        response_text = response_text.strip()
        
        if not response_text:
             response_text = "I am here with you. Help is arriving shortly."

        return {"assistant_text": response_text}

    except Exception as e:
        logger.error(f"Voice Assistant Error: {e}")
        return {"assistant_text": "I am having trouble connecting, but help is still on the way. Please stay calm."}


@app.post("/dispatch")
async def dispatch(file: UploadFile = File(...), source: str = Form("live_video_frame")):
    """
    Main dispatch endpoint - receives image from frontend.
    
    Frontend sends FormData with key 'file'.
    
    Returns:
        JSON with analysis and telemetry data
    """
    logger.info(f"Dispatch request received: {file.filename}, Source: {source}")
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Validate image
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        logger.info(f"Image size: {len(image_bytes)} bytes")
        
        # Analyze image with BLIP
        analysis_result = analyze_image_with_blip(image_bytes, source)
        
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
                "mode": analysis_result["mode"],
                "source": analysis_result.get("source", "unknown")
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