import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Activity,
} from "lucide-react";

// Store & Types
import { useOWDAStore } from "./store";
import { TabType } from "./components/layout/SideBar";

// Pages
import { WorkspacePage }  from "./pages/WorkspacePage";
import { SimulatePage }   from "./pages/SimulatePage";
import { AnalyticsPage }  from "./pages/AnalyticsPage";
import { ComparePage }    from "./pages/ComparePage";

// Layout
import { SideBar }         from "./components/layout/SideBar";
import { TopBar }          from "./components/layout/TopBar";
import { Footer }          from "./components/layout/Footer";
import { SettingsModal }   from "./components/modals/SettingsModal";
import { NetworkModal }    from "./components/modals/NetworkModal";
import { CursorOverlay }   from "./components/ui/CursorOverlay";

// ─── MODULE SCOPED COMPONENT REGISTRY ───
const PAGE_COMPONENTS = {
  workspace:  WorkspacePage,
  simulation: SimulatePage,
  analytics:  AnalyticsPage,
  compare:    ComparePage,
} as const satisfies Record<TabType, React.ComponentType>;

export default function App() {
  // Granular store selection prevents unnecessary root re-renders when other slices change
  const error = useOWDAStore(useCallback((state) => state.error, []));
  const isProcessing = useOWDAStore(useCallback((state) => state.isProcessing, []));

  const [activeTab, setActiveTab] = useState<TabType>("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);

  const toggleSettings = useCallback(() => setIsSettingsOpen((p) => !p), []);
  const toggleNetwork  = useCallback(() => setIsNetworkOpen((p) => !p),  []);
  const toggleSidebar  = useCallback(() => setIsSidebarOpen((p) => !p),  []);

  const ActivePage = PAGE_COMPONENTS[activeTab];

  return (
    <div className="h-screen w-screen relative overflow-hidden font-mono bg-[#FDFCFB] text-[#1A1A1A] selection:bg-[#D4FF00]">

      {/* ─── GRID BACKGROUND LAYER (Canvas Isolation) ─── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[size:40px_40px] bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)]" />
        <CursorOverlay />
      </div>

      <div className={`flex flex-col h-full transition-all duration-700 ${error !== undefined ? "blur-xl grayscale pointer-events-none select-none" : ""}`}>
        <TopBar />

        <div className="flex-1 flex overflow-hidden relative">
          {/* ─── SIDEBAR SHELL ─── */}
          <aside
            className={`relative flex flex-col border-r-4 border-[#1A1A1A] bg-white transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${
              isSidebarOpen ? "w-72" : "w-20"
            }`}
          >
            <button
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="absolute -right-6 top-8 z-[60] bg-[#1A1A1A] text-[#D4FF00] p-1.5 border-2 border-[#D4FF00] hover:scale-110 active:scale-95 transition-all outline-none"
            >
              {isSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>

            <SideBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              openSettings={toggleSettings}
              openNetwork={toggleNetwork}
              isCompact={!isSidebarOpen}
            />

            {/* Sidebar status footer HUD */}
            <div className="p-4 border-t-4 border-[#1A1A1A] bg-[#F5F5F5] select-none">
              <div className={`flex items-center gap-3 ${!isSidebarOpen ? "flex-col" : "justify-between"}`}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      isProcessing
                        ? "bg-[#D4FF00] animate-pulse shadow-[0_0_8px_#D4FF00]"
                        : "bg-green-500"
                    }`}
                  />
                  {isSidebarOpen && (
                    <span className="text-[9px] font-black tracking-widest opacity-40 uppercase">
                      Sys_Kernel
                    </span>
                  )}
                </div>
                {!isSidebarOpen ? (
                  <Activity size={12} className="opacity-20" />
                ) : (
                  <span className="text-[9px] font-bold tabular-nums opacity-30">L_3_NODE</span>
                )}
              </div>
            </div>
          </aside>

          {/* ─── MAIN VIEWPORT MODULE ─── */}
          <main className="flex-1 flex flex-col bg-[#EAE8E4] p-3 md:p-5 relative overflow-hidden">
            <div className="flex-1 bg-white border-4 border-[#1A1A1A] shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.99, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.01, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.2, 1, 0.2, 1] }}
                    className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto w-full"
                  >
                    {/* Component Header Block */}
                    <div className="flex items-baseline gap-6 mb-12 border-b-8 border-[#1A1A1A] pb-6 select-none">
                      <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none text-[#1A1A1A]">
                        {activeTab}
                      </h1>
                      <div className="flex-1 h-2 bg-[#1A1A1A]/10 relative overflow-hidden">
                        <motion.div
                          animate={{ left: ["-30%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          className="absolute top-0 w-32 h-full bg-[#FF6B6B]"
                        />
                      </div>
                      <span className="text-xs font-black opacity-20 font-mono">
                        REF_ID: 0x{activeTab.toUpperCase()}
                      </span>
                    </div>

                    <div className="w-full">
                      <ActivePage />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Technical framing corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#1A1A1A]/10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#1A1A1A]/10 pointer-events-none" />
            </div>

            {/* Structural spacer matching footer depth limits */}
            <div className="h-10 pointer-events-none" />
            <Footer sidebarOpen={isSidebarOpen} />
          </main>
        </div>
      </div>

      {/* ─── REALTIME TELEMETRY FLOATING HUD ─── */}
      <div className="fixed bottom-16 right-8 z-[40] pointer-events-none select-none">
        <motion.div
          animate={isProcessing ? { y: [0, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="bg-[#1A1A1A] text-white px-5 py-3 flex items-center gap-5 border-b-4 border-[#D4FF00] shadow-[8px_8px_0px_rgba(0,0,0,0.15)]"
        >
          <Zap
            size={18}
            className={isProcessing ? "text-[#D4FF00] drop-shadow-[0_0_6px_#D4FF00]" : "opacity-20"}
          />
          <div className="flex flex-col border-l-2 border-white/10 pl-4 leading-none">
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[#D4FF00] mb-1">
              Stream_Density
            </span>
            <span className="text-[11px] font-black tracking-tight uppercase">
              {isProcessing ? "SYNTHESIZING_DATA..." : "STABLE_ORBIT"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ─── KERNEL CRITICAL ERROR OVERLAY ─── */}
      <AnimatePresence>
        {error !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A1A1A]/95 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white border-[12px] border-red-600 p-10 max-w-2xl w-full shadow-[20px_20px_0px_rgba(239,68,68,0.2)]"
            >
              <div className="flex items-center gap-6 mb-8 text-red-600 select-none">
                <ShieldAlert size={48} className="shrink-0" />
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">
                  Core_Leak
                </h2>
              </div>
              <p className="text-xl font-bold mb-10 text-[#1A1A1A] leading-tight font-mono p-4 bg-red-50 border-2 border-red-200">
                {error.message}
              </p>
              {error.code !== undefined && (
                <p className="text-[10px] font-mono opacity-50 mb-6 uppercase tracking-wider">
                  FAULT_HEX_LOC: 0x{error.code.toString().toUpperCase()}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 text-white py-5 font-black uppercase tracking-widest text-sm border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:bg-red-700 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all outline-none"
              >
                Hard_Reset
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SYSTEM MODALS ─── */}
      <SettingsModal isOpen={isSettingsOpen} onClose={toggleSettings} />
      <NetworkModal isOpen={isNetworkOpen} onClose={toggleNetwork} />
    </div>
  );
}