import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Activity,
  Flame,
  Snowflake,
  Clock,
  Database,
  TrendingUp,
  TrendingDown,
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
  Legend,
} from 'recharts';
import { useOWDAStore, useOWDAActions } from '../store';
import { renderFormula } from '../utils/renderFormula';

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function AnalyticsPage() {
  const { reactionLog } = useOWDAStore();
  const { resetWorkspace } = useOWDAActions();
  const [confirmReset, setConfirmReset] = useState(false);

  // ── Derived Statistics ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = reactionLog.length;
    const balanced = reactionLog.filter((r) => r.isBalanced).length;
    const exothermic = reactionLog.filter((r) => r.isExothermic === true).length;
    const endothermic = reactionLog.filter((r) => r.isExothermic === false).length;

    // Reaction type distribution
    const typeCounts: Record<string, number> = {};
    reactionLog.forEach((r) => {
      const t = r.reactionType ?? 'Unknown';
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    });
    const typeData = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // Last 10 enthalpy values for sparkline
    const enthalpyData = reactionLog
      .filter((r) => r.enthalpy !== undefined)
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({ i: i + 1, dH: r.enthalpy ?? 0 }));

    const avgEnthalpy =
      reactionLog.filter((r) => r.enthalpy !== undefined).length > 0
        ? (
            reactionLog
              .filter((r) => r.enthalpy !== undefined)
              .reduce((sum, r) => sum + (r.enthalpy ?? 0), 0) /
            reactionLog.filter((r) => r.enthalpy !== undefined).length
          ).toFixed(1)
        : 'N/A';

    return { total, balanced, exothermic, endothermic, typeData, enthalpyData, avgEnthalpy };
  }, [reactionLog]);

  const pieData = [
    { name: 'Exothermic', value: stats.exothermic, color: '#10b981' },
    { name: 'Endothermic', value: stats.endothermic, color: '#f97316' },
    { name: 'Unknown', value: stats.balanced - stats.exothermic - stats.endothermic, color: '#5e5e5e' },
  ].filter((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
            <BarChart3 className="w-8 h-8 text-[#1A1A1A]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">
              Telemetry_Analytics
            </h2>
            <span className="text-[10px] font-bold text-[#1A1A1A] bg-[#EAE8E4] px-1 border border-[#1A1A1A] uppercase tracking-widest">
              {stats.total} reactions logged
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {confirmReset ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-[10px] font-black text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] hover:bg-[#EAE8E4] transition-all uppercase tracking-widest shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetWorkspace();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 text-[10px] font-black text-white bg-[#ff6b6b] border-2 border-[#1A1A1A] hover:bg-[#e75353] transition-all uppercase tracking-widest flex items-center gap-2 shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none"
              >
                <Trash2 className="w-3 h-3" /> Confirm_Purge
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 text-[10px] font-black text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EAE8E4] hover:text-[#ff6b6b] transition-all uppercase tracking-widest flex items-center gap-2 active:translate-y-0.5 active:shadow-none"
            >
              <Trash2 className="w-3 h-3" /> Purge_Log
            </button>
          )}
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Hash className="w-5 h-5" />}
          label="Total Reactions"
          value={stats.total.toString()}
          color="text-[#1A1A1A]"
          accent="border-[#1A1A1A] bg-white text-[#1A1A1A]"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Balanced"
          value={stats.balanced.toString()}
          sub={stats.total > 0 ? `${Math.round((stats.balanced / stats.total) * 100)}%` : '—'}
          color="text-[#1A1A1A]"
          accent="border-[#1A1A1A] bg-[#D4FF00] text-[#1A1A1A]"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Exothermic"
          value={stats.exothermic.toString()}
          color="text-[#1A1A1A]"
          accent="border-[#1A1A1A] bg-[#EAE8E4] text-[#1A1A1A]"
        />
        <StatCard
          icon={<Snowflake className="w-5 h-5" />}
          label="Avg ΔH"
          value={`${stats.avgEnthalpy} kJ`}
          color="text-[#1A1A1A]"
          accent="border-[#1A1A1A] bg-white text-[#1A1A1A]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Enthalpy Sparkline */}
          {stats.enthalpyData.length > 1 && (
            <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-6">
              <div className="flex items-center justify-between mb-4 border-b border-[#1A1A1A] pb-2">
                <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-[#1A1A1A]" /> Enthalpy_Trend (last 10)
                </h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={stats.enthalpyData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="i" hide />
                    <YAxis stroke="#1A1A1A" tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip
                      cursor={{fill: '#EAE8E4'}}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] p-2 text-[10px] font-mono font-bold">
                            <p className="text-[#1A1A1A]">ΔH</p>
                            <p className="text-[#1A1A1A]">
                              {payload[0].value as number} kJ/mol
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar
                      dataKey="dH"
                      radius={[0, 0, 0, 0]}
                      label={false}
                    >
                      {stats.enthalpyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.dH < 0 ? '#10b981' : '#f97316'}
                          stroke="#1A1A1A"
                          strokeWidth={2}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-4 bg-[#EAE8E4] border border-[#1A1A1A] px-2 py-1 w-fit">
                <Legend_Item color="#10b981" label="Exothermic (ΔH < 0)" />
                <Legend_Item color="#f97316" label="Endothermic (ΔH > 0)" />
              </div>
            </div>
          )}

          {/* Type Distribution */}
          {stats.typeData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-6">
                <h3 className="text-[10px] font-black text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Database className="w-3 h-3 text-[#1A1A1A]" /> Reaction_Types
                </h3>
                <div className="space-y-4 pt-2">
                  {stats.typeData.map((t, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-black">
                        <span className="text-[#1A1A1A] uppercase">{t.name}</span>
                        <span className="text-[#1A1A1A]">{t.value}</span>
                      </div>
                      <div className="h-3 w-full border border-[#1A1A1A] bg-[#EAE8E4] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(t.value / stats.total) * 100}%`,
                          }}
                          transition={{ delay: i * 0.05 }}
                          className="h-full bg-[#1A1A1A] border-r-2 border-[#1A1A1A]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {pieData.length > 0 && (
                <div className="bg-[#EAE8E4] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-6 flex flex-col items-center">
                  <h3 className="text-[10px] font-black text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 uppercase tracking-[0.2em] mb-4 self-stretch flex items-center gap-2">
                    <Activity className="w-3 h-3 text-[#1A1A1A]" /> Thermicity_Split
                  </h3>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="#1A1A1A" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] p-2 text-[10px] font-mono font-black">
                                <p className="text-[#1A1A1A]">
                                  {payload[0].name}: {payload[0].value}
                                </p>
                              </div>
                            ) : null
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-3 flex-wrap justify-center mt-4 bg-white border border-[#1A1A1A] px-2 py-1 shadow-[2px_2px_0px_#1A1A1A]">
                    {pieData.map((d, i) => (
                      <Legend_Item key={i} color={d.color} label={d.name} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {reactionLog.length === 0 && (
            <div className="bg-white border-2 border-dashed border-[#1A1A1A] p-12 flex flex-col items-center gap-4 text-center">
              <BarChart3 className="w-10 h-10 text-[#1A1A1A]/40" />
              <p className="text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-widest">
                No reactions logged yet.
                <br />
                Solve a reaction in the Laboratory to begin.
              </p>
            </div>
          )}
        </div>

        {/* Right: History Log */}
        <div className="lg:col-span-5">
          <div className="bg-[#D4FF00] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5 border-b border-[#1A1A1A] pb-2">
              <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-3 h-3 text-[#1A1A1A]" /> Reaction_Log
              </h3>
              <span className="text-[10px] font-mono font-bold px-1 border border-[#1A1A1A] bg-white text-[#1A1A1A]">
                {reactionLog.length} entries
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-150">
              <AnimatePresence>
                {reactionLog.length === 0 ? (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#1A1A1A] bg-white">
                    <span className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-widest">
                      Empty
                    </span>
                  </div>
                ) : (
                  reactionLog.map((entry, i) => (
                    <motion.div
                      key={entry.timestamp}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="group flex items-start justify-between p-3 bg-white border-2 border-[#1A1A1A] hover:bg-[#EAE8E4] transition-all shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-1"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-1 w-2 h-2 border border-[#1A1A1A] shrink-0 ${
                            entry.isBalanced
                              ? entry.isExothermic === true
                                ? 'bg-emerald-500'
                                : entry.isExothermic === false
                                ? 'bg-orange-400'
                                : 'bg-[#D4FF00]'
                              : 'bg-red-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-[12px] font-mono font-black text-[#1A1A1A] truncate">
                            {entry.expression}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {entry.reactionType && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-[#1A1A1A] text-white font-black uppercase">
                                {entry.reactionType}
                              </span>
                            )}
                            {entry.enthalpy !== undefined && (
                              <span
                                className={`text-[8px] font-mono font-black border border-[#1A1A1A] px-1 bg-white ${
                                  entry.isExothermic ? 'text-emerald-500' : 'text-orange-500'
                                }`}
                              >
                                ΔH={entry.enthalpy} kJ
                              </span>
                            )}
                            {!entry.isBalanced && (
                              <span className="text-[8px] font-black text-white bg-red-500 border border-[#1A1A1A] px-1">FAILED</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pl-2 self-center">
                        <span className="text-[9px] font-bold text-[#1A1A1A]">
                          {timeAgo(entry.timestamp)}
                        </span>
                        <ChevronRight className="w-3 h-3 text-[#1A1A1A] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  accent: string;
}) {
  return (
    <div className={`border-2 shadow-[2px_2px_0px_#1A1A1A] ${accent} p-5 flex flex-col gap-3 group hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform`}>
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black font-mono text-[#1A1A1A]">{value}</p>
        {sub && <p className={`text-xs font-mono font-bold ${color} border border-[#1A1A1A] w-fit px-1 mt-1 bg-white inline-block`}>{sub}</p>}
        <p className="text-[9px] font-black text-[#1A1A1A] uppercase tracking-widest mt-2 border-t border-[#1A1A1A] pt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

function Legend_Item({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 border border-[#1A1A1A]" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-black text-[#1A1A1A] uppercase">{label}</span>
    </div>
  );
}