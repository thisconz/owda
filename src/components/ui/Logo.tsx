import { useState } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const Logo = () => {
  const [isResonance, setIsResonance] = useState(false);

  return (
    <div className="flex items-center gap-5 relative z-10">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setIsResonance(!isResonance)}
      >
        {/* Brutalist Benzene Logo Icon */}
        <div className="relative w-10 h-10 border-[3px] border-[#1A1A1A] bg-[#D4FF00] shadow-[3px_3px_0px_#1A1A1A] flex items-center justify-center overflow-hidden active:translate-y-0.5 active:shadow-[1px_1px_0px_#1A1A1A] transition-all">
          <svg className="absolute w-full h-full p-1" viewBox="0 0 100 100">
            {/* Hexagon */}
            <polygon 
              points="50,10 85,30 85,70 50,90 15,70 15,30" 
              fill="none" 
              stroke="#1A1A1A" 
              strokeWidth="6" 
              strokeLinejoin="round" 
              className="group-hover:scale-105 transition-transform duration-300 origin-center"
            />
            {isResonance ? (
              /* Resonance circle */
              <circle 
                cx="50" cy="50" r="18" 
                fill="none" 
                stroke="#1A1A1A" 
                strokeWidth="6"
                strokeDasharray="6 4"
                className="group-hover:rotate-45 transition-transform duration-500 origin-center"
              />
            ) : (
              /* Static double bonds */
              <g stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" className="group-hover:scale-105 transition-transform duration-300 origin-center">
                <line x1="27" y1="39" x2="27" y2="61" />
                <line x1="52" y1="75" x2="71" y2="64" />
                <line x1="71" y1="36" x2="52" y2="25" />
              </g>
            )}
          </svg>
        </div>

        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter uppercase text-[#1A1A1A]">
              OWDA.
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A]">
              <ShieldCheck className="w-3 h-3 text-[#1A1A1A]" />
              <span className="text-[9px] font-mono text-[#1A1A1A] uppercase font-bold">ALPHA</span>
            </div>
          </div>
            
          <nav className="hidden lg:flex items-center gap-1 text-[9px] font-bold text-[#1A1A1A]/70 uppercase tracking-[0.15em] mt-1">
            <span className="hover:text-[#1A1A1A] hover:bg-[#D4FF00] px-0.5 transition-all">Core</span>
            <ChevronRight className="w-3 h-3 opacity-80" />
            <span className="text-[#1A1A1A] bg-[#EAE8E4] border border-[#1A1A1A] px-1">Control_Panel</span>
            <div className="ml-2 w-1.5 h-1.5 bg-[#ff6b6b] border border-[#1A1A1A] animate-pulse" />
          </nav>
        </div>
      </motion.div>
    </div>
  );
};