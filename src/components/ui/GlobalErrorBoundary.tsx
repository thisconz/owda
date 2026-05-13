import React, { ErrorInfo } from "react";
import {
  AlertTriangle, TerminalSquare, RefreshCw, ShieldAlert,
  Clipboard, ClipboardCheck, Database, Cpu, Activity, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  children: React.ReactNode;
  version?: string;
  onReport?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryStep: "idle" | "rebooting";
  copied: boolean;
  timestamp: string;
}

/**
 * OWDA_SYS_CORE: Global Error Boundary
 * High-stakes UI for critical engine failure.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryStep: "idle",
      copied: false,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("OWDA_CORE_PANIC:", error, errorInfo);
    this.props.onReport?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleHardReset = () => {
    this.setState({ recoveryStep: "rebooting" });
    setTimeout(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
      window.location.reload();
    }, 1800);
  };

  copyToClipboard = async () => {
    const telemetry = `Browser: ${navigator.userAgent}\nOS: ${navigator.platform}\nMemory: ${((performance as any).memory?.usedJSHeapSize / 1048576).toFixed(2)}MB used`;
    const text = [
      `[OWDA_FATAL_ERROR] ${this.state.timestamp}`,
      `ID: ${this.state.error?.name}`,
      `MSG: ${this.state.error?.message}`,
      `TRACE:\n${this.state.error?.stack}`,
      `\n--- COMPONENT_TREE ---\n${this.state.errorInfo?.componentStack}`,
      `\n--- TELEMETRY ---\n${telemetry}`
    ].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.error("Clipboard blocked.");
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-mono flex flex-col items-center justify-center p-6 relative select-none">
        {/* CRT Scanline & Grain Overlay */}
        <div className="absolute inset-0 pointer-events-none z-100 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <motion.div
          initial={{ x: -2, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full max-w-6xl z-10 flex flex-col gap-6"
        >
          {/* TOP BAR: SYSTEM STATUS */}
          <div className="flex flex-col md:flex-row items-center justify-between border-b-4 border-[#1A1A1A] pb-4 gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="p-3 bg-[#ff4d4d] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]"
              >
                <ShieldAlert className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Kernel_Panic.0x88</h1>
                <div className="flex gap-2 mt-2">
                  <span className="text-[9px] font-black bg-[#1A1A1A] text-white px-2 py-0.5">CORE: HALTED</span>
                  <span className="text-[9px] font-black bg-[#D4FF00] border border-[#1A1A1A] px-2 py-0.5">TIME: {this.state.timestamp}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold text-[#1A1A1A] opacity-40 uppercase">Architecture: TypeScript/React</span>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-3 h-3 text-[#ff4d4d]" />
                <span className="text-[10px] font-black">Memory_Heap_Overload_Risk: LOW</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LOG CONSOLE */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-[#1A1A1A] text-[#D4FF00] p-1 flex justify-between px-4 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <TerminalSquare size={12} /> Standard_Output_Stream
                </span>
                <span className="text-[8px]">ASCII_ENCODING_UTF8</span>
              </div>
              
              <div className="bg-white border-4 border-[#1A1A1A] shadow-[12px_12px_0px_rgba(26,26,26,0.1)] h-[55vh] overflow-hidden flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#F9F8F6]">
                  <div className="text-white bg-[#1A1A1A] p-4 border-l-8 border-[#ff4d4d] mb-6">
                    <p className="font-black text-sm uppercase mb-1 underline italic">Critical_Fault_Summary:</p>
                    {this.state.error?.message || "No error message provided by core."}
                  </div>
                  
                  <div className="space-y-4 opacity-80">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">
                      <span className="text-[#ff4d4d] font-black mr-2">[STACK_TRACE]</span>
                      {this.state.error?.stack}
                    </p>
                    <div className="border-t-2 border-dashed border-[#1A1A1A]/20 pt-4">
                      <span className="text-[#1A1A1A] font-black mr-2 text-[10px] uppercase">[Component_Hierarchy_State]</span>
                      <p className="mt-2 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION SIDEBAR */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_#1A1A1A]">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A] pb-2">
                  <Info size={14} />
                  <h3 className="font-black text-xs uppercase">Resolution_Protocols</h3>
                </div>
                
                <div className="space-y-3">
                  <ActionButton 
                    onClick={() => this.setState({ hasError: false })}
                    label="Re-Initialize_Node" 
                    icon={<Cpu size={14} />}
                    variant="primary"
                  />
                  <ActionButton 
                    onClick={this.handleHardReset}
                    label="Purge_&_Hard_Reboot" 
                    icon={<RefreshCw size={14} />}
                    variant="danger"
                  />
                  <ActionButton 
                    onClick={this.copyToClipboard}
                    label={this.state.copied ? "Logs_Captured" : "Copy_Diagnostic_Bundle"} 
                    icon={this.state.copied ? <ClipboardCheck size={14}/> : <Clipboard size={14}/>}
                    variant="ghost"
                  />
                </div>
              </div>

              <div className="bg-[#D4FF00] border-4 border-[#1A1A1A] p-4 flex flex-col gap-2 shadow-[6px_6px_0px_#1A1A1A]">
                 <span className="text-[10px] font-black flex items-center gap-2">
                    <Database size={12} /> ENGINE_ADVISORY
                 </span>
                 <p className="text-[9px] font-bold leading-tight uppercase">
                    Cache persistence detected. If errors continue, use "Purge & Hard Reboot" to clear all local indexedDB/LocalStorage entries.
                 </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* REBOOT OVERLAY */}
        <AnimatePresence>
          {this.state.recoveryStep === "rebooting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-200 bg-[#1A1A1A] text-[#D4FF00] flex flex-col items-center justify-center font-mono"
            >
              <RefreshCw className="w-12 h-12 animate-spin mb-4" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-black tracking-widest animate-pulse">CLEANING_REGISTRY...</span>
                <span className="text-[10px] opacity-60 uppercase">Deleting local data clusters</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}

// Sub-component for UI consistency
const ActionButton = ({ onClick, label, icon, variant }: any) => {
  const styles = {
    primary: "bg-[#D4FF00] text-[#1A1A1A]",
    danger: "bg-[#ff4d4d] text-white",
    ghost: "bg-white text-[#1A1A1A]"
  };

  return (
    <button
      onClick={onClick}
      className={`w-full py-4 px-4 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-between font-black text-[10px] uppercase ${styles[variant as keyof typeof styles]}`}
    >
      {label}
      {icon}
    </button>
  );
};