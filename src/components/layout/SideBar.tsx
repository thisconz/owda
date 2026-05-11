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
import { Logo } from '../ui/Logo';
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
    <nav className="fixed bottom-0 left-0 right-0 h-20 md:h-full md:w-64 bg-[#02020a]/90 backdrop-blur-3xl border-t md:border-t-0 md:border-r border-white/5 flex flex-row md:flex-col items-center z-50 shadow-[20px_0_60px_rgba(0,0,0,0.5)]">
      
      {/* 1. ARCHITECTURAL BRANDING */}
      <div className="hidden md:flex flex-col items-center py-10 w-full relative overflow-hidden">
        {/* V4 Canonical Background Accent */}
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-owda-teal/5 to-transparent pointer-events-none" />
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="group cursor-pointer relative"
        >
          <div className="absolute inset-0 bg-owda-teal/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full" />
          <Logo className="w-14 h-14 relative z-10 brightness-110 drop-shadow-[0_0_15px_rgba(86,160,153,0.3)]" />
        </motion.div>
        
        <div className="mt-6 flex flex-col items-center gap-1">
           <span className="text-[10px] font-black tracking-[0.4em] uppercase text-owda-snow/90 leading-none">OWDA</span>
           <span className="text-[7px] font-mono text-owda-teal/50 tracking-[0.2em]">CORE_INTERFACE_{process.env.V}</span>
        </div>
      </div>

      {/* 2. PRIMARY NAV MODULES */}
      <div className="flex flex-row md:flex-col w-full px-2 md:px-4 gap-1.5 md:gap-2 justify-center md:justify-start items-center">
        {tabs.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`relative group flex flex-col md:flex-row items-center gap-4 w-full p-3 md:py-3.5 md:px-4 rounded-lg transition-all duration-300 overflow-hidden ${
                isActive 
                ? 'text-owda-snow bg-white/[0.04]' 
                : 'text-owda-snow/30 hover:text-owda-snow hover:bg-white/[0.02]'
              }`}
            >
              {/* V4 Selection Laser */}
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-highlight"
                  className="absolute inset-0 border border-owda-teal/10 bg-linear-to-r from-owda-teal/[0.05] to-transparent rounded-lg"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-owda-teal shadow-[0_0_12px_#56a099]" />
                </motion.div>
              )}

              <div className="relative">
                <item.icon className={`w-5 h-5 md:w-5 md:h-5 z-10 transition-all duration-500 ${
                  isActive ? item.color : 'group-hover:text-owda-snow/80'
                }`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-owda-teal rounded-full animate-pulse shadow-[0_0_5px_#56a099]" />
                )}
              </div>
              
              <div className="flex flex-col items-start z-10 text-left">
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] ${
                  isActive ? 'text-owda-snow' : 'group-hover:text-owda-snow/70'
                }`}>
                  {item.label}
                </span>
                <span className="hidden md:block text-[7px] font-mono text-owda-gray opacity-50 group-hover:opacity-100 transition-opacity">
                  {isActive ? 'STATUS: ACTIVE' : item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. UTILITY & DIAGNOSTICS */}
      <div className="hidden md:flex mt-auto flex-col w-full p-4 gap-1 border-t border-white/[0.05] bg-linear-to-t from-white/[0.02] to-transparent">
        <div className="px-2 mb-3 flex items-center justify-between">
          <span className="text-[8px] font-black text-owda-gray uppercase tracking-[0.2em]">Diagnostic_Tools</span>
          <Terminal className="w-2.5 h-2.5 text-owda-gray/30" />
        </div>
        
        <UtilityButton 
          icon={<Settings className="w-3.5 h-3.5" />} 
          label="Sys_Config" 
          onClick={openSettings}
          accent="owda-teal"
        />
        
        <UtilityButton 
          icon={<Globe className="w-3.5 h-3.5" />} 
          label="Network_Mesh" 
          accent="owda-blue"
        />

        {/* Real-time Health Widget */}
        <div className="mt-4 p-3 bg-black/60 border border-white/[0.03] rounded-lg group cursor-help">
           <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-2.5 h-2.5 text-owda-teal animate-pulse" />
                <span className="text-[7px] font-mono text-owda-teal uppercase font-bold">Node_Status</span>
              </div>
              <span className="text-[7px] font-mono text-emerald-500/80">99.2%</span>
           </div>
           <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="h-full w-1/3 bg-linear-to-r from-transparent via-owda-teal to-transparent" 
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
    className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-owda-snow/40 text-[9px] font-bold uppercase tracking-wider transition-all group hover:bg-white/[0.03] hover:text-owda-snow`}
  >
    <span className={`group-hover:text-${accent} group-hover:scale-110 transition-all duration-300`}>
      {icon}
    </span>
    <span className="group-hover:translate-x-0.5 transition-transform">{label}</span>
  </button>
);