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
    <header className="sticky top-0 w-full px-4 py-2.5 md:px-6 flex items-center justify-between border-b-4 border-[#1A1A1A] bg-[#FDFCFB] z-40 overflow-hidden shadow-[0px_4px_0px_#1A1A1A]">
      
      {/* LEFT: Identity & Navigation */}
      <Logo />

      {/* CENTER: Telemetry Hub */}
      <div className="hidden xl:flex items-center gap-12 px-6 border-x-4 border-[#1A1A1A] mx-6 h-12 bg-[#EAE8E4] shadow-[inset_0px_-2px_0px_rgba(26,26,26,0.1)] relative">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#D4FF00] border-r-2 border-[#1A1A1A]" />
        
        {/* CPU Tracker */}
        <div className="flex items-center gap-3 pl-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase text-[#1A1A1A] tracking-wider">Load</span>
            <span className="text-[10px] font-mono text-white bg-[#1A1A1A] px-1 font-bold">{cpuLoad}%</span>
          </div>
          <div className="flex gap-0.5 items-end h-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div 
                key={i}
                animate={{ height: i * 2 + (Math.random() * 6) }}
                className={`w-1 border border-[#1A1A1A] ${i < 5 ? 'bg-[#ff6b6b]' : 'bg-white'}`} 
              />
            ))}
          </div>
        </div>

        {/* Runtime Clock */}
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black uppercase text-[#1A1A1A] tracking-wider mb-0.5 border-b border-[#1A1A1A]">Session</span>
          <div className="flex items-center gap-1.5 bg-white border-2 border-[#1A1A1A] px-2 py-0.5 shadow-[2px_2px_0px_#1A1A1A]">
            <Zap className="w-3 h-3 text-[#1A1A1A]" />
            <span className="text-[12px] font-mono text-[#1A1A1A] font-black tabular-nums tracking-widest">{uptime}</span>
          </div>
        </div>

        {/* Memory status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start bg-[#D4FF00] border-2 border-[#1A1A1A] px-1 shadow-[2px_2px_0px_#1A1A1A]">
             <span className="text-[8px] font-black uppercase text-[#1A1A1A] tracking-wider border-b border-[#1A1A1A]">Mem</span>
             <span className="text-[10px] font-mono text-[#1A1A1A] font-black">OPT</span>
          </div>
          <Orbit className="w-4 h-4 text-[#1A1A1A] animate-spin-slow" />
        </div>
      </div>

      {/* RIGHT: System Controls */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Engine Toggle */}
        <button className="hidden sm:flex items-center gap-3 px-3 py-1.5 border-2 border-[#1A1A1A] bg-[#D4FF00] shadow-[2px_2px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none transition-all group">
          <Binary className="w-4 h-4 text-[#1A1A1A] group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-black text-[#1A1A1A] uppercase tracking-tighter">Logic</span>
            <span className="text-[10px] font-mono text-[#1A1A1A] font-bold">DETERMINISTIC</span>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ y: 2, boxShadow: "0px 0px 0px #1A1A1A" }}
            className="p-2 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#D4FF00] text-[#1A1A1A] transition-all relative"
          >
            <Activity className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF6B6B] border border-[#1A1A1A]" />
          </motion.button>
          
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ y: 2, boxShadow: "0px 0px 0px #1A1A1A" }}
            className="p-2 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EAE8E4] text-[#1A1A1A] transition-all"
          >
            <Terminal className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};