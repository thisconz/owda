import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Terminal,
  Cpu,
  Wifi,
  Database,
  Shield,
  Zap,
  ChevronRight,
  HardDrive,
  Code,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOWDAStore } from "../../store";

interface FooterProps {
  sidebarOpen: boolean;
}

export const Footer: React.FC<FooterProps> = ({ sidebarOpen }) => {
  const { isProcessing } = useOWDAStore();
  const [metrics, setMetrics] = useState({ mem: 842, lat: 12, cpu: 4, disk: 1.2 });
  const [logIndex, setLogIndex] = useState(0);

  // Simulated Kernel Messages
  const logLines = useMemo(() => [
    "ATTACHING_VOLATILE_MEMORY...",
    "HANDSHAKE_SECURE_L7",
    "POLLING_STOCHASTIC_ENGINE",
    "SYNCING_WORKSPACE_STATE",
    "BUFFER_FLUSH_COMPLETE",
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        mem: Math.floor(820 + Math.random() * 45),
        lat: Math.floor(10 + Math.random() * 6),
        cpu: isProcessing ? Math.floor(65 + Math.random() * 20) : Math.floor(4 + Math.random() * 8),
        disk: Number((prev.disk + 0.01).toFixed(2))
      }));
      setLogIndex((p) => (p + 1) % logLines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, logLines.length]);

  return (
    <footer 
      className={`hidden md:flex fixed bottom-0 right-0 h-10 bg-white border-t-4 border-[#1A1A1A] z-50 px-6 items-center justify-between font-mono text-[9px] tracking-tight text-[#1A1A1A] select-none transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${
        sidebarOpen ? 'left-72' : 'left-20'
      }`}
    >
      {/* --- INFRASTRUCTURE OVERLAYS --- */}
      <div className="absolute inset-0 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] bg-[size:12px_12px] opacity-[0.04] pointer-events-none" />
      
      {/* Moving Scanline */}
      <motion.div 
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#D4FF00]/10 to-transparent pointer-events-none" 
      />

      {/* LEFT: CORE ENGINE STATUS */}
      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-3 bg-[#1A1A1A] text-white px-3 py-1 shadow-[3px_3px_0px_#D4FF00]">
          <Terminal className={`w-3 h-3 ${isProcessing ? "text-[#D4FF00] animate-pulse" : "text-white"}`} />
          <span className="font-black text-[8px] uppercase italic tracking-widest">
            {isProcessing ? "ENGINE_LOAD_HIGH" : "CORE_STABLE"}
          </span>
        </div>

        <div className="flex items-center gap-5 border-l-2 border-[#1A1A1A]/10 pl-5">
          <ResourceItem icon={<Cpu size={12} />} label="CPU" value={`${metrics.cpu}%`} />
          
          {/* Micro Graph for Visual Texture */}
          <div className="flex items-end gap-0.5 h-3 w-8 px-1 border-x border-[#1A1A1A]/10">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: isProcessing ? [`${30+i*10}%`, `${90-i*5}%`, `${50}%`] : '20%' }}
                transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                className={`w-full ${isProcessing ? 'bg-[#D4FF00]' : 'bg-[#1A1A1A]/20'}`}
              />
            ))}
          </div>

          <ResourceItem icon={<HardDrive size={12} />} label="IO" value={`${metrics.disk}GB/s`} />
        </div>
      </div>

      {/* CENTER: KERNEL LOG TICKER */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#F5F5F5] border-x-2 border-[#1A1A1A]/10 px-6 h-full overflow-hidden min-w-[240px] justify-center">
        <Code size={10} className="text-[#1A1A1A]/30" />
        <AnimatePresence mode="wait">
          <motion.span
            key={logLines[logIndex]}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-[8px] font-bold text-[#1A1A1A]/60 uppercase tracking-[0.2em]"
          >
            {logLines[logIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* RIGHT: SECURITY & VAULT */}
      <div className="flex items-center gap-5 relative z-10">
        <div className="hidden lg:flex items-center gap-3 opacity-50 border-r border-[#1A1A1A]/10 pr-5">
          <Shield size={12} />
          <span className="text-[7px] font-black uppercase tracking-widest">AES_256_ENCRYPT</span>
        </div>

        <div className="flex items-center gap-3 bg-emerald-500 text-white px-2 py-0.5 border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
          <span className="font-black text-[8px] italic">OS_v1.02_STABLE</span>
        </div>

        <button className="flex items-center gap-2 bg-[#D4FF00] border-2 border-[#1A1A1A] px-3 py-0.5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0 active:shadow-none transition-all group">
          <Database size={11} className="group-hover:rotate-[20deg] transition-transform" />
          <span className="font-black uppercase text-[8px] tracking-tighter">Open_Vault</span>
          <ChevronRight size={10} />
        </button>
      </div>
    </footer>
  );
};

const ResourceItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) => (
  <div className="flex items-center gap-2 group">
    <span className="text-[#1A1A1A]/40 group-hover:text-[#1A1A1A] transition-colors">
      {icon}
    </span>
    <div className="flex flex-col leading-none">
      <span className="text-[9px] font-black tabular-nums">{value}</span>
      <span className="text-[6px] font-black text-[#1A1A1A]/30 uppercase">{label}</span>
    </div>
  </div>
);