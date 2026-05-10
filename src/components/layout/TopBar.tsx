import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  Activity, 
  ShieldCheck, 
  ChevronRight, 
  Orbit, 
  Zap, 
  Terminal
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { motion } from 'motion/react';

export const TopBar: React.FC = () => {
  const [uptime, setUptime] = useState('00:00:00');
  const [cpuLoad, setCpuLoad] = useState(12);

  // Simulation of "Engine Life"
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
      
      // Jitter the CPU load for realism
      setCpuLoad(prev => Math.max(8, Math.min(24, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 w-full px-4 py-2.5 md:px-6 flex items-center justify-between border-b border-white/10 bg-[#050510]/80 backdrop-blur-xl z-100 overflow-hidden">
      {/* Tailwind v4 Canonical Linear Glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-owda-teal/50 to-transparent opacity-70" />
      
      {/* Background Micro-Noise (Optional CSS pattern) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* LEFT: Identity & Navigation */}
      <div className="flex items-center gap-5 relative z-10">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative p-1.5 bg-[#0a0a1a] border border-owda-teal/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-tr from-owda-teal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Logo className="w-6 h-6 relative z-10" />
          </div>
          
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-widest uppercase text-owda-snow">
                OWDA<span className="text-owda-teal">.</span>OS
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-owda-teal/10 border border-owda-teal/20">
                <ShieldCheck className="w-2.5 h-2.5 text-owda-teal" />
                <span className="text-[8px] font-mono text-owda-teal uppercase font-bold">SECURE_ALPHA</span>
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center gap-1 text-[8px] font-bold text-owda-gray uppercase tracking-[0.15em] mt-1">
              <span className="hover:text-owda-teal transition-colors">Core</span>
              <ChevronRight className="w-2 h-2 opacity-50" />
              <span className="text-owda-snow/80">Molecular_Solver</span>
              <div className="ml-2 w-1 h-1 bg-owda-teal rounded-full animate-pulse" />
            </nav>
          </div>
        </motion.div>
      </div>

      {/* CENTER: Telemetry Hub */}
      <div className="hidden xl:flex items-center gap-12 px-10 border-x border-white/5 mx-6 h-9">
        {/* CPU Tracker */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-mono uppercase text-owda-gray tracking-tighter">Proc_Load</span>
            <span className="text-[10px] font-mono text-owda-snow">{cpuLoad}%</span>
          </div>
          <div className="flex gap-0.5 items-end h-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div 
                key={i}
                animate={{ height: i * 2 + (Math.random() * 4) }}
                className={`w-0.5 rounded-full ${i < 5 ? 'bg-owda-teal' : 'bg-owda-teal/20'}`} 
              />
            ))}
          </div>
        </div>

        {/* Runtime Clock */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] font-mono uppercase text-owda-gray tracking-tighter">Engine_Uptime</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-2.5 h-2.5 text-owda-blue" />
            <span className="text-[11px] font-mono text-owda-snow tabular-nums tracking-wider">{uptime}</span>
          </div>
        </div>

        {/* Memory status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start">
             <span className="text-[7px] font-mono uppercase text-owda-gray tracking-tighter">Mem_State</span>
             <span className="text-[10px] font-mono text-owda-blue">STABLE</span>
          </div>
          <Orbit className="w-3.5 h-3.5 text-owda-blue/50 animate-spin-slow" />
        </div>
      </div>

      {/* RIGHT: System Controls */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Engine Toggle */}
        <button className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/3 border border-white/10 rounded-md hover:border-owda-blue/50 hover:bg-owda-blue/5 transition-all group">
          <Binary className="w-3.5 h-3.5 text-owda-blue group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[7px] font-bold text-owda-blue uppercase tracking-tighter">Logic_Gate</span>
            <span className="text-[9px] font-mono text-owda-snow/70">DETERMINISTIC</span>
          </div>
        </button>

        {/* Console Trigger */}
        <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />
        
        <div className="flex items-center gap-2">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-white/5 text-owda-gray hover:text-owda-teal transition-all relative"
          >
            <Activity className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-owda-teal rounded-full shadow-[0_0_5px_#56a099]" />
          </motion.button>
          
          <button className="p-2 rounded-md hover:bg-white/5 text-owda-gray hover:text-owda-snow transition-all">
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};