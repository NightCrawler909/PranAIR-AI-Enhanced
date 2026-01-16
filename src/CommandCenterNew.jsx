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

// ==========================================
// AI / MEDICAL LOGIC HELPERS
// ==========================================

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

// ==========================================
// MAIN COMPONENT
// ==========================================

function Dashboard() {
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

      // Prepare form data
      const formData = new FormData();
      formData.append('file', imageBlob, 'capture.jpg');

      console.log('📤 Sending to backend:', API_BASE_URL + '/dispatch');

      // Send to backend
      const response = await axios.post(`${API_BASE_URL}/dispatch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
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
      // Error handling logic omitted for brevity but preserved from original
      if (error.response) {
         if (error.response.status === 422) {
          alert('🔴 Connection Error: Backend Parameter Mismatch. Check server logs.');
        } else {
          alert(`Triage failed (${error.response.status}): ${error.response.data?.detail || 'Unknown error'}`);
        }
      } else if (error.request) {
        alert('🔴 Network Error: Ensure backend is running on localhost:8000');
      } else {
        alert(`Triage failed: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0B1020] text-zinc-100">
      {/* Sidebar Navigation */}
      <aside className="w-20 border-r border-zinc-800 flex flex-col items-center py-8 gap-8 bg-[#0B1020]/95 backdrop-blur-xl">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-900/40">
          P
        </div>
        <nav className="flex flex-col gap-6">
          <button title="Dashboard" className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button title="History" className="p-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <History className="w-6 h-6" />
          </button>
          <button title="Map View" className="p-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <Map className="w-6 h-6" />
          </button>
        </nav>
        <div className="mt-auto">
          <button title="Settings" className="p-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
             <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-zinc-400" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-800 bg-[#0B1020]/95 px-6 flex items-center justify-between backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
             <h1 className="text-xl font-bold tracking-tight text-white">COMMAND<span className="text-emerald-500">CENTER</span></h1>
             <div className="h-6 w-px bg-zinc-800"></div>
             
             {/* System Status Indicators */}
             <div className="flex items-center gap-4 text-sm font-medium">
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                  <Activity className={`w-4 h-4 ${systemOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span className={systemOnline ? 'text-emerald-500' : 'text-red-500'}>{systemOnline ? 'SYSTEM OPTIMAL' : 'SYSTEM OFFLINE'}</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {streamActive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE FEED
              </div>
            )}
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-bold tracking-wider">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                REC
             </div>
          </div>
        </header>

        {/* 3-Column Grid Layout */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          
          {/* LEFT COLUMN: TELEMETRY (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <h2 className="text-sm font-bold text-zinc-400 mb-5 flex items-center gap-2 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-blue-500" /> Drone Telemetry
                </h2>
                
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="p-4 bg-[#0B1020] rounded-xl border border-zinc-800/60 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-12 h-12 text-blue-500" />
                     </div>
                     <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1">Flight Status</span>
                     <span className={`text-xl font-bold tracking-tight ${telemetry?.status === 'AIRBORNE' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {telemetry?.status || 'INITIALIZING'}
                     </span>
                  </div>

                  {/* Battery Card */}
                  <div className="p-4 bg-[#0B1020] rounded-xl border border-zinc-800/60">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Battery Level</span>
                        <span className={`text-xl font-bold font-mono ${telemetry?.battery > 20 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {telemetry?.battery?.toFixed(1) ?? '--'}%
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                           className={`h-full transition-all duration-700 ${telemetry?.battery > 50 ? 'bg-emerald-500' : telemetry?.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                           style={{ width: `${telemetry?.battery ?? 0}%` }}
                        />
                     </div>
                  </div>

                  {/* Altitude Card */}
                  <div className="p-4 bg-[#0B1020] rounded-xl border border-zinc-800/60 flex items-center justify-between">
                     <div>
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1">Altitude</span>
                        <span className="text-xl font-bold text-purple-400 font-mono tracking-tight">
                           {telemetry?.altitude?.toFixed(1) ?? '--'} <span className="text-sm text-zinc-600 font-sans">m</span>
                        </span>
                     </div>
                     <TrendingUp className="w-6 h-6 text-purple-900/50" />
                  </div>

                  {/* Coordinates Mini-Panel */}
                  <div className="p-4 bg-[#0B1020] rounded-xl border border-zinc-800/60">
                     <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-3">GPS Coordinates</span>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <span className="text-[10px] text-zinc-600 block">LATITUDE</span>
                           <span className="text-sm font-mono text-zinc-300">{coordinates.latitude.toFixed(5)}</span>
                        </div>
                        <div>
                           <span className="text-[10px] text-zinc-600 block">LONGITUDE</span>
                           <span className="text-sm font-mono text-zinc-300">{coordinates.longitude.toFixed(5)}</span>
                        </div>
                     </div>
                  </div>
                </div>
             </div>
          </div>

          {/* CENTER COLUMN: VIDEO FEED (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 shadow-2xl relative flex flex-col h-full overflow-hidden">
               {/* Feed Header */}
               <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                     <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                     <span className="text-xs font-bold text-white tracking-widest">LIVE TRANSMISSION</span>
                  </div>
               </div>

               {/* Video Element */}
               <div className="flex-1 bg-black relative rounded-xl overflow-hidden group">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  
                  {/* Crosshair */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                     <div className="w-20 h-20 border border-white/30 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                     </div>
                     <div className="absolute w-[2px] h-4 bg-white/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-10"></div>
                     <div className="absolute w-[2px] h-4 bg-white/30 top-1/2 left-1/2 -translate-x-1/2 translate-y-full mt-10"></div>
                     <div className="absolute h-[2px] w-4 bg-white/30 top-1/2 left-1/2 -translate-x-full -translate-y-1/2 mr-10"></div>
                     <div className="absolute h-[2px] w-4 bg-white/30 top-1/2 left-1/2 translate-x-full -translate-y-1/2 ml-10"></div>
                  </div>

                  {/* Scanning Overlay */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                       <div className="w-full h-[2px] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] absolute top-0 animate-[scan_2s_linear_infinite]" />
                       <div className="bg-black/80 px-8 py-6 rounded-2xl border border-emerald-500/50 flex flex-col items-center gap-4 shadow-2xl">
                          <div className="relative w-12 h-12">
                             <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
                             <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                          </div>
                          <div className="text-center"> 
                             <h3 className="text-emerald-400 font-bold text-lg tracking-widest">ANALYZING</h3>
                             <p className="text-zinc-500 text-xs mt-1 font-mono">PROCESSING VISUAL DATA STREAM...</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {!streamActive && (
                    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-zinc-600">
                       <Radio className="w-16 h-16 mb-4 opacity-20" />
                       <p className="font-mono text-sm">NO SIGNAL</p>
                    </div>
                  )}
               </div>

               {/* Action Bar */}
               <div className="p-4 bg-[#0B1020] border-t border-zinc-800">
                  <button
                    onClick={handleTriage}
                    disabled={isAnalyzing}
                    className={`w-full py-4 rounded-xl font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-3 ${
                      isAnalyzing 
                        ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 hover:shadow-emerald-900/80 active:scale-[0.99] border border-emerald-500/50'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        INITIATE AI TRIAGE
                      </>
                    )}
                  </button>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI ASSESSMENT (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
             
             {!analysisResults && !isAnalyzing && (
               <div className="flex-1 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
                     <Activity className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-400 mb-2">System Ready</h3>
                  <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                     Waiting for triage command. Initiate analysis to generate medical assessment.
                  </p>
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
                  <div className="flex flex-col gap-4 overflow-y-auto pr-1 h-full pb-6">
                    {/* Urgency Header */}
                    <div className={`rounded-xl p-5 border-l-4 shadow-lg ${
                      analysisResults.severity >= 8 ? 'bg-red-900/20 border-red-500' :
                      analysisResults.severity >= 5 ? 'bg-yellow-900/20 border-yellow-500' :
                      'bg-emerald-900/20 border-emerald-500'
                    }`}>
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Recommended Response</h4>
                             <h2 className={`text-2xl font-bold tracking-tight ${
                                analysisResults.severity >= 8 ? 'text-red-400' :
                                analysisResults.severity >= 5 ? 'text-yellow-400' :
                                'text-emerald-400'
                             }`}>
                                {timeWindow.urgencyLabel}
                             </h2>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold border ${
                             analysisResults.severity >= 8 ? 'text-red-400 border-red-900 bg-red-900/30' :
                             analysisResults.severity >= 5 ? 'text-yellow-400 border-yellow-900 bg-yellow-900/30' :
                             'text-emerald-400 border-emerald-900 bg-emerald-900/30'
                          }`}>
                             SEVERITY {analysisResults.severity}/10
                          </div>
                       </div>
                       <p className="text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-3 mt-1">
                          {timeWindow.explanation}
                       </p>
                    </div>

                    {/* Critical Timer */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                       <div className="p-3 bg-zinc-800 rounded-lg">
                          <Clock className="w-6 h-6 text-zinc-400" />
                       </div>
                       <div>
                          <div className="text-xs text-zinc-500 font-bold uppercase">Action Window</div>
                          <div className="text-xl font-mono font-bold text-white">{timeWindow.timeRange}</div>
                       </div>
                    </div>

                    {/* Medical Details */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                       <div className="bg-zinc-900/80 px-4 py-3 border-b border-zinc-800">
                          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Clinical Findings</h3>
                       </div>
                       <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <span className="text-[10px] text-zinc-500 uppercase block mb-1">Injury Type</span>
                                 <span className="text-sm font-medium text-white block">{medicalContext.suspectedInjury}</span>
                              </div>
                              <div>
                                 <span className="text-[10px] text-zinc-500 uppercase block mb-1">Bleeding</span>
                                 <span className={`text-sm font-medium block ${medicalContext.bleedingColor}`}>{medicalContext.bleedingStatus}</span>
                              </div>
                          </div>
                          
                          <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                             <div className="flex gap-2 items-start">
                                <Zap className="w-3 h-3 text-blue-400 mt-0.5 max-w-[12px]" />
                                <p className="text-xs text-blue-200 leading-relaxed">
                                   {medicalContext.reasoning}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Pre-Alert Actions */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-900/30 rounded-xl p-4">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                             <Package className="w-4 h-4 text-purple-400" />
                             <span className="text-sm font-bold text-purple-200">Hospital Relay</span>
                          </div>
                          <button
                            onClick={() => {
                              const alertData = { ...analysisResults, altitude: telemetry.altitude, battery: telemetry.battery };
                              copyAlertToClipboard(generatePreAlertMessage(alertData, medicalContext, timeWindow, analysisResults.coordinates));
                            }}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded transition-colors border border-purple-500/30"
                          >
                            {copiedAlert ? 'COPIED ✓' : 'COPY ALERT'}
                          </button>
                       </div>
                       
                       <div className="space-y-2">
                          {generateHospitalPreparation(analysisResults.severity, analysisResults.primary_injury, timeWindow).slice(0, 3).map((step, i) => (
                             <div key={i} className="flex gap-2 text-xs text-zinc-400 items-start">
                                <span className="text-purple-500/50 font-mono">{i+1}.</span>
                                <span>{step}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                  </div>
                );
             })()}

          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
