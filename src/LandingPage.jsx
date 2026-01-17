import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Float, Sparkles, Text } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function Drone() {
  const { scene } = useGLTF('/src/dji_fpv_by_sdc_-__high_performance_drone.glb');
  const ref = useRef();
  const scrollProgressRef = useRef(0);
  
  // Direct scroll listener for instant response
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useFrame(() => {
    // Read scroll offset from ref (0 to 1)
    const offset = scrollProgressRef.current;

    // --- CONFIGURATION ---
    // Base transform constraints (MUST NOT CHANGE)
    const baseScale = 1.20;
    const baseY = -0.9;
    
    // --- ANIMATION TIMELINE ---
    // Linear interpolation helper
    const lerp = (start, end, t) => start + (end - start) * t;

    let x = 0;
    let y = baseY;
    let z = 0;
    let ry = Math.PI; // Base Y rotation
    let rx = 0;
    let rz = 0;

    // -----------------------------
    // Phase 1: Hero → Vision (Move Right)
    // Scroll: 0.00 → 0.22
    // -----------------------------
    if (offset < 0.22) {
      const t = offset / 0.22;

      x = lerp(0, 2.5, t);           // Controlled drift right (never off-screen)
      y = lerp(baseY, -0.5, t);      // Float up
      z = 0;
      ry = lerp(Math.PI, Math.PI - 0.2, t); // Slight yaw left
      rx = 0;
    }

    // -----------------------------
    // Phase 2: Vision → Engineering (Move Left Immediately)
    // Scroll: 0.22 → 0.50
    // -----------------------------
    else if (offset < 0.50) {
      const t = (offset - 0.22) / (0.50 - 0.22);

      x = lerp(2.5, -2, t);          // Immediate left motion
      y = lerp(-0.5, 0, t);          // Rise slightly
      z = lerp(0, 1, t);             // Come closer
      ry = lerp(Math.PI - 0.2, Math.PI + 0.3, t); // Yaw right
      rx = lerp(0, 0.1, t);           // Gentle pitch
    }

    // Phase 3: Engineering -> Intelligence (Center & Scan)
    // 0.50 to 0.75
    else if (offset < 0.75) {
      const t = (offset - 0.50) / 0.25;
      x = lerp(-2, 0, t);          // Return Center
      y = lerp(0, -1.2, t);        // Drop Down (Scanning)
      z = lerp(1, 0, t);           // Reset Depth
      ry = lerp(Math.PI + 0.3, Math.PI, t);
      rx = lerp(0.1, 0.3, t);      // Pitch Down to look at earth/data
    }
    // Phase 4: Intelligence -> Impact (Stabilize)
    // 0.75 to 1.0
    else {
      const t = (offset - 0.75) / 0.25;
      x = lerp(0, 0, t);
      y = lerp(-1.2, baseY, t);    // Return to Base Height
      z = lerp(0, 1.5, t);         // Fly very close for impact
      rx = lerp(0.3, 0, t);        // Level out
      ry = Math.PI;
    }

    // Apply transforms
    if (ref.current) {
      ref.current.position.set(x, y, z);
      ref.current.rotation.set(rx, ry, rz);
    }
  });
  
  return (
    <primitive 
      ref={ref}
      object={scene} 
      scale={[1.20, 1.20, 1.20]} 
      position={[0, -0.9, 0]} 
      rotation={[0, Math.PI, 0]} 
    />
  );
}

