# 🚁 PranAIR — AI-Enhanced Medical Emergency Drone System

**PranAIR** is an intelligent, real-time medical emergency response platform that uses **drones, live telemetry, interactive maps, and AI-assisted decision support** to prioritize and reach patients faster during critical situations.

The system simulates a **next-generation emergency workflow** where patient SOS signals, GPS locations, and severity levels are processed to help operators and doctors make informed, time-critical decisions.

[https://github.com/user-attachments/assets/7439b3ae-7a12-4c6e-8da6-eb40e4139438](https://github.com/user-attachments/assets/80d8c01e-b682-4c2e-8812-ac7e90b9254b)

<img width="2225" height="1329" alt="image" src="https://github.com/user-attachments/assets/d03b1491-bee5-49b6-bd8c-12849180dac8" />
<img width="2524" height="1355" alt="image" src="https://github.com/user-attachments/assets/1ca7acf7-4f83-4439-a18f-1f791fbad2da" />
<img width="605" height="1040" alt="image" src="https://github.com/user-attachments/assets/f67c1c6d-473c-4633-bd6e-3f37595f867c" />
<img width="679" height="1319" alt="image" src="https://github.com/user-attachments/assets/bb77ffac-10e6-4690-8173-e464dc3561e0" />
<img width="2225" height="1329" alt="image" src="https://github.com/user-attachments/assets/aa48ba92-e396-42fb-a263-639fb7e1fe17" />
<img width="2539" height="1345" alt="image" src="https://github.com/user-attachments/assets/888bbdc9-965e-4373-92d3-44267e181177" />

---

## 🌟 Key Features

### 🚨 Patient SOS System
- One-tap SOS triggers emergency workflows  
- Captures **live GPS location** instantly  
- Initiates downstream medical & operator pipelines  

---

### 🗺️ Multi-Patient Live Map View (Operator Dashboard)
- Real SOS patient + nearby patients using **latitude & longitude**
- **Interactive maps** with priority levels
- **Blue navigation path** between drone and patient (Zomato-style routing)
- Click-to-focus navigation for individual patients

---

### 🧠 Severity-Based Priority Assignment
- Patients ranked using:
  - Medical severity level
  - Distance from drone
- Determines **optimal dispatch order** automatically

---

### 📡 Live Drone Telemetry
- Battery percentage  
- Altitude  
- Drone status (idle, en route, airborne)  
- Continuous **real-time streaming**

---

### 🎙️ Patient Voice Assistant (Gemini API)
- Converts **speech → text**
- Sends patient input to **Google Gemini**
- Responds with **natural AI voice**
- CPU-only pipeline (**no CUDA, no Whisper**)

---

### 🏥 Doctor’s View
- Focused medical insights
- Injury severity interpretation
- Clean UI without operator clutter
- Optimized for fast clinical decisions

---

### 📧 Automated Emergency Email Alerts
- Sends patient **live location & coordinates** on SOS
- Designed to notify:
  - Nearby hospitals
  - Emergency responders
  - Control operators

---

## 📐 Distance Calculation Method

PranAIR uses the **Haversine Formula** to calculate the real-world surface distance between the drone and patients using GPS coordinates.

This ensures:
- Accurate distance estimation
- Realistic navigation paths
- Correct handling of Earth’s curvature

---

## 🧱 Tech Stack

### Frontend
- **React / Next.js**
- Interactive Maps (Leaflet / Mapbox-style logic)
- **Framer Motion** animations
- Modern **glassmorphism UI**

### Backend
- **FastAPI (Python)**
- **Gemini API** for conversational AI
- Real-time telemetry simulation
- REST-based architecture
- **CPU-only**, lightweight, demo-friendly

---

## 🎯 Project Vision

PranAIR demonstrates how **AI + drones + real-time geospatial intelligence** can significantly reduce emergency response time and improve decision-making in life-critical scenarios.

Built for:
- Hackathons  
- Research demos  
- Smart city simulations  
- Emergency response innovation  

---

## ⚠️ Disclaimer

This project is a **simulation and prototype** intended for **research, demonstration, and educational purposes only**.  
It is **not a production-ready medical or emergency response system**.

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
