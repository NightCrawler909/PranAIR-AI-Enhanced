"""
Patient Voice Assistant Backend - Gemini 3 Pro (Multimodal Voice-to-Voice)
==========================================================================
Full Voice Pipeline: Audio Input -> Gemini Thinking -> TTS Audio Output
Architecture:
- Model: gemini-3-pro-preview (Reasoning + Multimodal)
- TTS: edge-tts (High quality neural speech)
- Protocol: Base64 Audio response
"""

# ============================================================================
# SAFETY CONFIGURATION
# ============================================================================
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""  # Force CPU for safety
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
import google.generativeai as genai
import logging
import json
import traceback
import base64
import io
import asyncio
import edge_tts

# ============================================================================
# SETUP
# ============================================================================

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PranAIR_Voice")

# Configure API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not GOOGLE_API_KEY:
    logger.error("CRITICAL: No Google API Key found.")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Model
MODEL_NAME = "gemini-3-pro-preview" 

try:
    model = genai.GenerativeModel(MODEL_NAME)
    logger.info(f"Initialized Generative Model: {MODEL_NAME}")
except Exception as e:
    logger.error(f"Failed to initialize model {MODEL_NAME}: {e}")
    model = None

# Router
router = APIRouter(prefix="/patient", tags=["Patient Assistant"])

# ============================================================================
# DATAMODELS
# ============================================================================

class VoiceResponse(BaseModel):
    status: str
    text: str
    audio: str = Field(..., description="Base64 encoded MP3 audio")
    vitals_summary: dict

# ============================================================================
# TTS UTILITIES
# ============================================================================

async def text_to_speech_base64(text: str, voice: str = "en-US-AriaNeural") -> str:
    """
    Generates TTS audio and returns base64 string.
    Uses edge-tts for high quality neural voice.
    """
    try:
        communicate = edge_tts.Communicate(text, voice)
        # Create an in-memory byte stream
        mp3_io = io.BytesIO()
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_io.write(chunk["data"])
        
        mp3_io.seek(0)
        audio_bytes = mp3_io.read()
        base64_audio = base64.b64encode(audio_bytes).decode('utf-8')
        return base64_audio
    except Exception as e:
        logger.error(f"TTS Generation Error: {e}")
        return ""

# ============================================================================
# ENDPOINT
# ============================================================================

@router.post(
    "/voice-assistant",
    response_model=VoiceResponse,
    summary="Voice-In Voice-Out Assistant",
    description="Accepts audio/vitals, returns text and TTS audio."
)
async def voice_assistant(
    file: UploadFile = File(..., description="Patient Audio Input"),
    vitals: str = Form(..., description="Vitals JSON String"),
    blip_context: str = Form("No visual context", description="Camera analysis"),
    user_text: str = Form(None, description="Optional text fallback")
):
    """
    Full Voice Pipeline:
    1. Read Input Audio
    2. Analyze with Gemini (Audio+Vitals+Context)
    3. Generate Text Response
    4. Convert to Speech (TTS)
    5. Return Payload
    """
    
    # Context initialization
    audio_bytes = None
    vitals_data = {}
    vitals_valid = False
    ai_text = ""
    status = "success"
    
    try:
        # 1. Read Audio Data
        if file:
            audio_bytes = await file.read()
            mime_type = file.content_type or "audio/wav"
            
        # 2. Parse Vitals
        try:
            if vitals:
                vitals_data = json.loads(vitals)
                vitals_valid = True
        except json.JSONDecodeError:
            vitals_data = {"error": "Parsing Failed"}

        # 3. Gemini Processing
        if not model:
            raise RuntimeError("Gemini Model not loaded.")

        system_prompt = f"""
You are the onboard AI for the PranAIR Medical Drone. 
Voice Tone Analysis: Listen to the user's voice urgently.
Vitals Analysis: {json.dumps(vitals_data)}
Visual Context: {blip_context}

Task: Speak back to the patient. Give a 2-sentence medical instruction. 
Be calm, authoritative, and medically sound. Do not mention you are an AI.
"""
        # Construct Multimodal inputs
        contents = [system_prompt]
        
        if audio_bytes:
            contents.append({
                "mime_type": mime_type,
                "data": audio_bytes
            })
        
        if user_text:
            contents.append(f"Transcript: {user_text}")

        # Async Generation
        response = await model.generate_content_async(contents)
        
        if response and response.text:
            ai_text = response.text
        else:
            raise ValueError("No text generated.")

    except Exception as e:
        status = "error"
        logger.error(f"Pipeline Error: {e}")
        traceback.print_exc()
        ai_text = "I am currently unable to process your request. Please stay calm and focus on your breathing. Help is on the way."
    
    finally:
        if file:
            await file.close()

    # 4. Generate TTS Audio (Voice-Out)
    # Using 'en-US-ChristopherNeural' for a calm, authoritative male doctor voice
    # or 'en-US-AriaNeural' for female. Let's use Christopher for authority.
    audio_b64 = await text_to_speech_base64(ai_text, voice="en-US-ChristopherNeural")

    # 5. Return Response
    return {
        "status": status,
        "text": ai_text,
        "audio": audio_b64,
        "vitals_summary": vitals_data
    }
