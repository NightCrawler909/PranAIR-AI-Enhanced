import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LiveLocationMap from './LiveLocationMap';
import TacticalMapGrid from './TacticalMapGrid';
import {
  LayoutDashboard,
  History,
  Map,
  Battery,
  Radio,
  AlertCircle,
  Activity,
  Package,
  MapPin,
  Heart,
  Droplet,
  Eye,
  Zap,
  TrendingUp,
  Clock,
  Copy,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  User,
  Stethoscope,
  Siren,
  ChevronDown,
  Navigation,
  Crosshair,
  ShieldAlert,
  Info, 
  Menu, 
  X,    
  Mic, // Added for Voice Assistant
  Volume2, // Added for Voice Assistant
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const ROLES = {
  OPERATOR: 'OPERATOR',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT'
};

// --- VITALS SIMULATION & ANALYSIS ---

const usePatientVitals = (isActive) => {
  const [vitals, setVitals] = useState(null);

  useEffect(() => {
    if (!isActive) {
      setVitals(null);
      return;
    }

    const updateVitals = () => {
      const baseHr = 100 + Math.random() * 20 - 10;
      const sys = Math.floor(100 + Math.random() * 20);
      const dia = Math.floor(60 + Math.random() * 10);
      
      setVitals({
        heartRate: Math.floor(baseHr),
        spo2: Math.floor(93 + Math.random() * 5), // 93-98
        bloodPressure: { sys, dia },
        respiratoryRate: Math.floor(20 + Math.random() * 6),
        temperature: (37.2 + Math.random() * 1.5).toFixed(1),
        consciousness: "Alert", 
        shockIndex: (baseHr / sys).toFixed(2),
        lastUpdated: new Date()
      });
    };

    updateVitals();
    const interval = setInterval(updateVitals, 5000);
    return () => clearInterval(interval);
  }, [isActive]);

  return vitals;
};

// AI Clinical Interpretation for Doctor
const analyzeVitalsForDoctor = (vitals) => {
  if (!vitals) return null;
  
  const cues = [];
  if (vitals.shockIndex > 0.9) cues.push("possible shock");
  if (vitals.spo2 < 94) cues.push("hypoxia");
  if (vitals.heartRate > 110) cues.push("tachycardia");
  
  return {
    interpretation: cues.length > 0 
      ? `Vitals indicate ${cues.join(", ")}. Shock index ${vitals.shockIndex} warrants immediate attention.`
      : "Vitals currently stable but warrant monitoring due to trauma mechanism.",
    preparation: [
        `Oxygen: ${vitals.spo2 < 95 ? 'Required' : 'Standby'}`,
        `IV Fluids: ${vitals.shockIndex > 0.8 ? 'Recommended' : 'Standby'}`,
        "Trauma Bay: Yes",
        "Imaging: FAST Scan + CT"
    ]
  };
};

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate ETA based on distance
function calculateETA(distanceKm, speedKmH = 60) {
  const minutes = Math.ceil((distanceKm / speedKmH) * 60);
  return minutes <= 1 ? '< 1 min' : `${minutes} min`;
}

// --- TACTICAL MAP COMPONENT (Refined Visuals) ---
const TacticalMap = ({ patientLocation, droneLocation, showDrone, className }) => {
  return (
    <div className={`relative bg-[#0f1520] border border-zinc-800 rounded-xl overflow-hidden group shadow-inner ${className}`}>
      {/* Map Grid Background - Darker, subtler */}
      <div className="absolute inset-0 opacity-10" 
           style={{ 
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent opacity-20 w-[200%] h-[200%] top-[-50%] left-[-50%] animate-spin-slow pointer-events-none"></div>

      {/* Decorative Map Elements */}
      <div className="absolute top-3 left-3 text-[9px] font-mono text-zinc-600 tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
        SAT-LINK: ACTIVE
      </div>
      
      <div className="absolute bottom-3 right-3 text-[9px] font-mono text-emerald-900 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/10">
        GRID: 144
      </div>

      {/* Patient Marker (Centered Visually) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10">
        <div className="relative flex items-center justify-center">
           {/* Ping Ring */}
          <div className="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping"></div>
           {/* Core */}
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] border border-white z-20"></div>
           {/* Static Glow */}
          <div className="absolute w-8 h-8 bg-red-500/30 rounded-full blur-md"></div>
        </div>
        <div className="mt-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-red-400 border border-red-500/20 backdrop-blur-sm tracking-wider">
          PATIENT
        </div>
      </div>

      {/* Drone Marker (Detailed) */}
      {showDrone && droneLocation && (
        <div 
          className="absolute transition-all duration-[2000ms] ease-linear flex flex-col items-center z-30"
          style={{ 
            top: '30%', 
            left: '70%',
            transform: 'translate(-50%, -50%)' 
          }}
        >
          {/* Drone Icon */}
          <div className="relative">
             <Navigation className="w-6 h-6 text-emerald-400 fill-emerald-400/10 rotate-[-45deg] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" strokeWidth={1.5} />
          </div>

          <div className="mt-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-400 border border-emerald-500/20 backdrop-blur-sm whitespace-nowrap tracking-wider">
            DRONE-01
          </div>
          
          {/* Virtual Trajectory Line */}
          <svg className="absolute w-[300px] h-[300px] top-1/2 left-1/2 pointer-events-none opacity-30" style={{ transform: 'translate(-100%, -0%) rotate(45deg)' }}>
            <line x1="0" y1="0" x2="100" y2="0" stroke="#10b981" strokeWidth="1" strokeDasharray="2 4" />
          </svg>
        </div>
      )}

      {/* Crosshairs & HUD - Minimal */}
      <div className="absolute inset-4 border border-white/5 rounded-lg pointer-events-none opacity-50"></div>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
        <Crosshair className="w-64 h-64 text-white" strokeWidth={0.5} />
      </div>
    </div>
  );
};


// --- VOICE ASSISTANT COMPONENT (Revised with MediaRecorder) ---
const VoiceAssistant = ({ vitals, analysisResults }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, LISTENING, PROCESSING
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const isListeningRef = useRef(false); // To verify intended state in callbacks
  
  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // We manage restart manually
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current.onend = () => {
        // If we are supposed to be listening, restart it (Auto-restart logic)
        if (isListeningRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Already started or unrelated error
            }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
            setError('Microphone permission denied.');
            stopRecording();
        }
      };
    } else {
      setError('Voice not supported in this browser.');
    }
    
    return () => {
      stopRecording();
    };
  }, []);
  
  const startRecording = async () => {
    try {
       // 1. Get Audio Stream
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       mediaStreamRef.current = stream;
       
       // 2. Setup MediaRecorder
       mediaRecorderRef.current = new MediaRecorder(stream);
       audioChunksRef.current = [];
       
       mediaRecorderRef.current.ondataavailable = (e) => {
         if (e.data.size > 0) {
             console.log("Audio chunk size:", e.data.size); // DEBUG CHECK
             audioChunksRef.current.push(e.data);
         }
       };
       
       mediaRecorderRef.current.onstop = () => {
           // This triggers after we explicitly call stop()
           // We do nothing here, logic is in stopRecording
       };

       mediaRecorderRef.current.start(100); // 100ms slices
       
       // 3. Start Speech Recognition
       if (recognitionRef.current) {
           try {
              recognitionRef.current.start();
           } catch (e) { console.error("Recog start error:", e); }
       }
       
       // 4. Update State
       setIsListening(true);
       isListeningRef.current = true;
       setStatus('LISTENING');
       setTranscript('');
       setAssistantResponse('');
       setError(null);
       
       // Interrupt AI speaking
       window.speechSynthesis.cancel();
       setIsSpeaking(false);

    } catch (err) {
       console.error("Mic Error:", err);
       setError("Could not access microphone.");
    }
  };
  
  const stopRecording = () => {
      if (!isListeningRef.current) return;
      
      setIsListening(false);
      isListeningRef.current = false;
      setStatus('PROCESSING');
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          
          // --- VALIDATION LOGIC ---
          // Wait briefly for final chunk
          setTimeout(() => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
              console.log("Final Audio Blob Size:", audioBlob.size);
              
              if (audioBlob.size < 3000) {
                  // < 3KB -> Likely Silence (0.5s of audio is usually > 8KB at 16bit 16kHz mono)
                  setError("Could not hear you (Audio too short/quiet).");
                  setStatus('IDLE');
              } else {
                  // Valid Audio -> Send (Prioritize Audio, use Transcript as fallback)
                  handleSendToBackend(transcript, audioBlob);
              }
              
              // Clean up tracks
              if (mediaStreamRef.current) {
                  mediaStreamRef.current.getTracks().forEach(track => track.stop());
              }
          }, 200);
      }
      
      // Stop Speech Recognition
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };

  const handleToggleListen = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleSendToBackend = async (text, audioBlob) => {
      setStatus('PROCESSING');
      
      // Prepare FormData
      const formData = new FormData();
      if (audioBlob) {
        formData.append('file', audioBlob, 'voice_input.wav');
      }
      formData.append('user_text', text || "");
      formData.append('blip_context', analysisResults ? `Detected ${analysisResults.primary_injury} with severity ${analysisResults.severity}` : "Unknown visual context");
      formData.append('vitals', JSON.stringify(vitals || { note: "No vitals detected yet" }));
      
      try {
          // Send as multipart/form-data
          const res = await axios.post(`${API_BASE_URL}/patient/voice-assistant`, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data'
              }
          });
          
          // Extract text and audio from new response format
          const aiText = res.data.text || res.data.assistant_text || "Response received";
          const audioBase64 = res.data.audio;
          
          setAssistantResponse(aiText);
          setStatus('IDLE');
          
          // Play Base64 audio if available, otherwise fallback to browser TTS
          if (audioBase64) {
              playBase64Audio(audioBase64);
          } else {
              speakResponse(aiText);
          }
      } catch (err) {
          console.error("Voice Assistant Error:", err);
          const failText = "I am here with you. Help is on the way.";
          setAssistantResponse(failText);
          setStatus('IDLE');
          speakResponse(failText);
      }
  };
  
  const playBase64Audio = (base64Audio) => {
      try {
          setIsSpeaking(true);
          
          // Create audio element from Base64 string
          const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
          const audio = new Audio(audioSrc);
          
          audio.onended = () => {
              setIsSpeaking(false);
          };
          
          audio.onerror = (err) => {
              console.error('Audio playback error:', err);
              setIsSpeaking(false);
          };
          
          // Play the audio
          audio.play().catch(err => {
              console.error('Failed to play audio:', err);
              setIsSpeaking(false);
          });
      } catch (err) {
          console.error('Error processing audio:', err);
          setIsSpeaking(false);
      }
  };
  
  const speakResponse = (text) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.rate = 0.95; 
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
  };
  
  return (
      <div className="bg-[#111625] rounded-xl border border-zinc-800 p-4 relative overflow-hidden mt-4">
          <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isListening ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
                    <Mic className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`} />
                  </div>
                  <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Voice Assistant</h3>
              </div>
              {isSpeaking && <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />}
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 min-h-[60px] mb-3 border border-white/5 transition-colors duration-300 relative">
              {status === 'LISTENING' && transcript && (
                   <p className="text-zinc-200 text-sm">"{transcript}"</p>
              )}
              {status === 'LISTENING' && !transcript && (
                   <div className="flex items-center gap-2 text-zinc-500 text-xs italic">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                       Listening...
                   </div>
              )}
              {status === 'PROCESSING' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold animate-pulse">
                      Processing...
                  </div>
              )}
              {status === 'IDLE' && assistantResponse && (
                  <p className="text-emerald-400 text-sm font-medium">"{assistantResponse}"</p>
              )}
              {status === 'IDLE' && !assistantResponse && !error && (
                  <p className="text-zinc-600 text-xs italic">Tap button to start speaking...</p>
              )}
              
              {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
          </div>
          
          <button
            onClick={handleToggleListen}
            className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                isListening 
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
              {isListening ? 'STOP & SEND' : 'TALK TO ASSISTANT'}
          </button>
      </div>
  );
};



// Hospital Preparation Steps Generator
const generateHospitalPreparation = (severityScore, injuryType, timeWindow) => {
  const caption = injuryType.toLowerCase();
  const steps = [];
  
  if (severityScore >= 8) {
    // Critical/Immediate
    steps.push('ACTIVATE TRAUMA BAY - Priority Alpha');
    steps.push('Mobilize trauma team (surgeon, anesthesiologist, ER attending)');
    steps.push('Prepare O-negative blood units (2-4 units on standby)');
    steps.push('Ready CT scanner for immediate use');
    steps.push('Prepare intubation equipment');
    
    if (caption.includes('bleeding') || caption.includes('hemorrhage')) {
      steps.push('Alert blood bank for potential massive transfusion protocol');
      steps.push('Prepare hemostatic agents and surgical packs');
    }
    if (caption.includes('fracture') || caption.includes('broken')) {
      steps.push('Alert orthopedic surgeon');
      steps.push('Prepare X-ray and fixation equipment');
    }
    if (caption.includes('unconscious') || caption.includes('unresponsive')) {
      steps.push('Prepare neurological assessment tools');
      steps.push('Consider neurosurgery consult on standby');
    }
  } else if (severityScore >= 5) {
    // Urgent/Medium
    steps.push('Prepare ER trauma bed');
    steps.push('Basic trauma assessment kit ready');
    steps.push('IV lines and fluid resuscitation equipment');
    steps.push('Standard imaging protocols available');
    steps.push('Notify attending physician');
    
    if (caption.includes('bleeding') || caption.includes('blood')) {
      steps.push('Prepare suturing and wound care supplies');
    }
    if (caption.includes('fracture')) {
      steps.push('Orthopedic consultation available');
    }
  } else {
    // Stable/Low
    steps.push('Standard ER observation bed');
    steps.push('Basic vital monitoring equipment');
    steps.push('Standard triage assessment protocols');
    steps.push('Non-urgent imaging as needed');
  }
  
  return steps;
};

// Hospital Pre-Alert Message Generator
const generatePreAlertMessage = (analysisData, medicalContext, timeWindow, coordinates) => {
  const timestamp = new Date().toISOString();
  const localTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const preparationSteps = generateHospitalPreparation(
    analysisData.severity,
    analysisData.primary_injury,
    timeWindow
  );
  
  const message = `
==============================================
HOSPITAL EMERGENCY PRE-ALERT
==============================================

ALERT TIMESTAMP: ${localTime}
ALERT SOURCE: PranAIR Medical Drone AI System
ANALYSIS MODE: ${analysisData.mode}

----------------------------------------------
PATIENT CONDITION SUMMARY
----------------------------------------------

PRIMARY ASSESSMENT: ${medicalContext.suspectedInjury}
BLIP VISION ANALYSIS: "${analysisData.primary_injury}"

SEVERITY SCORE: ${analysisData.severity}/10
URGENCY LEVEL: ${timeWindow.urgencyLabel}
CRITICAL TIME WINDOW: ${timeWindow.timeRange}

MEDICAL STATUS:
  - Bleeding: ${medicalContext.bleedingStatus}
  - Consciousness: ${medicalContext.consciousnessStatus}
  - Confidence: ${(analysisData.confidence * 100).toFixed(1)}%

----------------------------------------------
LOCATION & COORDINATES
----------------------------------------------

GPS POSITION: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}
DRONE ALTITUDE: ${analysisData.altitude || 'N/A'}m
BATTERY STATUS: ${analysisData.battery || 'N/A'}%

