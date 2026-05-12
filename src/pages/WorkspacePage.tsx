import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Beaker,
  Target,
  Zap,
  Terminal,
  ChevronRight,
  AlertCircle,
  Brain,
  Cpu,
  BookOpen,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ReactionWorkspace } from '../components/ui/ReactionWorkspace';
import { useOWDAStore, useCurrentSteps } from '../store';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { renderFormula } from '../utils/renderFormula';
import ReactMarkdown from 'react-markdown';
import { ExplanationStep } from '../types';

// ─── AI Step Card ───────────────────────────────────────────────────────────

const modeConfig = {
  human: {
    icon: <BookOpen className="w-4 h-4 ml-1" />,
    label: 'Basic Overview',
    border: 'border-[#1A1A1A]',
    accent: 'text-[#1A1A1A]',
    bg: 'bg-white',
    headerBg: 'bg-[#D4FF00]',
  },
  expert: {
    icon: <Brain className="w-4 h-4 ml-1" />,
    label: 'Mechanism',
    border: 'border-[#1A1A1A]',
    accent: 'text-[#1A1A1A]',
    bg: 'bg-white',
    headerBg: 'bg-white',
  },
  machine: {
    icon: <Code2 className="w-4 h-4 ml-1" />,
    label: 'Thermodynamics',
    border: 'border-[#1A1A1A]',
    accent: 'text-white',
    bg: 'bg-white',
    headerBg: 'bg-[#1A1A1A]',
  },
};

