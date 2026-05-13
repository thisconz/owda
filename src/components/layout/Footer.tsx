import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Cpu, Wifi, Code2, Database, Shield } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { useOWDAStore } from '../../store';

export const Footer = () => {
  const { isProcessing } = useOWDAStore();
  const [metrics, setMetrics] = useState({ mem: 842, lat: 12, cpu: 4 });

  // Intelligent Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        mem: Math.floor(820 + Math.random() * 45),
        lat: Math.floor(10 + Math.random() * 6),
        cpu: isProcessing ? Math.floor(40 + Math.random() * 20) : Math.floor(2 + Math.random() * 5)
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <footer className="hidden md:flex fixed bottom-0 left-64 right-0 h-10 bg-white border-t-2 border-[#1A1A1A] z-50 px-6 items-center justify-between font-mono text-[9px] tracking-[0.12em] text-[#1A1A1A] select-none overflow-hidden">
      
      {/* Background Decor: CRT Scanline & Grain */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.05)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none opacity-20" />

      {/* LEFT: System Kernel & Resources */}
      <div className="flex items-center gap-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center justify-center p-1.5 transition-all duration-500 border-2 border-[#1A1A1A] ${
            isProcessing ? 'bg-owda-blue text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]' : 'bg-white text-[#1A1A1A]'
          }`}>
            <Terminal className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex flex-col">
            <span className={`transition-colors duration-300 font-black ${isProcessing ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/60'}`}>
              {isProcessing ? 'NODE_COMPUTE::SOLVING' : 'SYSTEM_IDLE'}
            </span>
            <span className="text-[7px] text-[#1A1A1A]/80 uppercase tracking-widest font-black">Kernel_{process.env.V || 'v4.0.0'}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-[#1A1A1A] hidden lg:block" />

        <div className="hidden lg:flex items-center gap-6">
          <ResourceItem 
            icon={<Cpu className="w-3 h-3" />} 
            label="MEM" 
            value={`${metrics.mem}MB`} 
            color="hover:bg-[#EAE8E4]" 
          />
          <ResourceItem 
            icon={<Wifi className="w-3 h-3" />} 
            label="LAT" 
            value={`${metrics.lat}MS`} 
            color="hover:bg-[#EAE8E4]" 
          />
          <div className="flex items-center gap-2 group cursor-help px-1 hover:bg-[#EAE8E4] transition-colors border border-transparent hover:border-[#1A1A1A]">
            <Activity className="w-3 h-3 text-[#1A1A1A] transition-colors" />
            <span className="text-[#1A1A1A] font-black uppercase">CPU: {metrics.cpu}%</span>
          </div>
        </div>
      </div>

      {/* CENTER: COMPUTATION PROGRESS (Refined) */}
      <AnimatePresence mode="wait">
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          >
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [1, 1, 1],
                    backgroundColor: ["#EAE8E4", "#D4FF00", "#EAE8E4"] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1, 
                    delay: i * 0.1,
                    ease: "easeInOut" 
                  }}
                  className="w-2.5 h-1 border border-[#1A1A1A]"
                />
              ))}
            </div>
            <span className="text-[7px] font-black text-[#1A1A1A] bg-white border border-[#1A1A1A] px-1 uppercase tracking-[0.4em]">Processing_Data_Stream</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT: Security & Versioning */}
      <div className="flex items-center gap-6 relative z-10">
        <div className="hidden xl:flex flex-col items-end leading-none gap-1 border-r-2 border-[#1A1A1A] pr-4">
          <div className="flex items-center gap-1.5 text-[#1A1A1A]">
            <Shield className="w-2.5 h-2.5 text-[#1A1A1A]" />
            <span className="text-[7px] font-black">ENCRYPTED_LINK</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#1A1A1A]/80">
            <Code2 className="w-3 h-3" />
            <span className="text-[8px] font-bold">OWDA.OS {process.env.V || 'v4.0'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] px-3 py-1 hover:bg-[#EAE8E4] transition-all cursor-pointer group active:translate-y-0.5 active:shadow-none">
            <div className="w-2 h-2 border border-[#1A1A1A] bg-emerald-500 animate-pulse" />
            <span className="text-[#1A1A1A] font-black tracking-widest uppercase text-[8px]">Stable</span>
          </div>
          
          <button className="p-1.5 border-2 border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none transition-all group">
            <Database className="w-3.5 h-3.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

const ResourceItem = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`flex items-center gap-2 group cursor-help ${color} transition-colors px-1 border border-transparent hover:border-[#1A1A1A]`}>
    <span className="text-[#1A1A1A]">{icon}</span>
    <div className="flex gap-1 items-baseline">
      <span className="text-[7px] font-black text-[#1A1A1A]">{label}:</span>
      <span className="text-[#1A1A1A] font-black tabular-nums">{value}</span>
    </div>
  </div>
);