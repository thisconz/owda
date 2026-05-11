import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Terminal, Cpu, HardDrive, Wifi, Code2, Database, Shield } from "lucide-react";
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
    <footer className="hidden md:flex fixed bottom-0 left-64 right-0 h-10 bg-[#02020a]/95 backdrop-blur-xl border-t border-white/6 z-50 px-6 items-center justify-between font-mono text-[9px] tracking-[0.12em] text-owda-snow/40 select-none overflow-hidden">
      
      {/* Background Decor: CRT Scanline & Grain */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/2 to-transparent pointer-events-none opacity-10" />

      {/* LEFT: System Kernel & Resources */}
      <div className="flex items-center gap-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center justify-center p-1.5 rounded transition-all duration-500 ${
            isProcessing ? 'bg-owda-teal/10 text-owda-teal ring-1 ring-owda-teal/30' : 'bg-white/5 text-owda-gray'
          }`}>
            <Terminal className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex flex-col">
            <span className={`transition-colors duration-300 ${isProcessing ? 'text-owda-teal font-bold' : 'text-owda-snow/60'}`}>
              {isProcessing ? 'NODE_COMPUTE::SOLVING' : 'SYSTEM_IDLE'}
            </span>
            <span className="text-[7px] text-owda-gray/50 uppercase tracking-widest font-bold">Kernel_{process.env.V}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/5 hidden lg:block" />

        <div className="hidden lg:flex items-center gap-6">
          <ResourceItem 
            icon={<Cpu className="w-3 h-3" />} 
            label="MEM" 
            value={`${metrics.mem}MB`} 
            color="hover:text-owda-teal" 
          />
          <ResourceItem 
            icon={<Wifi className="w-3 h-3" />} 
            label="LAT" 
            value={`${metrics.lat}MS`} 
            color="hover:text-owda-blue" 
          />
          <div className="flex items-center gap-2 group cursor-help">
            <Activity className="w-3 h-3 group-hover:text-emerald-500 transition-colors" />
            <span className="group-hover:text-owda-snow transition-colors uppercase">CPU: {metrics.cpu}%</span>
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
                    opacity: [0.2, 1, 0.2],
                    backgroundColor: ["#ffffff10", "#56a099", "#ffffff10"] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1, 
                    delay: i * 0.1,
                    ease: "easeInOut" 
                  }}
                  className="w-2.5 h-1 rounded-full"
                />
              ))}
            </div>
            <span className="text-[7px] font-black text-owda-teal uppercase tracking-[0.4em]">Processing_Data_Stream</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT: Security & Versioning */}
      <div className="flex items-center gap-6 relative z-10">
        <div className="hidden xl:flex flex-col items-end leading-none gap-1">
          <div className="flex items-center gap-1.5 text-owda-gray/60">
            <Shield className="w-2.5 h-2.5 text-owda-teal/50" />
            <span className="text-[7px] font-bold">ENCRYPTED_LINK</span>
          </div>
          <div className="flex items-center gap-1.5 text-owda-gray/30">
            <Code2 className="w-3 h-3" />
            <span className="text-[8px]">OWDA.OS {process.env.V}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-black/60 border border-white/5 px-3 py-1.5 rounded-sm hover:border-emerald-500/30 transition-all cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-[6px] rounded-full animate-pulse opacity-40 group-hover:opacity-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative z-10" />
            </div>
            <span className="text-emerald-500/70 font-black tracking-widest uppercase text-[8px] group-hover:text-emerald-500 transition-colors">Stable</span>
          </div>
          
          <button className="p-1.5 hover:bg-white/5 text-owda-gray hover:text-owda-snow rounded transition-colors group">
            <Database className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

const ResourceItem = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`flex items-center gap-2 group cursor-help ${color} transition-colors`}>
    <span className="text-owda-gray/40 group-hover:text-inherit transition-colors">{icon}</span>
    <div className="flex gap-1 items-baseline">
      <span className="text-[7px] font-bold text-owda-gray/30">{label}:</span>
      <span className="group-hover:text-owda-snow transition-colors tabular-nums">{value}</span>
    </div>
  </div>
);