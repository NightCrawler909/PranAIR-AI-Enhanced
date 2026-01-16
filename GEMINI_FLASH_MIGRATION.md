# ⚡ Gemini 1.5 Flash Migration - PranAIR Drone

## 🚀 Changes Summary
- **Model**: Switched from `gemini-1.5-pro` to `gemini-1.5-flash` for lower latency.
- **Environment**: Now prioritizing `GOOGLE_API_KEY` over `GEMINI_API_KEY`.
- **Protocol**: Strictly returning `status`, `response_text`, and `vitals_processed` (boolean).
- **Safety**: Hard-coded CPU enforcement (`CUDA_VISIBLE_DEVICES=""`).

## 🛠️ Testing the New Endpoint

### 1. Verification Command
To verify the new "Flash" model and error handling:

```bash
# Windows
curl -X POST "http://localhost:8000/patient/voice-assistant" ^
 -H "accept: application/json" ^
 -H "Content-Type: multipart/form-data" ^
 -F "file=@README.md" ^
 -F "vitals={\"heart_rate\": 120, \"spo2\": 95}" ^
 -F "blip_context=Patient lying on grass, visible leg injury" ^
 -F "user_text=My leg is bleeding bad"
```

### 2. Expected Success Response
```json
{
  "status": "success",
  "response_text": "Apply firm pressure directly to the bleeding wound with a clean cloth. Keep your leg elevated if possible and try to stay calm.",
  "vitals_processed": true
}
```

### 3. Expected Failure Response (e.g., No Internet)
```json
{
  "status": "error",
  "response_text": "Connection to medical database interrupted. A human dispatcher has been notified. Stay calm.",
  "vitals_processed": true 
}
```
*(Note: vitals_processed is true if valid JSON was provided, even if AI fails)*

## ⚠️ Troubleshooting "404 Model Not Found"
If you still see 404:
1. Ensure your API Key has access to `gemini-1.5-flash`.
2. Check `pip list` to ensure `google-generativeai` is up to date (`pip install -U google-generativeai`).
