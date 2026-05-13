import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Activity,
  Cpu,
  ChevronDown,
  Filter,
  Hexagon,
  Sparkles,
  ArrowRightLeft,
  FlaskConical,
  RotateCcw,
  Table2,
  Bot,
  BotOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOWDAActions, useOWDAStore, useSolverSettings } from '../../store';
import { ReactionSolver } from '../../engine/solver';
import { AIService } from '../../services/aiService';
import { ElementPicker } from './ElementPicker';

const REACTION_CATALOG = [
  {
    category: 'Basic Reactions',
    icon: <Filter className="w-4 h-4" />,
    items: [
      { label: 'Haber (Ammonia)',    formula: 'N2 + H2 -> NH3',                  difficulty: 'L1' },
      { label: 'Combustion (CH₄)',   formula: 'CH4 + O2 -> CO2 + H2O',            difficulty: 'L2' },
      { label: 'Water Formation',    formula: 'H2 + O2 -> H2O',                   difficulty: 'L1' },
      { label: 'Iron Rusting',       formula: 'Fe + O2 -> Fe2O3',                 difficulty: 'L2' },
    ],
  },
  {
    category: 'Aromatic',
    icon: <Hexagon className="w-4 h-4" />,
    items: [
      { label: 'EAS Nitration',       formula: 'C6H6 + HNO3 -> C6H5NO2 + H2O',   difficulty: 'L3' },
      { label: 'Combustion (C₆H₆)',  formula: 'C6H6 + O2 -> CO2 + H2O',          difficulty: 'L3' },
    ],
  },
  {
    category: 'Acid-Base',
    icon: <FlaskConical className="w-4 h-4" />,
    items: [
      { label: 'Neutralisation',     formula: 'HCl + NaOH -> NaCl + H2O',         difficulty: 'L1' },
      { label: 'H₂SO₄ + NaOH',       formula: 'H2SO4 + NaOH -> Na2SO4 + H2O',     difficulty: 'L2' },
      { label: 'CaCO₃ + HCl',        formula: 'CaCO3 + HCl -> CaCl2 + H2O + CO2', difficulty: 'L2' },
      { label: 'NH₃ + H₂SO₄',        formula: 'NH3 + H2SO4 -> (NH4)2SO4',         difficulty: 'L3' },
    ],
  },
];

