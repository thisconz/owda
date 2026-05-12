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

const PHASE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  solid:  { icon: <Snowflake className="w-4 h-4" />, label: 'Solid',  color: 'text-[#1A1A1A]',     bg: 'bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'     },
  liquid: { icon: <Waves     className="w-4 h-4" />, label: 'Liquid', color: 'text-[#1A1A1A]',    bg: 'bg-[#D4FF00] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'    },
  gas:    { icon: <Wind      className="w-4 h-4" />, label: 'Gas',    color: 'text-white', bg: 'bg-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'},
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
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white border-2 border-[#1A1A1A] rounded-none shrink-0 shadow-[4px_4px_0px_#1A1A1A]">
        <div className="flex items-center gap-5">
          <div className="relative border-2 border-[#1A1A1A] p-2 bg-[#EAE8E4]">
            <Orbit className="w-8 h-8 text-[#1A1A1A] relative z-10 animate-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-[#1A1A1A] uppercase italic flex items-center gap-2">
              Horizon <span className="bg-[#D4FF00] px-2 border-2 border-[#1A1A1A] not-italic">Simulator</span>
              <span className="not-italic text-[10px] bg-white border-2 border-[#1A1A1A] px-2 py-0.5 rounded-none text-[#1A1A1A] font-bold ml-2 shadow-[2px_2px_0px_#1A1A1A]">
                V3.0
              </span>
            </h2>
            <span className="text-[9px] font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5 mt-1 border border-[#1A1A1A] inline-flex px-1 bg-[#EAE8E4]">
              <span className="w-2 h-2 border border-[#1A1A1A] bg-[#D4FF00] animate-pulse" />
              Kinetic_Engine_Live — Maxwell–Boltzmann
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <StatHUD icon={<Thermometer className="w-4 h-4" />} label="Temp"  value={`${envParams.temp} K`}             color="text-[#1A1A1A]" />
          <StatHUD icon={<Gauge       className="w-4 h-4" />} label="Press" value={`${envParams.pressure.toFixed(2)} atm`} color="text-[#1A1A1A]" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-none text-[10px] font-black uppercase ${phaseConfig.bg} ${phaseConfig.color}`}>
            {phaseConfig.icon}
            <span>{phaseConfig.label}</span>
          </div>
          <button
            onClick={() => setIsLocked((p) => !p)}
            className={`p-3 rounded-none transition-all border-2 shadow-[2px_2px_0px_#1A1A1A] ${
              isLocked
                ? 'bg-[#ff6b6b] border-[#1A1A1A] text-[#1A1A1A]'
                : 'bg-white border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#EAE8E4]'
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
          <section className="bg-white border-2 border-[#1A1A1A] rounded-none shadow-[4px_4px_0px_#1A1A1A] p-6 relative overflow-hidden">
            <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-[#1A1A1A] pb-2">
              <ScanLine className="w-3 h-3 text-[#1A1A1A]" /> Target_Vector
            </h3>
            <div className="text-5xl font-black text-center mb-6 tracking-tighter text-[#1A1A1A]">
              {renderFormula(targetMolecule.formula)}
            </div>
            <div className="grid grid-cols-1 gap-4">
              <MetricDisplay label="M (molar)"  value={`${targetMolecule.molarMass} g/mol`} />
              <MetricDisplay label="V_RMS"      value={`${kinetics.vrms} m/s`}              />
              <MetricDisplay label="V_avg"      value={`${kinetics.vavg} m/s`}              />
              <MetricDisplay label="V_mp"       value={`${kinetics.vmp} m/s`}               />
              <MetricDisplay
                label="Stability"
                value={kinetics.stability}
                color={
                  kinetics.stability === 'NOMINAL'
                    ? 'text-[#1A1A1A] bg-[#D4FF00]'
                    : kinetics.stability === 'WARNING'
                    ? 'text-[#1A1A1A] bg-orange-400'
                    : 'text-white bg-[#ff6b6b]'
                }
              />
            </div>
          </section>

          {/* Environment Controls */}
          <section
            className={`bg-[#EAE8E4] border-2 border-[#1A1A1A] rounded-none shadow-[4px_4px_0px_#1A1A1A] p-6 space-y-6 transition-all duration-500 ${
              isLocked ? 'grayscale opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-[10px] font-black text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 uppercase tracking-[0.2em]">
              Environment_Shift
            </h3>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">
                  Temperature
                </span>
                <span className="text-sm font-mono font-black border border-[#1A1A1A] px-2 bg-white text-[#1A1A1A]">
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
                className="w-full h-8 rounded-none appearance-none bg-white border-2 border-[#1A1A1A] cursor-pointer accent-[#1A1A1A]"
              />
              <div className="flex justify-between text-[8px] font-bold text-[#1A1A1A]">
                <span>10 K</span><span>1500 K</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">
                  Pressure
                </span>
                <span className="text-sm font-mono font-black border border-[#1A1A1A] px-2 bg-white text-[#1A1A1A]">
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
                className="w-full h-8 rounded-none appearance-none bg-white border-2 border-[#1A1A1A] cursor-pointer accent-[#1A1A1A]"
              />
              <div className="flex justify-between text-[8px] font-bold text-[#1A1A1A]">
                <span>0.1</span><span>250 atm</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setEnvParams({ temp: 298, pressure: 1.0 })}
                className="w-full py-3 border-2 border-[#1A1A1A] text-[#1A1A1A] bg-white shadow-[2px_2px_0px_#1A1A1A] text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:translate-y-1 active:shadow-none"
              >
                Reset to STP
              </button>
            </div>
          </section>
        </aside>

        {/* CENTER: 3D Viewer */}
        <main className="lg:col-span-5 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-none relative overflow-hidden flex flex-col group min-h-105">
          <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start pointer-events-none">
            <div className="bg-white px-4 py-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] flex items-center gap-3">
              <div className={`w-3 h-3 border border-[#1A1A1A] ${isLocked ? 'bg-[#ff6b6b]' : 'bg-[#D4FF00] animate-pulse'}`} />
              <span className="text-[10px] font-mono font-black uppercase text-[#1A1A1A]">
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
            <div className="bg-white p-4 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] pointer-events-auto">
              <Rotate3D className="w-5 h-5 text-[#1A1A1A] hover:text-[#D4FF00] cursor-pointer transition-colors" />
            </div>
          </div>
        </main>

        {/* RIGHT: Analytics */}
        <aside className="lg:col-span-4 flex flex-col gap-5">

          {/* Maxwell–Boltzmann Chart */}
          <section className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-none p-6">
            <h3 className="text-[10px] font-black text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-[#1A1A1A]" /> MB Distribution
            </h3>
            <p className="text-[9px] font-bold text-[#1A1A1A]/70 mb-4 px-2 bg-[#EAE8E4] border border-[#1A1A1A] inline-block">
              Solid = {envParams.temp}K · Dashed = 298K
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={mbData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="v"
                    tick={{ fontSize: 10, fill: '#1A1A1A', fontWeight: 'bold' }}
                    label={{ value: 'v (m/s)', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#1A1A1A', fontWeight: 'bold' }}
                  />
                  <YAxis tick={false} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] p-2 text-[10px] font-mono font-bold">
                          <p className="text-[#1A1A1A]">Line: v = {payload[0]?.payload?.v} m/s</p>
                          <p className="text-[#1A1A1A]">Prob: {Number(payload[0]?.value).toExponential(2)}</p>
                        </div>
                      ) : null
                    }
                  />
                  {/* Reference at 298K */}
                  <Area
                    type="monotone"
                    dataKey="f_ref"
                    stroke="#1A1A1A"
                    strokeWidth={2}
                    fill="transparent"
                    strokeDasharray="4 2"
                  />
                  {/* Current temperature */}
                  <Area
                    type="step"
                    dataKey="f"
                    stroke="#1A1A1A"
                    strokeWidth={3}
                    fill="#D4FF00"
                    fillOpacity={1}
                  />
                  {/* Most Probable Speed marker */}
                  <ReferenceLine
                    x={Math.round(vmp(envParams.temp, molarMassKg))}
                    stroke="#1A1A1A"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Energy Profile (Reaction Pathway) */}
          <section className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-none p-6">
            <h3 className="text-[10px] font-black text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3 text-[#1A1A1A]" /> Reaction Pathway
            </h3>
            {currentReaction && currentReaction.isBalanced ? (() => {
              const baseEnergy = 100;
              const deltaH = currentReaction.enthalpy;
              const isExothermic = deltaH < 0;
              const finalEnergy = Math.max(10, baseEnergy + deltaH);
              const ea = currentReaction.activationEnergy ?? 60;
              const peak = Math.max(baseEnergy, finalEnergy) + ea;
              const dynamicEnergyData = [
                { step: 'R', energy: baseEnergy, label: 'Reactants' },
                { step: 'TS', energy: peak, label: 'Transition State' },
                { step: 'P', energy: finalEnergy, label: 'Products' },
              ];
              return (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[8px] font-mono font-bold px-1 py-0.5 border border-[#1A1A1A] ${isExothermic ? 'bg-[#D4FF00] text-[#1A1A1A]' : 'bg-[#EAE8E4] text-[#1A1A1A]'}`}>
                      {isExothermic ? 'EXOTHERMIC' : 'ENDOTHERMIC'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#1A1A1A]/70 px-2 bg-[#EAE8E4] border border-[#1A1A1A]">
                      ΔH = {deltaH.toFixed(1)} kJ
                    </span>
                  </div>
                  <div className="h-32 w-full border-b border-[#1A1A1A]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={dynamicEnergyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="energyGradSim" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isExothermic ? '#ff6b6b' : '#1A1A1A'} stopOpacity={1} />
                            <stop offset="95%" stopColor={isExothermic ? '#ff6b6b' : '#1A1A1A'} stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#1A1A1A', fontWeight: 'bold' }} stroke="#1A1A1A" />
                        <YAxis tick={false} stroke="#1A1A1A" />
                        <Tooltip
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] p-2 text-[10px] font-mono font-bold">
                                <p className="text-[#1A1A1A] uppercase tracking-wider">{payload[0]?.payload?.label}</p>
                                <p className="text-[#1A1A1A] mt-1">E: {payload[0]?.value}</p>
                              </div>
                            ) : null
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="energy"
                          stroke="#1A1A1A"
                          fill="url(#energyGradSim)"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#1A1A1A', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })() : (
              <div className="h-24 w-full flex items-center justify-center border-2 border-dashed border-[#1A1A1A] bg-[#EAE8E4]">
                <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/50 uppercase tracking-widest">Awaiting Reaction Data</span>
              </div>
            )}
          </section>

          {/* IR Spectrum */}
          <section className="bg-[#EAE8E4] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-none p-6 flex-1 flex flex-col">
            <h3 className="text-[10px] font-black text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-[#1A1A1A]" /> IR_Spectral_Analysis
            </h3>
            <div className="relative h-36 flex items-end gap-1 border-l-2 border-b-2 border-[#1A1A1A] bg-white p-2 flex-col-reverse justify-start transform rotate-180">
              {/* Note: the visual inversion is tricky with flex, let's keep it simple. Replacing classes. */}
            </div>
            
            {/* Real implementation of IR Spectrum chart blocks */}
            <div className="relative h-36 flex flex-row items-end gap-0.5 border-l-2 border-b-2 border-[#1A1A1A] pt-4 pl-1 pb-0 pr-1 overflow-visible bg-white">
              {irSpectrum.map((peak, i) => {
                const isActive = activeSpectralPeak === i;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 cursor-pointer border border-[#1A1A1A]"
                    style={{ height: `${Math.max(peak.intensity, 4)}%` }}
                    onMouseEnter={() => setActiveSpectralPeak(i)}
                    onMouseLeave={() => setActiveSpectralPeak(undefined)}
                  >
                    <div
                      className={`w-full h-full transition-colors ${
                        isActive ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/20 hover:bg-[#D4FF00]'
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
                    className="absolute -top-10 left-0 right-0 text-center text-[10px] font-black pointer-events-none z-50 text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] py-1 px-2 mx-auto max-w-[80%]"
                  >
                    {irSpectrum[activeSpectralPeak].wn} cm⁻¹ — {irSpectrum[activeSpectralPeak].label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex justify-between text-[8px] font-bold text-[#1A1A1A] mt-2">
              <span>4000 cm⁻¹</span><span>600 cm⁻¹</span>
            </div>

            {/* Electronic Properties */}
            <div className="space-y-4 mt-auto pt-6 border-t-2 border-[#1A1A1A]">
              <h4 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest bg-white border-2 border-[#1A1A1A] inline-block px-2 py-0.5 shadow-[2px_2px_0px_#1A1A1A] -mt-10 mb-4 absolute">
                Electronic Props
              </h4>
              <TelemetryRow label="Dipole Moment"  value="1.85 D"   progress={65} color="bg-[#D4FF00]"   />
              <TelemetryRow label="Polarizability" value="1.45 Å³"  progress={42} color="bg-[#1A1A1A]"   />
              <TelemetryRow label="HOMO-LUMO Gap"  value="5.2 eV"   progress={88} color="bg-white border-r-2 border-[#1A1A1A]"  />
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
  color = 'text-[#1A1A1A]',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white px-3 py-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
      <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">{label}</p>
      <p className={`text-xs md:text-sm font-mono font-black ${color} ${color.includes('bg-') ? 'px-2 py-0.5 border border-[#1A1A1A]' : ''}`}>{value}</p>
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
    <div className="space-y-1.5 p-2 border-2 border-[#1A1A1A] bg-white">
      <div className="flex justify-between text-[9px] font-mono font-black">
        <span className="text-[#1A1A1A] uppercase">{label}</span>
        <span className="text-[#1A1A1A]">{value}</span>
      </div>
      <div className="h-3 w-full bg-[#EAE8E4] border border-[#1A1A1A] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full border-r-2 border-[#1A1A1A] ${color}`}
        />
      </div>
    </div>
  );
}

function DataBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
      <p className="text-[10px] text-[#1A1A1A] font-black uppercase tracking-widest mb-0.5 border-b border-[#1A1A1A] pb-1 inline-block">{label}</p>
      <p className="text-sm font-mono text-[#1A1A1A] font-black pt-1">{value}</p>
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
    <div className="flex items-center gap-3 bg-white px-4 py-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
      <span className={color}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-[#1A1A1A] font-black tracking-tighter">{label}</span>
        <span className={`text-xs font-mono font-black ${color}`}>{value}</span>
      </div>
    </div>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-3 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] text-[#1A1A1A] hover:bg-[#D4FF00] transition-all active:translate-y-0.5 active:shadow-none">
      {icon}
    </button>
  );
}