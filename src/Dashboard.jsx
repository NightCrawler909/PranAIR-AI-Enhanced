import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  Activity,
  Battery,
  Radio,
  MapPin,
  AlertCircle,
  Zap,
  Clock,
  Heart,
  Droplet,
  Eye,
  CheckCircle,
  Copy,
  Package
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

// --- HELPER FUNCTIONS ---

const generateHospitalPreparation = (severityScore, injuryType, timeWindow) => {
  const caption = injuryType.toLowerCase();
  const steps = [];
  
  if (severityScore >= 8) {
    steps.push('ACTIVATE TRAUMA BAY - Priority Alpha');
    steps.push('Mobilize trauma team (surgeon, anesthesiologist, ER attending)');
    steps.push('Prepare O-negative blood units (2-4 units on standby)');
    steps.push('Ready CT scanner for immediate use');
    
    if (caption.includes('bleeding') || caption.includes('hemorrhage')) {
      steps.push('Alert blood bank for potential massive transfusion protocol');
    }
  } else if (severityScore >= 5) {
    steps.push('Prepare ER trauma bed');
    steps.push('Basic trauma assessment kit ready');
    steps.push('IV lines and fluid resuscitation equipment');
  } else {
    steps.push('Standard ER observation bed');
    steps.push('Basic vital monitoring equipment');
  }
  
  return steps;
};

const generatePreAlertMessage = (analysisData, medicalContext, timeWindow, coordinates, currentTelemetry) => {
  const localTime = new Date().toLocaleTimeString();
  const preparationSteps = generateHospitalPreparation(analysisData.severity, analysisData.primary_injury);

  return `
=== PRAN AIR MEDICAL DRONE ALERT ===
TIME: ${localTime}
SEVERITY: ${analysisData.severity}/10 (${timeWindow.urgencyLabel})
INJURY: ${analysisData.primary_injury}

VITALS:
- Bleeding: ${medicalContext.bleedingStatus}
- Consciousness: ${medicalContext.consciousnessStatus}

LOCATION:
Lat: ${coordinates.latitude.toFixed(6)}
Lng: ${coordinates.longitude.toFixed(6)}

RECOMMENDED PREP:
${preparationSteps.map(s => `- ${s}`).join('\n')}
  `.trim();
};

const analyzeCriticalTimeWindow = (severityScore, injuryType) => {
  let timeRange = '30-60 min';
  let urgencyLabel = 'STABLE';
  let urgencyColor = 'text-[#22C55E]';
  let progressPercent = 25;
  let explanation = 'Patient appears stable. Standard medical evaluation recommended.';

  if (severityScore >= 9) {
    timeRange = '0-5 min';
    urgencyLabel = 'IMMEDIATE';
    urgencyColor = 'text-red-500';
    progressPercent = 100;
    explanation = 'Extreme severity. Immediate intervention required to prevent mortality.';
  } else if (severityScore >= 7) {
    timeRange = '5-15 min';
    urgencyLabel = 'CRITICAL';
    urgencyColor = 'text-orange-500';
    progressPercent = 75;
    explanation = 'Critical condition. Rapid decline likely without stabilization.';
  } else if (severityScore >= 4) {
    timeRange = '15-30 min';
    urgencyLabel = 'URGENT';
    urgencyColor = 'text-yellow-500';
    progressPercent = 50;
    explanation = 'Urgent attention required. Condition unstable but manageable.';
  }

  return { timeRange, urgencyLabel, urgencyColor, progressPercent, explanation };
};

