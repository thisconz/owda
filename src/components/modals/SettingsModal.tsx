import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  X,
  Cpu,
  Database,
  Network,
  Power,
  Activity,
  ChevronRight,
  Binary,
  Bot,
  BotOff,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  useOWDAStore,
  useSolverSettings,
  AI_MODELS,
  AIModelType,
} from '../../store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

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
    className="flex items-start justify-between w-full p-3 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none group text-left"
  >
    <div className="flex flex-col pr-4">
      <span className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">
        {label}
      </span>
      {description && (
        <span className="text-[10px] font-bold text-[#1A1A1A] mt-1 leading-tight">
          {description}
        </span>
      )}
    </div>
    <div
      className={`w-10 h-6 border-2 border-[#1A1A1A] relative transition-colors shrink-0 ${
        active ? 'bg-[#D4FF00]' : 'bg-[#EAE8E4]'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 border-2 border-[#1A1A1A] bg-white transition-all ${
          active
            ? 'left-4'
            : 'left-1'
        }`}
      />
    </div>
  </button>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSolverSettings();
  const updateSettings = useOWDAStore((s) => s.actions.updateSettings);
  const resetWorkspace = useOWDAStore((s) => s.actions.resetWorkspace);

  const [saved, setSaved] = React.useState(false);

  // Close on Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleApply = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleFactoryReset = () => {
    resetWorkspace();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#020205]/80 backdrop-blur-sm z-60"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            role="dialog"
            aria-modal="true"
            aria-label="System Configuration"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] z-70 overflow-hidden flex flex-col"
          >
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50" />

            {/* Header */}
            <div className="p-5 border-b-4 border-[#1A1A1A] flex items-center justify-between bg-[#EAE8E4] relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative border-2 border-[#1A1A1A] p-2 bg-white shadow-[2px_2px_0px_#1A1A1A]">
                  <Settings className="w-5 h-5 text-[#1A1A1A] relative animate-[spin_20s_linear_infinite]" />
                </div>
                <div>
                  <h2 className="text-xs font-black tracking-[0.3em] uppercase text-[#1A1A1A] leading-none">
                    Root Configuration
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-2 h-2 border border-[#1A1A1A] bg-[#D4FF00] animate-pulse" />
                    <code className="text-[10px] text-[#1A1A1A] font-mono font-black tracking-widest bg-white border border-[#1A1A1A] px-1">
                      VER_4.0.0_ALPHA
                    </code>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group p-2 border-2 border-[#1A1A1A] bg-white transition-transform hover:bg-[#ff6b6b] hover:text-white active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5 text-[#1A1A1A] group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-8 relative z-10 custom-scrollbar">

              {/* Section: Inference Core */}
              <section className="space-y-4">
                <header className="flex items-center gap-2 text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-2">
                  <Cpu className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    Inference Core
                  </span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {/* AI Model Selector */}
                  <div className="p-4 border-2 border-[#1A1A1A] bg-[#EAE8E4] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                        <Bot className="w-3 h-3 text-[#1A1A1A]" />
                        AI Model
                      </span>

                      <span className="text-[10px] px-2 py-1 border-2 border-[#1A1A1A] bg-[#D4FF00] font-black uppercase">
                        {settings.AIModel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {AI_MODELS.map((model) => {
                        const active =
                          settings.AIModel === model.id;

                        return (
                          <button
                            key={model.id}
                            onClick={() =>
                              updateSettings({
                                AIModel:
                                  model.id as AIModelType,
                              })
                            }
                            className={`p-3 border-2 border-[#1A1A1A] text-left transition-all shadow-[2px_2px_0px_#1A1A1A]
                            ${
                              active
                                ? 'bg-[#D4FF00]'
                                : 'bg-white hover:bg-[#EAE8E4]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-wider">
                                  {model.label}
                                </div>

                                <div className="text-[10px] font-mono mt-1">
                                  {model.provider}
                                </div>
                              </div>

                              {active && (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* AI Toggle Card */}
                  <div className="p-4 border-2 border-[#1A1A1A] bg-[#EAE8E4] shadow-[4px_4px_0px_#1A1A1A] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                        {settings.enableAI ? (
                          <Bot className="w-3 h-3 text-[#1A1A1A]" />
                        ) : (
                          <BotOff className="w-3 h-3 text-[#1A1A1A]" />
                        )}
                        AI Analysis
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 font-mono font-black border-2 border-[#1A1A1A] ${
                          settings.enableAI
                            ? 'bg-[#D4FF00] text-[#1A1A1A]'
                            : 'bg-white text-[#1A1A1A]'
                        }`}
                      >
                        {settings.enableAI ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <SystemToggle
                      label="Enable Gemini AI"
                      description="Fetch thermodynamics (ΔH, ΔS, ΔG) and mechanism explanations from Gemini."
                      active={settings.enableAI}
                      onClick={() => updateSettings({ enableAI: !settings.enableAI })}
                    />
                  </div>

                  {/* Stoichiometry Mode Card */}
                  <div className="p-4 border-2 border-[#1A1A1A] bg-[#EAE8E4] shadow-[4px_4px_0px_#1A1A1A] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                        <Binary className="w-3 h-3 text-[#1A1A1A]" /> Reasoning
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 font-mono font-black border-2 border-[#1A1A1A] ${
                          settings.enforceStoichiometry
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-white text-[#1A1A1A]'
                        }`}
                      >
                        {settings.enforceStoichiometry ? 'DETERMINISTIC' : 'HEURISTIC'}
                      </span>
                    </div>
                    <SystemToggle
                      label="Enforce Stoichiometry"
                      description="Use Gaussian elimination for exact balancing. Disable for approximate heuristics."
                      active={settings.enforceStoichiometry}
                      onClick={() =>
                        updateSettings({ enforceStoichiometry: !settings.enforceStoichiometry })
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Section: Sync Delay */}
              <section className="space-y-4">
                <header className="flex items-center gap-2 text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-2">
                  <Sliders className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    Performance
                  </span>
                </header>
                <div className="p-4 border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_#1A1A1A] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">
                      API Sync Delay
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-mono font-black border border-[#1A1A1A] bg-[#D4FF00] text-[#1A1A1A]">
                      {settings.syncDelay}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3000}
                    step={100}
                    value={settings.syncDelay}
                    onChange={(e) =>
                      updateSettings({ syncDelay: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-2 bg-black border-2 border-[#1A1A1A] rounded-none appearance-none cursor-pointer accent-[#D4FF00]"
                  />
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#1A1A1A]">
                    <span>0ms (instant)</span>
                    <span>3000ms</span>
                  </div>
                </div>
              </section>

              {/* Section: Data Pipeline */}
              <section className="space-y-4">
                <header className="flex items-center gap-2 text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-2">
                  <Database className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    Data Pipeline
                  </span>
                </header>
                <div className="space-y-3">
                  {[
                    { icon: Network,  label: 'Gemini AI Mirror',    status: settings.enableAI ? 'ACTIVE' : 'OFFLINE', ok: settings.enableAI },
                    { icon: Database, label: 'Local Stoich Cache',  status: '24.2 MB',  ok: true },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] group hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-[#1A1A1A]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity
                          className={`w-3 h-3 ${
                            item.ok ? 'text-emerald-500 animate-pulse' : 'text-[#1A1A1A]'
                          }`}
                        />
                        <span
                          className={`text-[10px] px-1 font-mono font-black border border-[#1A1A1A] ${
                            item.ok ? 'text-[#1A1A1A] bg-[#D4FF00]' : 'text-white bg-[#1A1A1A]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section: Danger Zone */}
              <section className="space-y-4">
                <header className="flex items-center gap-2 text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-2">
                  <Power className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    Danger_Zone
                  </span>
                </header>
                <div className="p-5 border-2 border-[#1A1A1A] bg-[#ff6b6b] shadow-[4px_4px_0px_#1A1A1A]">
                  <p className="text-[10px] font-black text-white mb-4">
                    PURGES ALL REACTION HISTORY, LOGS, AND RESETS SETTINGS TO FACTORY DEFAULTS.
                    THIS ACTION IS IRREVERSIBLE.
                  </p>
                  <button
                    onClick={handleFactoryReset}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EAE8E4] transition-all active:translate-y-0.5 active:shadow-none"
                  >
                    Factory_Reset
                  </button>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-5 border-t-4 border-[#1A1A1A] bg-[#EAE8E4] flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <Power className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-tighter">
                  Changes apply immediately to the store
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2 text-[10px] uppercase font-black tracking-widest text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EAE8E4] transition-all active:translate-y-0.5 active:shadow-none"
                >
                  Close
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 sm:flex-none px-8 py-2.5 bg-[#D4FF00] border-2 border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_#1A1A1A] hover:bg-white transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </>
                  ) : (
                    <>
                      Apply Changes <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}