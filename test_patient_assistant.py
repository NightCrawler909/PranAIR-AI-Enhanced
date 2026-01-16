"""
Test script for Patient Voice Assistant Backend
==============================================
Quick test to verify Gemini integration works
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
PATIENT_ENDPOINT = f"{BASE_URL}/patient/voice-assistant"
STATUS_ENDPOINT = f"{BASE_URL}/patient/status"

def test_status():
    """Test health check endpoint"""
    print("\n🔍 Testing /patient/status endpoint...")
    try:
        response = requests.get(STATUS_ENDPOINT)
        print(f"✅ Status Code: {response.status_code}")
        print(f"📊 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_voice_assistant(query: str):
    """Test voice assistant endpoint"""
    print(f"\n🎤 Testing voice assistant with query: '{query}'")
    try:
        response = requests.post(
            PATIENT_ENDPOINT,
            json={"query": query},
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Status Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"🤖 AI Reply: {data.get('reply')}")
            print(f"📊 Status: {data.get('status')}")
        else:
            print(f"❌ Error Response: {response.text}")
        
        return response.ok
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_tests():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Patient Voice Assistant Backend Tests")
    print("=" * 60)
    
    # Test 1: Health check
    status_ok = test_status()
    
    if not status_ok:
        print("\n⚠️ Backend not responding. Is it running?")
        print("Run: python main.py")
        return
    
    # Test 2: Simple query
    test_voice_assistant("Hello, I'm hurt")
    
    # Test 3: Medical query
    test_voice_assistant("My leg is bleeding badly")
    
    # Test 4: Emotional query
    test_voice_assistant("I'm scared and alone")
    
    # Test 5: Information query
    test_voice_assistant("When will help arrive?")
    
    print("\n" + "=" * 60)
    print("✅ Tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
