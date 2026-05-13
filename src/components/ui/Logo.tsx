import { useState } from "react";
import { ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Logo = () => {
  const [isResonance, setIsResonance] = useState(false);

  return (
    <div className="flex items-center gap-5 relative z-10 select-none">
      <div 
        className="flex items-center gap-4 cursor-pointer group"
        onClick={() => setIsResonance(!isResonance)}
      >
        {/* 1. ARCHITECTURAL ICON CONTAINER */}
        <div className="relative w-12 h-12 flex items-center justify-center bg-[#D4FF00] border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] group-active:translate-y-0.5 group-active:shadow-none transition-all duration-75 overflow-hidden">
          {/* Decorative Corner Brackets */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-r border-b border-[#1A1A1A]/20" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-t border-l border-[#1A1A1A]/20" />
          
          <svg className="relative w-9 h-9 z-10" viewBox="0 0 100 100">
            {/* Hexagon Frame */}
            <motion.polygon
              animate={isResonance ? { scale: [1, 1.05, 1] } : {}}
              points="50,10 85,30 85,70 50,90 15,70 15,30"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="8"
              strokeLinejoin="round"
            />
            
            <AnimatePresence mode="wait">
              {isResonance ? (
                <motion.circle
                  key="resonance"
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  cx="50"
                  cy="50"
                  r="20"
                  fill="none"
                  stroke="#1A1A1A"
                  strokeWidth="6"
                  strokeDasharray="8 6"
                  className="origin-center"
                />
              ) : (
                <motion.g
                  key="static"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  stroke="#1A1A1A"
                  strokeWidth="8"
                  strokeLinecap="round"
                >
                  <line x1="30" y1="39" x2="30" y2="61" />
                  <line x1="52" y1="76" x2="72" y2="65" />
                  <line x1="72" y1="35" x2="52" y2="24" />
                </motion.g>
              )}
            </AnimatePresence>
          </svg>

          {/* Background Pulse Effect */}
          <AnimatePresence>
            {isResonance && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(26,26,26,0.05)_5px,rgba(26,26,26,0.05)_10px)]"
              />
            )}
          </AnimatePresence>
        </div>

        {/* 2. TEXTUAL IDENTITY */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <motion.span 
              whileHover={{ x: [0, -2, 2, 0] }}
              className="text-2xl font-black tracking-tighter uppercase text-[#1A1A1A] flex items-center"
            >
              OWDA<span className="text-[#ff6b6b]">.</span>OS
            </motion.span>

            <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] group-hover:bg-[#D4FF00] transition-colors">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[8px] font-mono font-black uppercase tracking-widest">
                v{process.env.APP_VERSION || "4.0.2"}
              </span>
            </div>
          </div>

          {/* 3. SYSTEM PATH / BREADCRUMB */}
          <nav className="hidden lg:flex items-center gap-1.5 text-[9px] font-black uppercase mt-1.5">
            <div className="flex items-center gap-1 text-[#1A1A1A]/40 group-hover:text-[#1A1A1A] transition-colors">
              <Zap size={10} className={isResonance ? "text-[#D4FF00]" : ""} />
              <span>Root</span>
            </div>
            <ChevronRight size={10} className="text-[#1A1A1A]/20" />
            <div className="bg-[#1A1A1A] text-white px-1.5 py-0.5 skew-x-[-10deg]">
              <span className="inline-block skew-x-10">Control_Panel</span>
            </div>
            <motion.div 
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-1 h-3 bg-[#ff6b6b] ml-1"
            />
          </nav>
        </div>
      </div>
    </div>
  );
};