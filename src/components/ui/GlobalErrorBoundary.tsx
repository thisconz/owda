import React, { ErrorInfo } from 'react';
import {
  AlertTriangle,
  TerminalSquare,
  RefreshCw,
  ShieldAlert,
  Clipboard,
  ClipboardCheck,
  Database,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
      `Error: ${this.state.error?.name} - ${this.state.error?.message}`,
      this.state.error?.stack,
      '\n\n--- Component Stack ---',
      this.state.errorInfo?.componentStack,
    ]
      .filter(Boolean)
      .join('\n');
      
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-mono flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Brutalist Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-50" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl z-10 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b-4 border-[#1A1A1A] pb-6 gap-4">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#ff6b6b] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
                <ShieldAlert className="w-10 h-10 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-4xl font-black tracking-tighter uppercase text-[#1A1A1A] leading-none mb-1">
                  Kernel_Panic
                </h1>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-[#1A1A1A] bg-[#D4FF00] px-2 py-0.5 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                    <Cpu className="w-3 h-3" /> ADDR: 0x004F22
                  </span>
                  <span className="text-[10px] text-[#ff6b6b] font-black animate-pulse uppercase tracking-widest bg-white border border-[#1A1A1A] px-1">
                    Faulty_Node_Detected
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[12px] text-[#1A1A1A] font-black uppercase tracking-[0.2em] bg-[#D4FF00] px-1 border border-[#1A1A1A] mb-1 inline-block">
                OWDA.OS {process.env.V || 'v4.0.0'}
              </p>
              <br />
              <p className="text-[10px] text-[#1A1A1A] font-bold bg-[#EAE8E4] px-1 inline-block border border-[#1A1A1A]">
                Build_Hash: 8f2d1e_9901
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stack Trace */}
            <div className="lg:col-span-3 bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] flex flex-col h-[50vh] relative">
              <div className="bg-[#EAE8E4] px-4 py-3 border-b-4 border-[#1A1A1A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-[12px] text-[#1A1A1A] uppercase font-black tracking-widest">
                    Diagnostic_Logs
                  </span>
                </div>
                <button
                  onClick={this.copyToClipboard}
                  className={`text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border-2 border-[#1A1A1A] px-3 py-1.5 shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none ${
                    this.state.copied 
                      ? 'bg-[#D4FF00] text-[#1A1A1A]' 
                      : 'bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A]'
                  }`}
                >
                  {this.state.copied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {this.state.copied ? 'Copied!' : 'Copy_Trace'}
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto font-mono text-xs sm:text-sm custom-scrollbar bg-[#FDFCFB]">
                <div className="text-white bg-[#ff6b6b] border-2 border-[#1A1A1A] font-black px-3 py-2 shadow-[2px_2px_0px_#1A1A1A] mb-6 inline-block">
                  {this.state.error?.name}: {this.state.error?.message}
                </div>
                <div className="text-[#1A1A1A] font-bold leading-relaxed whitespace-pre-wrap font-mono text-[11px] bg-white p-4 border-2 border-[#1A1A1A]">
                  {this.state.error?.stack}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-6 pt-6 border-t-2 border-dashed border-[#1A1A1A]">
                      <span className="bg-[#EAE8E4] px-1 text-[10px] uppercase font-black mb-2 inline-block">--- Component Tree State ---</span>
                      <div>{this.state.errorInfo.componentStack}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="flex flex-col gap-6">
              <div className="p-5 bg-white border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
                <h4 className="text-[12px] font-black text-white bg-[#1A1A1A] px-2 py-1 uppercase mb-4 flex items-center gap-2 w-fit border border-[#1A1A1A]">
                  <Database className="w-3.5 h-3.5" /> Recovery_Options
                </h4>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={this.handleSoftReset}
                    className="w-full py-3 bg-[#D4FF00] hover:bg-[#C2EB00] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none text-[#1A1A1A] font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Try_Recover
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-[#ff6b6b] hover:bg-[#e75353] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none text-white font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Soft_Reload
                  </button>
                  <button
                    onClick={this.handleHardReset}
                    className="w-full py-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] font-black text-[10px] uppercase transition-all"
                  >
                    Purge_Cache & Reboot
                  </button>
                </div>
              </div>
              <div className="mt-auto p-4 bg-[#EAE8E4] border-2 border-[#1A1A1A]">
                <p className="text-[10px] font-bold leading-tight uppercase font-mono text-[#1A1A1A]">
                  <span className="text-[#ff6b6b]">* CRITICAL:</span> Repeated failures indicate a logic loop in the OWDA Engine. Contact engineering.
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
                className="fixed inset-0 z-100 bg-[#D4FF00] flex flex-col items-center justify-center gap-6"
              >
                <div className="p-6 bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] flex flex-col items-center gap-4">
                  <RefreshCw className="w-16 h-16 text-[#1A1A1A] animate-spin" />
                  <p className="text-[#1A1A1A] font-black font-mono text-xl animate-pulse uppercase tracking-[0.2em] bg-[#EAE8E4] px-2 py-1 border-2 border-[#1A1A1A]">
                    Reinitializing_Core...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }
}
