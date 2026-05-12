import React from 'react';
import { 
  Atom, 
  Activity, 
  Settings, 
  Globe, 
  Zap, 
  Terminal, 
  FlaskConical 
} from 'lucide-react';
import { motion } from 'motion/react';

export type TabType = 'workspace' | 'explorer' | 'analytics';

interface SideBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openSettings: () => void;
}

export const SideBar: React.FC<SideBarProps> = ({ activeTab, setActiveTab, openSettings }) => {
  const tabs = [
    { id: 'workspace', icon: FlaskConical, label: "Laboratory", color: "text-owda-teal", desc: "Reaction Workspace" },
    { id: 'explorer', icon: Atom, label: "Quantum_Sim", color: "text-owda-blue", desc: "Simulate States" },
    { id: 'analytics', icon: Activity, label: "Telemetry", color: "text-emerald-500", desc: "Data Analytics" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 md:relative md:h-full md:w-64 md:border-t-0 md:border-r-4 border-t-4 border-[#1A1A1A] flex flex-row md:flex-col items-center z-50 bg-[#FDFCFB]">
      
      {/* 1. ARCHITECTURAL BRANDING */}
      <div className="hidden md:flex flex-col items-center justify-center p-6 w-full border-b-4 border-[#1A1A1A] bg-[#ff6b6b] relative">
        <div className="absolute top-0 right-0 w-8 h-8 bg-white border-l-4 border-b-4 border-[#1A1A1A] pt-1 pl-1">
          <div className="w-3 h-3 bg-[#1A1A1A] rounded-full animate-pulse" />
        </div>
        <div className="w-full flex items-center justify-between border-4 border-[#1A1A1A] bg-[#D4FF00] p-3 shadow-[4px_4px_0px_#1A1A1A] z-10">
          <div className="flex flex-col items-start leading-none">
            <span className="text-[14px] font-black text-[#1A1A1A] uppercase tracking-tighter">OWDA.SYS</span>
            <span className="text-[9px] font-mono font-black text-[#1A1A1A] uppercase bg-white px-1 border border-[#1A1A1A] mt-1">v4.0.0</span>
          </div>
        </div>
        {/* Decorative brutalist barcode / grid */}
        <div className="w-full h-5 mt-4 flex items-end gap-1 px-1 opacity-80 mix-blend-multiply">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`bg-[#1A1A1A] flex-1 ${i % 2 === 0 ? 'h-full' : 'h-3'}`} />
          ))}
        </div>
      </div>

      {/* 2. PRIMARY NAV MODULES */}
      <div className="flex flex-row md:flex-col w-full px-2 md:px-4 gap-1.5 md:gap-2 justify-center md:justify-start items-center my-4">
        {tabs.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`relative group flex flex-col md:flex-row items-center gap-4 w-full p-3 md:py-3.5 md:px-4 transition-all overflow-hidden border-2 ${
                isActive 
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[4px_4px_0px_#D4FF00]' 
                : 'bg-white text-[#1A1A1A] border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EAE8E4] hover:translate-x-1'
              }`}
            >
              {/* Selection Laser */}
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-highlight"
                  className="absolute inset-0 bg-[#1A1A1A]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}

              <div className="relative">
                <item.icon className={`w-5 h-5 md:w-5 md:h-5 z-10 transition-all ${
                  isActive ? 'text-white' : 'text-[#1A1A1A]'
                }`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#D4FF00] rounded-full animate-pulse shadow-[0_0_5px_#D4FF00]" />
                )}
              </div>
              
              <div className="flex flex-col items-start z-10 text-left">
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] ${
                  isActive ? 'text-white' : 'text-[#1A1A1A]'
                }`}>
                  {item.label}
                </span>
                <span className={`hidden md:block text-[7px] font-mono transition-opacity ${
                  isActive ? 'text-[#D4FF00]' : 'text-[#1A1A1A]/80 flex'
                }`}>
                  {isActive ? 'STATUS: ACTIVE' : item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. UTILITY & DIAGNOSTICS */}
      <div className="hidden md:flex mt-auto flex-col w-full p-4 gap-2 border-t-4 border-[#1A1A1A] bg-[#EAE8E4]">
        <div className="px-2 flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] px-1 uppercase tracking-[0.2em] font-mono shadow-[2px_2px_0px_#1A1A1A]">Diag</span>
          <Terminal className="w-3 h-3 text-[#1A1A1A]" />
        </div>
        
        <UtilityButton 
          icon={<Settings className="w-4 h-4" />} 
          label="Sys_Config" 
          onClick={openSettings}
          accent="text-[#1A1A1A]"
        />
        
        <UtilityButton 
          icon={<Globe className="w-4 h-4" />} 
          label="Network_Mesh" 
          accent="text-[#1A1A1A]"
        />

        {/* Real-time Health Widget */}
        <div className="mt-2 p-3 bg-white text-[#1A1A1A] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] group cursor-help relative overflow-hidden">
           <div className="absolute top-0 right-0 w-4 h-4 bg-[#D4FF00] border-l-2 border-b-2 border-[#1A1A1A] flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-[#1A1A1A] animate-ping" />
           </div>
           <div className="flex flex-col gap-1.5 mb-2 relative z-10">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-[#1A1A1A] animate-pulse" />
                <span className="text-[9px] font-mono uppercase font-black tracking-widest text-[#1A1A1A] bg-[#D4FF00] px-1 border border-[#1A1A1A]">Status</span>
              </div>
              <span className="text-[9px] font-mono font-black italic bg-black text-white w-fit px-1">100% NOMINAL</span>
           </div>
           <div className="h-[4px] w-full bg-[#EAE8E4] border border-[#1A1A1A] relative overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="h-full w-1/2 bg-[#ff6b6b]" 
              />
           </div>
        </div>
      </div>
    </nav>
  );
};

const UtilityButton = ({ icon, label, onClick, accent }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 py-2 px-3 text-[#1A1A1A] text-[9px] font-black uppercase tracking-wider transition-all group hover:bg-[#D4FF00] hover:text-[#1A1A1A] border-2 border-transparent hover:border-[#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A]`}
  >
    <span className={`transition-all duration-300`}>
      {icon}
    </span>
    <span className="group-hover:translate-x-0.5 transition-transform">{label}</span>
  </button>
);