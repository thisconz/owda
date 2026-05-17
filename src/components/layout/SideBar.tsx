import React, { useMemo } from "react";
import {
  Atom,
  Activity,
  Settings,
  Globe,
  Zap,
  Terminal,
  FlaskConical,
  Cpu,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type TabType = "workspace" | "simulation" | "analytics" | "compare";

interface SideBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openSettings: () => void;
  openNetwork: () => void;
  isCompact?: boolean;
}

interface UtilityIconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  compact: boolean;
  title: string;
}

const SECTION_HEADER_STYLE = "text-[9px] font-black text-[#1A1A1A]/40 uppercase tracking-[0.2em] mb-3 px-2 flex items-center gap-2 overflow-hidden whitespace-nowrap";

export const SideBar: React.FC<SideBarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  openNetwork,
  isCompact = false,
}) => {
  // Memoized tabs configuration array to avoid allocations on state adjustments
  const tabs = useMemo(() => [
    { id: "workspace" as const, icon: FlaskConical, label: "Synthesis Lab", desc: "CORE_PROCESSOR" },
    { id: "simulation" as const, icon: Atom, label: "Simulation", desc: "STATE_ENGINE" },
    { id: "analytics" as const, icon: Activity, label: "Analytics", desc: "DATA_UPLINK" },
    { id: "compare" as const, icon: Layers, label: "Comparison", desc: "DIFF_BUFFER" },
  ], []);

  return (
    <nav className="h-full flex flex-col items-stretch z-50 bg-[#FDFCFB] transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)]">
      
      {/* 1. BRANDING & VERSIONING */}
      <div className={`flex flex-col p-6 border-b-4 border-[#1A1A1A] bg-[#FF6B6B] relative overflow-hidden transition-all duration-500 ${isCompact ? 'items-center px-2' : ''}`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        <div className="relative z-10 flex flex-col gap-4 w-full items-center">
          {!isCompact && (
            <div className="flex items-center gap-2 self-start">
              <div className="w-2 h-2 bg-white border border-[#1A1A1A] rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-[#1A1A1A] uppercase bg-white px-1.5 shadow-[2px_2px_0px_#1A1A1A]">
                OS_ACTIVE
              </span>
            </div>
          )}
          
          <div className="bg-[#D4FF00] border-4 border-[#1A1A1A] p-3 shadow-[4px_4px_0px_#1A1A1A] flex items-center justify-center w-full">
            <h1 className="text-xl font-black italic tracking-tighter text-[#1A1A1A] leading-none select-none">
              {isCompact ? "O" : "OWDA"}<span className="text-[#FF6B6B]">.</span>OS
            </h1>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION MODULES */}
      <div className={`flex-1 flex flex-col px-3 md:px-4 gap-3 md:py-8 overflow-y-auto no-scrollbar transition-all ${isCompact ? 'px-2 py-4' : ''}`}>
        {!isCompact && (
          <p className={SECTION_HEADER_STYLE}>
            <Terminal size={10}/> <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Main_Modules</motion.span>
          </p>
        )}
        
        {tabs.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCompact ? item.label : undefined}
              className={`relative group flex items-center transition-all border-4 border-[#1A1A1A] outline-none ${
                isCompact ? 'justify-center p-3 w-12 h-12 self-center' : 'gap-4 p-3.5 w-full'
              } ${
                isActive
                  ? "bg-[#1A1A1A] text-white shadow-[4px_4px_0px_#D4FF00]"
                  : "bg-white text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F5F5F5] hover:shadow-[4px_4px_0px_#D4FF00] hover:-translate-y-0.5"
              }`}
            >
              <IconComponent className={`shrink-0 transition-transform duration-300 ${isCompact ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? "scale-110" : "group-hover:rotate-12"}`} />

              <AnimatePresence mode="wait">
                {!isCompact && (
                  <motion.div 
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-start overflow-hidden whitespace-nowrap text-left"
                  >
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      {item.label}
                    </span>
                    <span className={`text-[7px] font-mono font-bold uppercase opacity-60 ${isActive ? "text-[#D4FF00]" : ""}`}>
                      {isActive ? "ACTIVE_SESSION" : item.desc}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-[-4px] top-1 bottom-1 w-1 bg-[#D4FF00]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. UTILITY & DIAGNOSTICS */}
      <div className={`flex mt-auto flex-col p-4 gap-3 border-t-4 border-[#1A1A1A] bg-[#EAE8E4] transition-all ${isCompact ? 'p-2 items-center' : ''}`}>
        {!isCompact && <p className={SECTION_HEADER_STYLE}>System_Tools</p>}
        
        <div className={`grid gap-2 w-full ${isCompact ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <UtilityIconButton icon={<Settings size={14}/>} onClick={openSettings} compact={isCompact} title="Settings" />
          <UtilityIconButton icon={<Globe size={14}/>} onClick={openNetwork} compact={isCompact} title="Network Uplink" />
        </div>

        {/* Real-time Hardware Engine Health Widget */}
        <div className={`bg-white border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] relative overflow-hidden w-full transition-all ${isCompact ? 'p-2 flex justify-center h-12 w-12 self-center' : 'p-3'}`}>
          {!isCompact ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[#1A1A1A] animate-pulse" />
                  <span className="text-[8px] font-black uppercase font-mono">Load_V_Core</span>
                </div>
                <span className="text-[8px] font-mono font-black bg-[#1A1A1A] text-white px-1">98%</span>
              </div>
              <div className="h-1.5 w-full bg-[#F5F5F5] border-2 border-[#1A1A1A] relative overflow-hidden">
                <motion.div
                  animate={{ width: ["30%", "95%", "60%", "90%"] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="h-full bg-[#D4FF00]"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <Cpu size={14} className="text-[#1A1A1A] animate-pulse" />
              <div className="w-1.5 h-1 bg-[#D4FF00] border border-[#1A1A1A]" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const UtilityIconButton: React.FC<UtilityIconButtonProps> = ({ icon, onClick, compact, title }) => (
  <button
    onClick={onClick}
    title={compact ? title : undefined}
    className={`flex items-center justify-center bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#D4FF00] transition-all active:translate-y-0.5 outline-none group ${compact ? 'p-2 w-12 h-12 self-center' : 'p-3 w-full'}`}
  >
    <span className="group-hover:rotate-90 transition-transform duration-300 text-[#1A1A1A]">
      {icon}
    </span>
  </button>
);