const Section = ({ align = 'center', children, className = '' }) => {
  return (
    <section className={`h-screen w-screen flex items-center p-8 lg:p-20 relative z-10 ${
      align === 'left' ? 'justify-start' : 
      align === 'right' ? 'justify-end' : 
      'justify-center'
    } ${className}`}>
      <div className="max-w-xl relative w-full">
        {children}
      </div>
    </section>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // Track scroll for flowchart activation
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#0b0b0f] text-white overflow-x-hidden relative min-h-screen">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 8], fov: 45 }} 
        style={{ height: "100vh", width: "100vw", position: "fixed", top: 0, left: 0, zIndex: 5, pointerEvents: "none" }}
      >
        {/* Transparent Background - No color attached */}
        
        {/* LIGHTING SAFETY SET */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        
        {/* Restored Effects */}
        <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.5} color="#a855f7" />
        <Environment preset="city" />

        <Suspense fallback={null}>
            <Drone />
        </Suspense>
      </Canvas>

      {/* HTML Content Layer - Native Scroll */}
      <div className="relative w-full">
              
        {/* HERO SECTION */}
        <section className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
            {/* HERO TEXT LAYER - z-0 to sit BEHIND z-10 Canvas */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <h1 className="text-[12rem] md:text-[18rem] font-black text-white tracking-tighter select-none whitespace-nowrap scale-y-110 opacity-100">
                PRAN AIR
              </h1>
            </div>

            {/* Hero UI Content - z-20 to sit ABOVE z-10 Canvas */}
            <div className="relative z-20 pt-96 mt-20 text-center">
              <h2 className="text-2xl tracking-[0.5em] text-purple-400 font-light mb-4 uppercase drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                AI-Powered Emergency Medical Drone
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-md mx-auto font-medium">
                Faster than an ambulance. Smarter than a camera.
              </p>
              <button 
                onClick={() => navigate('/app')}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] transition-all transform hover:scale-105 pointer-events-auto"
              >
                Enter Command Center
              </button>
            </div>
        </section>

        {/* SECTION 1 - MISSION STATEMENT */}
        <section className="relative min-h-[120vh] flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content - SAFE ZONE */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 max-w-lg pointer-events-auto ml-[-6vw]"
              style={{
                backdropFilter: 'blur(12px)',
                background: 'rgba(10, 10, 20, 0.75)',
                padding: '2rem',
                borderRadius: '1.5rem',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Built for the First <span className="text-purple-400">10 Minutes</span> That Decide Everything
              </h2>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed space-y-4">
                <span className="block">In emergencies, the golden window between injury and treatment determines survival.</span>
                <span className="block">PranAir reaches accident scenes before ambulances arrive, providing real-time situational awareness, 
                AI-powered medical intelligence, and instant hospital readiness—giving doctors the critical information 
                they need before the patient even arrives.</span>
              </p>
            </motion.div>
            
            {/* Right - Drone visual space (empty) */}
            <div className="hidden md:block"></div>
          </div>
        </section>

        {/* SECTION 2 - HARDWARE ARCHITECTURE */}
        <section className="relative min-h-[100vh] flex items-center py-20 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left - Drone visual space (empty) */}
            <div className="hidden md:block"></div>
            
            {/* Right Content - SAFE ZONE (SHIFTED LEFT) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 ml-[-45vw] pointer-events-auto"
            >
              <div className="backdrop-blur-md bg-[rgba(10,10,20,0.75)] p-8 rounded-2xl border border-purple-500/20 max-w-[520px] w-full">
                
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Real Hardware. Real Engineering.{" "}
                  <span className="text-purple-400">Real Impact.</span>
                </h2>

                <p className="text-slate-400 mb-6 text-base">
                  Built with industry-grade components for mission-critical performance
                </p>
                
                <div className="space-y-3 max-w-lg">
                  
                  {/* Hardware Card 1 */}
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🎯</span>
                      <div>
                        <h3 className="text-lg font-bold text-purple-400">
                          ArduCopter APM 2.8
                        </h3>
                        <p className="text-sm text-slate-300">
                          Flight controller with GPS navigation and autonomous mission execution
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Card 2 */}
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🧠</span>
                      <div>
                        <h3 className="text-lg font-bold text-purple-400">
                          Raspberry Pi 4B (1GB)
                        </h3>
                        <p className="text-sm text-slate-300">
                          Edge AI brain running real-time inference without cloud dependency
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Card 3 */}
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🚁</span>
                      <div>
                        <h3 className="text-lg font-bold text-purple-400">
                          4 × Brushless Motors (1000 KV)
                        </h3>
                        <p className="text-sm text-slate-300">
                          High-efficiency propulsion with ESCs for rapid emergency deployment
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Card 4 */}
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🇮🇳</span>
                      <div>
                        <h3 className="text-lg font-bold text-purple-400">
                          F450 / Q450 Frame
                        </h3>
                        <p className="text-sm text-slate-300">
                          Made in India PCB frame with optimized payload capacity
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 3 - ONBOARD INTELLIGENCE */}
        <section className="relative min-h-[120vh] flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-10 w-full grid md:grid-cols-2 gap-5 items-center md:ml-[30vw] md:mt-[10vh]">


            <div className="hidden md:block"></div>
            {/* Left Content - SAFE ZONE */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 pointer-events-auto mt-[8vh]"

            >
              <div className="backdrop-blur-md bg-[rgba(10,10,20,0.75)] p-9 rounded-2xl border border-purple-500/20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Edge AI Powered by <span className="text-purple-400">Onboard Computing</span>
                </h2>
                <p className="text-slate-300 text-base mb-8 leading-relaxed max-w-lg">
                  The Raspberry Pi 4B processes everything locally—no cloud dependency, no latency, no connectivity failures. 
                  Pure edge intelligence designed for life-or-death scenarios.
                </p>

                <div className="space-y-4 max-w-lg">
                  <div className="flex gap-3 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🔬</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-purple-400 mb-1">Local AI Inference</h3>
                      <p className="text-sm text-slate-300">
                        Computer vision models analyze scenes, detect injuries, and estimate severity in real time
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">📹</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-purple-400 mb-1">Real-Time Video Processing</h3>
                      <p className="text-sm text-slate-300">
                        Live HD streams analyzed frame-by-frame to identify critical visual cues
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">📡</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-purple-400 mb-1">Emergency Data Transmission</h3>
                      <p className="text-sm text-slate-300">
                        Structured medical summaries transmitted to hospitals and first responders
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🌐</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-purple-400 mb-1">Works with Limited Connectivity</h3>
                      <p className="text-sm text-slate-300">
                        Core AI functions continue even in low-bandwidth conditions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Right - Drone visual space */}
            <div className="hidden md:block"></div>
          </div>
        </section>

        {/* SECTION 4 - AI CAPABILITIES */}
        <section className="relative min-h-[120vh] flex items-center py-20 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center md:ml-[30vw]">
            {/* Left - Drone visual space */}
            <div className="hidden md:block"></div>
            
            {/* Right Content - SAFE ZONE */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 mr-[1vw] pointer-events-auto"
            >
              <div className="backdrop-blur-md bg-[rgba(10,10,20,0.75)] p-8 rounded-2xl border border-purple-500/20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  AI That Assists Doctors <span className="text-purple-400">Before the Patient Arrives</span>
                </h2>
                <p className="text-slate-300 text-base mb-8 max-w-lg">
                  Visual intelligence transforms aerial footage into actionable medical insights
                </p>

                <div className="grid grid-cols-1 gap-4 max-w-lg">
                  {/* Capability 1 */}
                  <div className="bg-black/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">👁️</span>
                      <h3 className="text-xl font-bold text-purple-400">Scene Understanding</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-300 ml-9">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Detect human presence in complex environments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Identify posture and consciousness indicators</span>
                      </li>
                    </ul>
                  </div>

                  {/* Capability 2 */}
                  <div className="bg-black/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">🩺</span>
                      <h3 className="text-xl font-bold text-purple-400">Visual Medical Assessment</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-300 ml-9">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Possible injury detection through visual analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Bleeding likelihood assessment</span>
                      </li>
                    </ul>
                  </div>

                  {/* Capability 3 */}
                  <div className="bg-black/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">⏱️</span>
                      <h3 className="text-xl font-bold text-purple-400">Time Window Estimation</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-300 ml-9">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Severity scoring and urgency prediction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Time-critical case prioritization</span>
                      </li>
                    </ul>
                  </div>

                  {/* Capability 4 */}
                  <div className="bg-black/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">🏥</span>
                      <h3 className="text-xl font-bold text-purple-400">Hospital Pre-Alert</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-300 ml-9">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Structured medical summaries with visual evidence</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Real-time updates as situation evolves</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 5 - EMERGENCY WORKFLOW - NEON FLOWCHART */}
        <section className="relative min-h-[140vh] flex items-center pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto justify-center">
            {/* Left Content - NEON FLOWCHART */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 ml-[10vw] pointer-events-auto md:mr-[6vw]"
            >
              <div className="backdrop-blur-md bg-[rgba(10,10,20,0.75)] p-8 rounded-2xl border border-purple-500/20">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  How PranAir Responds to <span className="text-purple-400">an Emergency</span>
                </h2>
                <p className="text-slate-300 text-base mb-8">
                  From alert to action in seconds—a complete emergency response workflow
                </p>

                {/* NEON FLOWCHART */}
                <div className="relative max-w-lg">
                  {/* Vertical Neon Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/0 via-purple-500 to-purple-500/0" 
                       style={{
                         boxShadow: '0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.4)',
                         animation: 'pulse 2s infinite'
                       }}
                  />

                  <div className="space-y-3">
                    {[
                      { num: 1, title: "SOS Triggered", desc: "Emergency alert activated through mobile app", threshold: 0.48 },
                      { num: 2, title: "GPS Captured", desc: "Location transmitted to nearest PranAir unit", threshold: 0.50 },
                      { num: 3, title: "Drone Dispatched", desc: "Autonomous flight path calculated instantly", threshold: 0.52 },
                      { num: 4, title: "Live Feed Activated", desc: "HD video streaming begins", threshold: 0.54 },
                      { num: 5, title: "AI Visual Triage", desc: "Scene analysis and injury detection", threshold: 0.56 },
                      { num: 6, title: "Doctors Alerted", desc: "Real-time medical insights delivered", threshold: 0.58 },
                      { num: 7, title: "Hospital Prepares", desc: "Emergency room readies before arrival", threshold: 0.60 }
                    ].map((step) => {
                      const isActive = scrollProgress >= step.threshold;
                      return (
                        <motion.div 
                          key={step.num}
                          initial={{ opacity: 0.3, x: -20 }}
                          animate={isActive ? { 
                            opacity: 1, 
                            x: 0,
                            boxShadow: [
                              '0 0 12px rgba(168, 85, 247, 0.4)',
                              '0 0 25px rgba(168, 85, 247, 0.6)',
                              '0 0 12px rgba(168, 85, 247, 0.4)'
                            ]
                          } : { opacity: 0.3, x: -20 }}
                          transition={{ 
                            duration: 0.5,
                            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                          }}
                          className="flex gap-4 items-start relative"
                        >
                          {/* Neon Node */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm relative z-10 transition-all duration-500 ${
                            isActive 
                              ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]' 
                              : 'bg-purple-500/30 shadow-[0_0_5px_rgba(168,85,247,0.3)]'
                          }`}>
                            {step.num}
                          </div>

                          {/* Content Card */}
                          <div className={`flex-1 bg-zinc-900/60 backdrop-blur-sm p-3 rounded-lg border transition-all duration-500 ${
                            isActive 
                              ? 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                              : 'border-zinc-800'
                          }`}>
                            <h3 className={`text-sm font-bold mb-1 transition-colors duration-500 ${
                              isActive ? 'text-purple-400' : 'text-purple-400/50'
                            }`}>
                              {step.title}
                            </h3>
                            <p className={`text-xs transition-colors duration-500 ${
                              isActive ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                              {step.desc}
                            </p>
                          </div>

                          {/* Connecting Line Animation */}
                          {step.num < 7 && isActive && (
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                              className="absolute left-4 top-8 w-0.5 h-6 bg-gradient-to-b from-purple-500 to-purple-500/0"
                              style={{
                                boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
                                transformOrigin: 'top'
                              }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Right - Drone visual space */}
            <div className="hidden md:block"></div>
          </div>

          <style jsx>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </section>

        {/* SECTION 6 - WHY IT MATTERS */}
        <section className="relative min-h-[120vh] flex items-center py-20 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Drone visual space */}
            <div className="hidden md:block"></div>
            
            {/* Right Content - SAFE ZONE */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 mr-[-10vw] pointer-events-auto md:ml-[10vw]"
            >
              <div className="backdrop-blur-md bg-[rgba(10,10,20,0.75)] p-8 rounded-2xl border border-purple-500/20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Why Every Minute <span className="text-purple-400">Saved Matters</span>
                </h2>
                <p className="text-slate-300 text-base mb-8 max-w-lg">
                  In trauma care, time is the difference between life and death
                </p>

                <div className="grid grid-cols-1 gap-4 max-w-lg">
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-5 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">🚀</span>
                      <h3 className="text-lg font-bold text-purple-400">Faster Emergency Response</h3>
                    </div>
                    <p className="text-sm text-slate-300 ml-9">
                      Drones aren't stuck in traffic. They reach blocked roads and disaster zones minutes before ground vehicles.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 backdrop-blur-sm p-5 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">🏥</span>
                      <h3 className="text-lg font-bold text-purple-400">Better Medical Preparedness</h3>
                    </div>
                    <p className="text-sm text-slate-300 ml-9">
                      Hospitals receive AI-generated insights before the ambulance arrives—enabling pre-positioning of equipment.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 backdrop-blur-sm p-5 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">⚡</span>
                      <h3 className="text-lg font-bold text-purple-400">Reduced Decision-Making Delay</h3>
                    </div>
                    <p className="text-sm text-slate-300 ml-9">
                      Doctors see real-time video and AI-analyzed patterns—allowing faster, more informed treatment decisions.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 backdrop-blur-sm p-5 rounded-xl border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">🤝</span>
                      <h3 className="text-lg font-bold text-purple-400">AI-Assisted, Not AI-Replaced</h3>
                    </div>
                    <p className="text-sm text-slate-300 ml-9">
                      PranAir augments human expertise while doctors remain in control of critical treatment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 7 - FUTURE VISION */}
        <section className="relative min-h-[120vh] flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content - SAFE ZONE */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative z-20 ml-[-10vw] pointer-events-auto pr-48"
            >
              <div className="backdrop-blur-md bg-[rgba(10,10,20,0.75)] p-8 rounded-2xl border border-purple-500/20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Designed to <span className="text-purple-400">Scale</span>
                </h2>
                <p className="text-slate-300 text-base leading-relaxed max-w-lg mb-8">
                  This is just the beginning. PranAir's architecture is built to evolve with emerging technology—from 
                  thermal imaging and vital sign sensors to fully autonomous navigation and multi-drone coordination. 
                  As smart cities integrate emergency response networks, PranAir will become a core component of 
                  urban safety infrastructure.
                </p>

                <div className="grid grid-cols-1 gap-3 max-w-lg">
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-lg border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <h4 className="text-purple-400 font-bold text-base mb-1">🔬 Future Sensor Upgrades</h4>
                    <p className="text-sm text-slate-300">Thermal cameras, gas sensors, and non-contact vital sign monitoring</p>
                  </div>
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-lg border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <h4 className="text-purple-400 font-bold text-base mb-1">🤖 Autonomous Navigation</h4>
                    <p className="text-sm text-slate-300">Fully automated obstacle avoidance and dynamic path planning</p>
                  </div>
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-lg border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <h4 className="text-purple-400 font-bold text-base mb-1">🚁 Multi-Drone Coordination</h4>
                    <p className="text-sm text-slate-300">Swarm intelligence for large-scale disaster response</p>
                  </div>
                  <div className="bg-zinc-900/60 backdrop-blur-sm p-4 rounded-lg border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <h4 className="text-purple-400 font-bold text-base mb-1">🏙️ Smart City Integration</h4>
                    <p className="text-sm text-slate-300">Seamless connection with traffic systems, hospitals, and emergency services</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Right - Drone visual space */}
            <div className="hidden md:block"></div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="relative min-h-screen flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl px-6 relative z-30 pointer-events-auto"
          >
            <div className="backdrop-blur-xl bg-[rgba(0,0,0,0.55)] p-12 rounded-3xl border border-purple-500/30">
              <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                Saving Time. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Saving Lives.</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
                When roads are blocked and seconds matter, PranAir takes flight.
              </p>
              <button 
                onClick={() => navigate('/app')}
                className="px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-full shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:shadow-[0_0_50px_rgba(168,85,247,0.9)] transition-all transform hover:scale-105 pointer-events-auto inline-flex items-center gap-3"
              >
                Launch PranAir Command System
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </motion.div>
        </section>
      
      </div>

      <div className="fixed bottom-4 left-4 text-xs text-white/20 select-none z-50">
        PranAir Prototype v1.0 • Drone Model by SDC
      </div>
    </div>
  );
}
