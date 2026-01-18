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

## 🚁 Drone Components

- **Flight Controller:** ArduCopter APM 2.8  
- **Onboard Computer:** Raspberry Pi 4B (Edge processing & telemetry)  
- **Motors:** 4 × Brushless DC Motors (1000 KV) with ESCs  
- **Frame:** F450 / Q450 Quadcopter Frame  
- **Power:** LiPo Battery with real-time monitoring  
- **Navigation:** GPS module for live latitude & longitude tracking  
- **Camera:** Forward-facing camera (simulated live feed)

# 🚁 PranAIR - AI-Powered Medical Drone Backend

> **AI-powered medical drone dispatch system analyzing emergency scenes for intelligent automated triage response.**

A comprehensive FastAPI backend for autonomous medical emergency response using computer vision (BLIP), intelligent triage, quantum-inspired route optimization, and patient voice assistance.

---

## 🎯 Features

- **🖼️ AI Vision Analysis**: BLIP image captioning model for deterministic emergency scene analysis
- **🏥 Medical Triage System**: Rule-based severity scoring (1-9 scale) with keyword detection
- **🗣️ Patient Voice Assistant**: Gemini-powered conversational AI for patient interaction
- **⚛️ Quantum Route Optimization**: QUBO-based TSP solver for multi-location emergency dispatch
- **📊 Real-time Telemetry**: Live drone status monitoring with battery and altitude simulation
- **🔒 Secure Architecture**: CPU-only inference, environment variable management, CORS configuration

---

## 📋 System Requirements

### Prerequisites
- **Python**: 3.8 or higher (Python 3.10+ recommended)
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended for BLIP model)
- **Storage**: ~2GB free space for models and dependencies

### Required API Keys
- **Google Gemini API Key**: For patient voice assistant functionality
  - Sign up at: https://makersuite.google.com/app/apikey

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/NightCrawler909/PranAIR-AI-Enhanced.git
cd PranAIR-AI-Enhanced
```

### Step 2: Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies

**Core Dependencies:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Optional Dependencies (for full functionality):**

```bash
# Quantum Route Optimizer (optional)
pip install qiskit>=1.0.0 qiskit-optimization>=0.6.0 qiskit-algorithms>=0.3.0 networkx>=3.0

# Text-to-Speech (optional)
pip install edge-tts
```

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# .env file
GOOGLE_API_KEY=your_gemini_api_key_here
```

**To get your Gemini API key:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `.env`

### Step 5: Verify Installation

Check that all core packages are installed:

```bash
python -c "import fastapi, uvicorn, transformers, PIL; print('✅ Core dependencies installed')"
```

Check BLIP model availability:

```bash
python -c "from transformers import BlipForConditionalGeneration; print('✅ BLIP model available')"
```

---

## ▶️ Running the Application

### Start the Backend Server

**Method 1: Direct Python execution**
```bash
python main.py
```

**Method 2: Using Uvicorn**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Expected Startup Output

```
======================================================================
🚁 PranAIR Medical Drone Backend Starting
======================================================================
📦 AI Model: Salesforce/blip-image-captioning-base
💻 Device: CPU (CUDA disabled)
🎯 Mode: AI
✅ BLIP Model: LOADED (Deterministic inference enabled)
🤖 Pipeline: READY
🏥 Patient Router: True
⚛️  Quantum Optimizer: True
🌐 Server: http://0.0.0.0:8000
📚 Docs: http://0.0.0.0:8000/docs
======================================================================
```

### Access the Application

- **API Server**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 📡 API Endpoints

### 1. **POST /dispatch**
Analyzes emergency scene image and returns medical triage assessment.

**Request:**
```bash
curl -X POST "http://localhost:8000/dispatch" \
  -F "file=@emergency_scene.jpg" \
  -F "source=uploaded_image"
```

