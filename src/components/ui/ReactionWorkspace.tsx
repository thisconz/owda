// D:\Dev\OWDA\src\components\ReactionWorkspace.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Terminal, Activity, Cpu, ChevronDown, Filter, Hexagon, Sparkles,
  ArrowRightLeft, FlaskConical, RotateCcw, Table2, Bot, BotOff,
  Dna, Brain, Factory, Atom, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOWDAActions, useOWDAStore, useSolverSettings } from "../../store";
import { ReactionSolver }  from "../../engine/solver";
import { AIService }       from "../../services/aiService";
import { ElementPicker }   from "./ElementPicker";
import type { AIModelId }  from "../../config/models";
import type { ChemicalReaction, ExplanationStep, ReactionType } from "@/src/types";

// ---------------------------------------------------------------------------
// Helpers — Formats chemical alphanumeric tokens to structural sub-scripts
// ---------------------------------------------------------------------------
function formatSubscripts(formula: string): React.ReactNode {
  const subscriptMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
  };
  
  return formula.split(/([0-9]+)/).map((segment, idx) => {
    if (/^[0-9]+$/.test(segment)) {
      const converted = segment.split("").map(char => subscriptMap[char] ?? char).join("");
      return <sub key={idx} className="bottom-[-0.2em] text-[0.75em] font-bold tracking-normal">{converted}</sub>;
    }
    return <span key={idx}>{segment}</span>;
  });
}

