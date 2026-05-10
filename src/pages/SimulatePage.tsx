import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Thermometer, Droplets, Wind, Rotate3D, 
  Maximize, Orbit, Gauge, ScanLine, Lock, Unlock, 
  Cpu, Zap, ChevronRight, BarChart3, Database
} from 'lucide-react';
import { MolecularExplorer } from '../components/visualization/MolecularExplorer';
import { useOWDAStore } from '../store';
import { renderFormula } from "../utils/renderFormula";

export function SimulatePage() {
  const { currentReaction } = useOWDAStore();
  
  // 1. Fallback Logic: Detect first product or default to Water
  const targetMolecule = useMemo(() => {
    return currentReaction?.products.molecules[0]?.molecule || { formula: "H2O", molarMass: 18.015 };
  }, [currentReaction]);

  const [envParams, setEnvParams] = useState({ temp: 298, pressure: 1.0 });
  const [isLocked, setIsLocked] = useState(false);
  const [activePeak, setActivePeak] = useState<number | undefined>(undefined);

  // 2. Kinetic Calculations (Root Mean Square Speed Approximation)
  const kinetics = useMemo(() => {
    const R = 8.314; // Gas constant
    const massKg = (targetMolecule.molarMass || 18) / 1000;
    const vrms = Math.sqrt((3 * R * envParams.temp) / (massKg / 6.022e23 * 1e-3)).toFixed(0);
    
    return {
      velocity: vrms,
      collisionFreq: (envParams.pressure * (envParams.temp / 50)).toFixed(2),
      stability: envParams.temp > 800 ? 'CRITICAL' : envParams.temp > 500 ? 'WARNING' : 'NOMINAL'
    };
  }, [envParams, targetMolecule]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex flex-col gap-6 p-2 font-sans overflow-hidden"
    >
      {/* --- HUD HEADER --- */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#050510]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-owda-teal/20 blur-2xl rounded-full group-hover:bg-owda-teal/40 transition-all duration-700" />
            <Orbit className="w-10 h-10 text-owda-teal relative z-10 animate-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-owda-snow uppercase italic flex items-center gap-2">
              Horizon <span className="text-owda-teal">Simulator</span>
              <span className="not-italic text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-owda-gray font-mono ml-2">V2.4</span>
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-500 uppercase tracking-widest">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Kinetic_Engine_Live
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <StatHUD icon={<Thermometer className="w-4 h-4" />} label="Temp" value={`${envParams.temp}K`} color="text-owda-teal" />
          <StatHUD icon={<Gauge className="w-4 h-4" />} label="Press" value={`${envParams.pressure.toFixed(2)} atm`} color="text-owda-blue" />
          <button 
            onClick={() => setIsLocked(!isLocked)}
            className={`ml-2 p-3 rounded-2xl transition-all border ${isLocked ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-owda-gray hover:border-owda-teal/50 hover:text-owda-teal'}`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* --- LEFT: CONTROL MANIFEST --- */}
        <aside className="lg:col-span-3 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2">
          {/* Entity Focus Card */}
          <section className="bg-linear-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <Database className="absolute -top-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
            <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <ScanLine className="w-3 h-3 text-owda-teal" /> Target_Vector
            </h3>
            <div className="text-6xl font-black text-center mb-8 tracking-tighter">
              {renderFormula(targetMolecule.formula)}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <MetricDisplay label="V_RMS" value={`${kinetics.velocity} m/s`} sub="Molecular Speed" />
              <MetricDisplay 
                label="System_Stability" 
                value={kinetics.stability} 
                color={kinetics.stability === 'NOMINAL' ? 'text-emerald-400' : 'text-orange-500'} 
              />
            </div>
          </section>

          {/* Calibrator */}
          <section className={`bg-black/40 border border-white/5 rounded-3xl p-6 space-y-8 transition-all duration-500 ${isLocked ? 'grayscale opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h3 className="text-[10px] font-black text-owda-blue uppercase tracking-[0.2em]">Environment_Shift</h3>
            
            <RangeControl 
              label="Temperature" 
              value={envParams.temp} 
              max={1500} 
              unit="K"
              color="accent-owda-teal"
              onChange={(v: number) => setEnvParams(p => ({...p, temp: v}))} // Fixed type
            />

            <RangeControl 
              label="Pressure" 
              value={envParams.pressure} 
              max={250} 
              step={0.5}
              unit="atm"
              color="accent-owda-blue"
              onChange={(v: number) => setEnvParams(p => ({...p, pressure: v}))} // Fixed type
            />

            <div className="pt-4">
               <button className="w-full py-4 bg-owda-teal text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                 Initialize_Phase_Change
               </button>
            </div>
          </section>
        </aside>

        {/* --- CENTER: WEBGL VIEWPORT --- */}
        <main className="lg:col-span-6 bg-[#020205] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col group">
          <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
          
          {/* Top HUD Overlay */}
          <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start pointer-events-none">
            <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-owda-teal animate-pulse'}`} />
               <span className="text-[10px] font-mono uppercase tracking-widest">Feed: Orbital_Node_01</span>
            </div>
            <div className="flex gap-2 pointer-events-auto">
              <IconButton icon={<Maximize className="w-4 h-4" />} />
              <IconButton icon={<Activity className="w-4 h-4" />} />
            </div>
          </div>

          <div className="flex-1 relative">
            <MolecularExplorer formula={targetMolecule.formula} />
          </div>

          {/* Bottom HUD Overlay */}
          <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end pointer-events-none">
            <div className="flex gap-3">
              <DataBadge label="Collision" value={`${kinetics.collisionFreq} THz`} />
              <DataBadge label="Entropy" value="188.8 J/K" />
            </div>
            <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 pointer-events-auto">
               <Rotate3D className="w-5 h-5 text-owda-gray hover:text-owda-teal cursor-pointer transition-colors" />
            </div>
          </div>
        </main>

        {/* --- RIGHT: DATA TELEMETRY --- */}
        <aside className="lg:col-span-3 flex flex-col gap-5 overflow-y-auto custom-scrollbar pl-2">
          <section className="bg-black/40 border border-white/5 rounded-3xl p-6">
            <h3 className="text-[10px] font-black text-owda-snow uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-owda-blue" /> Spectral_Analysis
            </h3>
            <div className="h-48 flex items-end gap-1 px-2 border-l border-b border-white/10 relative group/spec">
               {/* Simplified mock spectroscopy peaks */}
               {Array.from({ length: 24 }).map((_, i) => {
                 const h = [4, 5, 12, 13, 18].includes(i) ? (Math.random() * 40 + 50) : (Math.random() * 15 + 5);
                 return (
                   <motion.div 
                    key={i}
                    onMouseEnter={() => setActivePeak(i)}
                    onMouseLeave={() => setActivePeak(undefined)}
                    animate={{ height: `${h}%` }}
                    // Changed rounded-t-[2px] to rounded-t-xs
                    className={`flex-1 rounded-t-xs transition-colors ${activePeak === i ? 'bg-owda-teal' : 'bg-owda-teal/20'}`}
                  />
                 );
               })}
               <AnimatePresence>
                 {activePeak !== undefined && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute -top-8 left-0 right-0 text-center text-[10px] font-mono text-owda-teal bg-owda-teal/10 py-1 rounded-lg border border-owda-teal/20"
                    >
                      BAND_{3000 + (activePeak * 50)} cm⁻¹
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </section>

          <section className="bg-black/40 border border-white/5 rounded-3xl p-6 flex-1">
            <h3 className="text-[10px] font-black text-owda-gray uppercase tracking-[0.2em] mb-6">Electronic_Properties</h3>
            <div className="space-y-6">
              <TelemetryRow label="Dipole Moment" value="1.85 D" progress={65} color="bg-owda-teal" />
              <TelemetryRow label="Polarizability" value="1.45 Å³" progress={42} color="bg-owda-blue" />
              <TelemetryRow label="HOMO-LUMO Gap" value="5.2 eV" progress={88} color="bg-purple-500" />
            </div>
          </section>
        </aside>
      </div>
    </motion.div>
  );
}

/** UPGRADED SUB-COMPONENTS **/

function MetricDisplay({ label, value, sub, color = "text-owda-snow" }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
      <p className="text-[8px] font-black text-owda-gray uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[8px] font-mono text-owda-gray/40 mt-1 uppercase">{sub}</p>}
    </div>
  );
}

function RangeControl({ label, value, max, step = 1, unit, color, onChange }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-owda-gray uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-mono font-bold ${color.replace('accent-', 'text-')}`}>{value}{unit}</span>
      </div>
      <input 
        type="range" min="0" max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 rounded-lg appearance-none bg-white/5 cursor-pointer ${color}`} 
      />
    </div>
  );
}

function TelemetryRow({ label, value, progress, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-owda-gray uppercase">{label}</span>
        <span className="text-owda-snow">{value}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${progress}%` }} 
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}

function DataBadge({ label, value }: any) {
  return (
    <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
      <p className="text-[8px] text-owda-gray font-black uppercase tracking-tighter mb-0.5">{label}</p>
      <p className="text-xs font-mono text-owda-snow font-bold">{value}</p>
    </div>
  );
}

function StatHUD({ icon, label, value, color }: any) {
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

function IconButton({ icon }: any) {
  return (
    <button className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-owda-gray hover:text-owda-teal transition-all active:scale-90">
      {icon}
    </button>
  );
}