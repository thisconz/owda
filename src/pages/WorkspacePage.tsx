import { useMemo, useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Activity,
  Cpu,
  BookOpen,
  Brain,
  Code2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Zap
} from "lucide-react";
import { ReactionWorkspace } from "../components/ui/ReactionWorkspace";
import { useCurrentReaction, useCurrentSteps } from "../store";
import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine, YAxis, CartesianGrid } from "recharts";
import { renderFormula } from "../utils/renderFormula";
import ReactMarkdown from "react-markdown";
import { ExplanationStep } from "../types";

// --- Types & Constants ---
const MODE_CONFIG = {
  human: { icon: <BookOpen size={14} />, label: "OBSERVATION", border: "border-[#1A1A1A]", accent: "text-[#1A1A1A]", bg: "bg-white", headerBg: "bg-[#D4FF00]" },
  expert: { icon: <Brain size={14} />, label: "MECHANISM", border: "border-[#1A1A1A]", accent: "text-[#1A1A1A]", bg: "bg-white", headerBg: "bg-[#FF6B6B]" },
  machine: { icon: <Code2 size={14} />, label: "THERMODYNAMICS", border: "border-[#1A1A1A]", accent: "text-white", bg: "bg-[#1A1A1A]/5", headerBg: "bg-[#1A1A1A]" },
};

// --- Optimized Sub-components ---