// ---------------------------------------------------------------------------
// Reaction catalog — defined outside component to avoid reallocation
// ---------------------------------------------------------------------------
const REACTION_CATALOG = [
  {
    category: "Basic Reactions",
    icon: <Filter className="w-4 h-4" />,
    items: [
      { label: "Haber Process (Ammonia)",  formula: "N2 + H2 -> NH3",       difficulty: "L1" },
      { label: "Methane Combustion",        formula: "CH4 + O2 -> CO2 + H2O",   difficulty: "L2" },
      { label: "Water Formation",           formula: "H2 + O2 -> H2O",           difficulty: "L1" },
      { label: "Iron Rusting",              formula: "Fe + O2 -> Fe2O3",          difficulty: "L2" },
      { label: "Photosynthesis",            formula: "CO2 + H2O -> C6H12O6 + O2", difficulty: "L2" },
      { label: "Cellular Respiration",      formula: "C6H12O6 + O2 -> CO2 + H2O", difficulty: "L2" },
    ],
  },
  {
    category: "Acid-Base",
    icon: <FlaskConical className="w-4 h-4" />,
    items: [
      { label: "Neutralisation",                formula: "HCl + NaOH -> NaCl + H2O",            difficulty: "L1" },
      { label: "Sulfuric Acid Neutralisation",   formula: "H2SO4 + NaOH -> Na2SO4 + H2O",      difficulty: "L2" },
      { label: "Carbonate + Acid",               formula: "CaCO3 + HCl -> CaCl2 + H2O + CO2",  difficulty: "L2" },
      { label: "Ammonium Sulfate Formation",     formula: "NH3 + H2SO4 -> (NH4)2SO4",            difficulty: "L3" },
      { label: "Acetic Acid Neutralisation",     formula: "CH3COOH + NaOH -> CH3COONa + H2O",  difficulty: "L2" },
    ],
  },
  {
    category: "Redox Reactions",
    icon: <Zap className="w-4 h-4" />,
    items: [
      { label: "Thermite Reaction",              formula: "Fe2O3 + Al -> Fe + Al2O3",                          difficulty: "L4" },
      { label: "Copper Oxidation",               formula: "Cu + O2 -> CuO",                                    difficulty: "L2" },
      { label: "Zinc + Copper Sulfate",          formula: "Zn + CuSO4 -> ZnSO4 + Cu",                         difficulty: "L2" },
      { label: "Potassium Permanganate + HCl",   formula: "KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O",          difficulty: "L5" },
    ],
  },
  {
    category: "Organic Reactions",
    icon: <Atom className="w-4 h-4" />,
    items: [
      { label: "Esterification",          formula: "CH3COOH + C2H5OH -> CH3COOC2H5 + H2O", difficulty: "L3" },
      { label: "Hydrogenation of Ethene", formula: "C2H4 + H2 -> C2H6",                     difficulty: "L2" },
      { label: "Fermentation",            formula: "C6H12O6 -> C2H5OH + CO2",               difficulty: "L2" },
    ],
  },
  {
    category: "Aromatic Chemistry",
    icon: <Hexagon className="w-4 h-4" />,
    items: [
      { label: "EAS Nitration",            formula: "C6H6 + HNO3 -> C6H5NO2 + H2O",  difficulty: "L3" },
      { label: "Friedel-Crafts Alkylation",formula: "C6H6 + CH3Cl -> C6H5CH3 + HCl", difficulty: "L4" },
      { label: "Benzene Combustion",        formula: "C6H6 + O2 -> CO2 + H2O",        difficulty: "L3" },
    ],
  },
  {
    category: "Industrial",
    icon: <Factory className="w-4 h-4" />,
    items: [
      { label: "Contact Process",    formula: "SO2 + O2 -> SO3",       difficulty: "L3" },
      { label: "Ostwald Process",    formula: "NH3 + O2 -> NO + H2O",  difficulty: "L4" },
      { label: "Lime Kiln",          formula: "CaCO3 -> CaO + CO2",    difficulty: "L2" },
      { label: "Electrolysis Water", formula: "H2O -> H2 + O2",        difficulty: "L3" },
    ],
  },
  {
    category: "Named Reactions",
    icon: <Brain className="w-4 h-4" />,
    items: [
      { label: "Grignard Reaction",   formula: "RMgX + Carbonyl -> Alcohol",          difficulty: "L5" },
      { label: "Aldol Condensation",  formula: "Aldehyde + Ketone -> β-Hydroxy",      difficulty: "L5" },
      { label: "Diels-Alder",         formula: "Diene + Dienophile -> Cyclohexene",   difficulty: "L5" },
    ],
  },
  {
    category: "Biochemistry",
    icon: <Dna className="w-4 h-4" />,
    items: [
      { label: "ATP Hydrolysis",           formula: "ATP + H2O -> ADP + Pi",     difficulty: "L3" },
      { label: "Lactic Acid Fermentation", formula: "C6H12O6 -> C3H6O3",        difficulty: "L3" },
      { label: "Protein Hydrolysis",       formula: "Protein + H2O -> Amino Acids", difficulty: "L4" },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Main Component View
// ---------------------------------------------------------------------------
export const ReactionWorkspace: React.FC = () => {
  const inputExpression = useOWDAStore((s) => s.inputExpression);
  const isProcessing    = useOWDAStore((s) => s.isProcessing);
  const currentReaction = useOWDAStore((s) => s.currentReaction);
  const settings        = useSolverSettings();
  const actions         = useOWDAActions();

  const {
    setInputExpression, setReaction, setProcessing,
    addToHistory, setError, clearError, setSteps, appendReactionLog,
  } = actions;

  const [localInput,        setLocalInput]        = useState<string>(inputExpression);
  const [expandedCategory,  setExpandedCategory]  = useState<string | null>(null);
  const [showPicker,        setShowPicker]        = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLocalInput(inputExpression);
  }, [inputExpression]);

  useEffect(() => () => {
    if (abortRef.current !== null) {
      abortRef.current.abort();
    }
  }, []);

  const handleSolve = useCallback(async () => {
    const trimmed = localInput.trim();
    if (trimmed === "" || isProcessing) return;

    if (abortRef.current !== null) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setProcessing(true);
    clearError();
    setInputExpression(trimmed);
    addToHistory(trimmed);

    try {
      const balanced = ReactionSolver.balance(trimmed);
      let aiResult;
      
      if (settings.enableAI) {
        aiResult = await AIService.explainReaction(
          trimmed,
          settings.AIModel as AIModelId,
          controller.signal,
        );
      } else {
        aiResult = AIService.disabledResult();
      }

      if (controller.signal.aborted) return;

      const { thermodynamics, steps } = aiResult;

      const finalReaction: ChemicalReaction = balanced.isBalanced
        ? {
            ...balanced,
            isBalanced: true,
            enthalpy: thermodynamics.enthalpy,
            entropy:  thermodynamics.entropy,
            gibbs:    thermodynamics.gibbs,
            type:     thermodynamics.type as ReactionType,
          }
        : balanced;

      setReaction(finalReaction);
      setSteps(steps as ExplanationStep[]);

      appendReactionLog({
        expression:   trimmed,
        timestamp:    Date.now(),
        isBalanced:   balanced.isBalanced,
        reactionType: thermodynamics.type,
        enthalpy:     thermodynamics.enthalpy,
        isExothermic:
          thermodynamics.enthalpy !== undefined
            ? thermodynamics.enthalpy < 0
            : undefined,
      });
    } catch (e: unknown) {
      if (controller.signal.aborted) return;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError({ message: msg, code: "ENGINE_FAULT" });
    } finally {
      if (!controller.signal.aborted) setProcessing(false);
    }
  }, [
    localInput, isProcessing, settings,
    setProcessing, clearError, setInputExpression, addToHistory,
    setReaction, setSteps, appendReactionLog, setError,
  ]);

  const handleClear = useCallback(() => {
    setLocalInput("");
    setInputExpression("");
    setReaction(undefined);
    setSteps([]);
    clearError();
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [setInputExpression, setReaction, setSteps, clearError]);

  const handlePickerInsert = useCallback((text: string) => {
    const el = inputRef.current;

    if (text === "\b") {
      if (el !== null) {
        const start = el.selectionStart !== null ? el.selectionStart : localInput.length;
        if (start > 0) {
          const newVal = localInput.slice(0, start - 1) + localInput.slice(start);
          setLocalInput(newVal);
          requestAnimationFrame(() => el.setSelectionRange(start - 1, start - 1));
        }
      } else {
        setLocalInput((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (el !== null) {
      const start = el.selectionStart !== null ? el.selectionStart : localInput.length;
      const end   = el.selectionEnd !== null ? el.selectionEnd : localInput.length;
      const newVal = localInput.slice(0, start) + text + localInput.slice(end);
      setLocalInput(newVal);
      const nextPos = start + text.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextPos, nextPos);
      });
    } else {
      setLocalInput((prev) => prev + text);
    }
  }, [localInput]);

  return (
    <div className="flex flex-col gap-5 p-5 bg-[#FDFCFB] relative min-w-0 min-h-0">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[#1A1A1A] bg-[#EAE8E4]">
            <Terminal className="text-[#1A1A1A] w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]">
              Core_Input_Module
            </h2>
            <p className="text-[9px] font-mono text-[#1A1A1A]/60 font-bold uppercase mt-1">
              {isProcessing ? "System Computing..." : "Awaiting Synthesis String"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 border text-[9px] font-mono font-bold ${
            settings.enableAI
              ? "border-[#1A1A1A] text-[#1A1A1A] bg-[#D4FF00]"
              : "border-[#1A1A1A] text-[#1A1A1A]/50 bg-[#EAE8E4]"
          }`}>
            {settings.enableAI ? <Bot className="w-3 h-3" /> : <BotOff className="w-3 h-3" />}
            {settings.enableAI ? "AI ON" : "AI OFF"} — {settings.AIModel.toUpperCase()}
          </div>
          <div className={`px-3 py-1 border text-[9px] font-mono font-bold transition-colors ${
            isProcessing
              ? "border-[#1A1A1A] text-white bg-[#1A1A1A] animate-pulse"
              : "border-[#1A1A1A] text-[#1A1A1A] bg-white"
          }`}>
            {isProcessing ? "COMPUTING" : "READY"}
          </div>
        </div>
      </div>

      {/* Control Input Element Bar */}
      <div className="relative flex items-center bg-white border-2 border-[#1A1A1A] overflow-hidden focus-within:shadow-[4px_4px_0px_#1A1A1A] transition-all">
        <div className="pl-5 shrink-0">
          <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder="e.g.  N2 + H2 -> NH3"
          className="w-full bg-transparent px-4 py-5 text-lg md:text-2xl text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none font-mono font-bold"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSolve();
            if (e.key === "Escape") setShowPicker(false);
          }}
          aria-label="Chemical reaction input"
        />
        <div className="flex items-center gap-1.5 pr-2 shrink-0">
          <button
            onClick={() => setShowPicker((p) => !p)}
            title="Element Picker"
            aria-pressed={showPicker}
            className={`p-2.5 border border-[#1A1A1A] transition-all ${
              showPicker
                ? "bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#1A1A1A]"
                : "bg-white text-[#1A1A1A] hover:bg-[#EAE8E4]"
            }`}
          >
            <Table2 className="w-4 h-4" />
          </button>
          {localInput !== "" && (
            <button
              onClick={handleClear}
              title="Clear"
              className="p-2 border border-transparent text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors bg-[#EAE8E4]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSolve}
            disabled={isProcessing || localInput.trim() === ""}
            className="px-6 py-3 ml-2 border border-[#1A1A1A] bg-[#D4FF00] hover:bg-[#1A1A1A] disabled:opacity-50 disabled:bg-[#EAE8E4] disabled:text-[#1A1A1A]/50 hover:text-white text-[#1A1A1A] transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest active:translate-y-1"
          >
            {isProcessing ? <Activity className="animate-spin w-3 h-3" /> : <Cpu className="w-3 h-3" />}
            {isProcessing ? "Solving" : "Execute"}
          </button>
        </div>
      </div>

      <ElementPicker isOpen={showPicker} onClose={() => setShowPicker(false)} onInsert={handlePickerInsert} />

      {/* Reaction Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REACTION_CATALOG.map((cat) => (
          <div key={cat.category} className="relative">
            <button
              onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
              className={`w-full flex items-center justify-between p-3 border-2 border-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest transition-all ${
                expandedCategory === cat.category
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#EAE8E4] text-[#1A1A1A] hover:bg-white shadow-[2px_2px_0px_#1A1A1A]"
              }`}
            >
              <div className="flex items-center gap-2">
                {cat.icon}
                {cat.category}
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedCategory === cat.category ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {expandedCategory === cat.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 z-60 bg-[#FDFCFB] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-2 flex flex-col gap-1"
                >
                  {cat.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLocalInput(item.formula);
                        setExpandedCategory(null);
                        if (inputRef.current !== null) {
                          inputRef.current.focus();
                        }
                      }}
                      className="flex flex-col p-2.5 border border-transparent hover:border-[#1A1A1A] hover:bg-[#D4FF00] transition-all text-left group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-mono text-[#1A1A1A] font-bold">{item.label}</span>
                        <span className="text-[7px] px-1 border border-[#1A1A1A] bg-white font-bold">{item.difficulty}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#1A1A1A]">{formatSubscripts(item.formula)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Solution Manifest Section */}
      <AnimatePresence mode="wait">
        {currentReaction !== undefined && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 bg-white border-2 border-[#1A1A1A] p-6 relative overflow-hidden shadow-[4px_4px_0px_#1A1A1A]"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4 mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]">
                Solution_Manifest
              </h3>
              <span className={`text-[9px] font-mono px-2 py-0.5 border-2 border-[#1A1A1A] font-bold text-[#1A1A1A] ${
                currentReaction.isBalanced ? "bg-[#D4FF00]" : "bg-[#ff6b6b]"
              }`}>
                {currentReaction.isBalanced ? "✓ BALANCED" : "✗ UNBALANCED"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-8 py-4">
              <div className="flex flex-wrap items-center justify-center gap-4 text-2xl md:text-3xl font-black tracking-tighter text-[#1A1A1A]">
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {currentReaction.reactants.molecules.map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        {m.coefficient > 1 && (
                          <span className="text-[#1A1A1A] font-black text-xl mt-1">{m.coefficient}</span>
                        )}
                        <span className="font-mono bg-white px-3 py-1 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                          {formatSubscripts(m.molecule.formula)}
                        </span>
                      </div>
                      {i < currentReaction.reactants.molecules.length - 1 && (
                        <span className="text-xl font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <ArrowRightLeft className="w-8 h-8 mx-2 shrink-0" />

                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {currentReaction.products.molecules.map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        {m.coefficient > 1 && (
                          <span className="text-[#1A1A1A] font-black text-xl mt-1">{m.coefficient}</span>
                        )}
                        <span className="font-mono bg-white px-3 py-1 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                          {formatSubscripts(m.molecule.formula)}
                        </span>
                      </div>
                      {i < currentReaction.products.molecules.length - 1 && (
                        <span className="text-xl font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {currentReaction.isBalanced && (
                <div className="w-full grid grid-cols-3 gap-4 border-t border-[#1A1A1A] pt-6 min-w-0">
                  <ThermMetric
                    label="Enthalpy ΔH"
                    value={currentReaction.enthalpy !== undefined ? `${currentReaction.enthalpy} kJ/mol` : "Pending AI…"}
                    good={currentReaction.enthalpy !== undefined ? currentReaction.enthalpy < 0 : undefined}
                  />
                  <ThermMetric
                    label="Entropy ΔS"
                    value={currentReaction.entropy !== undefined ? `${currentReaction.entropy} J/K·mol` : "Pending AI…"}
                    good={currentReaction.entropy !== undefined ? currentReaction.entropy > 0 : undefined}
                  />
                  <ThermMetric
                    label="Gibbs ΔG"
                    value={currentReaction.gibbs !== undefined ? `${currentReaction.gibbs} kJ/mol` : "Pending AI…"}
                    good={currentReaction.gibbs !== undefined ? currentReaction.gibbs < 0 : undefined}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component Layout — ThermMetric Element Card
// ---------------------------------------------------------------------------
interface ThermMetricProps {
  readonly label: string;
  readonly value: string;
  readonly good: boolean | undefined;
}

const ThermMetric: React.FC<ThermMetricProps> = ({ label, value, good }) => (
  <div className={`flex flex-col gap-1 p-3 border-2 border-[#1A1A1A] transition-colors min-w-0 overflow-hidden ${
    good === undefined ? "bg-[#F5F5F5] opacity-70" : good ? "bg-[#EAE8E4]" : "bg-white"
  }`}>
    <span className="text-[8px] font-black text-[#1A1A1A] uppercase tracking-widest block truncate">{label}</span>
    <span className="text-xs md:text-sm font-mono font-black text-[#1A1A1A] block truncate">{value}</span>
    {good !== undefined && (
      <span className={`text-[7px] font-black uppercase tracking-wider block ${good ? "text-green-700" : "text-red-600"}`}>
        {good ? "▲ FAVORABLE" : "▼ UNFAVORABLE"}
      </span>
    )}
  </div>
);