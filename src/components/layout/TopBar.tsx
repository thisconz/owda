import React, { useState, useEffect } from "react";
import {
  Binary,
  Activity,
  Orbit,
  Zap,
  Terminal,
  Cpu,
  Boxes,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { motion } from "motion/react";

export const TopBar: React.FC = () => {
  const [uptime, setUptime] = useState("00:00:00");
  const [cpuLoad, setCpuLoad] = useState(12);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);

      setCpuLoad((prev) =>
        Math.max(8, Math.min(24, prev + (Math.random() > 0.5 ? 1 : -1))),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 w-full px-4 py-2 md:px-6 flex items-center justify-between border-b-4 border-[#1A1A1A] bg-[#FDFCFB] z-40 shadow-[0px_4px_0px_#1A1A1A] overflow-hidden">
      {/* 1. IDENTITY BLOCK */}
      <div className="flex items-center gap-4">
        <Logo />
        <div className="hidden lg:flex flex-col border-l-2 border-[#1A1A1A] pl-4 leading-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">OWDA_Laboratory</span>
          <span className="text-[8px] font-mono font-bold text-[#1A1A1A]/50 uppercase">Riyadh_South_Node</span>
        </div>
      </div>

      {/* 2. CENTRAL TELEMETRY BAY */}
      <div className="hidden xl:flex items-center gap-10 px-8 border-x-4 border-[#1A1A1A] mx-6 h-12 bg-[#EAE8E4] relative group">
        {/* Safety Lead-in */}
        <div className="absolute top-0 left-0 w-2 h-full bg-[#D4FF00] border-r-2 border-[#1A1A1A]" />
        
        {/* Processor Activity */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start leading-none">
            <span className="text-[7px] font-black uppercase text-[#1A1A1A]/60">Proc_Load</span>
            <span className="text-[11px] font-mono font-black tabular-nums">{cpuLoad}%</span>
          </div>
          <div className="flex gap-0.5 items-end h-5 w-12 bg-white/50 border border-[#1A1A1A]/10 p-0.5">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: `${20 + Math.random() * 80}%` }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                className={`flex-1 border-t border-[#1A1A1A] ${i > 5 ? "bg-[#ff6b6b]" : "bg-[#1A1A1A]"}`}
              />
            ))}
          </div>
        </div>

        {/* Temporal Sync */}
        <div className="flex flex-col items-center px-4 border-x border-[#1A1A1A]/10">
          <div className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] px-3 py-0.5 shadow-[3px_3px_0px_#1A1A1A] relative active:translate-y-0.5 active:shadow-none transition-all cursor-help">
            <Zap className="w-3 h-3 text-[#1A1A1A] animate-pulse" />
            <span className="text-[13px] font-mono text-[#1A1A1A] font-black tabular-nums tracking-tighter">
              {uptime}
            </span>
          </div>
          <span className="text-[7px] font-black uppercase text-[#1A1A1A]/40 mt-1 tracking-[0.2em]">Uptime_Protocol</span>
        </div>

        {/* Engine Constants */}
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[7px] font-black uppercase text-[#1A1A1A]/60">Stability</span>
                <span className="text-[9px] font-mono font-black text-emerald-600">NOMINAL</span>
            </div>
            <Orbit className="w-5 h-5 text-[#1A1A1A] animate-[spin_12s_linear_infinite] opacity-80" />
        </div>
      </div>

      {/* 3. SYSTEM OVERRIDES */}
      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-3 px-4 py-1.5 border-2 border-[#1A1A1A] bg-[#D4FF00] shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all group">
          <Binary size={16} className="group-hover:rotate-360 transition-transform duration-700" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] font-black uppercase opacity-70">Engine_Mode</span>
            <span className="text-[10px] font-mono font-black">DETERMINISTIC</span>
          </div>
        </button>

        <div className="flex items-center gap-2 h-10 ml-2">
            <ControlIcon icon={<Boxes size={18}/>} badge color="hover:bg-[#ff6b6b]" />
            <ControlIcon icon={<Terminal size={18}/>} color="hover:bg-[#EAE8E4]" />
        </div>
      </div>
    </header>
  );
};

const ControlIcon = ({ icon, badge, color }: { icon: React.ReactNode, badge?: boolean, color: string }) => (
    <motion.button
      whileHover={{ y: -2, rotate: -2 }}
      whileTap={{ y: 1 }}
      className={`p-2 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] text-[#1A1A1A] transition-all relative ${color} group`}
    >
      {icon}
      {badge && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1A1A1A] border-2 border-white rounded-full group-hover:scale-125 transition-transform" />
      )}
    </motion.button>
);