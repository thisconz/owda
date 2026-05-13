import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Zap, 
  Radio, 
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Activity
} from "lucide-react";

// Store & Types
import { useOWDAStore } from "./store";
import { TabType } from "./components/layout/SideBar";

// Components
import { WorkspacePage } from "./pages/WorkspacePage";
import { SimulatePage } from "./pages/SimulatePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ComparePage } from "./pages/ComparePage";
import { SideBar } from "./components/layout/SideBar";
import { TopBar } from "./components/layout/TopBar";
import { Footer } from "./components/layout/Footer";
import { SettingsModal } from "./components/modals/SettingsModal";
import { NetworkModal } from "./components/modals/NetworkModal";

export default function App() {
  const error = useOWDAStore((state) => state.error);
  const isProcessing = useOWDAStore((state) => state.isProcessing);
  const clearError = useOWDAStore((state) => state.actions.clearError);

  const [activeTab, setActiveTab] = useState<TabType>("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const toggleSettings = useCallback(() => setIsSettingsOpen((p) => !p), []);
  const toggleNetwork = useCallback(() => setIsNetworkOpen((p) => !p), []);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const ActivePage = useMemo(() => {
    const registry: Record<TabType, React.ReactNode> = {
      workspace: <WorkspacePage />,
      simulation: <SimulatePage />,
      analytics: <AnalyticsPage />,
      compare: <ComparePage />,
    };
    return registry[activeTab] || registry.workspace;
  }, [activeTab]);

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="h-screen w-screen relative overflow-hidden font-mono bg-[#FDFCFB] text-[#1A1A1A] selection:bg-[#D4FF00]"
    >
      {/* --- KINETIC GRID BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[size:40px_40px] bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)]" />
        <motion.div 
          animate={{ x: mousePos.x, y: mousePos.y }}
          transition={{ type: "spring", damping: 60, stiffness: 400, mass: 0.1 }}
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-[0.08]"
        >
          <div className="absolute top-[-100vh] left-0 w-[2px] h-[200vh] bg-[#1A1A1A]" />
          <div className="absolute top-0 left-[-100vw] w-[200vw] h-[2px] bg-[#1A1A1A]" />
        </motion.div>
      </div>

      <div className={`flex flex-col h-full transition-all duration-700 ${error ? "blur-xl grayscale" : ""}`}>
        <TopBar />

        <div className="flex-1 flex overflow-hidden">
          {/* --- MECHANICAL SIDEBAR --- */}
          <aside className={`relative flex flex-col border-r-4 border-[#1A1A1A] bg-white transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
            <button 
              onClick={toggleSidebar}
              className="absolute -right-6 top-8 z-[60] bg-[#1A1A1A] text-[#D4FF00] p-1.5 border-2 border-[#D4FF00] hover:scale-110 active:scale-95 transition-all"
            >
              {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>

            <SideBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              openSettings={toggleSettings}
              openNetwork={toggleNetwork}
              isCompact={!isSidebarOpen}
            />

            {/* SIDEBAR FOOTER HUD */}
            <div className="p-4 border-t-4 border-[#1A1A1A] bg-[#F5F5F5]">
               <div className={`flex items-center gap-3 ${!isSidebarOpen ? 'flex-col' : 'justify-between'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#D4FF00] animate-pulse shadow-[0_0_8px_#D4FF00]' : 'bg-green-500'}`} />
                    {isSidebarOpen && <span className="text-[9px] font-black tracking-widest opacity-40 uppercase">Sys_Kernel</span>}
                  </div>
                  {!isSidebarOpen && <Activity size={12} className="opacity-20" />}
                  {isSidebarOpen && <span className="text-[9px] font-bold tabular-nums opacity-30">L_3_NODE</span>}
               </div>
            </div>
          </aside>

          {/* --- MAIN VIEWPORT (THE "SMALLER" CANVAS) --- */}
          <main className="flex-1 flex flex-col bg-[#EAE8E4] p-3 md:p-5 relative overflow-hidden">
            {/* The Recessed Container */}
            <div className="flex-1 bg-white border-4 border-[#1A1A1A] shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col">
              
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.2, 1, 0.2, 1] }}
                    className="p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full"
                  >
                    {/* Interior Page Header */}
                    <div className="flex items-baseline gap-6 mb-16 border-b-8 border-[#1A1A1A] pb-6">
                       <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none text-[#1A1A1A]">
                         {activeTab}
                       </h1>
                       <div className="flex-1 h-2 bg-[#1A1A1A]/10 relative">
                          <motion.div 
                            animate={{ left: ['0%', '75%'] }} 
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="absolute top-0 w-32 h-full bg-[#FF6B6B]"
                          />
                       </div>
                       <span className="text-xs font-black opacity-20">REF_ID: 0x{activeTab.toUpperCase()}</span>
                    </div>
                    
                    <div className="w-full">
                      {ActivePage}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Internal Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#1A1A1A]/10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#1A1A1A]/10 pointer-events-none" />
            </div>

            {/* Spacing for Footer */}
            <div className="h-10" /> 
            <Footer sidebarOpen={isSidebarOpen} />
          </main>
        </div>
      </div>

      {/* --- FLOATING SPATIAL HUD --- */}
      <div className="fixed bottom-12 right-12 z-[100] flex flex-col items-end gap-3 pointer-events-none">
        <motion.div 
          animate={isProcessing ? { scale: [1, 1.02, 1] } : {}}
          className="bg-[#1A1A1A] text-white px-6 py-4 flex items-center gap-6 border-b-8 border-[#D4FF00] shadow-2xl"
        >
           <Zap size={22} className={isProcessing ? "text-[#D4FF00] drop-shadow-[0_0_8px_#D4FF00]" : "opacity-20"} />
           <div className="flex flex-col border-l-2 border-white/10 pl-5">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4FF00]">Stream_Density</span>
              <span className="text-sm font-bold mt-1 tracking-tighter">
                {isProcessing ? 'SYNTHESIZING_DATA...' : 'STABLE_ORBIT'}
              </span>
           </div>
        </motion.div>

        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center gap-3">
            <Radio size={14} className="text-[#FF6B6B]" />
            <span className="text-[10px] font-black tabular-nums">X:{mousePos.x} Y:{mousePos.y}</span>
          </div>
        </div>
      </div>

      {/* --- ERROR OVERLAY --- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A1A1A]/95 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -2 }} animate={{ scale: 1, rotate: 0 }}
              className="bg-white border-[12px] border-red-600 p-12 max-w-2xl w-full shadow-[30px_30px_0px_rgba(255,0,0,0.3)]"
            >
              <div className="flex items-center gap-8 mb-10 text-red-600">
                <ShieldAlert size={64} />
                <h2 className="text-6xl font-black uppercase italic tracking-tighter">Core_Leak</h2>
              </div>
              <p className="text-2xl font-bold mb-12 text-[#1A1A1A] leading-tight">
                {error.message}
              </p>
              <div className="flex gap-6">
                <button onClick={() => window.location.reload()} className="flex-1 bg-red-600 text-white py-8 font-black uppercase tracking-widest text-lg hover:bg-red-700 transition-all">
                  Hard_Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal isOpen={isSettingsOpen} onClose={toggleSettings} />
      <NetworkModal isOpen={isNetworkOpen} onClose={toggleNetwork} />
    </div>
  );
}