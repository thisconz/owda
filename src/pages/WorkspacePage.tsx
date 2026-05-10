import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Target, Zap, Terminal, ChevronRight, AlertCircle } from 'lucide-react';
import { ReactionWorkspace } from '../components/ui/ReactionWorkspace';
import { useOWDAStore } from '../store';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { renderFormula } from "../utils/renderFormula";

export function WorkspacePage() {
  const { currentReaction } = useOWDAStore();
  const [logs, setLogs] = useState<string[]>(["SYSTEM_INITIALIZED", "AWAITING_MOLECULAR_INPUT"]);

  // 1. Narrowing the type within the Effect to avoid property access errors
  useEffect(() => {
    if (currentReaction?.isBalanced) {
      const rx = currentReaction as any; // Quickest fix for union property access
      const newLogs = [
        `MOLECULAR_STREAM_LOCKED: ${rx.reactants.molecules.length} reactants detected`,
        "STOICHIOMETRY_VERIFIED: Mass balance confirmed",
        `THERMO_COMPUTE: ΔH set to ${rx.enthalpy ?? 0}kJ`,
        "SCAN_COMPLETE: Reaction Workspace Ready"
      ];
      setLogs(prev => [...newLogs, ...prev].slice(0, 10));
    }
  }, [currentReaction]);

  // 2. Safe check for enthalpy
  const isExothermic = ((currentReaction as any)?.enthalpy ?? 0) <= 0;

  const dynamicEnergyData = useMemo(() => {
    const baseEnergy = 100;
    const deltaH = (currentReaction as any)?.enthalpy ?? -20; 
    const finalEnergy = Math.max(10, baseEnergy + deltaH);
    const ea = (currentReaction as any)?.activationEnergy ?? 60; 
    const peak = Math.max(baseEnergy, finalEnergy) + ea;

    return [
      { step: 'R', energy: baseEnergy, label: 'Reactants' },
      { step: 'TS', energy: peak, label: 'Transition State' },
      { step: 'P', energy: finalEnergy, label: 'Products' },
    ];
  }, [currentReaction]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-5 h-full p-4 lg:p-0 font-sans"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-owda-teal/10 rounded-xl border border-owda-teal/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
            <Beaker className="w-8 h-8 text-owda-teal" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-owda-snow uppercase italic flex items-center gap-2">
              <span className="text-owda-gray/50 not-italic font-mono text-sm">/</span>
              Synthesis_Lab 
              <span className="text-owda-teal px-2 py-0.5 bg-owda-teal/10 rounded text-xs not-italic tracking-normal">
                {(import.meta as any).env.VITE_SYNTHESISLAB_V || "v1.0.0"}
              </span>
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 uppercase">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Auth: System_Admin
              </span>
              <span className="text-[10px] font-mono text-owda-gray/60 uppercase">Loc: Riyadh_South_Sector</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="h-10 w-px bg-white/10 hidden md:block mx-2" />
           <div className="flex flex-col items-end">
             <div className="flex gap-1 mb-1">
               {[1,2,3,4].map(i => <div key={i} className={`w-3 h-1 rounded-full ${i < 4 ? 'bg-owda-teal' : 'bg-white/10'}`} />)}
             </div>
             <span className="text-[9px] font-mono text-owda-gray uppercase tracking-widest">Processing_Core_Load</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 flex-1">
        <div className="xl:col-span-8 flex flex-col gap-5 min-h-0">
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-owda-teal/20 to-owda-blue/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#050510] border border-white/10 rounded-2xl p-1 shadow-2xl">
              <ReactionWorkspace />
            </div>
          </section>
          
          <AnimatePresence mode="wait">
            {currentReaction?.isBalanced ? (
              <motion.div 
                key="balanced"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                   <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em]">Matrix_Verification</h3>
                      <Target className="w-4 h-4 text-owda-teal" />
                   </div>
                   <div className="space-y-4">
                     <MetricBar label="Atom_Consistency" percent={100} color="bg-emerald-500" />
                     <MetricBar label="Charge_Balance" percent={100} color="bg-owda-teal" />
                     <div className="pt-2 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-owda-gray/60 uppercase italic">Status: Verified</span>
                        <span className="text-[10px] font-mono text-emerald-400">0.002ms</span>
                     </div>
                   </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em]">Thermodynamic_Visual</h3>
                    <Zap className={`w-4 h-4 ${isExothermic ? 'text-emerald-400' : 'text-orange-400'}`} />
                  </div>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dynamicEnergyData}>
                        <defs>
                          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isExothermic ? '#10b981' : '#f97316'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isExothermic ? '#10b981' : '#f97316'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="energy" 
                          stroke={isExothermic ? '#10b981' : '#f97316'} 
                          fill="url(#energyGrad)" 
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#000', strokeWidth: 2 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono flex flex-col h-48"
              >
                <div className="flex items-center gap-2 mb-3 text-owda-gray">
                  <Terminal className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest">System_Event_Log</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 text-[10px] custom-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-owda-teal opacity-50">[{9 - i}]</span>
                      <span className={i === 0 ? "text-owda-snow" : "text-owda-gray/40"}>{log}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="xl:col-span-4 flex flex-col gap-5 min-h-0">
          <MoleculeStream title="Reactants" molecules={currentReaction?.reactants?.molecules} type="input" />
          <MoleculeStream title="Products" molecules={currentReaction?.products?.molecules} type="output" />
          
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
             <div className="text-[10px] text-owda-gray font-mono leading-tight uppercase">
                <span className="text-orange-200 block mb-1 underline underline-offset-4">Safety_Protocol_A1</span>
                Maintain standard STP conditions unless catalyst override is enabled in config.
             </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

/** HELPER COMPONENTS **/

function MetricBar({ label, percent, color }: { label: string, percent: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-mono text-owda-gray/80 uppercase">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${percent}%` }} 
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}

function MoleculeStream({ title, molecules, type }: { title: string, molecules?: any[], type: 'input' | 'output' }) {
  const isInput = type === 'input';
  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-owda-snow uppercase tracking-widest">{title}</h3>
        <div className={`px-2 py-0.5 rounded text-[8px] font-mono border ${isInput ? 'border-owda-teal text-owda-teal bg-owda-teal/5' : 'border-owda-blue text-owda-blue bg-owda-blue/5'}`}>
          {isInput ? 'CHANNEL_A' : 'CHANNEL_B'}
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
        {molecules && molecules.length > 0 ? (
          molecules.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/6 transition-colors"
            >
              <div className="flex items-center gap-3">
                 <ChevronRight className={`w-3 h-3 ${isInput ? 'text-owda-teal' : 'text-owda-blue'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                 <span className="text-lg font-bold text-owda-snow tracking-tight">{renderFormula(m.molecule.formula)}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${isInput ? 'text-owda-teal' : 'text-owda-blue'}`}>x{m.coefficient}</span>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl">
             <span className="text-[9px] font-mono text-owda-gray/30 uppercase tracking-[0.4em]">Listening...</span>
          </div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a1a] border border-white/20 p-2 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-[9px] font-mono text-owda-gray uppercase">{payload[0].payload.label}</p>
        <p className="text-xs font-bold text-owda-snow">{payload[0].value} <span className="text-[10px] font-normal opacity-50">Units</span></p>
      </div>
    );
  }
  return null;
};