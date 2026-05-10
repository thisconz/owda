import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Cpu, Database, Network, Power, Activity, ChevronRight, Binary } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sub-component for a tech-styled toggle
const SystemToggle = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-between w-full p-3 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 transition-all group"
  >
    <span className="text-[10px] font-mono uppercase tracking-wider text-owda-gray group-hover:text-owda-snow">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-owda-teal/40' : 'bg-white/10'}`}>
      <div className={`absolute top-1 left-1 w-2 h-2 rounded-full transition-all ${active ? 'translate-x-4 bg-owda-teal shadow-[0_0_8px_#56a099]' : 'bg-owda-gray'}`} />
    </div>
  </button>
);

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Local state for "uncommitted" changes
  const [isDeterministic, setIsDeterministic] = useState(true);
  const [useCache, setUseCache] = useState(true);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { e.key === 'Escape' && onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#020205]/80 backdrop-blur-sm z-60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-[#050510] border border-owda-teal/30 rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(86,160,153,0.05)] z-70 overflow-hidden flex flex-col"
          >
            {/* V4 Canonical Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none opacity-20" />
            
            {/* Header */}
            <div className="p-5 border-b border-owda-teal/10 flex items-center justify-between bg-linear-to-r from-white/3 to-transparent relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-owda-teal/20 blur-md rounded-full" />
                  <Settings className="w-5 h-5 text-owda-teal relative animate-[spin_20s_linear_infinite]" />
                </div>
                <div>
                  <h2 className="text-xs font-black tracking-[0.3em] uppercase text-owda-snow leading-none">Root Configuration</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-1 h-1 bg-owda-teal rounded-full animate-pulse" />
                    <code className="text-[9px] text-owda-teal/60 font-mono tracking-widest">VER_3.0.4_ALPHA</code>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="group p-2 rounded-lg transition-colors hover:bg-white/5">
                <X className="w-5 h-5 text-owda-gray group-hover:text-owda-snow transition-colors" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-8 relative z-10 custom-scrollbar">
              
              {/* Section: Logic Engine */}
              <section className="space-y-4">
                <header className="flex items-center gap-2 text-owda-teal opacity-80">
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Inference Core</span>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-owda-snow uppercase tracking-widest flex items-center gap-2">
                        <Binary className="w-3 h-3 text-owda-blue" /> Reasoning
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono ${isDeterministic ? 'bg-owda-blue/10 text-owda-blue border border-owda-blue/20' : 'bg-white/5 text-owda-gray'}`}>
                        {isDeterministic ? 'DETERMINISTIC' : 'HEURISTIC'}
                      </span>
                    </div>
                    <SystemToggle 
                      label="Enforce Stoichiometry" 
                      active={isDeterministic} 
                      onClick={() => setIsDeterministic(!isDeterministic)} 
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-white/1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-owda-snow uppercase tracking-widest">Sync Delay</span>
                      <span className="text-[9px] font-mono text-owda-teal">1500MS</span>
                    </div>
                    <input 
                      type="range" 
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-owda-teal" 
                    />
                  </div>
                </div>
              </section>

              {/* Section: Data Pipeline */}
              <section className="space-y-4">
                <header className="flex items-center gap-2 text-owda-blue opacity-80">
                  <Database className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Data Pipeline</span>
                </header>

                <div className="space-y-2">
                  {[
                    { icon: Network, label: 'PubChem Remote Mirror', status: 'ACTIVE', color: 'emerald' },
                    { icon: Database, label: 'Local Stoich Cache', status: '24.2MB', color: 'owda-teal' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/1 hover:border-white/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-owda-gray group-hover:text-owda-snow transition-colors" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-owda-snow/80">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono text-emerald-400">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-owda-teal/10 bg-white/2 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <div className="flex items-center gap-2 text-owda-teal/40">
                <Power className="w-3 h-3" />
                <span className="text-[8px] uppercase font-mono tracking-tighter">Integrity Check: Passed</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2 text-[10px] uppercase font-bold tracking-widest text-owda-gray hover:text-owda-snow transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={() => {
                    // Logic to commit changes to Zustand store would go here
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-8 py-2.5 bg-linear-to-r from-owda-teal to-owda-blue text-[#050510] text-[10px] font-black uppercase tracking-[0.2em] rounded hover:shadow-[0_0_20px_rgba(86,160,153,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Apply Changes <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}