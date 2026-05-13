import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Activity,
  Flame,
  Snowflake,
  Clock,
  Database,
  TrendingUp,
  Hash,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useOWDAStore, useOWDAActions } from '../store';

// --- Utility: Time Formatting ---
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 84600) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function AnalyticsPage() {
  const { reactionLog } = useOWDAStore();
  const { resetWorkspace } = useOWDAActions();
  const [confirmReset, setConfirmReset] = useState(false);

  // --- Derived Statistics ---
  const stats = useMemo(() => {
    const total = reactionLog.length;
    const balanced = reactionLog.filter((r) => r.isBalanced).length;
    const exothermic = reactionLog.filter((r) => r.isExothermic === true).length;
    const endothermic = reactionLog.filter((r) => r.isExothermic === false).length;

    const typeCounts: Record<string, number> = {};
    reactionLog.forEach((r) => {
      const t = r.reactionType ?? 'Unknown';
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    });

    const typeData = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const enthalpyData = reactionLog
      .filter((r) => r.enthalpy !== undefined)
      .slice(-10) // Get last 10
      .map((r, i) => ({ i: i + 1, dH: r.enthalpy ?? 0 }));

    const validEnthalpies = reactionLog.filter((r) => r.enthalpy !== undefined);
    const avgEnthalpy = validEnthalpies.length > 0
      ? (validEnthalpies.reduce((sum, r) => sum + (r.enthalpy ?? 0), 0) / validEnthalpies.length).toFixed(1)
      : '0.0';

    return { total, balanced, exothermic, endothermic, typeData, enthalpyData, avgEnthalpy };
  }, [reactionLog]);

  const pieData = [
    { name: 'Exothermic', value: stats.exothermic, color: '#10b981' },
    { name: 'Endothermic', value: stats.endothermic, color: '#f97316' },
  ].filter((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans p-4"
    >
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-6 bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A]">
        <div className="flex items-center gap-5">
          <div className="bg-[#ff6b6b] p-3 border-2 border-[#1A1A1A] rotate-3">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">
              Telemetry <span className="bg-[#D4FF00] px-2 border-2 border-[#1A1A1A] not-italic">Analytics</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5">V{import.meta.env.ANALYTIC_VERSION || '1.0.0'}</span>
               <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">{stats.total} total logs</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {confirmReset ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="px-4 py-2 text-[10px] font-black border-2 border-[#1A1A1A] bg-white hover:bg-[#EAE8E4] uppercase">Cancel</button>
              <button onClick={() => { resetWorkspace(); setConfirmReset(false); }} className="px-4 py-2 text-[10px] font-black bg-[#ff6b6b] text-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] uppercase">Confirm Purge</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="px-4 py-2 text-[10px] font-black bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center gap-2 hover:bg-[#ff6b6b] hover:text-white transition-all uppercase">
              <Trash2 className="w-3 h-3" /> Purge_System_Logs
            </button>
          )}
        </div>
      </header>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Hash />} label="Total Reactions" value={stats.total.toString()} accent="bg-white" />
        <StatCard icon={<Activity />} label="Balanced" value={stats.balanced.toString()} sub={`${Math.round((stats.balanced / (stats.total || 1)) * 100)}%`} accent="bg-[#D4FF00]" />
        <StatCard icon={<Flame />} label="Exothermic" value={stats.exothermic.toString()} accent="bg-[#EAE8E4]" />
        <StatCard icon={<Snowflake />} label="Avg Enthalpy" value={`${stats.avgEnthalpy} kJ`} accent="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 3. LEFT COLUMN: CHARTS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Sparkline Chart */}
          <div className="bg-white border-4 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_#1A1A1A]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" /> Enthalpy Trend <span className="text-[#1A1A1A]/40 font-mono text-[9px]">(Last 10)</span>
               </h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.enthalpyData} barSize={32}>
                  <XAxis dataKey="i" hide />
                  <YAxis stroke="#1A1A1A" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26, 26, 26, 0.05)' }} />
                  <Bar dataKey="dH" stroke="#1A1A1A" strokeWidth={2}>
                    {stats.enthalpyData.map((entry, i) => (
                      <Cell key={i} fill={entry.dH < 0 ? '#10b981' : '#f97316'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reaction Types Bar Chart */}
            <div className="bg-white border-4 border-[#1A1A1A] p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-[#1A1A1A] pb-2 mb-4">Distribution_Type</h3>
              <div className="space-y-4">
                {stats.typeData.map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                      <span>{t.name}</span>
                      <span>{t.value}</span>
                    </div>
                    <div className="h-2 w-full bg-[#EAE8E4] border border-[#1A1A1A]">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(t.value / stats.total) * 100}%` }} 
                        className="h-full bg-[#1A1A1A]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split Pie Chart */}
            <div className="bg-[#EAE8E4] border-4 border-[#1A1A1A] p-6 flex flex-col items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-[#1A1A1A] pb-2 mb-4 self-stretch">Thermicity_Split</h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="#1A1A1A" strokeWidth={2} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {pieData.map((d, i) => <LegendItem key={i} color={d.color} label={d.name} />)}
              </div>
            </div>
          </div>
        </div>

        {/* 4. RIGHT COLUMN: HISTORY LOG */}
        <div className="lg:col-span-5">
          <div className="bg-[#D4FF00] border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] h-full flex flex-col max-h-[650px]">
            <div className="p-4 border-b-4 border-[#1A1A1A] flex justify-between items-center bg-white">
              <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> Live_Sequence_Log
              </h3>
              <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-2">{reactionLog.length}</span>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-hide">
              <AnimatePresence>
                {reactionLog.slice().reverse().map((entry, i) => (
                  <motion.div
                    key={entry.timestamp}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-1 hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <div className={`w-3 h-3 border-2 border-[#1A1A1A] ${entry.isExothermic ? 'bg-[#10b981]' : 'bg-[#f97316]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{entry.reactionType || 'General'}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#1A1A1A]/50">{timeAgo(entry.timestamp)}</span>
                    </div>
                    <p className="font-mono text-xs font-black truncate mb-2">{entry.expression}</p>
                    <div className="flex gap-2">
                      {entry.enthalpy !== undefined && (
                        <span className="text-[8px] font-bold border border-[#1A1A1A] px-1 bg-[#EAE8E4]">ΔH: {entry.enthalpy}kJ</span>
                      )}
                      <ChevronRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Internal Helper Components ---

function StatCard({ icon, label, value, sub, accent }: any) {
  return (
    <div className={`border-4 border-[#1A1A1A] ${accent} p-6 shadow-[4px_4px_0px_#1A1A1A] transition-transform hover:translate-y-[-2px]`}>
      <div className="text-[#1A1A1A] mb-4">{icon}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black font-mono">{value}</span>
        {sub && <span className="text-[10px] font-black bg-white border border-[#1A1A1A] px-1">{sub}</span>}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-60 border-t border-[#1A1A1A] pt-2">{label}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-[#1A1A1A] p-2 shadow-[4px_4px_0px_#1A1A1A] font-mono">
        <p className="text-[10px] font-black">ΔH: {payload[0].value} kJ/mol</p>
      </div>
    );
  }
  return null;
};

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 border-2 border-[#1A1A1A]" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </div>
  );
}