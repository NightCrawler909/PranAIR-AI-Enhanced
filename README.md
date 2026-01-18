# PranAIR - AI Medical Drone Backend

A robust FastAPI backend for an AI-powered medical emergency drone system that combines Hugging Face's vision AI with Google's Gemini for intelligent triage and hospital communication.

https://github.com/user-attachments/assets/878d6bbc-7811-4bf6-b5aa-72cc0fdf0c55

🚁 PranAIR — AI-Enhanced Medical Emergency Drone System

PranAIR is an intelligent, real-time medical emergency response platform that uses drones, live telemetry, interactive maps, and AI-assisted decision support to prioritize and reach patients faster during critical situations.

The system simulates a next-generation emergency workflow where patient SOS signals, GPS locations, and severity levels are processed to help operators and doctors make informed, time-critical decisions.

🌟 Key Features

🚨 Patient SOS System
One-tap SOS triggers live location capture and emergency workflows.

🗺️ Multi-Patient Live Map View (Operator Dashboard)

Real SOS patient + nearby patients using latitude/longitude

Interactive maps with priority levels

Blue navigation path between drone and patient (realistic routing)

🧠 Severity-Based Priority Assignment
Patients are ranked using medical severity + distance from drone to determine optimal dispatch order.

📡 Live Drone Telemetry

Battery percentage

Altitude

Status updates

Continuous real-time streaming

🎙️ Patient Voice Assistant (Gemini API)

Converts speech → text

Sends patient input to Gemini

Responds with natural AI voice (no CUDA, no Whisper)

🏥 Doctor’s View

Focused medical insights

Injury severity interpretation

Clean UI without operator clutter

📧 Automated Emergency Email Alerts

Sends patient location & coordinates on SOS

Designed to notify nearby hospitals and responders

📐 Distance Calculation Method

PranAIR uses the Haversine Formula to calculate the real-world surface distance between the drone and patients using GPS coordinates.
This ensures accurate prioritization and realistic navigation over Earth’s curvature.

🧱 Tech Stack

Frontend

React / Next.js

Interactive Maps (Leaflet / Mapbox-style logic)

Framer Motion animations

Modern glassmorphism UI

Backend

FastAPI (Python)

Gemini API for conversational AI

Real-time telemetry simulation

REST-based architecture

CPU-only, lightweight, demo-friendly

🎯 Project Vision

PranAIR demonstrates how AI + drones + real-time geospatial intelligence can dramatically reduce emergency response time and improve decision-making in life-critical scenarios.

This project is built for:

Hackathons

Research demos

Smart city simulations

Emergency response innovation

⚠️ Note

This project is a simulation and prototype intended for research, demonstration, and educational purposes.

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
