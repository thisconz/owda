import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Terminal, RefreshCcw } from 'lucide-react';

// Store & Types
import { useOWDAStore } from './store';
import { TabType } from './components/layout/SideBar';

// Components
import { SettingsModal } from './components/modals/SettingsModal';
import { WorkspacePage } from './pages/WorkspacePage';
import { SimulatePage } from './pages/SimulatePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ComparePage } from './pages/ComparePage';
import { SideBar } from './components/layout/SideBar';
import { TopBar } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';

export default function App() {
  const error = useOWDAStore((state) => state.error);
  const isProcessing = useOWDAStore((state) => state.isProcessing);
  const clearError = useOWDAStore((state) => state.actions.clearError);

  const [activeTab, setActiveTab] = useState<TabType>('workspace');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSettings = useCallback(() => setIsSettingsOpen((prev) => !prev), []);

  // Page router — now includes AnalyticsPage
  const ActivePage = useMemo(() => {
    switch (activeTab) {
      case 'workspace':
        return <WorkspacePage />;
      case 'explorer':
        return <SimulatePage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'compare':
        return <ComparePage />;
      default:
        return <WorkspacePage />;
    }
  }, [activeTab]);

  return (
    <div
      className={`
        min-h-screen transition-all duration-1000 relative overflow-hidden select-none
        ${isProcessing ? 'opacity-80' : 'opacity-100'}
      `}
    >
      <SettingsModal isOpen={isSettingsOpen} onClose={toggleSettings} />

      {/* Main Interface Frame */}
      <div
        className={`flex flex-col h-screen relative z-10 transition-all duration-700 ${
          error ? 'blur-md grayscale scale-[0.99]' : ''
        }`}
      >
        <TopBar />
        <div className="flex-1 flex min-h-0 relative z-10">
          {/* Global Brutalist Background */}
          <div className="absolute inset-0 bg-[#FDFCFB] -z-20" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,26,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

          {/* Global Brutalist Frame Accents */}
          <div className="fixed top-0 left-0 w-full h-2 bg-[#1A1A1A] z-50 mix-blend-multiply" />
          <div className="fixed bottom-0 left-0 w-full h-2 bg-[#1A1A1A] z-50 mix-blend-multiply" />
          <div className="fixed top-0 left-0 w-2 h-full bg-[#1A1A1A] z-50 mix-blend-multiply hidden md:block" />
          <div className="fixed top-0 right-0 w-2 h-full bg-[#1A1A1A] z-50 mix-blend-multiply hidden md:block" />

          <div className="fixed bottom-4 right-4 z-50 pointer-events-none hidden md:flex flex-col items-end opacity-40">
            <span className="text-[10px] font-black uppercase text-[#1A1A1A] tracking-widest bg-[#D4FF00] px-1 border border-[#1A1A1A]">OWDA.SYS</span>
            <span className="text-[8px] font-mono font-bold text-[#1A1A1A]">BUILD_v4.0.0</span>
          </div>

          <SideBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openSettings={toggleSettings}
          />

          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-transparent z-10">
            <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="h-full w-full overflow-y-auto custom-scrollbar scroll-smooth"
              >
                <div className="max-w-7xl mx-auto p-4 pb-24 md:p-10 lg:p-16 md:pb-16">
                  {ActivePage}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <Footer />
        </main>
        </div>
      </div>

      {/* Critical System Override — Crash Handler */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-1000 flex items-center justify-center bg-[#02020a]/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="max-w-lg w-[95%] p-10 border-2 border-black bg-[#FDFCFB] rounded-none relative overflow-hidden shadow-[8px_8px_0px_#1A1A1A]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Terminal className="w-40 h-40 text-red-500" />
              </div>

              <div className="flex items-start gap-6 mb-8 relative z-10">
                <div className="p-4 rounded-xs bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-black tracking-tighter text-red-500 uppercase italic">
                    Critical_Interrupt
                  </h2>
                  <span className="text-[9px] font-mono text-red-400/50">
                    EXCEPTION_CODE: {error.code ?? '0xZ_001'}
                  </span>
                </div>
              </div>

              <div className="bg-white border-2 border-[#1A1A1A] p-5 mb-10 font-mono shadow-[4px_4px_0px_#1A1A1A]">
                <p className="text-[12px] font-black text-[#1A1A1A] leading-relaxed tracking-tight bg-[#ff6b6b] text-white px-2 py-1 mb-2 inline-block border-[1.5px] border-[#1A1A1A]">
                  {error.message}
                </p>
                {error.details && (
                  <div className="mt-4 opacity-80 text-[10px] border-t-2 border-dashed border-[#1A1A1A] pt-4 leading-snug break-words">
                    <span className="bg-[#EAE8E4] px-1 font-black mb-1 inline-block border border-[#1A1A1A]">STACK_TRACE:</span>
                    <br />
                    {error.details.slice(0, 300)}…
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-black text-black hover:bg-[#1A1A1A] hover:text-white transition-all rounded-none text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Hard_Reboot
                </button>
                <button
                  onClick={clearError}
                  className="flex items-center justify-center gap-2 py-4 rounded-none bg-[#D4FF00] border-2 border-[#1A1A1A] text-[#1A1A1A] transition-all hover:bg-[#C2EB00] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none font-black text-[10px] tracking-[0.2em] uppercase"
                >
                  Flush_&amp;_Resume
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}