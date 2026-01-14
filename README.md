# PranAIR - AI Medical Drone Backend

A robust FastAPI backend for an AI-powered medical emergency drone system that combines Hugging Face's vision AI with Google's Gemini for intelligent triage and hospital communication.

## Features

- **Visual Triage**: Uses Hugging Face's Qwen2-VL-7B-Instruct model to analyze emergency scenes
- **Smart Reporting**: Generates hospital-ready emergency reports using Gemini 1.5 Flash
- **Real-time Telemetry**: Simulated drone status monitoring
- **Secure**: API key management with environment variables

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. The `.env` file is already configured with your API keys.

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

The server will start at `http://localhost:8000`

## API Endpoints

### POST /dispatch
Analyzes emergency scene and generates hospital report.

**Request:**
- `image`: Image file (multipart/form-data)
- `latitude`: GPS latitude (float)
- `longitude`: GPS longitude (float)

**Response:**
```json
{
  "severity": 7,
  "primary_injury": "Active bleeding from head wound",
  "hospital_report": "...",
  "coordinates": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "raw_analysis": "..."
}
```

### GET /drone-status
Returns simulated drone telemetry.

**Response:**
```json
{
  "battery": 87.3,
  "altitude": 120.5,
  "status": "AIRBORNE"
}
```

### GET /
Health check endpoint.

## Architecture

1. **Main Brain (Hugging Face)**: Analyzes drone camera frames to identify medical emergencies
2. **Auxiliary Reasoning (Gemini)**: Generates actionable hospital reports with specific medical equipment recommendations
3. **FastAPI Backend**: Coordinates the AI systems and provides REST API

## Security Note

The CORS middleware is currently set to allow all origins for development. For production, restrict this to specific domains.
