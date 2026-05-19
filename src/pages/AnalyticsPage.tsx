import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  Flame,
  Snowflake,
  TrendingUp,
  Trash2,
  ChevronRight,
  Zap,
  Globe,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { useOWDAActions, useReactionLog } from "../store";

// --- Utility: Time Formatting ---
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function AnalyticsPage() {
  const reactionLog = useReactionLog();
  const { resetWorkspace } = useOWDAActions();
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const total = reactionLog.length;
    const balanced = reactionLog.filter((r) => r.isBalanced).length;
    const exothermic = reactionLog.filter((r) => r.isExothermic === true).length;
    const integrity = Math.round((balanced / (total || 1)) * 100);

    const typeCounts: Record<string, number> = {};
    reactionLog.forEach((r) => {
      const t = r.reactionType ?? "Unknown";
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    });

    const typeData = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const enthalpyData = reactionLog
      .filter((r) => r.enthalpy !== undefined)
      .slice(-15)
      .map((r, i) => ({ i: i + 1, dH: r.enthalpy ?? 0 }));

    const validEnthalpies = reactionLog.filter((r) => r.enthalpy !== undefined);
    const avgEnthalpy = validEnthalpies.length > 0
        ? (validEnthalpies.reduce((sum, r) => sum + (r.enthalpy ?? 0), 0) / validEnthalpies.length).toFixed(1)
        : "0.0";

    return { total, integrity, exothermic, typeData, enthalpyData, avgEnthalpy };
  }, [reactionLog]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 p-4 select-none font-sans"
    >
      {/* ─── HUD HEADER ─── */}
      <header className="grid grid-cols-1 md:grid-cols-12 border-4 border-[#1A1A1A] bg-white shadow-[8px_8px_0px_#1A1A1A] overflow-hidden">
        <div className="md:col-span-4 p-5 flex items-center gap-4 bg-[#D4FF00] border-r-4 border-[#1A1A1A]">
          <div className="bg-[#1A1A1A] p-3 rotate-3 shadow-[4px_4px_0px_#FF6B6B]">
            <BarChart3 className="w-8 h-8 text-[#D4FF00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none tracking-tighter">
              Analytics -{" "}
              <span className="bg-white px-1 border-2 border-[#1A1A1A] not-italic">OS</span>
            </h1>
            <p className="text-[10px] font-mono font-black mt-1 uppercase opacity-70">OWDA_analytics_V{process.env.ANALYTIC_VERSION}</p>
          </div>
        </div>

        <div className="md:col-span-5 p-6 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black tracking-widest uppercase">Sync_Integrity_Index</span>
            <span className="font-mono text-xs font-bold">{stats.integrity}%</span>
          </div>
          <div className="h-4 w-full bg-[#EAE8E4] border-2 border-[#1A1A1A] p-0.5">
            <motion.div 
              animate={{ width: `${stats.integrity}%` }}
              className="h-full bg-[#1A1A1A]" 
            />
          </div>
        </div>

        <div className="md:col-span-3 p-6 bg-[#1A1A1A] text-white flex flex-col justify-center items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.4em]">LIVE_STREAM_ON</span>
          </div>
          <span className="text-[9px] opacity-40 font-mono italic">TOTAL_VECTORS: {stats.total}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* PRIMARY ANALYTICS AREA */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* MAIN CHART BLOCK */}
          <section className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[8px_8px_0px_#1A1A1A] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe size={120} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <TrendingUp size={14} className="text-[#D4FF00]" /> Enthalpy_Phase_Shift
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.enthalpyData}>
                  <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Area 
                    type="monotone" 
                    dataKey="dH" 
                    stroke="#1A1A1A" 
                    strokeWidth={4} 
                    fill="#D4FF00" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* STAT MODULE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1A1A1A] text-white p-8 border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#D4FF00]">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-8">Classification_Model</h3>
              <div className="space-y-6">
                {stats.typeData.map((t, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                      <span>{t.name}</span>
                      <span className="text-[#D4FF00]">{t.value}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/10 overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: `${(t.value / stats.total) * 100 - 100}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-[#D4FF00]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <StatModule icon={<Flame size={18}/>} label="Thermicity" value={stats.exothermic} sub="Exo" />
              <StatModule icon={<Snowflake size={18}/>} label="Avg Enthalpy" value={stats.avgEnthalpy} sub="kJ/mol" />
            </div>
          </div>
        </div>

        {/* SIDEBAR TELEMETRY */}
        <aside className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white border-4 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_#1A1A1A] flex-1 flex flex-col min-h-[400px]">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b-2 border-[#1A1A1A] pb-2 flex justify-between">
              Sequence_Log <span className="opacity-30 italic">L_STREAM</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {reactionLog.slice().reverse().map((entry) => (
                  <motion.div
                    key={entry.timestamp}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 border-4 border-[#1A1A1A] hover:bg-[#D4FF00] transition-colors group cursor-crosshair"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black uppercase bg-[#1A1A1A] text-white px-1">
                        {entry.reactionType || 'SYNTH'}
                      </span>
                      <span className="text-[8px] font-mono opacity-40">{timeAgo(entry.timestamp)}</span>
                    </div>
                    <p className="text-[11px] font-black font-mono truncate mb-2">{entry.expression}</p>
                    <div className="flex justify-between items-center text-[9px] font-bold opacity-60">
                      <span>dH: {entry.enthalpy ?? '0'}</span>
                      <ChevronRight size={12} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {reactionLog.length === 0 && (
                <div className="text-[9px] font-mono opacity-20 py-10 text-center uppercase tracking-widest">Idle_State</div>
              )}
            </div>
          </div>

          {/* PURGE ACTION */}
          <button
            onClick={() => confirmReset ? (resetWorkspace(), setConfirmReset(false)) : setConfirmReset(true)}
            onMouseLeave={() => setConfirmReset(false)}
            className={`w-full py-6 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all border-4 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] ${
              confirmReset ? 'bg-red-500 text-white animate-pulse' : 'bg-[#1A1A1A] text-[#D4FF00] hover:bg-white hover:text-[#1A1A1A]'
            }`}
          >
            {confirmReset ? <Zap /> : <Trash2 size={16} />}
            {confirmReset ? "CONFIRM_PURGE" : "PURGE_SYNC_NODE"}
          </button>
        </aside>
      </div>
    </motion.div>
  );
}

// --- Sub-components ---

function StatModule({ icon, label, value, sub }: any) {
  return (
    <div className="bg-white p-6 border-4 border-[#1A1A1A] group hover:bg-[#1A1A1A] transition-all shadow-[4px_4px_0px_#1A1A1A] flex flex-col justify-center">
      <div className="text-[#1A1A1A] group-hover:text-[#D4FF00] transition-colors mb-2">{icon}</div>
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h4 className="text-3xl font-black font-mono tracking-tighter group-hover:text-white transition-colors">
            {value}
          </h4>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:text-white/40">{label}</p>
        </div>
        {sub && <span className="text-[8px] font-bold bg-[#D4FF00] px-1 group-hover:bg-white group-hover:text-[#1A1A1A] mb-1">{sub}</span>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-[#1A1A1A] text-white p-3 border-2 border-[#D4FF00] font-mono shadow-[4px_4px_0px_#1A1A1A]">
        <p className="text-[9px] uppercase font-black text-[#D4FF00] mb-1">Enthalpy_Flux</p>
        <p className="text-xl font-black italic">{payload[0].value} <span className="text-[10px] not-italic opacity-50">kJ</span></p>
      </div>
    );
  }
  return null;
};