**Response:**
```json
{
  "analysis": {
    "injury_type": "SEVERE - Person on ground, immediate response needed",
    "severity_score": 8,
    "confidence": 0.90,
    "mode": "AI",
    "source": "uploaded_image",
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

**Severity Scale:**
- **9**: CRITICAL - Unconscious, severe bleeding, cardiac arrest
- **8**: SEVERE - Person on ground, blood visible
- **7**: HIGH - Lying down, fallen, potential fracture
- **6**: MODERATE-HIGH - Visible injury, medical attention required
- **5**: MODERATE - Minor injury, monitoring recommended
- **3-4**: LOW - Person in mild distress
- **1-2**: MINIMAL - No visible emergency

### 2. **GET /drone-status**
Returns current drone telemetry with simulated updates.

**Response:**
```json
{
  "battery": 98.45,
  "altitude": 121.3,
  "status": "AIRBORNE",
  "lat": 28.61,
  "lng": 77.20,
  "speed": 15.0
}
```

### 3. **POST /optimize-route**
Quantum-inspired route optimization for multiple emergency locations.

**Request:**
```json
{
  "current_location": {"lat": 28.61, "lng": 77.20, "id": "drone_base"},
  "targets": [
    {"lat": 28.62, "lng": 77.21, "id": "emergency_1"},
    {"lat": 28.63, "lng": 77.22, "id": "emergency_2"}
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "optimization_engine": "QUBO/Ising (Classical Simulator)",
  "optimized_route": [...],
  "metrics": {
    "total_distance_km": 5.3,
    "estimated_time_min": 12.5
  }
}
```

### 4. **POST /patient/voice-assistant**
Patient interaction with Gemini-powered voice assistant.

**Request:**
```json
{
  "message": "I'm having chest pain",
  "conversation_id": "patient_001"
}
```

### 5. **GET /health**
Simple health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "ai_ready": true,
  "mode": "AI"
}
```

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│         TacticalMapGrid + CommandCenter + Dashboard         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API
┌────────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend (main.py)                  │
├─────────────────────────────────────────────────────────────┤
│  📸 Image Analysis      │  🗣️ Patient Assistant            │
│  (BLIP CPU inference)   │  (Gemini API)                     │
├─────────────────────────┼───────────────────────────────────┤
│  ⚛️ Route Optimizer     │  📊 Telemetry Simulation         │
│  (QUBO/Ising TSP)       │  (Battery, Altitude, GPS)         │
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **FastAPI**: Modern async web framework for Python
- **BLIP**: Salesforce's image-to-text model for scene understanding
- **Transformers**: Hugging Face library for AI model inference
- **Qiskit**: Quantum computing framework for route optimization
- **Google Gemini**: LLM for conversational patient assistance
- **Pillow**: Image processing library
- **Uvicorn**: ASGI server for production deployment

### Data Flow

1. **Image Upload** → Drone camera captures emergency scene
2. **BLIP Analysis** → AI generates caption ("person lying on ground")
3. **Triage Logic** → Keywords mapped to severity score (1-9)
4. **Response** → Frontend displays severity + recommended action
5. **Route Optimization** → Quantum solver finds fastest multi-patient path
6. **Patient Communication** → Gemini assistant provides medical guidance

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | - | Google Gemini API key for patient assistant |
| `CUDA_VISIBLE_DEVICES` | No | "" | CUDA device configuration (disabled by default) |

### Server Configuration

Edit `main.py` startup section to customize:

```python
uvicorn.run(
    app,
    host="0.0.0.0",    # Listen on all interfaces
    port=8000,         # Port number
    log_level="info"   # Logging level
)
```

### CORS Settings

For production, restrict CORS origins in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🐛 Troubleshooting

### Issue: BLIP Model Not Loading

**Symptoms:**
```
⚠️  BLIP Model: NOT LOADED (Using SIMULATION fallback)
```

**Solutions:**
1. Check transformers installation:
   ```bash
   pip install transformers --upgrade
   ```

2. Verify PyTorch installation:
   ```bash
   pip install torch --index-url https://download.pytorch.org/whl/cpu
   ```

3. Check available disk space (need ~1GB for model download)

### Issue: Port Already in Use

**Error:**
```
ERROR: [Errno 48] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows

# Or use a different port
uvicorn main:app --port 8080
```

### Issue: Import Errors

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Activate virtual environment first
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate      # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Slow Inference

**Problem:** BLIP analysis takes >10 seconds per image

**Solutions:**
1. **Reduce image size** before uploading (640x480 recommended)
2. **Use simulation mode** for development (set `AI_MODE = "SIMULATION"`)
3. **Upgrade RAM** (8GB+ recommended for optimal performance)

### Issue: Gemini API Errors

**Error:**
```
google.api_core.exceptions.PermissionDenied: 403 API key not valid
```

**Solution:**
1. Verify API key in `.env` file
2. Check API key is enabled at https://makersuite.google.com
3. Ensure no extra spaces in `.env` file:
   ```bash
   GOOGLE_API_KEY=your_key_here
   ```

---

## 📚 Development

### Project Structure

```
DroneModel/
├── main.py                      # Main FastAPI backend
├── patient_gemini_assistant.py  # Patient voice assistant module
├── quantum_route_optimizer.py   # Route optimization module
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (create this)
├── src/                         # React frontend source
│   ├── CommandCenter.jsx        # Main operator interface
│   ├── Dashboard.jsx            # Analytics dashboard
│   └── LandingPage.jsx          # Landing page
└── README.md                    # This file
```

### Running in Development Mode

```bash
# Backend with auto-reload
uvicorn main:app --reload --port 8000

# Frontend (in separate terminal)
npm run dev
```

### Testing API Endpoints

Use the interactive API documentation at http://localhost:8000/docs to test all endpoints with a built-in interface.

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `allow_origins` to specific domains (not `["*"]`)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS encryption
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting
- [ ] Use production ASGI server (Gunicorn + Uvicorn workers)
- [ ] Set up database for persistent storage
- [ ] Implement authentication/authorization

### Production Deployment Example

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --log-level info
```

---