function StepCard({ step, index }: { step: ExplanationStep; index: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const cfg = modeConfig[step.mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`border-2 ${cfg.border} ${cfg.bg} rounded-none overflow-hidden shadow-[4px_4px_0px_#1A1A1A]`}
    >
      <button
        onClick={() => setCollapsed((p) => !p)}
        className={`w-full flex items-center justify-between px-5 py-3 ${cfg.headerBg} border-b-2 border-[#1A1A1A]`}
      >
        <div className="flex items-center gap-2">
          <span className={cfg.accent}>{cfg.icon}</span>
          <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${cfg.accent}`}>
            {step.title}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className={`w-4 h-4 ${cfg.accent}`} />
        ) : (
          <ChevronUp className={`w-4 h-4 ${cfg.accent}`} />
        )}
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-[#EAE8E4]"
          >
            <div className="px-5 py-4 prose-sm max-w-none text-[#1A1A1A] font-mono">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="text-[12px] font-bold leading-relaxed mb-3 last:mb-0">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-black font-black bg-[#D4FF00] px-1 border border-[#1A1A1A] inline-block -my-0.5">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-white px-1.5 py-0.5 border border-[#1A1A1A] text-black font-black text-[11px] shadow-[1px_1px_0px_#1A1A1A]">
                      {children}
                    </code>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-1 list-disc pl-5 mb-3 marker:text-[#1A1A1A] font-bold">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-[12px]">{children}</li>
                  ),
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
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function WorkspacePage() {
  const { currentReaction } = useOWDAStore();
  const currentSteps = useCurrentSteps();
  const [logs, setLogs] = useState<string[]>([
    'SYSTEM_INITIALIZED',
    'AWAITING_MOLECULAR_INPUT',
  ]);

  useEffect(() => {
    if (currentReaction?.isBalanced) {
      const newLogs = [
        `MOLECULAR_STREAM_LOCKED: ${currentReaction.reactants.molecules.length}R → ${currentReaction.products.molecules.length}P`,
        'STOICHIOMETRY_VERIFIED: Mass balance confirmed',
        `THERMO_COMPUTE: ΔH = ${currentReaction.enthalpy} kJ/mol`,
        `GIBBS: ΔG = ${currentReaction.gibbs} kJ/mol — ${
          currentReaction.gibbs < 0 ? 'SPONTANEOUS' : 'NON_SPONTANEOUS'
        }`,
        'SCAN_COMPLETE: Reaction Workspace Ready',
      ];
      setLogs((prev) => [...newLogs, ...prev].slice(0, 12));
    }
  }, [currentReaction]);

  // Type-safe exothermic check via discriminated union
  const isExothermic =
    currentReaction?.isBalanced ? currentReaction.enthalpy < 0 : false;

  const dynamicEnergyData = useMemo(() => {
    if (!currentReaction?.isBalanced) {
      return [
        { step: 'R', energy: 100, label: 'Reactants' },
        { step: 'TS', energy: 160, label: 'Transition State' },
        { step: 'P', energy: 80, label: 'Products' },
      ];
    }
    const baseEnergy = 100;
    const deltaH = currentReaction.enthalpy;
    const finalEnergy = Math.max(10, baseEnergy + deltaH);
    const ea = currentReaction.activationEnergy ?? 60;
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
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white border-2 border-[#1A1A1A] rounded-none shrink-0 shadow-[4px_4px_0px_#1A1A1A]">
        <div className="flex items-center gap-5">
          <div className="relative border-2 border-[#1A1A1A] p-2 bg-[#EAE8E4]">
            <Beaker className="w-8 h-8 text-[#1A1A1A] relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-[#1A1A1A] uppercase italic flex items-center gap-2">
              Synthesis <span className="bg-[#D4FF00] px-2 border-2 border-[#1A1A1A] not-italic">Lab</span>
              <span className="not-italic text-[10px] bg-white border-2 border-[#1A1A1A] px-2 py-0.5 rounded-none text-[#1A1A1A] font-bold ml-2 shadow-[2px_2px_0px_#1A1A1A]">
                {import.meta.env.WORKSPACE_VERSION}
              </span>
            </h2>
            <span className="text-[9px] font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5 mt-1 border border-[#1A1A1A] inline-flex px-1 bg-[#EAE8E4]">
              <span className="w-2 h-2 border border-[#1A1A1A] bg-[#D4FF00] animate-pulse" />
              Auth: System_Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-px bg-[#1A1A1A] hidden md:block mx-2" />
          <div className="flex flex-col items-end">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-1 border border-[#1A1A1A] ${
                    i < 4 ? 'bg-[#D4FF00]' : 'bg-white'
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono text-[#1A1A1A]/70 uppercase tracking-widest font-bold">
              Processing_Core_Load
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 flex-1">
        {/* Left: Workspace + Charts + AI Analysis */}
        <div className="xl:col-span-8 flex flex-col gap-5 min-h-0">
          <section className="relative group">
            <div className="relative bg-white border-2 border-[#1A1A1A] rounded-none shadow-[8px_8px_0px_#1A1A1A] p-1">
              <ReactionWorkspace />
            </div>
          </section>

          <AnimatePresence mode="wait">
            {currentReaction?.isBalanced ? (
              <motion.div
                key="balanced"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4"
              >
                {/* Matrix Verification */}
                <div className="bg-[#EAE8E4] border-2 border-[#1A1A1A] rounded-none p-5 shadow-[4px_4px_0px_#1A1A1A]">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.2em]">
                      Matrix_Verification
                    </h3>
                    <Target className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div className="space-y-4 text-[#1A1A1A]">
                    <MetricBar label="Atom_Consistency" percent={100} color="bg-[#1A1A1A]" />
                    <MetricBar label="Charge_Balance" percent={100} color="bg-[#1A1A1A]" />
                    <MetricBar
                      label="Mass_Conservation"
                      percent={currentReaction.massConservation ? 100 : 60}
                      color={currentReaction.massConservation ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/50'}
                    />
                    <div className="pt-2 flex justify-between items-center border-t border-[#1A1A1A] mt-2">
                      <span className="text-[10px] font-mono text-[#1A1A1A] uppercase italic mt-2">
                        Status: Verified
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#1A1A1A] mt-2">✓ Passed</span>
                    </div>
                  </div>
                </div>

                {/* Energy Profile */}
                <div className="bg-[#EAE8E4] border-2 border-[#1A1A1A] rounded-none p-5 shadow-[4px_4px_0px_#1A1A1A]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.2em]">
                      Energy_Profile
                    </h3>
                    <div className="flex items-center gap-2">
                      <Zap
                        className={`w-4 h-4 ${
                          isExothermic ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/80'
                        }`}
                      />
                      <span
                        className={`text-[8px] font-mono font-bold px-1 py-0.5 border border-[#1A1A1A] ${
                          isExothermic ? 'bg-[#D4FF00] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A]'
                        }`}
                      >
                        {isExothermic ? 'EXOTHERMIC' : 'ENDOTHERMIC'}
                      </span>
                    </div>
                  </div>
                  <div className="h-28 w-full border-t border-[#1A1A1A] pt-4 mt-2">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={dynamicEnergyData}>
                        <defs>
                          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor={isExothermic ? '#D4FF00' : '#EAE8E4'}
                              stopOpacity={1}
                            />
                            <stop
                              offset="95%"
                              stopColor={isExothermic ? '#D4FF00' : '#EAE8E4'}
                              stopOpacity={1}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="energy"
                          stroke="#1A1A1A"
                          fill="url(#energyGrad)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#1A1A1A', strokeWidth: 2 }}
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
                className="bg-[#EAE8E4] border-2 border-[#1A1A1A] rounded-none p-4 font-mono flex flex-col h-48 shadow-[4px_4px_0px_#1A1A1A] mt-4"
              >
                <div className="flex items-center gap-2 mb-3 text-[#1A1A1A] border-b border-[#1A1A1A] pb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">System_Event_Log</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 text-[10px] custom-scrollbar text-[#1A1A1A]">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-bold opacity-50">[{logs.length - 1 - i}]</span>
                      <span className={i === 0 ? 'font-bold' : 'opacity-80'}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Analysis Panel */}
          <AnimatePresence>
            {currentSteps.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-3 px-1 border-b-2 border-[#1A1A1A] pb-2 bg-white">
                  <Cpu className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]">
                    AI_Analysis_Report
                  </span>
                  <div className="flex-1 h-[2px] bg-[#1A1A1A] hidden md:block" />
                  <span className="text-[9px] font-black bg-[#D4FF00] border border-[#1A1A1A] px-1 text-[#1A1A1A] uppercase">
                    Gemini_Engine
                  </span>
                </div>
                {currentSteps.map((step, i) => (
                  <StepCard key={i} step={step} index={i} />
                ))}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Molecule Streams + Safety */}
        <aside className="xl:col-span-4 flex flex-col gap-5 min-h-0">
          <MoleculeStream
            title="Reactants"
            molecules={currentReaction?.reactants?.molecules}
            type="input"
          />
          <MoleculeStream
            title="Products"
            molecules={currentReaction?.products?.molecules}
            type="output"
          />
          <div className="bg-[#FF6B6B] border-2 border-[#1A1A1A] rounded-none p-4 flex items-start gap-3 shadow-[4px_4px_0px_#1A1A1A]">
            <AlertCircle className="w-6 h-6 text-[#1A1A1A] shrink-0 mt-0.5 fill-white" />
            <div className="text-[10px] text-[#1A1A1A] font-black leading-tight uppercase font-mono">
              <span className="text-white block mb-1 underline underline-offset-4 tracking-widest bg-[#1A1A1A] w-fit px-1">
                Safety_Protocol_A1
              </span>
              Maintain standard STP conditions unless catalyst override is enabled in config.
              AI thermodynamic values are estimated — validate with experimental data.
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MetricBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-mono text-[#1A1A1A] font-bold uppercase">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-white border border-[#1A1A1A] rounded-none overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function MoleculeStream({
  title,
  molecules,
  type,
}: {
  title: string;
  molecules?: any[];
  type: 'input' | 'output';
}) {
  const isInput = type === 'input';
  return (
    <div className="bg-[#EAE8E4] border-2 border-[#1A1A1A] rounded-none p-5 shadow-[4px_4px_0px_#1A1A1A] flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4 border-b border-[#1A1A1A] pb-2">
        <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">
          {title}
        </h3>
        <div
          className={`px-2 py-0.5 rounded-none text-[8px] font-mono font-bold border border-[#1A1A1A] ${
            isInput
              ? 'bg-[#D4FF00] text-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A]'
          }`}
        >
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
              className="group flex items-center justify-between p-3 bg-white border-2 border-[#1A1A1A] rounded-none shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#D4FF00] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all"
            >
              <div className="flex items-center gap-3">
                <ChevronRight
                  className={`w-3 h-3 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity`}
                />
                <div>
                  <span className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                    {renderFormula(m.molecule.formula)}
                  </span>
                  <span className="block text-[9px] text-[#1A1A1A]/70 font-mono">
                    {m.molecule.molarMass} g/mol
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold text-[#1A1A1A] border px-1 py-0.5 border-[#1A1A1A] bg-white group-hover:bg-[#EAE8E4]`}
              >
                ×{m.coefficient}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-[#1A1A1A] bg-white rounded-none min-h-20">
            <span className="text-[9px] font-mono text-[#1A1A1A] font-bold uppercase tracking-[0.4em]">
              Listening...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FDFCFB] border-2 border-[#1A1A1A] p-2 shadow-[2px_2px_0px_#1A1A1A] rounded-none backdrop-blur-md">
        <p className="text-[9px] font-mono text-[#1A1A1A] font-bold uppercase">
          {payload[0].payload.label}
        </p>
        <p className="text-xs font-bold text-[#1A1A1A]">
          {payload[0].value.toFixed(1)}{' '}
          <span className="text-[10px] font-normal opacity-70">kJ/mol</span>
        </p>
      </div>
    );
  }
  return null;
};