export const ReactionWorkspace: React.FC = () => {
  const inputExpression = useOWDAStore((state) => state.inputExpression);
  const isProcessing = useOWDAStore((state) => state.isProcessing);
  const currentReaction = useOWDAStore((state) => state.currentReaction);
  const settings = useSolverSettings();

  const {
    setInputExpression,
    setReaction,
    setProcessing,
    addToHistory,
    setError,
    clearError,
    setSteps,
    appendReactionLog,
  } = useOWDAActions();

  const [localInput, setLocalInput] = useState(inputExpression);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalInput(inputExpression);
  }, [inputExpression]);

  const handleSolve = async () => {
    const trimmed = localInput.trim();
    if (!trimmed || isProcessing) return;

    setProcessing(true);
    clearError();
    setInputExpression(trimmed);
    addToHistory(trimmed);

    try {
      // 1. Deterministic balancing
      const balanced = ReactionSolver.balance(trimmed);

      // 2. AI analysis (conditionally based on settings)
      let thermodynamics: { enthalpy?: number; entropy?: number; gibbs?: number; type: string } =
        { type: 'Unknown' };
      let steps: any[] = [];

      if (settings.enableAI) {
        const aiResult = await AIService.explainReaction(trimmed);
        thermodynamics = aiResult.thermodynamics;
        steps = aiResult.steps;
      } else {
        steps = [
          {
            title: 'AI Analysis Disabled',
            description: 'Enable AI analysis in **Sys_Config** to receive thermodynamic estimates and mechanistic explanations.',
            mode: 'machine',
          },
        ];
      }

      const finalReaction = {
        ...balanced,
        ...(balanced.isBalanced
          ? {
              enthalpy: thermodynamics.enthalpy ?? 0,
              entropy: thermodynamics.entropy ?? 0,
              gibbs: thermodynamics.gibbs ?? 0,
              type: thermodynamics.type as any,
            }
          : {}),
      } as any;

      setReaction(finalReaction);
      setSteps(steps);

      appendReactionLog({
        expression: trimmed,
        timestamp: Date.now(),
        isBalanced: balanced.isBalanced,
        reactionType: thermodynamics.type,
        enthalpy: thermodynamics.enthalpy,
        isExothermic:
          thermodynamics.enthalpy !== undefined
            ? thermodynamics.enthalpy < 0
            : undefined,
      });
    } catch (e: any) {
      setError({
        message: e.message ?? 'An unknown engine error occurred.',
        code: e.code ?? 'ENGINE_FAULT',
        details: e.stack,
      });
      setReaction(undefined);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setLocalInput('');
    setInputExpression('');
    setReaction(undefined);
    setSteps([]);
    clearError();
    inputRef.current?.focus();
  };

  /** Insert text from ElementPicker into input at cursor position */
  const handlePickerInsert = (text: string) => {
    const el = inputRef.current;
    if (!el) {
      // Backspace signal
      if (text === '\b') {
        setLocalInput((prev) => prev.slice(0, -1));
        return;
      }
      setLocalInput((prev) => prev + text);
      return;
    }

    if (text === '\b') {
      const start = el.selectionStart ?? localInput.length;
      if (start > 0) {
        const newVal = localInput.slice(0, start - 1) + localInput.slice(start);
        setLocalInput(newVal);
        requestAnimationFrame(() => {
          el.setSelectionRange(start - 1, start - 1);
        });
      }
      return;
    }

    const start = el.selectionStart ?? localInput.length;
    const end = el.selectionEnd ?? localInput.length;
    const newVal = localInput.slice(0, start) + text + localInput.slice(end);
    setLocalInput(newVal);
    const nextPos = start + text.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-[#FDFCFB] rounded-none border-0 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[#1A1A1A] bg-[#EAE8E4]">
            <Terminal className="text-[#1A1A1A] w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]">
              Core_Input_Module
            </h2>
            <p className="text-[9px] font-mono text-[#1A1A1A]/60 font-bold uppercase transition-all mt-1">
              {isProcessing ? 'System Computing...' : 'Awaiting Synthesis String'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Status badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 border text-[9px] font-mono font-bold ${
              settings.enableAI
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-[#D4FF00]'
                : 'border-[#1A1A1A] text-[#1A1A1A]/50 bg-[#EAE8E4]'
            }`}
          >
            {settings.enableAI ? (
              <Bot className="w-3 h-3" />
            ) : (
              <BotOff className="w-3 h-3" />
            )}
            {settings.enableAI ? 'AI ON' : 'AI OFF'} - {settings.AIModel}
          </div>
          <div
            className={`px-3 py-1 border text-[9px] font-mono font-bold transition-colors ${
              isProcessing
                ? 'border-[#1A1A1A] text-white bg-[#1A1A1A] animate-pulse'
                : 'border-[#1A1A1A] text-[#1A1A1A] bg-white'
            }`}
          >
            {isProcessing ? 'COMPUTING' : 'READY'}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="relative group">
        <div className="relative flex items-center bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden focus-within:border-[#1A1A1A] focus-within:shadow-[4px_4px_0px_#1A1A1A] transition-all">
          <div className="pl-5 text-[#1A1A1A]/40 shrink-0">
            <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="e.g.  N2 + H2 -> NH3"
            className="w-full bg-transparent px-4 py-5 text-lg md:text-2xl text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none font-mono font-bold"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSolve();
              if (e.key === 'Escape') setShowPicker(false);
            }}
          />
          <div className="flex items-center gap-1.5 pr-2 shrink-0">
            <button
              onClick={() => setShowPicker((p) => !p)}
              title="Element Picker"
              className={`p-2.5 rounded-none border border-[#1A1A1A] transition-all ${
                showPicker
                  ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#1A1A1A]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#EAE8E4]'
              }`}
            >
              <Table2 className="w-4 h-4" />
            </button>
            {localInput && (
              <button
                onClick={handleClear}
                className="p-2 border border-transparent text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors bg-[#EAE8E4]"
                title="Clear"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSolve}
              disabled={isProcessing || !localInput.trim()}
              className="px-6 py-3 ml-2 border border-[#1A1A1A] bg-[#D4FF00] hover:bg-[#1A1A1A] disabled:opacity-50 disabled:bg-[#EAE8E4] disabled:text-[#1A1A1A]/50 hover:text-white text-[#1A1A1A] rounded-none transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest active:translate-y-1"
            >
              {isProcessing ? (
                <Activity className="animate-spin w-3 h-3" />
              ) : (
                <Cpu className="w-3 h-3" />
              )}
              {isProcessing ? 'Solving' : 'Execute'}
            </button>
          </div>
        </div>
      </div>

      {/* Element Picker Panel */}
      <ElementPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onInsert={handlePickerInsert}
      />

      {/* Reaction Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {REACTION_CATALOG.map((cat) => (
          <div key={cat.category} className="relative">
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === cat.category ? null : cat.category
                )
              }
              className={`w-full flex items-center justify-between p-3 rounded-none border-2 border-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest transition-all ${
                expandedCategory === cat.category
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#EAE8E4] text-[#1A1A1A] hover:bg-white shadow-[2px_2px_0px_#1A1A1A]'
              }`}
            >
              <div className="flex items-center gap-2">
                {cat.icon}
                {cat.category}
              </div>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  expandedCategory === cat.category ? 'rotate-180 text-white' : 'text-[#1A1A1A]'
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedCategory === cat.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 z-50 bg-[#FDFCFB] border-2 border-[#1A1A1A] rounded-none shadow-[4px_4px_0px_#1A1A1A] p-2 flex flex-col gap-1"
                >
                  {cat.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLocalInput(item.formula);
                        setExpandedCategory(null);
                        inputRef.current?.focus();
                      }}
                      className="flex flex-col p-2.5 rounded-none border border-transparent hover:border-[#1A1A1A] hover:bg-[#D4FF00] transition-all text-left group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-mono text-[#1A1A1A] font-bold">
                          {item.label}
                        </span>
                        <span className="text-[7px] px-1 border border-[#1A1A1A] bg-white rounded-none text-[#1A1A1A] font-bold">
                          {item.difficulty}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#1A1A1A]">{item.formula}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {currentReaction && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 bg-white border-2 border-[#1A1A1A] rounded-none p-6 relative overflow-hidden shadow-[4px_4px_0px_#1A1A1A]"
          >
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4 mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]">
                Solution_Manifest
              </h3>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 border-2 border-[#1A1A1A] font-bold text-[#1A1A1A] ${
                  currentReaction.isBalanced
                    ? 'bg-[#D4FF00]'
                    : 'bg-[#ff6b6b]'
                }`}
              >
                {currentReaction.isBalanced ? '✓ BALANCED' : '✗ UNBALANCED'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-8 py-4">
              {/* Equation */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-2xl md:text-3xl font-black tracking-tighter text-[#1A1A1A]">
                <div className="flex items-center gap-3">
                  {currentReaction.reactants.molecules.map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        {m.coefficient > 1 && (
                          <span className="text-[#1A1A1A] font-black text-xl md:text-2xl mt-1">
                            {m.coefficient}
                          </span>
                        )}
                        <span className="font-mono bg-white px-3 py-1 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-none">
                          {m.molecule.formula}
                        </span>
                      </div>
                      {i < currentReaction.reactants.molecules.length - 1 && (
                        <span className="text-[#1A1A1A] text-xl font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <ArrowRightLeft className="w-8 h-8 text-[#1A1A1A] mx-2" />

                <div className="flex items-center gap-3">
                  {currentReaction.products.molecules.map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        {m.coefficient > 1 && (
                          <span className="text-[#1A1A1A] font-black text-xl md:text-2xl mt-1">
                            {m.coefficient}
                          </span>
                        )}
                        <span className="font-mono bg-white px-3 py-1 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-none">
                          {m.molecule.formula}
                        </span>
                      </div>
                      {i < currentReaction.products.molecules.length - 1 && (
                        <span className="text-[#1A1A1A] text-xl font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Thermodynamics row */}
              {currentReaction.isBalanced && (
                <div className="w-full grid grid-cols-3 gap-4 border-t border-[#1A1A1A] pt-6 flex flex-wrap">
                  <ThermMetric
                    label="Enthalpy ΔH"
                    value={`${currentReaction.enthalpy} kJ/mol`}
                    good={currentReaction.enthalpy < 0}
                  />
                  <ThermMetric
                    label="Entropy ΔS"
                    value={`${currentReaction.entropy} J/K·mol`}
                    good={currentReaction.entropy > 0}
                  />
                  <ThermMetric
                    label="Gibbs ΔG"
                    value={`${currentReaction.gibbs} kJ/mol`}
                    good={currentReaction.gibbs < 0}
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

const ThermMetric = ({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) => (
  <div className="flex flex-col gap-1 p-3 border-2 border-[#1A1A1A] bg-[#EAE8E4]">
    <span className="text-[8px] font-black text-[#1A1A1A] uppercase tracking-widest">{label}</span>
    <span className={`text-xs md:text-sm font-mono font-black text-[#1A1A1A]`}>
      {value}
    </span>
  </div>
);