const analyzeMedicalContext = (injuryType, severityScore) => {
  const caption = injuryType.toLowerCase();
  
  let suspectedInjury = 'Under Assessment';
  if (caption.includes('fracture')) suspectedInjury = 'Suspected Fracture';
  else if (caption.includes('bleeding')) suspectedInjury = 'Active Hemorrhage';
  else if (caption.includes('burn')) suspectedInjury = 'Thermal Injury';
  else if (caption.includes('lying')) suspectedInjury = 'Fall / Trauma';

  let bleedingStatus = 'None Detected';
  let bleedingColor = 'text-[#22C55E]';
  if (caption.includes('bleeding')) {
    bleedingStatus = 'Active Bleeding';
    bleedingColor = 'text-red-500';
  }

  let consciousnessStatus = 'Likely Conscious';
  let consciousnessColor = 'text-[#22C55E]';
  if (caption.includes('unconscious')) {
    consciousnessStatus = 'Unresponsive';
    consciousnessColor = 'text-red-500';
  }

  let urgencyLevel = 'Low';
  let urgencyColor = 'text-[#22C55E]';
  if (severityScore >= 8) {
    urgencyLevel = 'CRITICAL';
    urgencyColor = 'text-red-500';
  } else if (severityScore >= 5) {
    urgencyLevel = 'MEDIUM';
    urgencyColor = 'text-yellow-500';
  }

  return {
    suspectedInjury,
    bleedingStatus, bleedingColor,
    consciousnessStatus, consciousnessColor,
    urgencyLevel, urgencyColor
  };
};

