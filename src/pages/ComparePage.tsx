import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react"; // Note: adjusted import to standard framer-motion
import { useReactionLog } from "../store";
import { ReactionSolver } from "../engine/solver";
import { renderFormulaHTML } from "../utils/renderFormula";
import {
  Activity,
  Flame,
  Database,
  Scale,
  Trophy,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// --- Types ---
interface ReactionData {
  isBalanced: boolean;
  reactants: { molecules: any[] };
  products: { molecules: any[] };
  enthalpy?: number;
  entropy?: number;
  gibbs?: number;
  reactionType?: string;
}

export function ComparePage() {
  const reactionLog = useReactionLog();
  const [reac1, setReac1] = useState("");
  const [reac2, setReac2] = useState("");

  const historyExpressions = useMemo(() => {
    const balanced = reactionLog
      .filter((log) => log.isBalanced)
      .map((log) => log.expression);
    return Array.from(new Set(balanced)).slice(0, 5);
  }, [reactionLog]);

  const resolveData = (expr: string): ReactionData | undefined => {
    if (!expr.trim()) return undefined;
    const balanced = ReactionSolver.balance(expr);
    if (!balanced?.isBalanced) return undefined;

    const thermo = reactionLog.find((log) => log.expression === expr);

    // Applying Anti-Null Policy: using undefined for optionality
    return {
      ...balanced,
      enthalpy: thermo?.enthalpy ?? balanced.enthalpy ?? undefined,
      entropy: thermo?.entropy ?? balanced.entropy ?? undefined,
      gibbs: thermo?.gibbs ?? balanced.gibbs ?? undefined,
      reactionType: thermo?.reactionType ?? balanced.type ?? "Unknown",
    };
  };

  const data1 = useMemo(() => resolveData(reac1), [reac1, reactionLog]);
  const data2 = useMemo(() => resolveData(reac2), [reac2, reactionLog]);

  const handleSwap = () => {
    setReac1(reac2);
    setReac2(reac1);
  };

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
            <Scale className="w-8 h-8 text-[#D4FF00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none tracking-tighter text-[#1A1A1A]">
              Compare -
              <span className="bg-white px-1 border-2 border-[#1A1A1A] not-italic text-[#1A1A1A]">
                OS
              </span>
            </h1>
            <p className="text-[10px] font-mono font-black mt-1 uppercase opacity-70 text-[#1A1A1A]">
              OWDA_COMPARE_V{process.env.COMPARE_VERSION}
            </p>
          </div>
        </div>

        <div className="md:col-span-5 p-6 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black tracking-widest uppercase">
              Comparison_Load_Status
            </span>
            <span className="font-mono text-xs font-bold">
              {data1 && data2 ? "READY" : "WAITING"}
            </span>
          </div>
          <div className="h-4 w-full bg-[#EAE8E4] border-2 border-[#1A1A1A] p-0.5">
            <motion.div
              animate={{
                width: data1 && data2 ? "100%" : data1 || data2 ? "50%" : "0%",
              }}
              className={`h-full ${data1 && data2 ? "bg-[#1A1A1A]" : "bg-[#FF6B6B]"}`}
            />
          </div>
        </div>

        <div className="md:col-span-3 p-6 bg-[#1A1A1A] flex items-center justify-center">
          <button
            disabled={!reac1 && !reac2}
            onClick={handleSwap}
            className="flex items-center gap-3 bg-[#D4FF00] text-[#1A1A1A] px-6 py-3 font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#FF6B6B] active:translate-y-1 active:shadow-none transition-all disabled:opacity-20 grayscale disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={14}
              className={data1 && data2 ? "animate-spin" : ""}
            />{" "}
            Swap_Vectors
          </button>
        </div>
      </header>

      {/* ─── DELTA ANALYSIS PIN ─── */}
      <AnimatePresence>
        {data1 && data2 && <ComparisonDelta d1={data1} d2={data2} />}
      </AnimatePresence>

      {/* ─── COMPARISON GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <InputSlot
          label="Alpha"
          val={reac1}
          setVal={setReac1}
          data={data1}
          history={historyExpressions}
          accent="#D4FF00"
          dir="left"
        />
        <InputSlot
          label="Beta"
          val={reac2}
          setVal={setReac2}
          data={data2}
          history={historyExpressions}
          accent="#FF6B6B"
          dir="right"
        />
      </div>
    </motion.div>
  );
}

// --- Sub-components ---

function InputSlot({ label, val, setVal, data, history, accent, dir }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border-4 border-[#1A1A1A] p-6 shadow-[8px_8px_0px_#1A1A1A] relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]">
            Matrix_Slot <span className="opacity-30">[{label}]</span>
          </label>
          {dir === "left" ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </div>

        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Input sequence..."
          className="w-full bg-[#F5F5F5] px-5 py-5 font-mono text-xl border-b-4 border-[#1A1A1A] focus:outline-none focus:bg-white transition-all uppercase placeholder:opacity-20"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {history.map((h: string, i: number) => (
            <button
              key={i}
              onClick={() => setVal(h)}
              className="text-[8px] font-black font-mono border-2 border-[#1A1A1A] px-2 py-1 bg-white hover:bg-[#1A1A1A] hover:text-white transition-all uppercase"
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <ReactionDisplay data={data} slotLabel={label} accent={accent} />
    </div>
  );
}

function ReactionDisplay({ data, slotLabel, accent }: any) {
  if (!data)
    return (
      <div className="h-115 flex flex-col items-center justify-center border-4 border-dashed border-[#1A1A1A]/20 bg-[#F9F9F9] grayscale">
        <Database className="w-12 h-12 text-[#1A1A1A]/10 mb-4" />
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#1A1A1A]/20">
          Awaiting_Input_{slotLabel}
        </p>
      </div>
    );

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] overflow-hidden flex flex-col"
    >
      <div className="p-4 bg-[#1A1A1A] text-white flex justify-between items-center border-b-4 border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center text-[10px] font-black bg-[#D4FF00] text-[#1A1A1A]">
            {slotLabel[0]}
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 italic">
            {data.reactionType}
          </span>
        </div>
        <div className="h-1 w-12 bg-[#D4FF00]/30 rounded-full" />
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div
          className="text-2xl font-mono font-black border-l-12 px-6 py-6 bg-[#F9F9F9]"
          style={{ borderLeftColor: accent }}
        >
          <FormulaRenderer molecules={data.reactants.molecules} />
          <span className="mx-3 opacity-20">→</span>
          <FormulaRenderer molecules={data.products.molecules} isProduct />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricBlock
            label="Enthalpy"
            value={data.enthalpy}
            unit="kJ/mol"
            icon={Flame}
          />
          <MetricBlock
            label="Entropy"
            value={data.entropy}
            unit="J/mol·K"
            icon={Activity}
          />
          <div className="col-span-2">
            <StabilityBlock value={data.gibbs} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FormulaRenderer({ molecules, isProduct }: any) {
  return (
    <>
      {molecules.map((m: any, i: number) => (
        <span key={i}>
          {m.coefficient > 1 && (
            <span className={isProduct ? "text-blue-600" : "text-red-500"}>
              {m.coefficient}
            </span>
          )}
          <span
            dangerouslySetInnerHTML={{
              __html: renderFormulaHTML(m.molecule.formula),
            }}
          />
          {i < molecules.length - 1 && (
            <span className="opacity-20 mx-1">+</span>
          )}
        </span>
      ))}
    </>
  );
}

function MetricBlock({ label, value, unit, icon: Icon }: any) {
  return (
    <div className="p-4 bg-white border-2 border-[#1A1A1A] group hover:bg-[#1A1A1A] hover:text-white transition-all">
      <div className="flex items-center gap-2 mb-2 opacity-40 group-hover:opacity-100">
        <Icon size={12} className="group-hover:text-[#D4FF00]" />
        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="text-xl font-mono font-black">
        {value?.toFixed(1) ?? "—"}{" "}
        <span className="text-[9px] font-sans opacity-40 group-hover:text-[#D4FF00]">
          {" "}
          {unit}
        </span>
      </div>
    </div>
  );
}

function StabilityBlock({ value }: { value?: number }) {
  const isStable = value !== undefined && value < 0;
  const percent =
    value !== undefined
      ? Math.max(0, Math.min(100, ((value + 250) / 500) * 100))
      : 50;

  return (
    <div className="p-6 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-[inset_0px_0px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4FF00]">
          STABILITY_VECTOR (ΔG)
        </span>
        <span
          className={`text-[8px] px-2 py-0.5 font-black uppercase border-2 ${isStable ? "border-[#D4FF00] text-[#D4FF00]" : "border-red-500 text-red-500"}`}
        >
          {isStable ? "SPONTANEOUS" : "NON_SPONTANEOUS"}
        </span>
      </div>
      <div className="text-4xl font-mono font-black mb-6 italic tracking-tighter">
        {value?.toFixed(2) ?? "0.00"}{" "}
        <span className="text-[10px] opacity-40 not-italic">kJ/mol</span>
      </div>
      <div className="h-3 w-full bg-white/5 border border-white/10 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${isStable ? "bg-[#D4FF00]" : "bg-red-500"}`}
        />
        <div className="absolute top-1/2 left-1/2 h-6 w-0.5 bg-white -translate-y-1/2 shadow-[0_0_10px_white]" />
      </div>
      <div className="flex justify-between mt-3 text-[7px] font-black uppercase opacity-30 tracking-[0.2em]">
        <span>Highly_Stable</span>
        <span>Equilibrium</span>
        <span>High_Energy_Input</span>
      </div>
    </div>
  );
}

function ComparisonDelta({ d1, d2 }: { d1: ReactionData; d2: ReactionData }) {
  const g1 = d1.gibbs ?? 0;
  const g2 = d2.gibbs ?? 0;
  const gDiff = g1 - g2;
  const aWins = g1 < g2;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="bg-[#D4FF00] text-[#1A1A1A] p-8 border-4 border-[#1A1A1A] shadow-[12px_12px_0px_#1A1A1A] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
        <Scale size={140} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={18} className="text-[#1A1A1A]" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">
              Dominant_Pathway
            </h3>
          </div>
          <p className="text-6xl font-black italic tracking-tighter uppercase leading-none">
            {aWins ? "Alpha" : "Beta"}{" "}
            <span className="text-2xl not-italic opacity-30">#01</span>
          </p>
          <p className="mt-4 text-[10px] font-black uppercase leading-tight max-w-xs opacity-70">
            Vector {aWins ? "Alpha" : "Beta"} displays higher thermodynamic
            favorability. Estimated kinetic advantage:{" "}
            {Math.abs((gDiff / (g1 || 1)) * 100).toFixed(1)}%.
          </p>
        </div>

        <div className="md:col-span-4 border-l-4 border-[#1A1A1A] pl-8 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
            Delta_Variance (ΔG)
          </span>
          <div className="text-5xl font-mono font-black tracking-tighter">
            {Math.abs(gDiff).toFixed(2)}
            <span className="text-xs ml-2 opacity-50 uppercase font-sans">
              kJ/mol
            </span>
          </div>
        </div>

        <div className="md:col-span-3 bg-[#1A1A1A] text-[#D4FF00] p-6 text-center border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#FFF]">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] block mb-2 opacity-50">
            Efficiency_Gap
          </span>
          <div className="text-3xl font-black italic">
            {Math.abs((gDiff / (g1 || 1)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}
