import React, { ErrorInfo } from 'react';
import {
  AlertTriangle,
  TerminalSquare,
  RefreshCw,
  ShieldAlert,
  Clipboard,
  Database,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react'; // FIXED: was 'framer-motion'

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryStep: 'idle' | 'rebooting';
  copied: boolean;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryStep: 'idle',
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null, recoveryStep: 'idle' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZENTHAR_CORE_CRITICAL_FAULT:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleHardReset = () => {
    this.setState({ recoveryStep: 'rebooting' });
    setTimeout(() => {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      window.location.reload();
    }, 1500);
  };

  handleSoftReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, recoveryStep: 'idle' });
  };

  copyToClipboard = async () => {
    const text = [
      this.state.error?.stack,
      '\n\n--- Component Stack ---',
      this.state.errorInfo?.componentStack,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {}
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#050000] text-red-500 font-mono flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* CRT Scanline */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl z-10 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-red-900/40 pb-6 gap-4">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-lg opacity-20 animate-pulse" />
                <div className="p-4 bg-red-950/30 border border-red-500/50 rounded-2xl relative">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                  Kernel_Panic
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-red-400/60 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/20">
                    <Cpu className="w-3 h-3" /> ADDR: 0x004F22
                  </span>
                  <span className="text-[10px] text-red-400/60 animate-pulse uppercase tracking-widest">
                    Faulty_Node_Detected
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-red-900 font-bold uppercase tracking-[0.2em]">
                OWDA.OS {process.env.V}
              </p>
              <p className="text-[9px] text-red-500/40 font-mono">
                Build_Hash: 8f2d1e_9901
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stack Trace */}
            <div className="lg:col-span-3 bg-black/40 border border-red-500/20 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[50vh]">
              <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="w-3 h-3" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    Diagnostic_Logs
                  </span>
                </div>
                <button
                  onClick={this.copyToClipboard}
                  className="text-[9px] hover:text-white transition-colors flex items-center gap-1.5 bg-red-500/20 px-2 py-1 rounded"
                >
                  <Clipboard className="w-3 h-3" />
                  {this.state.copied ? 'Copied!' : 'Copy_Trace'}
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto font-mono text-xs sm:text-sm custom-scrollbar">
                <div className="text-white bg-red-600/20 px-2 py-1 rounded mb-4 inline-block">
                  {this.state.error?.name}: {this.state.error?.message}
                </div>
                <div className="text-red-400/80 leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                  {this.state.error?.stack}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-6 pt-6 border-t border-red-900/30 text-red-900">
                      {'--- Component Tree State ---'}
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <h4 className="text-[10px] font-bold text-red-900 uppercase mb-3 flex items-center gap-2">
                  <Database className="w-3 h-3" /> Recovery_Options
                </h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={this.handleSoftReset}
                    className="w-full py-3 bg-orange-700 hover:bg-orange-600 text-black font-black text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-3 h-3" /> Try_Recover
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-black text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" /> Soft_Reload
                  </button>
                  <button
                    onClick={this.handleHardReset}
                    className="w-full py-3 bg-transparent border border-red-500/30 hover:border-red-500 text-red-500 font-bold text-[10px] uppercase rounded-lg transition-all"
                  >
                    Purge_Cache & Reboot
                  </button>
                </div>
              </div>
              <div className="mt-auto p-4 border border-red-900/20 rounded-2xl opacity-40">
                <p className="text-[9px] leading-tight">
                  * CRITICAL: Repeated failures indicate a logic loop in the
                  Zenthar Engine. Contact engineering if reboot fails.
                </p>
              </div>
            </div>
          </div>

          {/* Fullscreen Reboot Overlay */}
          <AnimatePresence>
            {this.state.recoveryStep === 'rebooting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-100 bg-black flex flex-col items-center justify-center gap-4"
              >
                <RefreshCw className="w-12 h-12 text-red-600 animate-spin" />
                <p className="text-red-600 font-mono text-sm animate-pulse uppercase tracking-[0.4em]">
                  Reinitializing_Core...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }
}