import React, { useState, useEffect } from 'react';
import { 
  Terminal, Activity, Cpu, CheckCircle2, ChevronDown, 
  Filter, Hexagon, Sparkles, ArrowRightLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOWDAActions, useOWDAStore } from '../../store';
import { ReactionSolver } from '../../engine/solver';
import { AIService } from '../../services/aiService';

// Updated catalog with metadata
const REACTION_CATALOG = [
  {
    category: "Chemical Reactions",
    icon: <Filter className="w-4 h-4" />,
    items: [
      { label: "Synthesis", formula: "N2 + H2 -> NH3", difficulty: "L1" },
      { label: "Combustion", formula: "CH4 + O2 -> CO2 + H2O", difficulty: "L2" }
    ]
  },
  {
    category: "Aromatic",
    icon: <Hexagon className="w-4 h-4" />,
    items: [
      { label: "EAS (Nitration)", formula: "C6H6 + HNO3 -> C6H5NO2 + H2O", difficulty: "L3" }
    ]
  }
];

export const ReactionWorkspace: React.FC = () => {
  const inputExpression = useOWDAStore((state) => state.inputExpression);
  const isProcessing = useOWDAStore((state) => state.isProcessing);
  const currentReaction = useOWDAStore((state) => state.currentReaction);
  
  const { 
    setInputExpression, 
    setReaction, 
    setProcessing, 
    addToHistory, 
    setError, 
    clearError 
  } = useOWDAActions();

  const [localInput, setLocalInput] = useState(inputExpression);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Chemical Reactions");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalInput(inputExpression);
  }, [inputExpression]);

  const handleSolve = async () => {
    if (!localInput || isProcessing) return;
    setProcessing(true);
    clearError();
    setInputExpression(localInput);
    addToHistory(localInput);

    try {
      // 1. Deterministic Solver
      const balanced = ReactionSolver.balance(localInput);
      
      // 2. AI Explanation
      const { thermodynamics } = await AIService.explainReaction(localInput);
      
      // Merge results. Note: cast to 'any' if ChemicalReaction type 
      // hasn't been updated yet with enthalpy/entropy/gibbs
      setReaction({ ...balanced, ...thermodynamics } as any);
    } catch (e: any) {
      setError({
        message: e.message,
        code: e.code
      });
      setReaction(undefined);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-[#050510]/80 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Background HUD Decor - Updated to bg-linear */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-owda-teal/40 to-transparent" />
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-owda-blue/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Info Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-owda-teal/10 rounded-lg">
            <Terminal className="text-owda-teal w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-owda-gray">Core_Input_Module</h2>
            <p className="text-[9px] font-mono text-owda-teal/60">Awaiting Stoichiometric String...</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className={`px-3 py-1 rounded-full border text-[9px] font-mono transition-colors ${isProcessing ? 'border-owda-blue text-owda-blue bg-owda-blue/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>
             {isProcessing ? 'PROCESSING_STREAM' : 'SYSTEM_READY'}
           </div>
        </div>
      </div>

      {/* Main Input Field */}
      <div className="relative group">
        <div className={`absolute -inset-1 bg-linear-to-r from-owda-teal/20 to-owda-blue/20 rounded-2xl blur-lg transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="relative flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden focus-within:border-owda-teal/50 transition-all">
          <div className="pl-5 text-owda-teal/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={localInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="N2 + H2 -> NH3"
            className="w-full bg-transparent px-4 py-5 text-lg md:text-2xl text-owda-snow placeholder:text-owda-snow/10 focus:outline-none font-mono"
            onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
          />
          
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={handleSolve}
              disabled={isProcessing || !localInput}
              className="px-6 py-3 bg-owda-teal hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale text-owda-navy rounded-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
            >
              {isProcessing ? <Activity className="animate-spin w-3 h-3" /> : <Cpu className="w-3 h-3" />}
              Execute
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {REACTION_CATALOG.map((cat) => (
          <div key={cat.category} className="relative">
            <button
              onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                expandedCategory === cat.category 
                  ? 'bg-owda-teal/10 border-owda-teal/40 text-owda-teal' 
                  : 'bg-white/2 border-white/5 text-owda-gray hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {cat.icon}
                {cat.category}
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform ${expandedCategory === cat.category ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {expandedCategory === cat.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 z-50 bg-[#0a0a1a] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {cat.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLocalInput(item.formula);
                        setExpandedCategory(null);
                      }}
                      className="flex flex-col p-2.5 rounded-lg hover:bg-owda-teal/10 border border-transparent hover:border-owda-teal/20 transition-all text-left group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-mono text-owda-gray group-hover:text-owda-teal">{item.label}</span>
                        <span className="text-[7px] px-1 bg-white/5 rounded text-owda-gray">{item.difficulty}</span>
                      </div>
                      <span className="text-xs font-mono text-owda-snow truncate">{item.formula}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Result Section */}
      <AnimatePresence mode="wait">
        {currentReaction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 bg-linear-to-b from-white/3 to-transparent border border-white/10 rounded-2xl p-6 relative group overflow-hidden"
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-owda-gray mb-8">Solution_Manifest</h3>

            <div className="flex flex-col items-center justify-center gap-8 py-4">
              <div className="flex flex-wrap items-center justify-center gap-4 text-2xl md:text-4xl font-light tracking-tighter text-owda-snow">
                {/* Reactants */}
                <div className="flex items-center gap-3">
                  {currentReaction.reactants.molecules.map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        {m.coefficient > 1 && <span className="text-owda-teal font-black text-xl md:text-2xl mb-1">{m.coefficient}</span>}
                        <span className="font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/5">{m.molecule.formula}</span>
                      </div>
                      {i < currentReaction.reactants.molecules.length - 1 && <span className="text-owda-gray/30 text-xl">+</span>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex flex-col items-center px-4">
                   <ArrowRightLeft className="w-8 h-8 text-owda-teal/40" />
                </div>

                {/* Products */}
                <div className="flex items-center gap-3">
                  {currentReaction.products.molecules.map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        {m.coefficient > 1 && <span className="text-owda-teal font-black text-xl md:text-2xl mb-1">{m.coefficient}</span>}
                        <span className="font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/5">{m.molecule.formula}</span>
                      </div>
                      {i < currentReaction.products.molecules.length - 1 && <span className="text-owda-gray/30 text-xl">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              {/* Thermodynamics HUD - Using Optional Chaining or Fallbacks */}
              <div className="w-full grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-4">
                 <Metric 
                    label="Enthalpy" 
                    value={`${(currentReaction as any).enthalpy ?? 'N/A'} kJ/mol`} 
                    icon={<Activity className="w-3 h-3 text-orange-400" />} 
                  />
                 <Metric 
                    label="Entropy" 
                    value={`${(currentReaction as any).entropy ?? 'N/A'} J/K`} 
                    icon={<Activity className="w-3 h-3 text-owda-blue" />} 
                  />
                 <Metric 
                    label="Gibbs Free" 
                    value={`${(currentReaction as any).gibbs ?? 'N/A'} kJ`} 
                    icon={<Sparkles className="w-3 h-3 text-emerald-400" />} 
                  />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Metric = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[8px] font-mono text-owda-gray uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-mono text-owda-snow">{value}</span>
  </div>
);