export default function CommandCenter() {
  const [telemetry, setTelemetry] = useState({ battery: 85.5, altitude: 45.2, status: 'AIRBORNE' });
  const [coordinates, setCoordinates] = useState({ latitude: 28.6139, longitude: 77.2090 });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemOnline, setSystemOnline] = useState(true);
  const [streamActive, setStreamActive] = useState(true);
  const [copiedAlert, setCopiedAlert] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Poll Drone Status
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/drone-status`);
        setTelemetry(res.data);
        setSystemOnline(true);
      } catch (e) {
        setSystemOnline(false); 
      }
    };
    const interval = setInterval(fetchStatus, 3000);
    fetchStatus();

    // Camera Init
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        setStreamActive(false);
      }
    };
    initCamera();

    return () => {
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleTriage = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) throw new Error("No Video Feed");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');

      const res = await axios.post(`${API_BASE_URL}/dispatch`, formData);
      const data = res.data;

      setAnalysisResults({
        severity: data.analysis.severity_score,
        primary_injury: data.analysis.injury_type,
        confidence: data.analysis.confidence,
        mode: data.analysis.mode,
        raw: data
      });
      
      // Update coords from telemetry snapshot
      if (data.telemetry) {
        setCoordinates({ latitude: data.telemetry.lat, longitude: data.telemetry.lng });
      }

    } catch (err) {
      console.error(err);
      alert("Triage Analysis Failed. Check backend connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const Card = ({ children, className = "" }) => (
    <div className={`bg-[#121A2F] border border-[#1E2A4A] rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#0B1020] text-slate-200 overflow-hidden flex font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-[#0B1020] border-r border-[#1E2A4A] flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-[#7C5CFF]/20 text-[#7C5CFF] rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(124,92,255,0.2)]">
          P
        </div>
        <nav className="flex flex-col gap-6">
          <div className="p-3 rounded-xl bg-[#7C5CFF]/10 text-[#7C5CFF]">
            <LayoutDashboard className="w-6 h-6" />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-[#1E2A4A] flex items-center justify-between px-8 bg-[#0B1020]/95 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg tracking-wide text-white">COMMAND CENTER</h1>
            <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${systemOnline ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-red-500/10 text-red-500'}`}>
              {systemOnline ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
            </div>
          </div>
          <div className="flex items-center gap-6">
             {/* Simple Status Indicators */}
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-red-500 tracking-wider">LIVE REC</span>
             </div>
          </div>
        </header>

        {/* 3-Column Dashboard Layout */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
          
          {/* COLUMN 1: DRONE TELEMETRY (Left) */}
          <div className="col-span-3 flex flex-col gap-6 h-full">
            <Card className="h-full flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="font-bold text-white tracking-wide">SYSTEM VALIDATION</h2>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#0B1020] p-4 rounded-xl border border-[#1E2A4A]">
                  <span className="text-xs text-slate-500 font-bold tracking-wider">FLIGHT STATUS</span>
                  <div className="text-lg font-mono font-bold text-[#22C55E] mt-1">
                    {telemetry.status}
                  </div>
                </div>

                <div className="bg-[#0B1020] p-4 rounded-xl border border-[#1E2A4A]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 font-bold tracking-wider">BATTERY</span>
                    <Battery className={`w-4 h-4 ${telemetry.battery < 20 ? 'text-red-500' : 'text-blue-400'}`} />
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mb-2">
                    {telemetry.battery.toFixed(1)}%
                  </div>
                  <div className="h-1.5 bg-[#1E2A4A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${telemetry.battery}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#0B1020] p-4 rounded-xl border border-[#1E2A4A]">
                   <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 font-bold tracking-wider">ALTITUDE</span>
                    <Radio className="w-4 h-4 text-[#7C5CFF]" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {telemetry.altitude.toFixed(1)}<span className="text-sm text-slate-500 ml-1">m</span>
                  </div>
                </div>

                <div className="bg-[#0B1020] p-4 rounded-xl border border-[#1E2A4A] flex-1">
                   <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 font-bold tracking-wider">GPS COORDINATES</span>
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-mono text-sm space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>LAT</span> <span>{coordinates.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>LNG</span> <span>{coordinates.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* COLUMN 2: LIVE FEED (Center) */}
          <div className="col-span-5 h-full flex flex-col">
            <Card className="h-full p-0 overflow-hidden flex flex-col relative border-[#7C5CFF]/30 shadow-[0_0_30px_rgba(124,92,255,0.05)]">
               
               {/* Live Feed Header Overlay */}
               <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-white tracking-widest">LIVE OPTICAL FEED // 4K</span>
                  </div>
                  <div className="text-xs font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-1 rounded border border-[#7C5CFF]/20">
                    AI VISION READY
                  </div>
               </div>

               {/* Video Element */}
               <div className="flex-1 bg-black relative flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                  
                  {/* Scanning Overlay */}
                  <canvas ref={canvasRef} className="hidden" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-[#0B1020]/80 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                       <div className="w-16 h-16 border-4 border-[#7C5CFF] border-t-transparent rounded-full animate-spin"></div>
                       <div className="text-[#7C5CFF] font-bold tracking-widest animate-pulse">ANALYZING SCENE DATA...</div>
                    </div>
                  )}

                  {!streamActive && (
                    <div className="z-10 text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <span className="text-red-500 font-bold">SIGNAL LOSS</span>
                    </div>
                  )}
               </div>

               {/* Action Button - Pinned Bottom */}
               <div className="p-4 bg-[#121A2F] border-t border-[#1E2A4A]">
                  <button
                    onClick={handleTriage}
                    disabled={isAnalyzing}
                    className={`w-full py-4 rounded-xl font-bold tracking-widest text-white transition-all 
                      ${isAnalyzing 
                        ? 'bg-slate-700 cursor-wait' 
                        : 'bg-[#7C5CFF] hover:bg-[#6A4CE0] shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_30px_rgba(124,92,255,0.6)] transform active:scale-[0.99]'
                      }
                    `}
                  >
                    {isAnalyzing ? "PROCESSING..." : "RUN AI MEDICAL TRIAGE"}
                  </button>
               </div>
            </Card>
          </div>

          {/* COLUMN 3: AI INTELLIGENCE (Right) */}
          <div className="col-span-4 h-full flex flex-col gap-4">
             <Card className={`h-full flex flex-col gap-4 relative overflow-hidden transition-all duration-500 ${analysisResults ? 'border-[#7C5CFF]/50 shadow-[0_0_30px_rgba(124,92,255,0.1)]' : ''}`}>
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#7C5CFF]/10 rounded-lg">
                    <Zap className="w-5 h-5 text-[#7C5CFF]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white tracking-wide">AI DIAGNOSTIC REPORT</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Powered by BLIP-2 Vision Model</p>
                  </div>
                </div>

                {!analysisResults ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                    <Activity className="w-16 h-16" />
                    <span className="text-sm font-bold tracking-widest text-center">WAITING FOR SCENE ANALYSIS...</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                     
                     {/* Time Window (Critical) */}
                     {(() => {
                        const tw = analyzeCriticalTimeWindow(analysisResults.severity);
                        return (
                          <div className={`p-4 rounded-xl border-l-4 bg-[#0B1020] ${tw.urgencyColor.replace('text', 'border')}`}>
                             <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-400 uppercase">Critical Time Window</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded bg-[#0B1020] border border-current ${tw.urgencyColor}`}>{tw.urgencyLabel}</span>
                             </div>
                             <div className={`text-3xl font-bold ${tw.urgencyColor} mb-2`}>{tw.timeRange}</div>
                             <p className="text-xs text-slate-400 leading-relaxed">{tw.explanation}</p>
                          </div>
                        );
                     })()}

                     {/* Main Diagnosis */}
                     <div className="bg-[#7C5CFF]/5 border border-[#7C5CFF]/20 rounded-xl p-4">
                        <span className="text-xs text-[#7C5CFF] font-bold tracking-wider">PRIMARY AI DIAGNOSIS</span>
                        <div className="text-xl font-bold text-white mt-1 capitalize leading-snug">
                          {analysisResults.primary_injury}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-[#0B1020] rounded-full overflow-hidden">
                             <div className="h-full bg-[#7C5CFF]" style={{ width: `${analysisResults.confidence * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-mono text-[#7C5CFF]">{(analysisResults.confidence * 100).toFixed(0)}% CONF</span>
                        </div>
                     </div>

                     {/* Vitals Grid */}
                     {(() => {
                       const ctx = analyzeMedicalContext(analysisResults.primary_injury, analysisResults.severity);
                       return (
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#0B1020] p-3 rounded-xl border border-[#1E2A4A]">
                              <div className="flex items-center gap-2 mb-1">
                                <Droplet className={`w-3 h-3 ${ctx.bleedingColor}`} />
                                <span className="text-[10px] text-slate-500 font-bold uppercase">BLEEDING</span>
                              </div>
                              <div className={`text-sm font-bold ${ctx.bleedingColor}`}>{ctx.bleedingStatus}</div>
                            </div>
                            <div className="bg-[#0B1020] p-3 rounded-xl border border-[#1E2A4A]">
                              <div className="flex items-center gap-2 mb-1">
                                <Eye className={`w-3 h-3 ${ctx.consciousnessColor}`} />
                                <span className="text-[10px] text-slate-500 font-bold uppercase">CONSCIOUSNESS</span>
                              </div>
                              <div className={`text-sm font-bold ${ctx.consciousnessColor}`}>{ctx.consciousnessStatus}</div>
                            </div>
                         </div>
                       );
                     })()}

                     {/* Pre-Alert CTA */}
                     <div className="mt-auto">
                        <button 
                          onClick={() => {
                            const msg = generatePreAlertMessage(analysisResults, analyzeMedicalContext(analysisResults.primary_injury, analysisResults.severity), null, coordinates);
                            navigator.clipboard.writeText(msg);
                            setCopiedAlert(true);
                            setTimeout(() => setCopiedAlert(false), 2000);
                          }}
                          className="w-full py-3 bg-[#0B1020] border border-[#7C5CFF]/30 hover:bg-[#7C5CFF]/10 text-[#7C5CFF] rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
                        >
                          {copiedAlert ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedAlert ? "ALERT COPIED" : "COPY HOSPITAL PRE-ALERT"}
                        </button>
                     </div>
                  </div>
                )}
             </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