----------------------------------------------
RECOMMENDED HOSPITAL PREPARATION
----------------------------------------------

${preparationSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

----------------------------------------------
AI CLINICAL REASONING
----------------------------------------------

${timeWindow.explanation}

${medicalContext.reasoning}

----------------------------------------------
CRITICAL NOTES
----------------------------------------------

${analysisData.mode === 'SIMULATION' ? '⚠ This alert is based on SIMULATED data for demonstration purposes.' : '✓ Alert generated from live AI vision analysis.'}

${analysisData.severity >= 8 ? 'IMMEDIATE ACTION REQUIRED - High mortality risk if delayed.' : ''}
${analysisData.severity >= 5 ? 'Rapid response recommended within stated time window.' : 'Standard protocols apply.'}

==============================================
END ALERT - TIMESTAMP: ${localTime}
==============================================
  `.trim();
  
  return message;
};

// Critical Time Window Analyzer
const analyzeCriticalTimeWindow = (severityScore, injuryType) => {
  const caption = injuryType.toLowerCase();
  
  let timeRange = '';
  let timeMinutes = 0;
  let urgencyLabel = '';
  let urgencyColor = '';
  let progressPercent = 0;
  let explanation = '';
  
  if (severityScore >= 9) {
    timeRange = '0-5 minutes';
    timeMinutes = 5;
    urgencyLabel = 'IMMEDIATE';
    urgencyColor = 'text-red-500';
    progressPercent = 100;
    explanation = 'Extreme severity detected. Patient requires immediate intervention. Delays beyond 5 minutes significantly increase mortality risk. Emergency response must be deployed NOW.';
  } else if (severityScore >= 7) {
    timeRange = '5-15 minutes';
    timeMinutes = 15;
    urgencyLabel = 'CRITICAL';
    urgencyColor = 'text-orange-500';
    progressPercent = 75;
    explanation = 'Critical condition identified. Patient stability declining rapidly. Medical intervention required within 15 minutes to prevent life-threatening complications.';
  } else if (severityScore >= 4) {
    timeRange = '15-30 minutes';
    timeMinutes = 30;
    urgencyLabel = 'URGENT';
    urgencyColor = 'text-yellow-500';
    progressPercent = 50;
    explanation = 'Urgent medical attention required. Patient condition is unstable but manageable with timely intervention. Response should be dispatched within 30 minutes.';
  } else {
    timeRange = '30-60 minutes';
    timeMinutes = 60;
    urgencyLabel = 'STABLE';
    urgencyColor = 'text-green-500';
    progressPercent = 25;
    explanation = 'Patient appears stable. Condition does not indicate immediate life threat, but medical evaluation should occur within one hour as precaution.';
  }
  
  // Adjust based on injury keywords
  if (caption.includes('bleeding') || caption.includes('hemorrhage')) {
    explanation += ' Hemorrhage indicators reduce available time window.';
  }
  if (caption.includes('unconscious') || caption.includes('unresponsive')) {
    explanation += ' Loss of consciousness escalates urgency.';
  }
  if (caption.includes('fracture') && severityScore >= 7) {
    explanation += ' Severe structural trauma may indicate internal injuries.';
  }
  
  return {
    timeRange,
    timeMinutes,
    urgencyLabel,
    urgencyColor,
    progressPercent,
    explanation
  };
};

// AI Medical Reasoning Engine
const analyzeMedicalContext = (injuryType, severityScore, mode) => {
  const caption = injuryType.toLowerCase();
  
  // Extract injury type
  let suspectedInjury = 'Unknown';
  if (caption.includes('fracture') || caption.includes('broken')) {
    suspectedInjury = 'Suspected Bone Fracture';
  } else if (caption.includes('bleeding') || caption.includes('blood')) {
    suspectedInjury = 'Active Hemorrhage';
  } else if (caption.includes('burn')) {
    suspectedInjury = 'Thermal Injury';
  } else if (caption.includes('lying') || caption.includes('ground') || caption.includes('fallen')) {
    suspectedInjury = 'Fall-Related Trauma';
  } else if (caption.includes('injured')) {
    suspectedInjury = 'General Trauma';
  } else if (caption.includes('stable') || caption.includes('normal')) {
    suspectedInjury = 'No Visible Injury';
  } else {
    suspectedInjury = 'Under Assessment';
  }
  
  // Detect bleeding
  let bleedingStatus = 'None Detected';
  let bleedingColor = 'text-green-400';
  if (caption.includes('bleeding') || caption.includes('blood') || caption.includes('hemorrhage')) {
    bleedingStatus = 'Severe Bleeding';
    bleedingColor = 'text-red-400';
  } else if (severityScore >= 6) {
    bleedingStatus = 'Possible';
    bleedingColor = 'text-yellow-400';
  }
  
  // Detect consciousness
  let consciousnessStatus = 'Likely Conscious';
  let consciousnessColor = 'text-green-400';
  if (caption.includes('unconscious') || caption.includes('unresponsive')) {
    consciousnessStatus = 'Possibly Unconscious';
    consciousnessColor = 'text-red-400';
  } else if (caption.includes('lying') || caption.includes('ground') || caption.includes('fallen')) {
    consciousnessStatus = 'Status Uncertain';
    consciousnessColor = 'text-yellow-400';
  }
  
  // Determine urgency
  let urgencyLevel = 'Low';
  let urgencyColor = 'text-green-400';
  let urgencyBg = 'bg-green-500/20';
  if (severityScore >= 8) {
    urgencyLevel = 'CRITICAL';
    urgencyColor = 'text-red-400';
    urgencyBg = 'bg-red-500/20';
  } else if (severityScore >= 5) {
    urgencyLevel = 'MEDIUM';
    urgencyColor = 'text-yellow-400';
    urgencyBg = 'bg-yellow-500/20';
  }
  
  // Generate AI reasoning
  const detectedCues = [];
  if (caption.includes('injured')) detectedCues.push('injury markers detected');
  if (caption.includes('lying') || caption.includes('ground') || caption.includes('fallen')) {
    detectedCues.push('subject on ground (fall risk)');
  }
  if (caption.includes('bleeding') || caption.includes('blood')) detectedCues.push('hemorrhage indicators');
  if (caption.includes('fracture') || caption.includes('broken')) detectedCues.push('structural damage');
  if (caption.includes('stable') || caption.includes('normal')) detectedCues.push('scene appears stable');
  
  const reasoning = detectedCues.length > 0
    ? `Analysis based on visual cues: ${detectedCues.join(', ')}. Severity calibrated using AI pattern recognition. ${severityScore >= 7 ? 'Immediate medical intervention recommended.' : 'Monitoring advised.'}`
    : `Severity assessment derived from image analysis patterns. ${severityScore >= 7 ? 'High-priority indicators detected.' : 'No critical markers identified.'}`;
  
  return {
    suspectedInjury,
    bleedingStatus,
    bleedingColor,
    consciousnessStatus,
    consciousnessColor,
    urgencyLevel,
    urgencyColor,
    urgencyBg,
    reasoning,
    detectedCues
  };
};

function App() {
  const [telemetry, setTelemetry] = useState({
    battery: 0,
    altitude: 0,
    status: 'INITIALIZING',
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamActive, setStreamActive] = useState(true);
  const [systemOnline, setSystemOnline] = useState(true);
  const [coordinates, setCoordinates] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [activeRole, setActiveRole] = useState(ROLES.OPERATOR); // Demo Role State
  const [showMobileInfo, setShowMobileInfo] = useState(false); // UI State for Mobile Telemetry

  // --- SOS & MAP STATE ---
  const [sosActive, setSosActive] = useState(false);
  const [sosState, setSosState] = useState('IDLE'); // IDLE, REQUESTING, ACTIVE
  const [patientLocation, setPatientLocation] = useState(null);
  const [droneLocation, setDroneLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // Mock starting point
  const [eta, setEta] = useState(null);
  
  // --- REAL-TIME VITALS (DRONE LINK) ---
  const patientVitals = usePatientVitals(sosActive);

  // --- SOS HANDLER ---
  const handleSOS = () => {
    setSosState('REQUESTING');
    
    // 1. Get Geolocation with high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const patientPos = { lat: latitude, lng: longitude };
          setPatientLocation(patientPos);
          
          // Initialize drone at a nearby starting point (simulate dispatch location)
          const initialDronePos = {
            lat: latitude + 0.01, // ~1km away
            lng: longitude + 0.01
          };
          setDroneLocation(initialDronePos);
          
          // Calculate initial ETA
          const distance = calculateDistance(initialDronePos.lat, initialDronePos.lng, latitude, longitude);
          const initialEta = calculateETA(distance);
          
          // Simulate Server Delay
          setTimeout(() => {
            setSosState('ACTIVE');
            setSosActive(true);
            setEta(initialEta);
          }, 1500);
        },
        (error) => {
          console.error("Location error:", error);
          
          let errorMessage = "Location access denied. ";
          if (error.code === 1) {
            errorMessage += "Please enable location permissions in your browser settings.";
          } else if (error.code === 2) {
            errorMessage += "Location unavailable. Using fallback coordinates.";
          } else if (error.code === 3) {
            errorMessage += "Location request timed out. Using fallback coordinates.";
          }
          
          alert(errorMessage);
          
          // Fallback MOCK coordinates (Delhi center)
          const fallbackPatient = { lat: 28.6139, lng: 77.2090 };
          setPatientLocation(fallbackPatient);
          setDroneLocation({ lat: 28.6239, lng: 77.2190 });
          setSosState('ACTIVE');
          setSosActive(true);
          setEta('8 min');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert("Geolocation not supported by this browser.");
    }
  };

  // --- LIVE TRACKING EFFECT (Patient Location) ---
  useEffect(() => {
    let watchId;
    if (sosActive && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
           const newPatientPos = { 
             lat: position.coords.latitude, 
             lng: position.coords.longitude 
           };
           setPatientLocation(newPatientPos);
           
           console.log('📍 Patient location updated:', newPatientPos);
        },
        (err) => {
          console.error('Location watch error:', err);
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );
    }
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        console.log('🛑 Location watch stopped');
      }
    };
  }, [sosActive]);

  // --- DRONE MOVEMENT SIMULATION ---
  useEffect(() => {
    if (!sosActive || !patientLocation || !droneLocation) return;

    const interval = setInterval(() => {
      setDroneLocation(prev => {
        // Calculate distance to patient
        const distance = calculateDistance(
          prev.lat, prev.lng,
          patientLocation.lat, patientLocation.lng
        );

        // If very close, stop moving
        if (distance < 0.05) { // < 50 meters
          clearInterval(interval);
          setEta('ARRIVED');
          return prev;
        }

        // Move 2% closer each second (smooth approach)
        const newPos = {
          lat: prev.lat + (patientLocation.lat - prev.lat) * 0.02,
          lng: prev.lng + (patientLocation.lng - prev.lng) * 0.02
        };

        // Update ETA
        const newDistance = calculateDistance(
          newPos.lat, newPos.lng,
          patientLocation.lat, patientLocation.lng
        );
        setEta(calculateETA(newDistance));

        console.log(`🚁 Drone moving... Distance: ${newDistance.toFixed(2)}km | ETA: ${calculateETA(newDistance)}`);

        return newPos;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [sosActive, patientLocation, droneLocation]);

  // New State for Image Upload
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const copyAlertToClipboard = (alertText) => {
    navigator.clipboard.writeText(alertText).then(() => {
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  useEffect(() => {
    const fetchDroneStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/drone-status`);
        setTelemetry(response.data);
        setSystemOnline(true);
      } catch (error) {
        console.error('Failed to fetch drone status:', error);
        setSystemOnline(false);
      }
    };

    fetchDroneStatus();
    const interval = setInterval(fetchDroneStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  // Camera initialization - only when needed for Operator/Doctor views
  useEffect(() => {
    // Only initialize camera if we're in Operator or Doctor view
    if (activeRole === ROLES.PATIENT) {
      return;
    }

    const initCamera = async () => {
      // Don't reinitialize if video already has a stream
      if (videoRef.current?.srcObject) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        setStreamActive(false);
      }
    };

    initCamera();

    // Don't stop the camera when switching views - keep it running
    // Only cleanup would happen when the entire component unmounts
  }, [activeRole]); // Re-run when activeRole changes

  const handleTriage = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        throw new Error('Video or canvas not available');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const imageBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      );

      if (!imageBlob) {
        throw new Error('Failed to capture image from video');
      }

      console.log('📸 Captured image:', imageBlob.size, 'bytes');

      const formData = new FormData();
      formData.append('file', imageBlob, 'capture.jpg');

      console.log('📤 Sending to backend:', API_BASE_URL + '/dispatch');

      const response = await axios.post(`${API_BASE_URL}/dispatch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('✅ Analysis successful:', response.data);
      
      const transformedData = {
        severity: response.data.analysis.severity_score,
        primary_injury: response.data.analysis.injury_type,
        confidence: response.data.analysis.confidence,
        mode: response.data.analysis.mode,
        source: response.data.analysis.source || 'live_video_frame',
        coordinates: {
          latitude: response.data.telemetry.lat,
          longitude: response.data.telemetry.lng
        },
        hospital_report: `Emergency Medical Alert - ${response.data.analysis.mode} Mode\n\nDiagnosis: ${response.data.analysis.injury_type}\n\nSeverity Level: ${response.data.analysis.severity_score}/10\nConfidence: ${(response.data.analysis.confidence * 100).toFixed(1)}%\n\nLocation: ${response.data.telemetry.lat.toFixed(4)}, ${response.data.telemetry.lng.toFixed(4)}\nAltitude: ${response.data.telemetry.altitude}m\n\nDrone Status: ${response.data.telemetry.status}\nBattery: ${response.data.telemetry.battery}%\n\nRecommendation: ${response.data.analysis.severity_score >= 7 ? 'IMMEDIATE DISPATCH REQUIRED' : 'Monitor situation'}`,
        raw_analysis: JSON.stringify(response.data, null, 2)
      };
      
      setAnalysisResults(transformedData);
    } catch (error) {
      console.error('❌ Triage failed:', error);

      if (error.response) {
        console.error('📊 Response Status:', error.response.status);
        console.error('📋 Response Data:', error.response.data);

        if (error.response.status === 422) {
          alert(
            '🔴 Connection Error: Backend expects "file" parameter but received something else.\n\n' +
            'This usually means there\'s a mismatch between frontend and backend parameter names.\n\n' +
            'Details: ' + JSON.stringify(error.response.data)
          );
        } else {
          alert(`Triage failed (${error.response.status}): ${error.response.data?.detail || 'Unknown error'}`);
        }
      } else if (error.request) {
        console.error('📡 No response received from server');
        alert(
          '🔴 Network Error: Cannot connect to backend.\n\n' +
          'Please check:\n' +
          '1. Is the backend running on http://localhost:8000?\n' +
          '2. Run: python main.py in the terminal\n' +
          '3. Check if port 8000 is available'
        );
      } else {
        console.error('⚠️ Error:', error.message);
        alert(`Triage failed: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG).');
        return;
      }
      setUploadedImage(file);
      setUploadedImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageAnalysis = async () => {
    if (!uploadedImage) return;

    setIsAnalyzingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedImage);
      formData.append('source', 'uploaded_image');

      console.log('📤 Sending uploaded image to backend:', API_BASE_URL + '/dispatch');

      const response = await axios.post(`${API_BASE_URL}/dispatch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('✅ Image Analysis successful:', response.data);
      
      const transformedData = {
        severity: response.data.analysis.severity_score,
        primary_injury: response.data.analysis.injury_type,
        confidence: response.data.analysis.confidence,
        mode: response.data.analysis.mode,
        source: response.data.analysis.source,
        coordinates: {
          latitude: response.data.telemetry.lat,
          longitude: response.data.telemetry.lng
        },
        hospital_report: `Emergency Medical Alert - ${response.data.analysis.mode} Mode (IMAGE SOURCE)\n\nDiagnosis: ${response.data.analysis.injury_type}\n\nSeverity Level: ${response.data.analysis.severity_score}/10\nConfidence: ${(response.data.analysis.confidence * 100).toFixed(1)}%\n\nLocation: ${response.data.telemetry.lat.toFixed(4)}, ${response.data.telemetry.lng.toFixed(4)}\nAltitude: ${response.data.telemetry.altitude}m\n\nDrone Status: ${response.data.telemetry.status}\nBattery: ${response.data.telemetry.battery}%\n\nRecommendation: ${response.data.analysis.severity_score >= 7 ? 'IMMEDIATE DISPATCH REQUIRED' : 'Monitor situation'}`,
        raw_analysis: JSON.stringify(response.data, null, 2)
      };
      
      setAnalysisResults(transformedData);
    } catch (error) {
       console.error('❌ Image Triage failed:', error);
       alert(`Image analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const renderImageUploadSection = () => (
    <div className={`bg-[#111625] border border-zinc-800 ${activeRole === ROLES.PATIENT ? 'mt-0' : 'mt-4'} rounded-xl p-3 flex flex-col gap-3 group hover:border-zinc-700 transition-colors`}>
         <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-800 rounded-lg">
               <Upload className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div>
                <h3 className="text-[11px] font-bold text-zinc-300 uppercase leading-tight">
                    {activeRole === ROLES.PATIENT ? 'Scene Photo' : 'Visual Input'}
                </h3>
                <p className="text-[9px] text-zinc-500 leading-none mt-0.5">
                    {activeRole === ROLES.PATIENT ? 'Upload photo for context' : 'Supplementary visuals'}
                </p>
            </div>
         </div>

         <div className="flex gap-2">
            <div 
                className="flex-1 border border-dashed border-zinc-700 bg-black/20 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative h-16"
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/jpg" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
                
                {uploadedImagePreview ? (
                    <div className="relative w-full h-full rounded overflow-hidden">
                        <img src={uploadedImagePreview} alt="Preview" className="h-full w-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                             <div className="bg-black/60 p-1 rounded-full"><ImageIcon className="w-3 h-3 text-white" /></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <ImageIcon className="w-4 h-4 text-zinc-600 mx-auto mb-1" />
                        <span className="text-[9px] text-zinc-500 font-medium">Tap to Upload</span>
                    </div>
                )}
            </div>

            <button
                onClick={handleImageAnalysis}
                disabled={!uploadedImage || isAnalyzingImage}
                className={`w-16 rounded-lg font-bold text-[10px] tracking-wide border transition-all flex flex-col items-center justify-center gap-1 ${
                    !uploadedImage 
                        ? 'border-zinc-800 text-zinc-600 cursor-not-allowed bg-transparent'
                        : isAnalyzingImage
                            ? 'border-zinc-700 text-zinc-400 bg-zinc-800/50'
                            : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                }`}
            >
                {isAnalyzingImage ? (
                    <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                ) : (
                    <Navigation className="w-4 h-4" />
                )}
                <span>SEND</span>
            </button>
         </div>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden bg-[#0B1020] text-zinc-100 font-sans selection:bg-emerald-500/30 ${activeRole === ROLES.PATIENT ? 'overflow-y-auto' : ''}`}>
      
      {/* --- TOP HEADER --- */}
      <div className="bg-[#0B1020]/95 backdrop-blur-md border-b border-white/5 shrink-0 z-50 sticky top-0">
        <div className="max-w-[1440px] mx-auto h-14 px-4 flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center font-black text-black shadow-lg shadow-emerald-900/20">P</div>
                <h1 className="font-bold tracking-[0.2em] text-zinc-400 text-xs hidden md:block">
                    PRANAIR <span className="text-white">COMMAND</span>
                </h1>
            </div>

            {/* Role Selector */}
            <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5 shadow-inner">
                <div className="relative group">
                    <select 
                        value={activeRole}
                        onChange={(e) => setActiveRole(e.target.value)}
                        className="appearance-none bg-transparent pl-8 pr-8 py-1.5 text-[10px] md:text-xs font-bold tracking-wider text-zinc-300 focus:outline-none cursor-pointer hover:text-white transition-colors uppercase"
                        style={{
                            colorScheme: 'dark'
                        }}
                    >
                        <option value={ROLES.OPERATOR} className="bg-[#1a1a1a] text-white font-bold">OPERATOR</option>
                        <option value={ROLES.DOCTOR} className="bg-[#1a1a1a] text-white font-bold">DOCTOR</option>
                        <option value={ROLES.PATIENT} className="bg-[#1a1a1a] text-white font-bold">PATIENT</option>
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {activeRole === ROLES.OPERATOR && <User className="w-3.5 h-3.5 text-emerald-500" />}
                        {activeRole === ROLES.DOCTOR && <Stethoscope className="w-3.5 h-3.5 text-blue-500" />}
                        {activeRole === ROLES.PATIENT && <Siren className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-zinc-600" />
                    </div>
                </div>
            </div>
            
            {/* System Status (Desktop) / Info Toggle (Mobile) */}
            <div className="flex items-center gap-4">
                {/* Mobile Info Toggle */}
                {activeRole !== ROLES.PATIENT && (
                    <button 
                        onClick={() => setShowMobileInfo(!showMobileInfo)}
                        className="md:hidden p-2 text-zinc-400 hover:text-white active:scale-95 transition-transform"
                    >
                        {showMobileInfo ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </button>
                )}

                <div className="hidden md:flex items-center gap-6 text-[10px] font-mono tracking-wider">
                    {activeRole !== ROLES.PATIENT && (
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${systemOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
                            <span className={`${systemOnline ? 'text-emerald-500' : 'text-red-500'}`}>SYS {systemOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden relative max-w-[1440px] w-full mx-auto">
      
      {activeRole === ROLES.PATIENT ? (
          // === PATIENT / BYSTANDER VIEW ===
          <div className="flex-1 overflow-y-auto h-full p-4 flex flex-col items-center custom-scrollbar">
              <div className="w-full max-w-sm space-y-4 pb-10">
                  
                  {!sosActive ? (
                      // SCREEN 1: TRIGGER
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-700">
                          <div className="space-y-3">
                             <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
                             </div>
                             <h1 className="text-2xl font-black text-white tracking-tight">EMERGENCY<br/>RESPONSE</h1>
                             <p className="text-xs text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
                                 Press below to share location and request drone medical triage.
                             </p>
                          </div>

                          <button 
                              onClick={handleSOS}
                              disabled={sosState === 'REQUESTING'}
                              className="w-48 h-48 rounded-full bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.3)] hover:shadow-[0_0_100px_rgba(220,38,38,0.5)] active:scale-95 transition-all duration-300 relative group border-4 border-black ring-1 ring-red-500/50"
                          >
                              {sosState === 'REQUESTING' ? (
                                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                  <div className="flex flex-col items-center gap-1 z-10">
                                      <span className="text-3xl font-black text-white tracking-widest drop-shadow-md">SOS</span>
                                      <span className="text-[9px] font-bold text-red-200 uppercase tracking-widest opacity-80">ACTIVATE</span>
                                  </div>
                              )}
                          </button>

                          <div className="text-[10px] text-zinc-600 font-mono text-center">
                             ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
                          </div>
                      </div>
                  ) : (
                      // SCREEN 2: ACTIVE STATUS
                      <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-500">
                           {/* Status Banner */}
                           <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                                <div className="flex items-center gap-3 z-10">
                                    <div className="relative">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute inset-0"></div>
                                        <div className="w-3 h-3 bg-red-500 rounded-full relative border border-white/50"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-red-400 font-bold text-xs tracking-widest">PATIENT SOS ACTIVE</span>
                                        <span className="text-red-300/50 text-[10px] uppercase">Tracking Location...</span>
                                    </div>
                                </div>
                                <div className="text-right z-10">
                                    <div className="bg-red-500/20 px-2 py-1 rounded text-red-100 font-mono text-sm font-bold border border-red-500/30">
                                        {eta || '--:--'}
                                    </div>
                                </div>
                           </div>

                           {/* Map Card */}
                           <div className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl h-[320px]">
                               <LiveLocationMap 
                                  patientLocation={patientLocation} 
                                  droneLocation={droneLocation} 
                                  showDrone={sosActive}
                                  className="w-full h-full"
                               />
                           </div>

                           {/* PATIENT VITALS (Simplified) */}
                           {patientVitals && (
                            <div className="bg-[#111625] rounded-xl overflow-hidden border border-zinc-800 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                                <div className="bg-zinc-900/50 p-3 border-b border-zinc-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                        <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Your Vitals (Drone Link)</h3>
                                    </div>
                                    <div className="px-2 py-0.5 bg-zinc-800 rounded border border-white/5">
                                        <span className={`text-[9px] font-bold ${patientVitals.heartRate > 110 ? 'text-yellow-500' : 'text-emerald-400'}`}>
                                            {patientVitals.heartRate > 110 ? 'NEEDS ATTENTION' : 'STABLE'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Heart Rate</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white">{patientVitals.heartRate}</span>
                                            <span className="text-[9px] text-zinc-600">BPM</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Oxygen</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white">{patientVitals.spo2}</span>
                                            <span className="text-[9px] text-zinc-600">%</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Temp</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white">{patientVitals.temperature}</span>
                                            <span className="text-[9px] text-zinc-600">°C</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Status</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] font-bold text-emerald-400">Conscious</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-emerald-500/10 p-3 border-t border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-300 leading-snug">
                                        <Heart className="w-3 h-3 inline-block mr-1 text-emerald-500" />
                                        Your vital signs are being transmitted to the medical team. Help is on the way.
                                    </p>
                                </div>
                            </div>
                           )}

                           {/* PATIENT SAFETY CHECKS */}
                           <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-4">
                               <div className="flex items-center gap-2 mb-3">
                                   <ShieldAlert className="w-4 h-4 text-red-400" />
                                   <h3 className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Important Right Now</h3>
                               </div>
                               <ul className="space-y-2">
                                   <li className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5"></div>
                                        <span className="text-[10px] text-zinc-400">Stay still if you suspect any injury.</span>
                                   </li>
                                   <li className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5"></div>
                                        <span className="text-[10px] text-zinc-400">Keep the area around you clear for the drone.</span>
                                   </li>
                                   <li className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5"></div>
                                        <span className="text-[10px] text-zinc-400">Keep this screen open for the operator.</span>
                                   </li>
                               </ul>
                           </div>

                           {/* VOICE ASSISTANT */}
                           <VoiceAssistant vitals={patientVitals} analysisResults={analysisResults} />

                           {/* Upload Button */}
                           {renderImageUploadSection()}

                           {/* Action Cards Grid */}
                           <div className="grid grid-cols-2 gap-2 mt-2">
                               <div className="bg-[#151a25] p-3 rounded-xl border border-zinc-800/50">
                                   <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                       <Navigation className="w-4 h-4 text-emerald-500" />
                                   </div>
                                   <h3 className="text-zinc-300 text-[10px] font-bold uppercase mb-1">Stay Clear</h3>
                                   <p className="text-[10px] text-zinc-500 leading-tight">Keep landing zone clear of obstacles.</p>
                               </div>
                               <div className="bg-[#151a25] p-3 rounded-xl border border-zinc-800/50">
                                   <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                                       <Radio className="w-4 h-4 text-blue-500" />
                                   </div>
                                   <h3 className="text-zinc-300 text-[10px] font-bold uppercase mb-1">Connected</h3>
                                   <p className="text-[10px] text-zinc-500 leading-tight">Operator is monitoring your status.</p>
                               </div>
                           </div>
                      </div>
                  )}
              </div>
          </div>
      ) : (
        // === DASHBOARD GRID VIEW (OPERATOR & DOCTOR) ===
        <div className="h-full p-4 lg:p-6 overflow-y-auto lg:overflow-hidden custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-[1440px] mx-auto">
            
            {/* --- LEFT COLUMN: TELEMETRY (Hidden on Mobile unless toggled) --- */}
            {activeRole === ROLES.OPERATOR && (
                <div className={`
                    lg:col-span-3 lg:flex flex-col gap-4 h-full
                    ${showMobileInfo ? 'fixed inset-0 z-50 bg-[#0B1020] p-6 flex' : 'hidden'}
                `}>
                    {/* Mobile Close Button */}
                    <div className="flex justify-between items-center lg:hidden mb-4">
                        <span className="text-sm font-bold tracking-widest text-zinc-400">MISSION DATA</span>
                        <button onClick={() => setShowMobileInfo(false)}><X className="text-zinc-400" /></button>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-500/50 mb-1 lg:mb-0">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Telemetry Stream</span>
                    </div>
                
                    {/* Telemetry Cards */}
                    <div className="space-y-3">
                        {/* Status */}
                        <div className="bg-[#111625] border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Status</span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/30 ${telemetry?.status === 'AIRBORNE' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {telemetry?.status || 'INIT'}
                            </span>
                        </div>

                        {/* Battery */}
                        <div className="bg-[#111625] border border-white/5 p-4 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Battery</span>
                                <Battery className={`w-4 h-4 ${telemetry?.battery < 20 ? 'text-red-500' : 'text-emerald-500'}`} />
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${
                                        (telemetry?.battery ?? 0) > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                        (telemetry?.battery ?? 0) > 20 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`}
                                    style={{ width: `${telemetry?.battery ?? 0}%` }}
                                />
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-xl font-mono font-bold text-zinc-200">{telemetry?.battery?.toFixed(0)}%</span>
                            </div>
                        </div>

                        {/* Altitude */}
                        <div className="bg-[#111625] border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
                            <div>
                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1 tracking-wider">Altitude</div>
                                <div className="text-xl font-mono font-bold text-blue-400">
                                    {telemetry?.altitude?.toFixed(1)} <span className="text-[10px] text-zinc-600">m</span>
                                </div>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-900/50" />
                        </div>

                        {/* Location Compact */}
                        <div className="bg-[#111625] border border-white/5 p-4 rounded-xl shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-zinc-600" />
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Coordinates</span>
                            </div>
                            <div className="font-mono text-[10px] text-zinc-400 grid grid-cols-2 gap-2">
                                <div className="bg-black/40 p-2 rounded border border-white/5">
                                    <span className="block text-zinc-600 text-[8px]">LAT</span>
                                    {coordinates.latitude.toFixed(5)}
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-white/5">
                                    <span className="block text-zinc-600 text-[8px]">LNG</span>
                                    {coordinates.longitude.toFixed(5)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CENTER COLUMN: LIVE FEED & MAP --- */}
            <div className={`flex flex-col gap-4 h-full min-h-[500px] lg:min-h-0 ${activeRole === ROLES.DOCTOR ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
                
                {/* Live Feed Panel */}
                <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-zinc-800 shadow-2xl group flex flex-col">
                    {/* Header Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-white tracking-widest">LIVE OPTICAL</span>
                        </div>
                        {isAnalyzing && (
                            <div className="bg-emerald-500 text-black px-2 py-1 rounded-md font-bold text-[10px] tracking-widest shadow-lg animate-pulse">
                                SCANNING
                            </div>
                        )}
                    </div>

                    {/* Video Area */}
                    <div className={`relative flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden`}>
                        <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover opacity-90 contrast-[1.1] brightness-[1.1]"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanner Effect */}
                        {isAnalyzing && (
                        <div className="absolute inset-0 z-10 pointer-events-none bg-emerald-500/5">
                            <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan"></div>
                        </div>
                        )}
                    </div>

                    {/* Operator Controls */}
                    {activeRole === ROLES.OPERATOR && (
                        <div className="bg-[#111625] border-t border-zinc-800 p-0">
                            <button
                                onClick={handleTriage}
                                disabled={isAnalyzing}
                                className={`w-full py-4 text-center font-bold text-[11px] tracking-[0.2em] transition-all relative overflow-hidden group ${
                                    isAnalyzing
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:brightness-110 active:scale-[0.99]'
                                }`}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {isAnalyzing ? <span className="animate-pulse">PROCESSING...</span> : (
                                        <>
                                            <Crosshair className="w-4 h-4" />
                                            RUN ANALYSIS
                                        </>
                                    )}
                                </div>
                                {!isAnalyzing && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Live Map (Conditional) */}
                {sosActive && activeRole === ROLES.OPERATOR && (
                    <div className="h-48 lg:h-64 rounded-xl overflow-hidden border border-zinc-800 shadow-lg relative">
                        <div className="absolute top-2 right-2 z-[1001] bg-red-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse shadow-lg">SOS ACTIVE</div>
                        <LiveLocationMap 
                            patientLocation={patientLocation} 
                            droneLocation={droneLocation} 
                            showDrone={true}
                            className="w-full h-full"
                        />
                    </div>
                )}

                {/* Mobile Upload Section - Visible here for layout balance */}
                <div className="lg:hidden">
                   {renderImageUploadSection()}
                </div>
                 
                 {/* Desktop Upload Section */}
                <div className="hidden lg:block">
                   {renderImageUploadSection()}
                </div>

            </div>

            {/* --- RIGHT COLUMN: TACTICAL MAPS (OPERATOR) OR AI ANALYSIS (DOCTOR) --- */}
            <div className={`flex flex-col h-full bg-[#0B1020] lg:pl-2 overflow-hidden ${activeRole === ROLES.DOCTOR ? 'lg:col-span-8' : 'lg:col-span-4'}`}>
                
                {/* OPERATOR VIEW: Tactical Map Grid */}
                {activeRole === ROLES.OPERATOR && sosActive && patientLocation && (
                    <TacticalMapGrid 
                        realPatient={{
                            id: 'PRIMARY_SOS',
                            latitude: patientLocation.lat,
                            longitude: patientLocation.lng,
                            severity: 9, // Critical - primary SOS
                            label: 'CRITICAL'
                        }}
                        drone={{
                            id: 'DRONE_01',
                            latitude: droneLocation.lat,
                            longitude: droneLocation.lng,
                            battery: telemetry?.battery || 85,
                            altitude: telemetry?.altitude || 120,
                            status: telemetry?.status || 'AIRBORNE'
                        }}
                    />
                )}
                
                {/* OPERATOR VIEW: Awaiting SOS */}
                {activeRole === ROLES.OPERATOR && !sosActive && (
                    <div className="h-full flex items-center justify-center bg-[#111625] rounded-xl border border-zinc-800">
                        <div className="text-center text-zinc-500">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs font-medium">Awaiting SOS Activation</p>
                            <p className="text-[10px] opacity-40 mt-1">Tactical maps will appear once emergency is triggered</p>
                        </div>
                    </div>
                )}
                
                {/* DOCTOR VIEW: AI Analysis Panel */}
                {activeRole === ROLES.DOCTOR && (
                    <>
                        <div className="flex items-center gap-2 text-purple-400 mb-4 flex-shrink-0">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">DIAGNOSTIC DATA</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 pb-10 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                    
                    {/* 1. DOCTOR VITALS PANEL (Always visible if active) */}
                    {patientVitals && (() => {
                        const analysis = analyzeVitalsForDoctor(patientVitals);
                        return (
                            <div className="col-span-2 space-y-4 mb-4">
                                {/* Vitals Grid */}
                                <div className="bg-[#111625] rounded-xl border border-zinc-800 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Drone-Captured Vitals</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[9px] text-zinc-500 font-mono">LIVE LINK</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-4">
                                        {/* HR */}
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <span className="text-[9px] text-zinc-500 font-bold block mb-1">HR</span>
                                            <span className="text-xl font-mono font-bold text-white">{patientVitals.heartRate}</span>
                                            <span className="text-[9px] text-zinc-600 ml-1">bpm</span>
                                        </div>
                                        {/* SpO2 */}
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <span className="text-[9px] text-zinc-500 font-bold block mb-1">SpO₂</span>
                                            <span className={`text-xl font-mono font-bold ${patientVitals.spo2 < 94 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {patientVitals.spo2}%
                                            </span>
                                        </div>
                                        {/* BP */}
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <span className="text-[9px] text-zinc-500 font-bold block mb-1">BP</span>
                                            <span className="text-lg font-mono font-bold text-white whitespace-nowrap">
                                                {patientVitals.bloodPressure.sys}/{patientVitals.bloodPressure.dia}
                                            </span>
                                            <span className="text-[9px] text-zinc-600 block">mmHg</span>
                                        </div>
                                        {/* RR */}
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <span className="text-[9px] text-zinc-500 font-bold block mb-1">RR</span>
                                            <span className="text-xl font-mono font-bold text-white">{patientVitals.respiratoryRate}</span>
                                            <span className="text-[9px] text-zinc-600 ml-1">/min</span>
                                        </div>
                                        {/* Temp */}
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <span className="text-[9px] text-zinc-500 font-bold block mb-1">Temp</span>
                                            <span className="text-xl font-mono font-bold text-white">{patientVitals.temperature}</span>
                                            <span className="text-[9px] text-zinc-600 ml-1">°C</span>
                                        </div>
                                        {/* Shock Index */}
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <span className="text-[9px] text-zinc-500 font-bold block mb-1">SI</span>
                                            <span className={`text-xl font-mono font-bold ${patientVitals.shockIndex > 0.9 ? 'text-red-400' : 'text-zinc-300'}`}>
                                                {patientVitals.shockIndex}
                                            </span>
                                        </div>
                                        {/* AVPU */}
                                        <div className="col-span-2 bg-black/20 p-2 rounded border border-white/5 flex items-center justify-between">
                                            <span className="text-[9px] text-zinc-500 font-bold">AVPU</span>
                                            <span className="text-sm font-bold text-emerald-400">{patientVitals.consciousness}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Clinical Interpretation */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#111625] rounded-xl border border-dashed border-zinc-700 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-3 h-3 text-purple-400" />
                                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase">Clinical Interpretation</h3>
                                        </div>
                                        <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                                            "{analysis.interpretation}"
                                        </p>
                                    </div>

                                    {/* Pre-Arrival Prep */}
                                    <div className="bg-[#111625] rounded-xl border border-zinc-800 p-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <Package className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-[10px] font-bold text-zinc-400 uppercase mb-3 text-center border-b border-zinc-800 pb-2">Preparation Checklist</h3>
                                        <div className="space-y-1.5">
                                            {analysis.preparation.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3 text-emerald-500/50" />
                                                    <span className="text-[10px] text-zinc-300 font-mono">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    
                    {/* Empty State */}
                    {!analysisResults && !isAnalyzing && !patientVitals && (
                        <div className={`h-64 lg:h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800/50 rounded-xl bg-[#111625]/30 ${activeRole === ROLES.DOCTOR ? 'col-span-2' : ''}`}>
                            <div className="p-4 bg-zinc-800/20 rounded-full mb-3">
                                <Activity className="w-6 h-6 opacity-40" />
                            </div>
                            <p className="text-xs font-medium text-zinc-500">Awaiting Signal</p>
                            <p className="text-[10px] opacity-40">System Ready</p>
                        </div>
                    )}

                    {/* Loader */}
                    {isAnalyzing && !analysisResults && (
                        <div className={`space-y-3 animate-pulse opacity-50 ${activeRole === ROLES.DOCTOR ? 'col-span-2' : ''}`}>
                            <div className="h-32 bg-zinc-800 rounded-xl"></div>
                            <div className="h-24 bg-zinc-800 rounded-xl"></div>
                            <div className="h-40 bg-zinc-800 rounded-xl"></div>
                        </div>
                    )}

                    {/* Results Display */}
                    {analysisResults && (() => {
                        const medicalContext = analyzeMedicalContext(
                            analysisResults.primary_injury,
                            analysisResults.severity,
                            analysisResults.mode
                        );
                        
                        const timeWindow = analyzeCriticalTimeWindow(
                            analysisResults.severity,
                            analysisResults.primary_injury
                        );

                        return (
                            <>
                                {/* 1. Time Window Card */}
                                <div className={`p-4 rounded-xl border-l-2 bg-[#111625] ${timeWindow.severity >= 8 ? 'border-red-500 bg-red-500/5' : 'border-emerald-500'}`}>
                                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Critical Window</h3>
                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className={`text-xl font-bold ${timeWindow.urgencyColor}`}>
                                            {timeWindow.timeRange}
                                        </span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded bg-black/40 border border-white/5 uppercase`}>
                                            {timeWindow.urgencyLabel}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed opacity-80">
                                        {timeWindow.explanation}
                                    </p>
                                </div>

                                {/* 2. Severity & Metrics */}
                                <div className="bg-[#111625] rounded-xl p-4 border border-zinc-800/50 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="text-[9px] font-bold text-zinc-500 uppercase mb-0.5">Severity Score</div>
                                            <div className="text-2xl font-black text-white">
                                                {analysisResults.severity}<span className="text-sm text-zinc-600 font-normal">/10</span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded ${medicalContext.urgencyBg}`}>
                                            <span className={`text-[9px] font-bold uppercase ${medicalContext.urgencyColor}`}>
                                                {medicalContext.urgencyLevel} Priority
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                        className={`h-full ${
                                            analysisResults.severity >= 8 ? 'bg-red-500' :
                                            analysisResults.severity >= 5 ? 'bg-yellow-500' :
                                            'bg-emerald-500'
                                        }`}
                                        style={{ width: `${(analysisResults.severity / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* 3. Findings List */}
                                <div className="bg-[#111625] rounded-xl overflow-hidden border border-zinc-800/50 divide-y divide-zinc-800/50">
                                    <div className="p-3 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Injury</span>
                                        <span className="text-[11px] text-zinc-200 font-medium text-right">{medicalContext.suspectedInjury}</span>
                                    </div>
                                    <div className="p-3 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Blood Loss</span>
                                        <span className={`text-[11px] font-medium ${medicalContext.bleedingColor === 'text-green-400' ? 'text-zinc-400' : 'text-red-400'}`}>
                                            {medicalContext.bleedingStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* 4. Visual Analysis */}
                                <div className={`bg-[#111625] rounded-xl p-4 border border-zinc-800/50 ${activeRole === ROLES.DOCTOR ? 'col-span-2' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-[10px] font-bold text-emerald-500 flex items-center gap-2 uppercase tracking-wider">
                                            <Eye className="w-3 h-3" />
                                            AI Observation
                                        </h3>
                                        <span className="text-[8px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                                            {analysisResults.source === 'uploaded_image' ? 'IMG' : 'LIVE'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-300 font-medium italic border-l-2 border-zinc-700 pl-3 py-1 my-2">
                                        "{analysisResults.primary_injury}"
                                    </p>
                                    <div className="flex justify-end">
                                        <span className="text-[9px] text-emerald-600 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-900/20">
                                            Confidence: {(analysisResults.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* 5. Reasoning */}
                                <div className={`p-4 rounded-xl border border-dashed border-zinc-800 bg-black/20 ${activeRole === ROLES.DOCTOR ? 'col-span-2' : ''}`}>
                                    <h3 className="text-[10px] font-bold text-purple-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                        <Zap className="w-3 h-3" />
                                        Inference
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                        {medicalContext.reasoning}
                                    </p>
                                </div>

                                {/* 6. Pre-Alert Action */}
                                <div className={`mt-2 ${activeRole === ROLES.DOCTOR ? 'col-span-2' : ''}`}>
                                    <button
                                        onClick={() => {
                                            const alertData = {
                                                ...analysisResults,
                                                altitude: telemetry.altitude,
                                                battery: telemetry.battery
                                            };
                                            const alertMessage = generatePreAlertMessage(
                                                alertData,
                                                medicalContext,
                                                timeWindow,
                                                analysisResults.coordinates
                                            );
                                            copyAlertToClipboard(alertMessage);
                                        }}
                                        className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                            copiedAlert
                                            ? 'bg-emerald-500 text-black border-emerald-500'
                                            : 'bg-[#111625] text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                                        }`}
                                    >
                                        <Package className="w-3 h-3" />
                                        {copiedAlert ? 'Report Copied' : 'Generate Hospital Alert'}
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </div>
                    </>
                )}
            </div>

            </div>
        </div>
      )}
      
      </div>
      
      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
}

export default App;
