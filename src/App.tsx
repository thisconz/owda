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
import { AnalyticsPage } from './pages/AnalyticsPage'; // NEW
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
      default:
        return <WorkspacePage />;
    }
  }, [activeTab]);

  return (
    <div
      className={`
        min-h-screen text-owda-snow font-sans transition-all duration-1000 relative overflow-hidden select-none
        ${isProcessing ? 'bg-[#041212]' : 'bg-[#02020a]'}
      `}
    >
      <SettingsModal isOpen={isSettingsOpen} onClose={toggleSettings} />

      {/* Atmospheric Engine Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <motion.div
          animate={{
            opacity: isProcessing ? [0.2, 0.4, 0.2] : 0.15,
            scale: isProcessing ? [1, 1.1, 1] : 1,
            x: isProcessing ? [0, 20, 0] : 0,
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-linear-to-tr from-owda-teal/10 via-owda-blue/5 to-transparent blur-[160px] rounded-full"
        />
      </div>

      {/* Main Interface Frame */}
      <div
        className={`flex h-screen relative z-10 transition-all duration-700 ${
          error ? 'blur-md grayscale scale-[0.99]' : ''
        }`}
      >
        <SideBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openSettings={toggleSettings}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black/20">
          <TopBar />

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
                <div className="max-w-450 mx-auto p-6 md:p-10 lg:p-16">
                  {ActivePage}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <Footer />
        </main>
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
              className="max-w-lg w-[95%] p-10 border border-red-500/30 bg-[#050510] rounded-sm relative overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.15)]"
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

              <div className="bg-black/40 border-l-2 border-red-500 p-5 mb-10 font-mono">
                <p className="text-[11px] text-owda-snow/80 leading-relaxed tracking-tight">
                  {error.message}
                </p>
                {error.details && (
                  <p className="mt-3 opacity-40 text-[9px] border-t border-white/5 pt-3 leading-snug">
                    STACK_TRACE: {error.details.slice(0, 300)}…
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-owda-snow/60 hover:bg-white/10 transition-all rounded-xs text-[10px] font-bold uppercase tracking-widest"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Hard_Reboot
                </button>
                <button
                  onClick={clearError}
                  className="group relative py-4 overflow-hidden rounded-xs bg-red-500 text-black transition-all hover:bg-red-400 active:scale-[0.98]"
                >
                  <span className="relative z-10 font-black text-[10px] tracking-[0.2em] uppercase">
                    Flush_&amp;_Resume
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}