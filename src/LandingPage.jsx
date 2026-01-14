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

    // Phase 1: Hero -> Vision (Move Right)
    // 0.0 to 0.25
    if (offset < 0.25) {
      const t = offset / 0.25;
      x = lerp(0, 2, t);           // Drift Right
      y = lerp(baseY, -0.5, t);    // Float Up
      ry = lerp(Math.PI, Math.PI - 0.2, t); // Yaw Left
    } 
    // Phase 2: Vision -> Engineering (Move Left)
    // 0.25 to 0.50
    else if (offset < 0.50) {
      const t = (offset - 0.25) / 0.25;
      x = lerp(2, -2, t);          // Drift Left
      y = lerp(-0.5, 0, t);        // Float Higher
      z = lerp(0, 1, t);           // Come Closer
      ry = lerp(Math.PI - 0.2, Math.PI + 0.3, t); // Yaw Right
      rx = lerp(0, 0.1, t);        // Slight Pitch
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

  return (
    <div className="bg-[#0b0b0f] text-white overflow-x-hidden relative min-h-screen">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 8], fov: 45 }} 
        style={{ height: "100vh", width: "100vw", position: "fixed", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}
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

        {/* SECTION 1 - VISION */}
        <Section align="left">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Designed for the <span className="text-purple-400">first critical minutes</span> after an accident
            </h2>
            <p className="text-xl text-slate-400 border-l-4 border-purple-500 pl-6">
              When every second matters, PranAIR reaches the scene before help arrives.
            </p>
          </motion.div>
        </Section>

        {/* SECTION 2 - ENGINEERING */}
        <Section align="right">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-right"
          >
            <h2 className="text-5xl font-bold mb-6">
              Precision-engineered <br/><span className="text-purple-400">Aerial Platform</span>
            </h2>
            <ul className="space-y-4 text-lg text-slate-300 inline-block text-left">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                High-speed autonomous navigation
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                Stabilized vision system
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                Medical payload support
              </li>
            </ul>
            <div className="h-1 w-32 bg-purple-500 ml-auto mt-8 shadow-[0_0_15px_#a855f7]" />
          </motion.div>
        </Section>

        {/* SECTION 3 - INTELLIGENCE */}
        <Section align="center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center bg-black/50 backdrop-blur-md p-10 rounded-3xl border border-purple-500/30"
          >
            <h2 className="text-4xl font-bold mb-6">
              Powered by <span className="text-purple-400 shadow-purple-500/20 drop-shadow-md">AI Visual Intelligence</span>
            </h2>
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-purple-400 font-bold mb-1">Scene Understanding</h4>
                <p className="text-sm text-slate-400">Real-time analysis of accident environment</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-purple-400 font-bold mb-1">Medical Assessment</h4>
                <p className="text-sm text-slate-400">Visual injury identification & severity scoring</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-purple-400 font-bold mb-1">Time Estimation</h4>
                <p className="text-sm text-slate-400">Critical time window prediction algorithms</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-purple-400 font-bold mb-1">Hospital Alerts</h4>
                <p className="text-sm text-slate-400">Pre-arrival briefing generation for doctors</p>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* FINAL CTA SECTION */}
        <Section align="center" className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-6xl font-bold mb-8 tracking-tight">
              Saving Time. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Saving Lives.</span>
            </h2>
            <p className="text-xl text-slate-400 mb-12">
              When seconds matter, PranAIR responds.
            </p>
            <button 
              onClick={() => navigate('/app')}
              className="group relative px-10 py-5 bg-transparent border border-purple-500 text-purple-400 font-bold rounded-xl overflow-hidden hover:text-white transition-colors duration-300 pointer-events-auto"
            >
              <div className="absolute inset-0 w-0 bg-purple-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-20 group-hover:opacity-100" />
              <span className="relative z-10 flex items-center gap-3 text-lg">
                Launch PranAIR System
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </motion.div>
        </Section>
      
      </div>

      <div className="fixed bottom-4 left-4 text-xs text-white/20 select-none z-50">
        PranAir Prototype v1.0 • Drone Model by SDC
      </div>
    </div>
  );
}
