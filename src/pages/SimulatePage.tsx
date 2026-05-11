import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react'; // FIXED: was 'framer-motion'
import {
  Activity,
  Thermometer,
  Droplets,
  Wind,
  Rotate3D,
  Maximize,
  Orbit,
  Gauge,
  ScanLine,
  Lock,
  Unlock,
  Zap,
  ChevronRight,
  BarChart3,
  Database,
  Flame,
  Snowflake,
  Waves,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { MolecularExplorer } from '../components/visualization/MolecularExplorer';
import { useOWDAStore } from '../store';
import { renderFormula } from '../utils/renderFormula';

// ─── Maxwell–Boltzmann Distribution ──────────────────────────────────────────

const BOLTZMANN = 1.380649e-23; // J/K
const AVOGADRO  = 6.02214076e23;

/**
 * Maxwell-Boltzmann speed probability density f(v) at temperature T.
 * molarMassKg: molar mass in kg/mol
 */
function maxwellBoltzmann(v: number, T: number, molarMassKg: number): number {
  if (T <= 0 || molarMassKg <= 0 || v < 0) return 0;
  const m = molarMassKg / AVOGADRO; // mass per molecule (kg)
  const kT = BOLTZMANN * T;
  return (
    4 * Math.PI *
    Math.pow(m / (2 * Math.PI * kT), 1.5) *
    v * v *
    Math.exp(-(m * v * v) / (2 * kT))
  );
}

function buildMBData(T: number, molarMassKg: number, T_ref = 298) {
  const vMax = Math.sqrt((2 * BOLTZMANN * Math.max(T, T_ref) * 3) / (molarMassKg / AVOGADRO));
  const N = 60;
  const step = vMax / N;
  return Array.from({ length: N + 1 }, (_, i) => {
    const v = i * step;
    return {
      v: Math.round(v),
      f: maxwellBoltzmann(v, T, molarMassKg) * 1e-3, // scale for display
      f_ref: maxwellBoltzmann(v, T_ref, molarMassKg) * 1e-3,
    };
  });
}

/** Most probable speed: sqrt(2RT/M) */
function vmp(T: number, molarMassKg: number) {
  return Math.sqrt((2 * BOLTZMANN * T) / (molarMassKg / AVOGADRO));
}

// ─── Phase State ─────────────────────────────────────────────────────────────

const MOLECULE_PHASES: Record<
  string,
  { meltK: number; boilK: number; name: string }
> = {
  H2O:  { meltK: 273.15, boilK: 373.15, name: 'Water'         },
  NH3:  { meltK: 195.4,  boilK: 239.8,  name: 'Ammonia'       },
  CH4:  { meltK: 90.7,   boilK: 111.7,  name: 'Methane'       },
  CO2:  { meltK: 194.7,  boilK: 194.7,  name: 'Carbon Dioxide'},
  HCl:  { meltK: 159.0,  boilK: 188.1,  name: 'Hydrogen Chloride'},
  O2:   { meltK: 54.4,   boilK: 90.2,   name: 'Oxygen'        },
  N2:   { meltK: 63.2,   boilK: 77.4,   name: 'Nitrogen'      },
  H2:   { meltK: 14.0,   boilK: 20.3,   name: 'Hydrogen'      },
};

function getPhase(formula: string, T: number) {
  const data = MOLECULE_PHASES[formula];
  if (!data) return 'gas'; // default for unknowns
  if (T < data.meltK) return 'solid';
  if (T < data.boilK) return 'liquid';
  return 'gas';
}

const PHASE_CONFIG = {
  solid:  { icon: <Snowflake className="w-4 h-4" />, label: 'Solid',  color: 'text-sky-400',     bg: 'bg-sky-400/10  border-sky-400/30'     },
  liquid: { icon: <Waves     className="w-4 h-4" />, label: 'Liquid', color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30'    },
  gas:    { icon: <Wind      className="w-4 h-4" />, label: 'Gas',    color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30'},
};

// ─── Spectral Peaks (simplified IR estimate) ──────────────────────────────────

function buildIRSpectrum(formula: string): { wn: number; intensity: number; label: string }[] {
  const counts: Record<string, number> = {};
  const matches = formula.matchAll(/([A-Z][a-z]*)(\d*)/g);
  for (const m of matches) {
    counts[m[1]] = (counts[m[1]] ?? 0) + parseInt(m[2] || '1', 10);
  }

  const peaks: { wn: number; intensity: number; label: string }[] = [];

  if (counts['O'] && counts['H'])      peaks.push({ wn: 3450, intensity: 95,  label: 'O–H str.' });
  if (counts['N'] && counts['H'])      peaks.push({ wn: 3380, intensity: 80,  label: 'N–H str.' });
  if (counts['C'] && counts['H'])      peaks.push({ wn: 2950, intensity: 70,  label: 'C–H str.' });
  if (counts['C'] && counts['O'])      peaks.push({ wn: 1720, intensity: 100, label: 'C=O str.' });
  if (counts['C'] && counts['C'])      peaks.push({ wn: 1640, intensity: 50,  label: 'C=C str.' });
  if (counts['N'] && counts['O'])      peaks.push({ wn: 1540, intensity: 85,  label: 'N–O str.' });
  if (counts['C'])                     peaks.push({ wn: 1460, intensity: 40,  label: 'C–H bend'  });
  if (counts['S'])                     peaks.push({ wn: 1120, intensity: 60,  label: 'S=O str.' });
  if (counts['C'] && counts['O'])      peaks.push({ wn: 1050, intensity: 55,  label: 'C–O str.' });
  if (counts['C'] && counts['N'])      peaks.push({ wn: 2220, intensity: 75,  label: 'C≡N str.' });

  // Always add a fingerprint region noise floor
  for (let wn = 600; wn <= 1400; wn += 100) {
    if (!peaks.find((p) => Math.abs(p.wn - wn) < 80)) {
      peaks.push({ wn, intensity: Math.random() * 20 + 5, label: 'fingerprint' });
    }
  }

  return peaks.sort((a, b) => a.wn - b.wn);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SimulatePage() {
  const { currentReaction } = useOWDAStore();

  const targetMolecule = useMemo(() => {
    return currentReaction?.products.molecules[0]?.molecule ?? {
      formula: 'H2O',
      molarMass: 18.015,
    };
  }, [currentReaction]);

  const [envParams, setEnvParams] = useState({ temp: 298, pressure: 1.0 });
  const [isLocked, setIsLocked]   = useState(false);
  const [activeSpectralPeak, setActiveSpectralPeak] = useState<number | undefined>();

  const molarMassKg = (targetMolecule.molarMass || 18) / 1000;

  // ── Kinetics (Maxwell–Boltzmann derived) ────────────────────────────────────
  const kinetics = useMemo(() => {
    const T = envParams.temp;
    const M = molarMassKg;
    const R = 8.314;

    const vrms  = Math.sqrt((3 * R * T) / M).toFixed(0);
    const vavg  = Math.sqrt((8 * R * T) / (Math.PI * M)).toFixed(0);
    const vmpStr = vmp(T, M).toFixed(0);

    return {
      vrms,
      vavg,
      vmp: vmpStr,
      collisionFreq: ((envParams.pressure * T) / 200).toFixed(2),
      stability: T > 1000 ? 'CRITICAL' : T > 600 ? 'WARNING' : 'NOMINAL',
    };
  }, [envParams, molarMassKg]);

  const phase = useMemo(
    () => getPhase(targetMolecule.formula, envParams.temp),
    [targetMolecule.formula, envParams.temp]
  );

  const phaseConfig = PHASE_CONFIG[phase];

  // ── Maxwell–Boltzmann chart data ─────────────────────────────────────────────
  const mbData = useMemo(
    () => buildMBData(envParams.temp, molarMassKg),
    [envParams.temp, molarMassKg]
  );

  // ── IR Spectrum ──────────────────────────────────────────────────────────────
  const irSpectrum = useMemo(
    () => buildIRSpectrum(targetMolecule.formula),
    [targetMolecule.formula]
  );

  const onRangeChange = useCallback(
    (key: 'temp' | 'pressure') => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isLocked) {
        setEnvParams((p) => ({ ...p, [key]: parseFloat(e.target.value) }));
      }
    },
    [isLocked]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-6 font-sans"
    >
      {/* HUD Header */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#050510]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-owda-teal/20 blur-2xl rounded-full" />
            <Orbit className="w-10 h-10 text-owda-teal relative z-10 animate-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-owda-snow uppercase italic flex items-center gap-2">
              Horizon <span className="text-owda-teal">Simulator</span>
              <span className="not-italic text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-owda-gray font-mono ml-2">
                V3.0
              </span>
            </h2>
            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Kinetic_Engine_Live — Maxwell–Boltzmann
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <StatHUD icon={<Thermometer className="w-4 h-4" />} label="Temp"  value={`${envParams.temp} K`}             color="text-owda-teal" />
          <StatHUD icon={<Gauge       className="w-4 h-4" />} label="Press" value={`${envParams.pressure.toFixed(2)} atm`} color="text-owda-blue" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-[10px] font-mono ${phaseConfig.bg} ${phaseConfig.color}`}>
            {phaseConfig.icon}
            <span>{phaseConfig.label}</span>
          </div>
          <button
            onClick={() => setIsLocked((p) => !p)}
            className={`p-3 rounded-2xl transition-all border ${
              isLocked
                ? 'bg-red-500/10 border-red-500/50 text-red-500'
                : 'bg-white/5 border-white/10 text-owda-gray hover:border-owda-teal/50 hover:text-owda-teal'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

        {/* LEFT: Controls */}
        <aside className="lg:col-span-3 flex flex-col gap-5">

          {/* Target Card */}
          <section className="bg-linear-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <Database className="absolute -top-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
            <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ScanLine className="w-3 h-3 text-owda-teal" /> Target_Vector
            </h3>
            <div className="text-5xl font-black text-center mb-6 tracking-tighter text-owda-snow">
              {renderFormula(targetMolecule.formula)}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <MetricDisplay label="M (molar)"  value={`${targetMolecule.molarMass} g/mol`} />
              <MetricDisplay label="V_RMS"      value={`${kinetics.vrms} m/s`}              />
              <MetricDisplay label="V_avg"      value={`${kinetics.vavg} m/s`}              />
              <MetricDisplay label="V_mp"       value={`${kinetics.vmp} m/s`}               />
              <MetricDisplay
                label="Stability"
                value={kinetics.stability}
                color={
                  kinetics.stability === 'NOMINAL'
                    ? 'text-emerald-400'
                    : kinetics.stability === 'WARNING'
                    ? 'text-orange-400'
                    : 'text-red-400'
                }
              />
            </div>
          </section>

          {/* Environment Controls */}
          <section
            className={`bg-black/40 border border-white/5 rounded-3xl p-6 space-y-6 transition-all duration-500 ${
              isLocked ? 'grayscale opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-[10px] font-black text-owda-blue uppercase tracking-[0.2em]">
              Environment_Shift
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-owda-gray uppercase tracking-widest">
                  Temperature
                </span>
                <span className="text-sm font-mono font-bold text-owda-teal">
                  {envParams.temp} K
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1500"
                step="1"
                value={envParams.temp}
                onChange={onRangeChange('temp')}
                className="w-full h-1.5 rounded-lg appearance-none bg-white/5 cursor-pointer accent-owda-teal"
              />
              <div className="flex justify-between text-[8px] font-mono text-owda-gray/40">
                <span>10 K</span><span>1500 K</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-owda-gray uppercase tracking-widest">
                  Pressure
                </span>
                <span className="text-sm font-mono font-bold text-owda-blue">
                  {envParams.pressure.toFixed(1)} atm
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="250"
                step="0.1"
                value={envParams.pressure}
                onChange={onRangeChange('pressure')}
                className="w-full h-1.5 rounded-lg appearance-none bg-white/5 cursor-pointer accent-owda-blue"
              />
              <div className="flex justify-between text-[8px] font-mono text-owda-gray/40">
                <span>0.1</span><span>250 atm</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setEnvParams({ temp: 298, pressure: 1.0 })}
                className="w-full py-3 border border-white/10 text-owda-gray text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
              >
                Reset to STP
              </button>
            </div>
          </section>
        </aside>

        {/* CENTER: 3D Viewer */}
        <main className="lg:col-span-5 bg-[#020205] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col group min-h-105">
          <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

          <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start pointer-events-none">
            <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-owda-teal animate-pulse'}`} />
              <span className="text-[10px] font-mono uppercase tracking-widest">
                Feed: Orbital_Node_01
              </span>
            </div>
            <div className="flex gap-2 pointer-events-auto">
              <IconButton icon={<Maximize  className="w-4 h-4" />} />
              <IconButton icon={<Activity  className="w-4 h-4" />} />
            </div>
          </div>

          <div className="flex-1 relative">
            <MolecularExplorer formula={targetMolecule.formula} />
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end pointer-events-none">
            <div className="flex gap-3">
              <DataBadge label="Collision"  value={`${kinetics.collisionFreq} THz`} />
              <DataBadge label="Phase"      value={phaseConfig.label}               />
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 pointer-events-auto">
              <Rotate3D className="w-5 h-5 text-owda-gray hover:text-owda-teal cursor-pointer transition-colors" />
            </div>
          </div>
        </main>

        {/* RIGHT: Analytics */}
        <aside className="lg:col-span-4 flex flex-col gap-5">

          {/* Maxwell–Boltzmann Chart */}
          <section className="bg-black/40 border border-white/5 rounded-3xl p-6">
            <h3 className="text-[10px] font-black text-owda-snow uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
              <Zap className="w-3 h-3 text-owda-teal" /> Maxwell–Boltzmann Distribution
            </h3>
            <p className="text-[8px] font-mono text-owda-gray/40 mb-4">
              Green = {envParams.temp}K · Gray = 298K (ref)
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mbData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#56a099" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#56a099" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="v"
                    tick={{ fontSize: 8, fill: '#5e5e5e' }}
                    label={{ value: 'v (m/s)', position: 'insideBottomRight', offset: -4, fontSize: 8, fill: '#5e5e5e' }}
                  />
                  <YAxis tick={false} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-[#0a0a1a] border border-white/20 p-2 rounded-lg text-[10px] font-mono">
                          <p className="text-owda-gray">v = {payload[0]?.payload?.v} m/s</p>
                          <p className="text-owda-teal">f(v) = {Number(payload[0]?.value).toExponential(2)}</p>
                        </div>
                      ) : null
                    }
                  />
                  {/* Reference at 298K */}
                  <Area
                    type="monotone"
                    dataKey="f_ref"
                    stroke="#5e5e5e"
                    strokeWidth={1}
                    fill="transparent"
                    strokeDasharray="4 2"
                  />
                  {/* Current temperature */}
                  <Area
                    type="monotone"
                    dataKey="f"
                    stroke="#56a099"
                    strokeWidth={2}
                    fill="url(#mbGrad)"
                  />
                  {/* Most Probable Speed marker */}
                  <ReferenceLine
                    x={Math.round(vmp(envParams.temp, molarMassKg))}
                    stroke="#56a099"
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* IR Spectrum */}
          <section className="bg-black/40 border border-white/5 rounded-3xl p-6 flex-1">
            <h3 className="text-[10px] font-black text-owda-snow uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-owda-blue" /> IR_Spectral_Analysis
            </h3>
            <div className="relative h-36 flex items-end gap-px border-l border-b border-white/10">
              {irSpectrum.map((peak, i) => {
                const isActive = activeSpectralPeak === i;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 cursor-pointer"
                    style={{ height: `${peak.intensity}%` }}
                    onMouseEnter={() => setActiveSpectralPeak(i)}
                    onMouseLeave={() => setActiveSpectralPeak(undefined)}
                  >
                    <div
                      className={`w-full h-full rounded-t-sm transition-colors ${
                        isActive ? 'bg-owda-teal' : 'bg-owda-teal/20'
                      }`}
                    />
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {activeSpectralPeak !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-8 left-0 right-0 text-center text-[10px] font-mono text-owda-teal bg-owda-teal/10 py-1 rounded-lg border border-owda-teal/20 pointer-events-none"
                  >
                    {irSpectrum[activeSpectralPeak].wn} cm⁻¹ — {irSpectrum[activeSpectralPeak].label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex justify-between text-[8px] font-mono text-owda-gray/40 mt-1">
              <span>4000 cm⁻¹</span><span>600 cm⁻¹</span>
            </div>

            {/* Electronic Properties */}
            <div className="space-y-4 mt-6 pt-4 border-t border-white/5">
              <h4 className="text-[9px] font-black text-owda-gray uppercase tracking-widest">
                Electronic_Properties
              </h4>
              <TelemetryRow label="Dipole Moment"  value="1.85 D"   progress={65} color="bg-owda-teal"   />
              <TelemetryRow label="Polarizability" value="1.45 Å³"  progress={42} color="bg-owda-blue"   />
              <TelemetryRow label="HOMO-LUMO Gap"  value="5.2 eV"   progress={88} color="bg-purple-500"  />
            </div>
          </section>
        </aside>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricDisplay({
  label,
  value,
  sub,
  color = 'text-owda-snow',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white/3 px-3 py-2 rounded-xl border border-white/5">
      <p className="text-[8px] font-black text-owda-gray uppercase tracking-widest">{label}</p>
      <p className={`text-xs font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TelemetryRow({
  label,
  value,
  progress,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-mono">
        <span className="text-owda-gray uppercase">{label}</span>
        <span className="text-owda-snow">{value}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function DataBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
      <p className="text-[8px] text-owda-gray font-black uppercase tracking-tighter mb-0.5">{label}</p>
      <p className="text-xs font-mono text-owda-snow font-bold">{value}</p>
    </div>
  );
}

function StatHUD({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
      <span className={color}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-[8px] uppercase text-owda-gray font-black tracking-tighter">{label}</span>
        <span className={`text-xs font-mono font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-owda-gray hover:text-owda-teal transition-all active:scale-90">
      {icon}
    </button>
  );
}