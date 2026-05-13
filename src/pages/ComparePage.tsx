import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOWDAStore } from '../store';
import { ReactionSolver } from '../engine/solver';
import { renderFormula } from '../utils/renderFormula';
import { 
  ArrowLeftRight, Activity, Zap, Flame, Snowflake, 
  Database, Check, Scale, AlertCircle 
} from 'lucide-react';

// --- Types ---
interface ThermoData {
  enthalpy?: number;
  entropy?: number;
  gibbs?: number;
  reactionType?: string;
}

interface ReactionData extends ThermoData {
  isBalanced: boolean;
  reactants: { molecules: any[] };
  products: { molecules: any[] };
}

export function ComparePage() {
  const { reactionLog } = useOWDAStore();
  const [reac1, setReac1] = useState('');
  const [reac2, setReac2] = useState('');

  //
  const historyExpressions = useMemo(() => {
    const balanced = reactionLog.filter(log => log.isBalanced).map(log => log.expression);
    return Array.from(new Set(balanced)).slice(0, 5);
  }, [reactionLog]);

  //
  const resolveData = (expr: string): ReactionData | null => {
    if (!expr.trim()) return null;
    const balanced = ReactionSolver.balance(expr);
    if (!balanced?.isBalanced) return null;

    const thermo = reactionLog.find(log => log.expression === expr);
    return {
      ...balanced,
      enthalpy: thermo?.enthalpy ?? balanced.enthalpy,
      entropy: thermo?.entropy ?? balanced.entropy,
      gibbs: thermo?.gibbs ?? balanced.gibbs,
      reactionType: thermo?.reactionType ?? balanced.type,
    };
  };

  const data1 = useMemo(() => resolveData(reac1), [reac1, reactionLog]);
  const data2 = useMemo(() => resolveData(reac2), [reac2, reactionLog]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans p-4"
    >
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-6 bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A]">
        <div className="flex items-center gap-5">
          <div className="bg-[#ff6b6b] p-3 border-2 border-[#1A1A1A] rotate-3">
            <ArrowLeftRight className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-[#1A1A1A] uppercase italic flex items-center gap-2">
              Side-to-Side <span className="bg-[#D4FF00] px-2 border-2 border-[#1A1A1A] not-italic">Compare</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5">V{import.meta.env.COMPARE_VERSION || '1.0.0'}</span>
               <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">Cross-reference thermodynamic stability profiles</span>
            </div>
          </div>
        </div>
        
        {/* Comparison Badge */}
        {data1 && data2 && (
          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2 font-black text-xs uppercase tracking-widest animate-pulse">
            <Scale className="w-4 h-4 text-[#D4FF00]" />
            Live Comparison Active
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InputSlot 
          label="Reaction A" 
          val={reac1} 
          setVal={setReac1} 
          data={data1} 
          history={historyExpressions} 
          accentColor="#D4FF00" 
        />
        <InputSlot 
          label="Reaction B" 
          val={reac2} 
          setVal={setReac2} 
          data={data2} 
          history={historyExpressions} 
          accentColor="#ff6b6b" 
        />
      </div>

      {/* COMPARISON DELTA PANEL (Only shows when both have data) */}
      <AnimatePresence>
        {data1 && data2 && (
          <ComparisonDelta d1={data1} d2={data2} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Sub-components for Cleanliness ---

function InputSlot({ label, val, setVal, data, history, accentColor }: any) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-4">
        <label className="text-[10px] font-black uppercase tracking-widest mb-2 block text-[#1A1A1A]">
          Input {label}
        </label>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="e.g., C3H8 + O2 = CO2 + H2O"
          className="w-full bg-[#EAE8E4] px-4 py-4 font-mono text-base border-4 border-[#1A1A1A] focus:outline-none focus:ring-4 focus:ring-opacity-50 transition-all"
          style={{ '--tw-ring-color': accentColor } as any}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {history.map((h: string, i: number) => (
            <button 
              key={i} 
              onClick={() => setVal(h)}
              className="text-[9px] font-mono border-2 border-[#1A1A1A] px-2 py-1 bg-white hover:invert transition-all"
            >
              {h}
            </button>
          ))}
        </div>
      </div>
      <ReactionDisplay data={data} slotName={label} />
    </div>
  );
}

function ReactionDisplay({ data, slotName }: { data: ReactionData | null; slotName: string }) {
  if (!data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed border-[#1A1A1A]/20 bg-[#EAE8E4]/50">
        <Database className="w-10 h-10 text-[#1A1A1A]/20 mb-2" />
        <p className="text-[10px] font-black uppercase tracking-tighter text-[#1A1A1A]/40">Awaiting Valid Sequence</p>
      </div>
    );
  }

  return (
    <div className="border-4 border-[#1A1A1A] bg-white shadow-[8px_8px_0px_#1A1A1A] overflow-hidden">
      <div className="p-3 bg-[#1A1A1A] text-white flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{slotName}</span>
        <span className="text-[9px] font-mono bg-white text-[#1A1A1A] px-2 py-0.5">{data.reactionType || 'Unknown Type'}</span>
      </div>
      
      <div className="p-6 bg-[#EAE8E4]">
        <div className="mb-6 bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_#1A1A1A]">
          <div className="flex flex-wrap items-center gap-2 font-mono text-lg font-bold">
            {data.reactants.molecules.map((m, i) => (
              <span key={i}>
                {m.coefficient > 1 && <span className="text-red-500">{m.coefficient}</span>}
                <span dangerouslySetInnerHTML={{ __html: renderFormula(m.molecule.formula) }} />
                {i < data.reactants.molecules.length - 1 && ' + '}
              </span>
            ))}
            <span className="text-2xl px-2">→</span>
            {data.products.molecules.map((m, i) => (
              <span key={i}>
                {m.coefficient > 1 && <span className="text-blue-600">{m.coefficient}</span>}
                <span dangerouslySetInnerHTML={{ __html: renderFormula(m.molecule.formula) }} />
                {i < data.products.molecules.length - 1 && ' + '}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricBox label="Enthalpy" value={data.enthalpy} unit="kJ/mol" icon={data.enthalpy && data.enthalpy < 0 ? Flame : Snowflake} />
          <MetricBox label="Entropy" value={data.entropy} unit="J/mol·K" icon={Activity} />
          <div className="col-span-2">
            <MetricBox 
              label="Gibbs Free Energy" 
              value={data.gibbs} 
              unit="kJ/mol" 
              icon={Zap} 
              extra={data.gibbs !== undefined ? (data.gibbs < 0 ? 'Spontaneous' : 'Non-Spontaneous') : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, unit, icon: Icon, extra }: any) {
  return (
    <div className="p-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="font-mono font-black text-sm">{value ?? '—'} <span className="text-[9px]">{unit}</span></span>
        {extra && (
          <span className={`text-[8px] px-1 border border-[#1A1A1A] font-bold uppercase ${extra === 'Spontaneous' ? 'bg-[#D4FF00]' : 'bg-red-100'}`}>
            {extra}
          </span>
        )}
      </div>
    </div>
  );
}

function ComparisonDelta({ d1, d2 }: { d1: ReactionData, d2: ReactionData }) {
  const gDiff = (d1.gibbs ?? 0) - (d2.gibbs ?? 0);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1A1A1A] text-white p-6 border-4 border-[#D4FF00] shadow-[12px_12px_0px_#1A1A1A]"
    >
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="text-[#D4FF00]" />
        <h3 className="font-black uppercase tracking-widest text-lg italic">Thermodynamic Variance</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-l-2 border-[#D4FF00] pl-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Stability Lead</p>
          <p className="text-xl font-black">
            {gDiff < 0 ? 'Reaction A' : 'Reaction B'} is more stable
          </p>
        </div>
        <div className="border-l-2 border-[#D4FF00] pl-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Energy Gap (ΔG)</p>
          <p className="text-xl font-mono font-black text-[#D4FF00]">
            {Math.abs(gDiff).toFixed(2)} kJ/mol
          </p>
        </div>
        <div className="border-l-2 border-[#D4FF00] pl-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Efficiency Ratio</p>
          <p className="text-xl font-black">
            {(Math.abs((d1.enthalpy || 1) / (d2.enthalpy || 1))).toFixed(2)}x
          </p>
        </div>
      </div>
    </motion.div>
  );
}