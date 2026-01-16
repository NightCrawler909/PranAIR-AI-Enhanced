import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

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
  // State Management
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Copy to clipboard handler
  const copyAlertToClipboard = (alertText) => {
    navigator.clipboard.writeText(alertText).then(() => {
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Poll drone status every 3 seconds
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

  // Initialize camera stream
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        setStreamActive(false);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle AI Triage
  const handleTriage = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      // Capture frame from video
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        throw new Error('Video or canvas not available');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert canvas to blob
      const imageBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      );

      if (!imageBlob) {
        throw new Error('Failed to capture image from video');
      }

      console.log('📸 Captured image:', imageBlob.size, 'bytes');

      // Prepare form data - CRITICAL: Use 'file' as the key name (backend expects this)
      const formData = new FormData();
      formData.append('file', imageBlob, 'capture.jpg');

      console.log('📤 Sending to backend:', API_BASE_URL + '/dispatch');

      // Send to backend
      const response = await axios.post(`${API_BASE_URL}/dispatch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('✅ Analysis successful:', response.data);
      
      // Transform backend response to frontend format
      const transformedData = {
        severity: response.data.analysis.severity_score,
        primary_injury: response.data.analysis.injury_type,
        confidence: response.data.analysis.confidence,
        mode: response.data.analysis.mode,
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

      // Enhanced error logging
      if (error.response) {
        // Server responded with error
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
        // Request made but no response
        console.error('📡 No response received from server');
        alert(
          '🔴 Network Error: Cannot connect to backend.\n\n' +
          'Please check:\n' +
          '1. Is the backend running on http://localhost:8000?\n' +
          '2. Run: python main.py in the terminal\n' +
          '3. Check if port 8000 is available'
        );
      } else {
        // Other errors
        console.error('⚠️ Error:', error.message);
        alert(`Triage failed: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Severity Badge Component
  const SeverityBadge = ({ severity }) => {
    let colorClass = 'bg-green-500';
    let textColor = 'text-green-100';
    let label = 'LOW';

    if (severity >= 8) {
      colorClass = 'bg-red-500';
      textColor = 'text-red-100';
      label = 'CRITICAL';
    } else if (severity >= 4) {
      colorClass = 'bg-yellow-500';
      textColor = 'text-yellow-100';
      label = 'MODERATE';
    }

    return (
      <div className={`${colorClass} ${textColor} px-4 py-2 rounded-lg font-bold text-lg inline-flex items-center gap-2`}>
        <AlertCircle className="w-5 h-5" />
        SEVERITY: {severity}/10 - {label}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <aside className="w-20 glass-sidebar flex flex-col items-center py-8 gap-8">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl">
          P
        </div>
        <nav className="flex flex-col gap-6">
          <button className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button className="p-3 rounded-xl text-zinc-400 hover:bg-zinc-800 transition-colors">
            <History className="w-6 h-6" />
          </button>
          <button className="p-3 rounded-xl text-zinc-400 hover:bg-zinc-800 transition-colors">
            <Map className="w-6 h-6" />
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass-card border-x-0 border-t-0 rounded-none px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${systemOnline ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="font-semibold tracking-wide">
                SYSTEM: <span className={`${systemOnline ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                  {systemOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </span>
            </div>
            <div className="h-6 w-px bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <Battery className={`w-5 h-5 ${telemetry.battery > 20 ? 'text-blue-400' : 'text-red-400'}`} />
              <span className="font-semibold tracking-wide">
                Battery: <span className={`${telemetry.battery > 20 ? 'text-blue-400' : 'text-red-400'} font-mono`}>{telemetry.battery.toFixed(1)}%</span>
              </span>
            </div>
            <div className="h-6 w-px bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              <span className="font-semibold tracking-wide">
                Altitude: <span className="text-purple-400 font-mono">{telemetry.altitude.toFixed(1)}m</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {streamActive && (
              <div className="status-indicator status-online">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                LIVE CAMERA
              </div>
            )}
            {analysisResults && analysisResults.mode === 'SIMULATION' && (
              <div className="status-indicator status-simulation">
                SIMULATION MODE
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" style={{ animation: 'pulse-slow 2s ease-in-out infinite' }}></div>
              <span className="font-semibold text-red-400 text-sm tracking-wider">RECORDING</span>
            </div>
          </div>
        </header>

        {/* Content Grid - 3 Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-auto">
          {/* Left Sidebar - Telemetry */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <span>Drone Telemetry</span>
              </h2>
              <div className="space-y-5">
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</span>
                  </div>
                  <span className={`text-lg font-bold ${telemetry?.status === 'AIRBORNE' ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {telemetry?.status || 'INITIALIZING'}
                  </span>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Battery</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-blue-400 font-mono">{telemetry?.battery?.toFixed(1) ?? '--'}</span>
                    <span className="text-sm text-zinc-500">%</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        (telemetry?.battery ?? 0) > 50 ? 'bg-blue-500' :
                        (telemetry?.battery ?? 0) > 20 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${telemetry?.battery ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Altitude</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-purple-400 font-mono">{telemetry?.altitude?.toFixed(1) ?? '--'}</span>
                    <span className="text-sm text-zinc-500">m</span>
                  </div>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Location</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Lat:</span>
                      <span className="text-sm text-emerald-400 font-mono">{coordinates.latitude.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Lng:</span>
                      <span className="text-sm text-emerald-400 font-mono">{coordinates.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Live Feed */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Video Feed */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 hover:shadow-2xl transition-all h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Radio className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>Live Drone Feed</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                    telemetry.status === 'AIRBORNE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {telemetry.status}
                  </span>
                </div>
              </div>

              {/* Video Container */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-700/50">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Animation Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="relative w-full h-full">
                      <div className="scanning-line"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="glass-card px-10 py-6 rounded-xl border-2 border-emerald-500/30">
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex gap-2">
                              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <p className="text-emerald-400 font-bold text-lg tracking-wide">
                              AI ANALYSIS IN PROGRESS
                            </p>
                            <p className="text-zinc-400 text-sm">
                              Processing visual data...
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stream Status Indicator */}
                {!streamActive && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-red-400 font-bold">Camera Stream Unavailable</p>
                      <p className="text-zinc-400 text-sm mt-2">Using simulated feed</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-4 mt-auto">
                <button
                  onClick={handleTriage}
                  disabled={isAnalyzing}
                  className={`flex-1 py-4 rounded-xl font-bold text-base tracking-wide transition-all transform shadow-lg ${
                    isAnalyzing
                      ? 'bg-zinc-700 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.02] hover:shadow-emerald-500/50 active:scale-[0.98]'
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-3 border-zinc-400 border-t-white rounded-full animate-spin"></div>
                      ANALYZING...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      RUN AI TRIAGE
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - AI Medical Assessment */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>AI Medical Assessment</span>
                </h2>
                {analysisResults && analysisResults.mode === 'SIMULATION' && (
                  <div className="status-indicator status-simulation">
                    SIMULATION
                  </div>
                )}
                {analysisResults && analysisResults.mode === 'AI' && (
                  <div className="status-indicator status-online">
                    <Zap className="w-3 h-3" />
                    AI ACTIVE
                  </div>
                )}
              </div>

              {!analysisResults && !isAnalyzing && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 font-semibold mb-2">No Analysis Performed</p>
                  <p className="text-zinc-500 text-sm">Click "RUN AI TRIAGE" to begin</p>
                </div>
              )}

              {isAnalyzing && !analysisResults && (
                <div className="space-y-4 fade-in">
                  <div className="skeleton h-20 w-full"></div>
                  <div className="skeleton h-16 w-full"></div>
                  <div className="skeleton h-24 w-full"></div>
                </div>
              )}

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
                  <div className="space-y-5 fade-in slide-in-right">
                    {/* Critical Time Window - Priority Display */}
                    <div className={`bg-gradient-to-br ${
                      analysisResults.severity >= 9 ? 'from-red-900/40 to-red-800/40 border-red-600 pulse-critical' :
                      analysisResults.severity >= 7 ? 'from-orange-900/40 to-orange-800/40 border-orange-600' :
                      analysisResults.severity >= 4 ? 'from-yellow-900/40 to-yellow-800/40 border-yellow-600' :
                      'from-green-900/40 to-green-800/40 border-green-600'
                    } rounded-xl p-5 border-2 shadow-xl transition-all hover:scale-[1.01]`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2.5 ${timeWindow.urgencyColor.replace('text-', 'bg-')}/20 rounded-lg border ${timeWindow.urgencyColor.replace('text-', 'border-')}/30`}>
                          <Clock className={`w-6 h-6 ${timeWindow.urgencyColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xs font-bold text-zinc-300 mb-1 tracking-wider uppercase">Critical Time Window</h3>
                          <div className="flex items-baseline gap-3">
                            <span className={`text-3xl font-bold ${timeWindow.urgencyColor} tracking-tight`}>
                              {timeWindow.timeRange}
                            </span>
                            <span className={`text-sm font-bold ${timeWindow.urgencyColor} px-2 py-0.5 rounded`}>
                              {timeWindow.urgencyLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Time Progress Bar */}
                      <div className="mb-3">
                        <div className="h-2.5 bg-zinc-900/70 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all duration-1000 ease-out ${
                              analysisResults.severity >= 9 ? 'bg-red-500' :
                              analysisResults.severity >= 7 ? 'bg-orange-500' :
                              analysisResults.severity >= 4 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ 
                              width: `${timeWindow.progressPercent}%`,
                              animation: analysisResults.severity >= 9 ? 'pulse 1.5s ease-in-out infinite' : 'none'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Explanation */}
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        {timeWindow.explanation}
                      </p>
                      
                      {analysisResults.mode === 'SIMULATION' && (
                        <div className="mt-3 pt-3 border-t border-zinc-700/50 text-xs text-yellow-400 italic flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Estimate based on simulated data
                        </div>
                      )}
                    </div>

                    {/* Severity Progress Bar */}
                    <div className="space-y-3 bg-zinc-900/30 rounded-xl p-4 border border-zinc-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-400">SEVERITY</span>
                        <span className={`text-xl font-bold ${medicalContext.urgencyColor} font-mono`}>
                          {analysisResults.severity}/10
                        </span>
                      </div>
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            analysisResults.severity >= 8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            analysisResults.severity >= 5 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
                          style={{ width: `${(analysisResults.severity / 10) * 100}%` }}
                        />
                      </div>
                      <div className={`${medicalContext.urgencyBg} border ${medicalContext.urgencyColor.replace('text-', 'border-')} px-3 py-2 rounded-lg`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300">URGENCY</span>
                          <span className={`text-sm font-bold ${medicalContext.urgencyColor}`}>
                            {medicalContext.urgencyLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Medical Status Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Injury Type */}
                      <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700/50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                            <Heart className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-semibold text-zinc-400 mb-1">SUSPECTED INJURY</h3>
                            <p className="text-sm font-medium text-white">
                              {medicalContext.suspectedInjury}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bleeding Status */}
                      <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700/50">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 ${medicalContext.bleedingColor.replace('text-', 'bg-')}/20 rounded-lg flex-shrink-0`}>
                            <Droplet className={`w-4 h-4 ${medicalContext.bleedingColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-semibold text-zinc-400 mb-1">BLEEDING</h3>
                            <p className={`text-sm font-medium ${medicalContext.bleedingColor}`}>
                              {medicalContext.bleedingStatus}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Consciousness */}
                      <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700/50">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 ${medicalContext.consciousnessColor.replace('text-', 'bg-')}/20 rounded-lg flex-shrink-0`}>
                            <Eye className={`w-4 h-4 ${medicalContext.consciousnessColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-semibold text-zinc-400 mb-1">CONSCIOUSNESS</h3>
                            <p className={`text-sm font-medium ${medicalContext.consciousnessColor}`}>
                              {medicalContext.consciousnessStatus}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning Section */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-xl p-4 border border-blue-700/30">
                      <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        AI REASONING
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                        {medicalContext.reasoning}
                      </p>
                      {medicalContext.detectedCues.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {medicalContext.detectedCues.map((cue, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                              {cue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* BLIP Caption */}
                    <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700/50">
                      <h3 className="text-xs font-semibold text-zinc-400 mb-2">BLIP CAPTION</h3>
                      <p className="text-sm text-zinc-300 italic mb-2">
                        "{analysisResults.primary_injury}"
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Confidence:</span>
                        <span className="text-xs font-semibold text-emerald-400">
                          {(analysisResults.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-700/50">
                      <h3 className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        LOCATION
                      </h3>
                      <p className="text-sm font-mono text-emerald-400">
                        {analysisResults.coordinates.latitude.toFixed(4)}, {analysisResults.coordinates.longitude.toFixed(4)}
                      </p>
                    </div>

                    {/* Hospital Pre-Alert Panel */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-4 border border-purple-700/40">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          HOSPITAL PRE-ALERT
                        </h3>
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
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            copiedAlert
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                          }`}
                        >
                          {copiedAlert ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy Alert
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Alert Preview */}
                      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700/50 max-h-48 overflow-y-auto">
                        <div className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {(() => {
                            const alertData = {
                              ...analysisResults,
                              altitude: telemetry.altitude,
                              battery: telemetry.battery
                            };
                            const preparationSteps = generateHospitalPreparation(
                              analysisResults.severity,
                              analysisResults.primary_injury,
                              timeWindow
                            );
                            const timestamp = new Date().toLocaleString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            });
                            
                            return (
                              <div className="space-y-2">
                                <div className="text-purple-400 font-bold">EMERGENCY PRE-ALERT</div>
                                <div className="text-zinc-500">{timestamp}</div>
                                <div className="border-t border-zinc-700 pt-2 mt-2">
                                  <div className="text-zinc-400">SEVERITY: {analysisResults.severity}/10 - {timeWindow.urgencyLabel}</div>
                                  <div className="text-zinc-400">TIME WINDOW: {timeWindow.timeRange}</div>
                                  <div className="text-zinc-400">CONDITION: {medicalContext.suspectedInjury}</div>
                                </div>
                                <div className="border-t border-zinc-700 pt-2 mt-2">
                                  <div className="text-zinc-400 font-semibold mb-1">PREPARATION REQUIRED:</div>
                                  {preparationSteps.slice(0, 3).map((step, idx) => (
                                    <div key={idx} className="text-zinc-500 text-[10px]">
                                      {idx + 1}. {step}
                                    </div>
                                  ))}
                                  {preparationSteps.length > 3 && (
                                    <div className="text-zinc-600 text-[10px] mt-1">
                                      +{preparationSteps.length - 3} more steps...
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-zinc-500">
                        Click "Copy Alert" to send full briefing to hospital
                      </div>
                    </div>

                    {/* Expandable Full Report */}
                    <details className="bg-zinc-900/30 rounded-xl border border-zinc-700/50">
                      <summary className="cursor-pointer p-3 text-sm font-semibold text-zinc-400 hover:text-zinc-300">
                        View Complete Medical Report
                      </summary>
                      <div className="px-3 pb-3">
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {analysisResults.hospital_report}
                        </p>
                      </div>
                    </details>
                  </div>
                );
              })()}
            </div>

            {/* Telemetry Card */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Drone Telemetry</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Status</span>
                  <span className={`font-bold ${telemetry?.status === 'AIRBORNE' ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {telemetry?.status || 'INITIALIZING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Battery</span>
                  <span className="font-bold text-blue-400">{telemetry?.battery?.toFixed(1) ?? '--'}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Altitude</span>
                  <span className="font-bold text-purple-400">{telemetry?.altitude?.toFixed(1) ?? '--'}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
