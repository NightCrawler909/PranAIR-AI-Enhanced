"""
🔒 FINAL VALIDATION - Patient Voice Assistant
==============================================
Run this to verify everything is correctly configured
"""

import sys
import os

print("=" * 70)
print("🔍 PATIENT VOICE ASSISTANT - VALIDATION CHECKLIST")
print("=" * 70)

# ============================================================================
# 1. CHECK PYTHON VERSION
# ============================================================================
print("\n1️⃣  Python Version")
print(f"   ✅ Python {sys.version.split()[0]}")

# ============================================================================
# 2. CHECK CUDA IS DISABLED
# ============================================================================
print("\n2️⃣  CUDA Status")
try:
    import torch
    cuda_available = torch.cuda.is_available()
    if cuda_available:
        print("   ⚠️  WARNING: CUDA is available")
        print("   → This is OK if you want BLIP to use GPU")
        print("   → Patient endpoint will NOT use CUDA (has own disable)")
    else:
        print("   ✅ CUDA disabled globally")
except ImportError:
    print("   ✅ PyTorch not imported (CUDA disabled)")

# ============================================================================
# 3. CHECK GEMINI API KEY
# ============================================================================
print("\n3️⃣  Gemini API Configuration")
from dotenv import load_dotenv
load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    masked_key = gemini_key[:10] + "..." + gemini_key[-4:] if len(gemini_key) > 14 else "***"
    print(f"   ✅ GEMINI_API_KEY found: {masked_key}")
else:
    print("   ❌ GEMINI_API_KEY not found in .env")
    print("   → Add: GEMINI_API_KEY=your_key_here")

# ============================================================================
# 4. CHECK REQUIRED PACKAGES
# ============================================================================
print("\n4️⃣  Required Packages")

required_packages = {
    "fastapi": "FastAPI framework",
    "google.generativeai": "Gemini API",
    "pydantic": "Data validation",
    "uvicorn": "ASGI server"
}

for package, description in required_packages.items():
    try:
        __import__(package)
        print(f"   ✅ {package:25s} - {description}")
    except ImportError:
        print(f"   ❌ {package:25s} - NOT INSTALLED")
        print(f"      → pip install {package.replace('.', '-')}")

# ============================================================================
# 5. CHECK FILE STRUCTURE
# ============================================================================
print("\n5️⃣  File Structure")

required_files = {
    "main.py": "Main backend application",
    "patient_gemini_assistant.py": "Patient voice assistant module",
    "src/PatientVoiceAssistant.jsx": "Frontend component",
    ".env": "Environment variables"
}

for filepath, description in required_files.items():
    if os.path.exists(filepath):
        print(f"   ✅ {filepath:35s} - {description}")
    else:
        print(f"   ❌ {filepath:35s} - MISSING")

# ============================================================================
# 6. VERIFY PATIENT ENDPOINT ARCHITECTURE
# ============================================================================
print("\n6️⃣  Patient Endpoint Architecture")

try:
    with open("patient_gemini_assistant.py", "r", encoding="utf-8") as f:
        content = f.read()
        
        checks = {
            "CUDA disabled": 'os.environ["CUDA_VISIBLE_DEVICES"] = ""' in content,
            "No UploadFile": "UploadFile" not in content,
            "No File()": "File(" not in content,
            "No Form()": "Form(" not in content,
            "No Whisper": "whisper" not in content.lower(),
            "No torch": "import torch" not in content,
            "Gemini imported": "google.generativeai" in content,
            "Text-only schema": "class PatientQuery" in content
        }
        
        for check_name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
            
except FileNotFoundError:
    print("   ❌ patient_gemini_assistant.py not found")

# ============================================================================
# 7. VERIFY FRONTEND SENDS JSON
# ============================================================================
print("\n7️⃣  Frontend Request Format")

try:
    with open("src/PatientVoiceAssistant.jsx", "r", encoding="utf-8") as f:
        content = f.read()
        
        checks = {
            "JSON Content-Type": '"Content-Type": "application/json"' in content,
            "JSON.stringify used": "JSON.stringify" in content,
            "No FormData": "FormData" not in content,
            "No audioBlob": "audioBlob" not in content,
            "Web Speech API": "SpeechRecognition" in content
        }
        
        for check_name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
            
except FileNotFoundError:
    print("   ❌ src/PatientVoiceAssistant.jsx not found")

# ============================================================================
# 8. VERIFY NO OLD ENDPOINTS IN MAIN.PY
# ============================================================================
print("\n8️⃣  Main.py Cleanup")

try:
    with open("main.py", "r", encoding="utf-8") as f:
        content = f.read()
        
        checks = {
            "Patient router imported": "from patient_gemini_assistant import router" in content,
            "Patient router registered": "app.include_router(patient_router)" in content or "app.include_router(router" in content,
            "No old voice_assistant_chat": "async def voice_assistant_chat(" not in content or "# async def voice_assistant_chat" in content,
            "Global CUDA disable": 'os.environ["CUDA_VISIBLE_DEVICES"]' in content[:500]  # Check in first 500 chars
        }
        
        for check_name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
            
except FileNotFoundError:
    print("   ❌ main.py not found")

# ============================================================================
# FINAL VERDICT
# ============================================================================
print("\n" + "=" * 70)
print("🎯 VALIDATION COMPLETE")
print("=" * 70)

print("""
✅ If all checks passed:
   1. Start backend: python -m uvicorn main:app --reload --port 8000
   2. Open frontend in browser
   3. Test voice assistant
   4. Verify no CUDA errors in logs

❌ If any checks failed:
   1. Fix the issues listed above
   2. Re-run this validation script
   3. Do NOT start backend until all checks pass

📚 Documentation:
   - FINAL_ARCHITECTURE_LOCKED.md
   - PATIENT_VOICE_ASSISTANT_README.md
   - test_patient_assistant.py

🚀 Architecture:
   Browser STT → JSON → Gemini API → JSON → Browser TTS
   (Zero audio processing, Zero CUDA, 100% stable)
""")

print("=" * 70)