const StepCard = memo(({ step, index }: { step: ExplanationStep; index: number }) => {
  const [collapsed, setCollapsed] = useState(false);
  const cfg = MODE_CONFIG[step.mode as keyof typeof MODE_CONFIG] || MODE_CONFIG.human;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-4 ${cfg.border} ${cfg.bg} shadow-[4px_4px_0px_#1A1A1A]`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-2.5 ${cfg.headerBg} border-b-4 border-[#1A1A1A]`}
      >
        <div className="flex items-center gap-3">
          <div className="p-1 border-2 border-[#1A1A1A] bg-white text-[#1A1A1A]">{cfg.icon}</div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] font-black uppercase opacity-60">{cfg.label}</span>
            <span className="text-[11px] font-black uppercase tracking-tight">{step.title}</span>
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 font-mono text-[12px] text-[#1A1A1A]">
              <ReactMarkdown 
                components={{
                    strong: ({children}) => <span className="bg-[#1A1A1A] text-white px-1 mx-0.5">{children}</span>,
                    code: ({children}) => <code className="bg-[#D4FF00] px-1 border border-[#1A1A1A] font-bold">{children}</code>
                }}
              >
                {step.description}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export function WorkspacePage() {
  const currentReaction = useCurrentReaction();
  const currentSteps    = useCurrentSteps();
  const [logs, setLogs] = useState<string[]>(["CORE_READY", "AWAITING_REACTION_DATA"]);

  // Type-safe derived state
  const reactionState = useMemo(() => {
    if (currentReaction?.isBalanced) {
      return {
        isBalanced: true,
        enthalpy: currentReaction.enthalpy ?? 0,
        gibbs: currentReaction.gibbs ?? 0,
        entropy: currentReaction.entropy ?? 0,
        activationEnergy: currentReaction.activationEnergy ?? 40,
        isExothermic: (currentReaction.enthalpy ?? 0) < 0
      };
    }
    return { isBalanced: false, enthalpy: 0, gibbs: 0, entropy: 0, activationEnergy: 40, isExothermic: undefined };
  }, [currentReaction]);

  useEffect(() => {
    if (reactionState.isBalanced) {
      const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setLogs(p => [`[${ts}] R_SYNC: ΔG=${reactionState.gibbs.toFixed(2)} | ΔH=${reactionState.enthalpy}`, ...p].slice(0, 12));
    }
  }, [reactionState.isBalanced, reactionState.gibbs, reactionState.enthalpy]);

  const chartData = useMemo(() => {
    const base = 100;
    const final = base + reactionState.enthalpy;
    const peak = Math.max(base, final) + reactionState.activationEnergy;
    return [
      { step: "Reactants", energy: base },
      { step: "TS", energy: peak },
      { step: "Products", energy: final },
    ];
  }, [reactionState]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 p-4 select-none font-sans"
    >
      
      {/* ─── HUD HEADER ─── */}
      <header className="grid grid-cols-1 md:grid-cols-12 border-4 border-[#1A1A1A] bg-white shadow-[8px_8px_0px_#1A1A1A] overflow-hidden">
        <div className="md:col-span-4 p-5 flex items-center gap-4 bg-[#D4FF00] border-r-4 border-[#1A1A1A]">
          <div className="bg-[#1A1A1A] p-3 rotate-3 shadow-[4px_4px_0px_#FF6B6B]">
            <Activity className="w-8 h-8 text-[#D4FF00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Synthesis -<span className="bg-white px-1 border-2 border-[#1A1A1A] not-italic">OS</span></h1>
            <p className="text-[10px] font-mono font-black opacity-60">OWDA_WORKSPACE_V{process.env.WORKSPACE_VERSION}</p>
          </div>
        </div>

        <div className="md:col-span-5 p-5 flex flex-col justify-center bg-white">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase">Stability_Index</span>
            <span className="font-mono text-sm font-black italic">{reactionState.gibbs.toFixed(2)}</span>
          </div>
          <div className="h-4 w-full bg-[#EAE8E4] border-2 border-[#1A1A1A] p-0.5 overflow-hidden">
            <motion.div 
                animate={{ width: reactionState.isBalanced ? `${Math.min(Math.abs(reactionState.gibbs), 100)}%` : '0%' }}
                className={`h-full ${reactionState.gibbs < 0 ? 'bg-[#D4FF00]' : 'bg-[#FF6B6B]'}`} 
            />
          </div>
        </div>

        <div className="md:col-span-3 p-5 bg-[#1A1A1A] text-white flex flex-col justify-center items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.5em]">SYSTEM_LIVE</span>
            </div>
            <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => <div key={i} className={`w-3 h-1 ${i < 3 ? 'bg-[#D4FF00]' : 'bg-white/10'}`} />)}
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ─── LEFT: MAIN ENGINE ─── */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <section className="bg-white border-4 border-[#1A1A1A] p-2 shadow-[8px_8px_0px_#1A1A1A]">
            <ReactionWorkspace />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#EAE8E4] border-4 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_#1A1A1A]">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                <Target size={14} /> Matrix_Audit_Log
              </h3>
              <div className="space-y-5">
                <MetricBar label="Atom_Parity" percent={reactionState.isBalanced ? 100 : 0} />
                <MetricBar label="Valence_Match" percent={reactionState.isBalanced ? 100 : 40} />
                <MetricBar label="Entropy_Delta" percent={reactionState.entropy ? 85 : 0} />
              </div>
            </div>

            <div className="bg-white border-4 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_#1A1A1A] relative overflow-hidden">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Enthalpy_Path</h3>
                  <div className={`px-2 py-0.5 border-2 border-[#1A1A1A] text-[9px] font-black ${reactionState.isExothermic ? 'bg-[#D4FF00]' : 'bg-[#FF6B6B]'}`}>
                    {reactionState.isExothermic ? 'EXOTHERMIC' : 'ENDOTHERMIC'}
                  </div>
               </div>
               <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A10" />
                      <YAxis hide domain={[0, 'dataMax + 50']} />
                      <Area 
                        type="stepAfter" 
                        dataKey="energy" 
                        stroke="#1A1A1A" 
                        strokeWidth={4} 
                        fill={reactionState.isExothermic ? "#D4FF00" : "#FF6B6B"} 
                        fillOpacity={1}
                      />
                      <ReferenceLine y={100} stroke="#1A1A1A" strokeDasharray="5 5" />
                      <Tooltip content={<CustomTooltip />} cursor={{stroke: '#1A1A1A', strokeWidth: 2}} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
               <Cpu className="animate-spin-slow" size={16} />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Neural_Analysis_Chain</h2>
               <div className="flex-1 h-1 bg-[#1A1A1A]/10" />
            </div>
            <div className="grid gap-4">
                {currentSteps.length > 0 ? (
                    currentSteps.map((s, i) => <StepCard key={i} step={s} index={i} />)
                ) : (
                    <div className="border-4 border-dashed border-[#1A1A1A]/20 py-16 text-center">
                        <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.5em]">Awaiting_Input_Stream</p>
                    </div>
                )}
            </div>
          </section>
        </div>

        {/* ─── RIGHT: TELEMETRY ─── */}
        <aside className="xl:col-span-4 flex flex-col gap-6">
          <MoleculeStream title="Feedstock_In" molecules={currentReaction?.reactants?.molecules} color="#1A1A1A" />
          <MoleculeStream title="Synthesis_Out" molecules={currentReaction?.products?.molecules} color="#D4FF00" />

          {/* CONSOLE */}
          <div className="bg-[#1A1A1A] text-[#D4FF00] p-4 font-mono text-[10px] h-48 border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#D4FF00] flex flex-col">
            <div className="flex justify-between border-b border-[#D4FF00]/20 pb-2 mb-2 uppercase font-black tracking-widest">
                <span>Sys_Terminal</span>
                <span>v4.0</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                {logs.map((l, i) => (
                    <div key={i} className={i === 0 ? "text-white flex gap-2" : "opacity-50 flex gap-2"}>
                        <span className="text-[#D4FF00] shrink-0">[{logs.length - i}]</span> {l}
                    </div>
                ))}
            </div>
          </div>

          {/* SAFETY OVERRIDE */}
          <div className={`p-5 border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] transition-colors ${reactionState.isExothermic ? 'bg-[#FF6B6B]' : 'bg-[#D4FF00]'}`}>
            <div className="flex items-start gap-4">
              <ShieldAlert size={24} className="shrink-0" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight mb-1">Safety_Override_Active</p>
                <p className="text-[10px] font-bold leading-tight uppercase opacity-80">
                    {reactionState.isExothermic 
                        ? "CAUTION: Rapid energy release detected. Thermal containment buffers engaged."
                        : "NOMINAL: System stable. Thermodynamic drift within expected parameters."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

// --- Internal UI Components ---

function MetricBar({ label, percent }: { label: string, percent: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-black uppercase">
        <span className="opacity-50">{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-3.5 w-full bg-white border-2 border-[#1A1A1A] p-0.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-[#1A1A1A]" />
      </div>
    </div>
  );
}

function MoleculeStream({ title, molecules, color }: any) {
  return (
    <div className="bg-white border-4 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_#1A1A1A]">
      <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b-2 border-[#1A1A1A] pb-2 flex justify-between">
        {title} <span className="opacity-30 italic">S_NODE</span>
      </h3>
      <div className="space-y-4">
        {molecules?.map((m: any, i: number) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-6" style={{ backgroundColor: color }} />
                <span className="text-lg font-black font-mono italic tracking-tighter">
                    {renderFormula(m.molecule.formula)}
                </span>
            </div>
            <div className="text-right">
                <span className="text-xs font-black block leading-none">×{m.coefficient}</span>
                <span className="text-[8px] font-mono opacity-40 uppercase">{m.molecule.molarMass}u</span>
            </div>
          </div>
        ))}
        {(!molecules || molecules.length === 0) && <div className="text-[9px] font-mono opacity-20 py-2 text-center uppercase tracking-widest">Idle_State</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-[#1A1A1A] text-white p-3 border-2 border-[#D4FF00] font-mono shadow-[4px_4px_0px_#1A1A1A]">
        <p className="text-[9px] uppercase font-black text-[#D4FF00] mb-1">{payload[0].payload.step}</p>
        <p className="text-lg font-black italic">{payload[0].value.toFixed(1)}<span className="text-[10px] not-italic ml-1 opacity-50">kJ/mol</span></p>
      </div>
    );
  }
  return null;
};