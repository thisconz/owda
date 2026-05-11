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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-owda-snow uppercase italic">
              Telemetry_Analytics
            </h2>
            <span className="text-[10px] font-mono text-owda-gray uppercase tracking-widest">
              {stats.total} reactions logged
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {confirmReset ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-[10px] font-bold text-owda-gray border border-white/10 rounded-xl hover:bg-white/5 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetWorkspace();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 text-[10px] font-bold text-black bg-red-500 rounded-xl hover:bg-red-400 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Confirm_Purge
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 text-[10px] font-bold text-owda-gray border border-white/10 rounded-xl hover:bg-white/5 hover:text-red-400 hover:border-red-500/30 transition-all uppercase tracking-widest flex items-center gap-2"
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
          color="text-owda-teal"
          accent="border-owda-teal/20 bg-owda-teal/5"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Balanced"
          value={stats.balanced.toString()}
          sub={stats.total > 0 ? `${Math.round((stats.balanced / stats.total) * 100)}%` : '—'}
          color="text-emerald-400"
          accent="border-emerald-500/20 bg-emerald-500/5"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Exothermic"
          value={stats.exothermic.toString()}
          color="text-orange-400"
          accent="border-orange-500/20 bg-orange-500/5"
        />
        <StatCard
          icon={<Snowflake className="w-5 h-5" />}
          label="Avg ΔH"
          value={`${stats.avgEnthalpy} kJ`}
          color="text-owda-blue"
          accent="border-owda-blue/20 bg-owda-blue/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Enthalpy Sparkline */}
          {stats.enthalpyData.length > 1 && (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-owda-teal" /> Enthalpy_Trend (last 10)
                </h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.enthalpyData} barSize={18}>
                    <XAxis dataKey="i" hide />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-[#0a0a1a] border border-white/20 p-2 rounded-lg text-[10px] font-mono">
                            <p className="text-owda-gray">ΔH</p>
                            <p className="text-owda-snow font-bold">
                              {payload[0].value as number} kJ/mol
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar
                      dataKey="dH"
                      fill="#56a099"
                      radius={[4, 4, 0, 0]}
                      // Color bar red if endothermic, teal if exothermic
                      label={false}
                    >
                      {stats.enthalpyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.dH < 0 ? '#10b981' : '#f97316'}
                          fillOpacity={0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <Legend_Item color="#10b981" label="Exothermic (ΔH < 0)" />
                <Legend_Item color="#f97316" label="Endothermic (ΔH > 0)" />
              </div>
            </div>
          )}

          {/* Type Distribution */}
          {stats.typeData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Database className="w-3 h-3 text-owda-blue" /> Reaction_Types
                </h3>
                <div className="space-y-3">
                  {stats.typeData.map((t, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-owda-gray uppercase">{t.name}</span>
                        <span className="text-owda-snow">{t.value}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(t.value / stats.total) * 100}%`,
                          }}
                          transition={{ delay: i * 0.05 }}
                          className="h-full bg-owda-teal"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {pieData.length > 0 && (
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
                  <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] mb-4 self-start flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-400" /> Thermicity_Split
                  </h3>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={56}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="bg-[#0a0a1a] border border-white/20 p-2 rounded-lg text-[10px] font-mono">
                                <p className="text-owda-snow font-bold">
                                  {payload[0].name}: {payload[0].value}
                                </p>
                              </div>
                            ) : null
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {pieData.map((d, i) => (
                      <Legend_Item key={i} color={d.color} label={d.name} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {reactionLog.length === 0 && (
            <div className="bg-black/40 border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
              <BarChart3 className="w-10 h-10 text-owda-gray/20" />
              <p className="text-[11px] font-mono text-owda-gray/40 uppercase tracking-widest">
                No reactions logged yet.
                <br />
                Solve a reaction in the Laboratory to begin.
              </p>
            </div>
          )}
        </div>

        {/* Right: History Log */}
        <div className="lg:col-span-5">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-3 h-3 text-owda-teal" /> Reaction_Log
              </h3>
              <span className="text-[8px] font-mono text-owda-gray/40">
                {reactionLog.length} entries
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-150">
              <AnimatePresence>
                {reactionLog.length === 0 ? (
                  <div className="flex items-center justify-center h-32 border border-dashed border-white/10 rounded-xl">
                    <span className="text-[9px] font-mono text-owda-gray/30 uppercase tracking-widest">
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
                      className="group flex items-start justify-between p-3 bg-white/2 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            entry.isBalanced
                              ? entry.isExothermic === true
                                ? 'bg-emerald-500'
                                : entry.isExothermic === false
                                ? 'bg-orange-400'
                                : 'bg-owda-teal'
                              : 'bg-red-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-owda-snow truncate">
                            {entry.expression}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {entry.reactionType && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-owda-teal/10 border border-owda-teal/20 rounded text-owda-teal font-mono uppercase">
                                {entry.reactionType}
                              </span>
                            )}
                            {entry.enthalpy !== undefined && (
                              <span
                                className={`text-[8px] font-mono ${
                                  entry.isExothermic ? 'text-emerald-400' : 'text-orange-400'
                                }`}
                              >
                                ΔH={entry.enthalpy} kJ
                              </span>
                            )}
                            {!entry.isBalanced && (
                              <span className="text-[8px] font-mono text-red-400">FAILED</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="text-[8px] font-mono text-owda-gray/40">
                          {timeAgo(entry.timestamp)}
                        </span>
                        <ChevronRight className="w-3 h-3 text-owda-gray/20 group-hover:text-owda-teal transition-colors" />
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
    <div className={`border ${accent} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className={`${color} opacity-70`}>{icon}</div>
      <div>
        <p className="text-2xl font-black font-mono text-owda-snow">{value}</p>
        {sub && <p className={`text-xs font-mono ${color} opacity-60`}>{sub}</p>}
        <p className="text-[9px] font-mono text-owda-gray uppercase tracking-widest mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

function Legend_Item({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-mono text-owda-gray uppercase">{label}</span>
    </div>
  );
}