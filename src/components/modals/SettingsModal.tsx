import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  X,
  Cpu,
  Bot,
  Sliders,
  CheckCircle2,
  Terminal,
  Hash,
  ChevronRight,
  Activity,
  LucideProps,
} from "lucide-react";
import {
  useOWDAStore,
  useSolverSettings,
  AI_MODELS,
  AIModelType,
} from "../../store";

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// -----------------------------------------------------------------------------
// Atoms
// -----------------------------------------------------------------------------

const WarningStripe = () => (
  <div className="h-1.5 w-full flex overflow-hidden">
    {[...Array(24)].map((_, i) => (
      <div
        key={i}
        className={`h-full w-8 -skew-x-12 ${i % 2 === 0 ? "bg-owda-blue" : "bg-owda-gray"}`}
      />
    ))}
  </div>
);

const DiagnosticLine = ({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) => (
  <div className="flex justify-between items-center font-mono text-[9px] py-1.5 border-b border-owda-blue/10">
    <span className="text-owda-navy/40 uppercase">{label}</span>
    <span className={active ? "text-owda-blue font-bold" : "text-owda-navy/80"}>
      {value}
    </span>
  </div>
);

const SystemToggle = ({
  label,
  active,
  onClick,
  description,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  description?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-start justify-between w-full p-4 border-2 border-owda-gray shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none group text-left ${
      active ? "bg-owda-blue" : "bg-white hover:bg-[#EAE8E4]"
    }`}
  >
    <div className="flex flex-col pr-4">
      <span className="text-[10px] font-black uppercase tracking-wider text-owda-gray">
        {label}
      </span>
      {description && (
        <span className="text-[9px] font-bold text-owda-gray/60 mt-1 leading-tight font-mono">
          {description}
        </span>
      )}
    </div>
    <div className="w-10 h-5 border-2 border-owda-gray relative bg-white shrink-0">
      <motion.div
        animate={{ x: active ? 20 : 2 }}
        className="absolute top-0.5 w-3 h-3 bg-owda-gray"
      />
    </div>
  </button>
);

// -----------------------------------------------------------------------------
// Main Modal
// -----------------------------------------------------------------------------

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSolverSettings();
  const updateSettings = useOWDAStore((s) => s.actions.updateSettings);
  const resetWorkspace = useOWDAStore((s) => s.actions.resetWorkspace);

  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleApply = () => {
    setIsCommitting(true);
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  OWDA<span className="text-[#ff6b6b]">.</span>OS // SYS_CONFIG
                </span>
              </div>
              <div className="hidden sm:flex items-center bg-owda-blue text-owda-gray px-4 py-1 font-black text-[9px] -skew-x-12 mr-12 tracking-widest">
                ENVIRONMENT: {process.env.NODE_ENV?.toUpperCase() || "STABLE"}
              </div>
            </div>

            {/* 2. Interface Header */}
            <div className="flex items-center justify-between border-b-4 border-owda-gray p-6 bg-white bg-grid">
              <div className="flex items-center gap-5">
                <div className="p-4 border-4 border-owda-gray bg-owda-blue shadow-[4px_4px_0px_#1a1a1a]">
                  <Settings className="w-6 h-6 text-owda-gray animate-[spin_20s_linear_infinite]" />
                </div>
                <div>
                  <h1 className="font-mono text-3xl font-bold tracking-tight text-owda-gray leading-none">
                    Hardware Specs
                  </h1>
                  <p className="font-mono text-[9px] mt-2 font-bold text-owda-gray/50 uppercase tracking-widest">
                    V{process.env.APP_VERSION} // KINETIC_RUNTIME
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
                    <Cpu size={14} className="text-owda-gray" />
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">
                      Inference_Core
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {AI_MODELS.map((model) => {
                      const active = settings.AIModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() =>
                            updateSettings({ AIModel: model.id as AIModelType })
                          }
                          className={`p-4 border-2 border-owda-gray text-left transition-all flex justify-between items-center group ${
                            active
                              ? "bg-owda-blue shadow-[4px_4px_0px_#1a1a1a]"
                              : "bg-white hover:bg-[#EAE8E4]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 border-2 border-black bg-white group-hover:-rotate-6 transition-transform">
                              <Bot size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-tight">
                                {model.label}
                              </p>
                              <p className="text-[8px] font-mono font-bold opacity-50">
                                {model.provider}
                              </p>
                            </div>
                          </div>
                          {active && (
                            <CheckCircle2
                              size={16}
                              className="text-owda-gray"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="p-6 border-4 border-owda-gray bg-white shadow-[inset_6px_6px_0px_#EAE8E4]">
                  <div className="flex justify-between items-end mb-6">
                    <div className="flex items-center gap-2">
                      <Sliders size={14} />
                      <span className="font-black text-[10px] uppercase tracking-widest">
                        Bus_Speed
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black bg-owda-gray text-owda-blue px-2">
                      {settings.syncDelay}
                      <span className="text-[10px] ml-1">MS</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={settings.syncDelay}
                    onChange={(e) =>
                      updateSettings({ syncDelay: Number(e.target.value) })
                    }
                    className="w-full h-10 appearance-none bg-[#EAE8E4] border-2 border-owda-gray cursor-crosshair accent-owda-gray"
                  />
                </section>
              </div>

              {/* Toggles/Diagnostics Column */}
              <div className="lg:col-span-5 bg-owda-gray text-owda-navy p-6 flex flex-col">
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-owda-blue/30 pb-2 mb-4">
                    <Activity size={14} className="text-owda-blue" />
                    <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
                      Sub_Systems
                    </span>
                  </div>

                  <SystemToggle
                    label="AI Analysis"
                    description="Fetch thermodynamic ΔG and mechanisms."
                    active={settings.enableAI}
                    onClick={() =>
                      updateSettings({ enableAI: !settings.enableAI })
                    }
                  />

                  <SystemToggle
                    label="Stoichiometry"
                    description="Gaussian elimination for exact balancing."
                    active={settings.enforceStoichiometry}
                    onClick={() =>
                      updateSettings({
                        enforceStoichiometry: !settings.enforceStoichiometry,
                      })
                    }
                  />
                </div>

                <div className="mt-auto pt-6 border-t border-owda-blue/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Hash size={14} className="text-owda-blue" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-tight">
                      Atomic State Sync
                    </span>
                  </div>
                  <DiagnosticLine
                    label="Active_Model"
                    value={(settings.AIModel?.split("-")[0]) ?? ""}
                  />
                  <DiagnosticLine
                    label="Latency_Mode"
                    value={settings.syncDelay < 500 ? "REALTIME" : "BUFFERED"}
                    active={settings.syncDelay < 500}
                  />

                  <div className="mt-6 p-4 border-2 border-red-500 bg-white/10">
                    <p className="text-[9px] font-black uppercase text-red-600 mb-3">
                      Security_Flush
                    </p>
                    <button
                      onClick={() => {
                        resetWorkspace();
                        onClose();
                      }}
                      className="w-full py-2 bg-red-600 text-white font-mono text-[10px] font-bold uppercase hover:bg-black transition-colors"
                    >
                      Wipe_Core
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Footer Actions */}
            <div className="mt-auto">
              <WarningStripe />
              <div className="p-6 bg-white flex flex-col sm:flex-row gap-4 border-t-4 border-owda-gray">
                <button
                  onClick={onClose}
                  className="px-6 py-4 border-2 border-owda-gray font-black text-[10px] uppercase tracking-[0.2em] hover:bg-owda-snow transition-all flex items-center gap-3 justify-center"
                >
                  Discard
                </button>

                <button
                  onClick={handleApply}
                  disabled={isCommitting}
                  className="flex-1 relative bg-owda-blue border-4 border-owda-gray py-4 px-8 shadow-[8px_8px_0px_#000] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all flex items-center justify-center overflow-hidden"
                >
                  <span className="font-black text-[11px] uppercase tracking-[0.4em] relative z-10 text-owda-gray flex items-center gap-2">
                    {isCommitting ? (
                      "Committing..."
                    ) : (
                      <>
                        Commit_Changes <ChevronRight size={14} />
                      </>
                    )}
                  </span>
                  {isCommitting && (
                    <motion.div
                      className="absolute inset-0 bg-white/40"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 0.6, repeat: Infinity }}
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
