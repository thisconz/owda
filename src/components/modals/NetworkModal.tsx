import React, { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wifi, WifiOff, Shield, RotateCcw, 
  Database, Gauge, Terminal, Activity, LucideProps
} from "lucide-react";
import { useOWDAStore, useSolverNetwork } from "../../store";

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// -----------------------------------------------------------------------------
// Atoms
// -----------------------------------------------------------------------------

const WarningStripe = () => (
  <div className="h-1.5 w-full flex overflow-hidden">
    {[...Array(24)].map((_, i) => (
      <div key={i} className={`h-full w-8 -skew-x-12 ${i % 2 === 0 ? "bg-owda-blue" : "bg-owda-gray"}`} />
    ))}
  </div>
);

const DiagnosticLine = ({ label, value, active }: { label: string; value: string; active?: boolean }) => (
  <div className="flex justify-between items-center font-mono text-[9px] py-1.5 border-b border-owda-blue/10">
    <span className="text-owda-navy/40 uppercase">{label}</span>
    <span className={active ? "text-owda-blue font-bold" : "text-owda-navy/80"}>{value}</span>
  </div>
);

// -----------------------------------------------------------------------------
// Main Modal
// -----------------------------------------------------------------------------

export function NetworkModal({ isOpen, onClose }: NetworkModalProps) {
  const network = useSolverNetwork();
  const updateNetwork = useOWDAStore((state) => state.actions.updateNetwork);
  const factoryReset = useOWDAStore((state) => state.actions.factoryReset);
  
  const [logs, setLogs] = useState<string[]>(["INIT_CORE", "WAITING_PKT"]);
  const [isCommitting, setIsCommitting] = useState(false);

  // Esc Key support
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleCommit = () => {
    setIsCommitting(true);
    setLogs(prev => ["COMMITTING_PROTOCOL", ...prev]);
    setTimeout(() => {
      setIsCommitting(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-owda-gray/90 backdrop-blur-md bg-scanline"
            onClick={onClose}
          />

          <motion.div
            initial={{ clipPath: "inset(50% 0 50% 0)", opacity: 0 }}
            animate={{ clipPath: "inset(0% 0 0% 0)", opacity: 1 }}
            exit={{ clipPath: "inset(50% 0 50% 0)", opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="relative w-full max-w-4xl bg-owda-navy border-4 border-owda-gray shadow-[16px_16px_0px_#000] flex flex-col h-fit max-h-[90vh] overflow-hidden"
          >
            {/* 1. System Status Bar */}
            <div className="bg-owda-gray text-owda-navy p-3 flex justify-between items-center">
               <div className="flex items-center gap-4 px-2">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-owda-blue" />
                    <div className="w-1.5 h-1.5 bg-owda-blue/40" />
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.3em] font-bold uppercase opacity-80">
                    OWDA<span className="text-[#ff6b6b]">.</span>OS // SYS_NETWORK
                  </span>
               </div>
               <div className="hidden sm:flex items-center bg-owda-blue text-owda-gray px-4 py-1 font-black text-[9px] -skew-x-12 mr-12 tracking-widest">
                  ACCESS: UNRESTRICTED
               </div>
            </div>

            {/* 2. Interface Header */}
            <div className="flex items-center justify-between border-b-4 border-owda-gray p-6 bg-white bg-grid">
              <div className="flex items-center gap-5">
                <div className="p-4 border-4 border-owda-gray bg-owda-blue shadow-[4px_4px_0px_#1a1a1a]">
                  <Database className="w-6 h-6 text-owda-gray" />
                </div>
                <div>
                  <h1 className="font-mono text-3xl font-bold tracking-tight text-owda-gray leading-none">
                    Core Protocol
                  </h1>
                  <p className="font-mono text-[9px] mt-2 font-bold text-owda-gray/50 uppercase tracking-widest">
                    V{process.env.APP_VERSION} // {network.online ? 'UPLINK_LIVE' : 'LOCAL_ONLY'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="group p-3 border-2 border-owda-gray bg-white hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_#1a1a1a] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* 3. Main Operational Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Controls Column */}
              <div className="lg:col-span-7 p-6 space-y-8 border-r-4 border-owda-gray">
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-owda-gray" />
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Logic_Gates</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'online', label: 'Inference', icon: <Wifi />, desc: 'Cloud Uplink' },
                      { id: 'useProxy', label: 'Proxy', icon: <Shield />, desc: 'Node Tunnel' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => updateNetwork({ [item.id]: !network[item.id as keyof typeof network] })}
                        className={`p-4 border-2 border-owda-gray text-left transition-all flex justify-between items-center group ${
                          network[item.id as keyof typeof network] ? 'bg-owda-blue shadow-[4px_4px_0px_#1a1a1a]' : 'bg-white hover:bg-[#EAE8E4]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 border-2 border-black bg-white group-hover:-rotate-6 transition-transform">
                            {/* Fixed TS2769: Correctly casting the cloned icon props */}
                            {React.cloneElement(item.icon as React.ReactElement<LucideProps>, { size: 16 })}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                            <p className="text-[8px] font-mono font-bold opacity-50">{item.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="p-6 border-4 border-owda-gray bg-white shadow-[inset_6px_6px_0px_#EAE8E4]">
                   <div className="flex justify-between items-end mb-6">
                      <div className="flex items-center gap-2">
                        <Activity size={14} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Timeout_Limit</span>
                      </div>
                      <span className="font-mono text-lg font-black bg-owda-gray text-owda-blue px-2">
                        {network.timeoutMs}<span className="text-[10px] ml-1">MS</span>
                      </span>
                   </div>
                   <input 
                      type="range" min="500" max="10000" step="500" value={network.timeoutMs}
                      onChange={(e) => updateNetwork({ timeoutMs: Number(e.target.value) })}
                      className="w-full h-10 appearance-none bg-[#EAE8E4] border-2 border-owda-gray cursor-crosshair accent-owda-gray"
                   />
                </section>
              </div>

              {/* Console/Diagnostics Column */}
              <div className="lg:col-span-5 bg-owda-gray text-owda-navy p-6 flex flex-col">
                 <div className="mb-6">
                    <div className="flex items-center gap-2 border-b border-owda-blue/30 pb-2 mb-4">
                       <Terminal size={14} className="text-owda-blue" />
                       <span className="font-mono text-[10px] font-bold tracking-widest uppercase">System_Output</span>
                    </div>
                    <div className="space-y-1 max-h-30 overflow-hidden">
                       {logs.map((log, i) => (
                         <motion.p initial={{ x: -5, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={i} className="font-mono text-[9px] leading-relaxed">
                            <span className="text-owda-blue mr-2">[{i}]</span>
                            <span className={i === 0 ? "text-white" : "opacity-40"}>{log}</span>
                         </motion.p>
                       ))}
                    </div>
                 </div>

                 <div className="mt-auto pt-6 border-t border-owda-blue/20">
                    <DiagnosticLine label="Uplink_Node" value="0xFF-A2" />
                    <DiagnosticLine label="State" value={network.online ? 'ACTIVE' : 'IDLE'} active={network.online} />
                    <div className="mt-4 flex items-end gap-1 h-12">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [`${20 + Math.random() * 80}%`, `${10 + Math.random() * 50}%`] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                          className="flex-1 bg-owda-blue"
                        />
                      ))}
                    </div>
                 </div>
              </div>
            </div>

            {/* 4. Footer Actions */}
            <div className="mt-auto">
              <WarningStripe />
              <div className="p-6 bg-white flex flex-col sm:flex-row gap-4 border-t-4 border-owda-gray">
                <button 
                  onClick={factoryReset}
                  className="px-6 py-4 border-2 border-owda-gray font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center gap-3 justify-center"
                >
                  <RotateCcw size={14} />
                  Purge_Env
                </button>
                
                <button
                  onClick={handleCommit}
                  disabled={isCommitting}
                  className="flex-1 relative bg-owda-blue border-4 border-owda-gray py-4 px-8 shadow-[8px_8px_0px_#000] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all flex items-center justify-center overflow-hidden"
                >
                  <span className="font-black text-[11px] uppercase tracking-[0.4em] relative z-10 text-owda-gray">
                    {isCommitting ? "Syncing_Metadata..." : "Execute_Network_Commit"}
                  </span>
                  {isCommitting && (
                    <motion.div 
                      className="absolute inset-0 bg-white/40"
                      initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
