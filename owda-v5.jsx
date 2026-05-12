import { useState, useCallback, useMemo, useEffect, useRef, useReducer } from "react";
import * as THREE from "three";
import {
  FlaskConical, Atom, BarChart3, Terminal, Activity, Search, X,
  ArrowRight, Download, Copy, Check, ChevronDown, ChevronUp, ChevronRight,
  Trash2, Zap, Brain, BookOpen, Code2, AlertTriangle, RefreshCcw,
  Thermometer, Gauge, Wind, Waves, Snowflake, Orbit, Database, Cpu,
  RotateCcw, Sparkles, GitCompare, Lock, Unlock, Command,
  Hash, Flame, Clock, TrendingUp, Settings, Shield, Plus, Table2,
  Bot, BotOff, BarChart2, FileText, SlidersHorizontal, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, PieChart, Pie, ReferenceLine
} from "recharts";

// ====================================================================
// SECTION 1: CHEMISTRY ENGINE
// ====================================================================

const ATOMIC_WEIGHTS = {
  H:1.008,He:4.003,Li:6.941,Be:9.012,B:10.811,C:12.011,N:14.007,
  O:15.999,F:18.998,Ne:20.18,Na:22.99,Mg:24.305,Al:26.982,Si:28.085,
  P:30.974,S:32.06,Cl:35.45,Ar:39.948,K:39.098,Ca:40.078,Fe:55.845,
  Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,Br:79.904,Ag:107.868,
  I:126.904,Ba:137.327,Au:196.967,Pb:207.2,Mn:54.938,Cr:51.996,
};

const ELEM_THREE = {
  H:{color:0xffffff,emissive:0x222222,r:0.31},C:{color:0x333333,emissive:0x000,r:0.77},
  O:{color:0xdd2222,emissive:0x330000,r:0.73},N:{color:0x2244ee,emissive:0x000022,r:0.75},
  S:{color:0xddcc00,emissive:0x333200,r:1.02},P:{color:0xff9900,emissive:0x442200,r:1.06},
  Cl:{color:0x22cc44,emissive:0x002200,r:0.99},Na:{color:0xaa88ff,emissive:0x110022,r:1.86},
  Fe:{color:0xcc6633,emissive:0x221100,r:1.26},
  default:{color:0x56a099,emissive:0x112222,r:0.80}
};

// FIX: Refactored parseFormula with a clean stack-based approach
// The original had a subtle molar mass double-count risk for nested groups
class ChemicalParser {
  static ELEM_RE = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;

  static parseFormula(formula) {
    this.ELEM_RE.lastIndex = 0;
    const countStack = [{}];
    let match;
    while ((match = this.ELEM_RE.exec(formula)) !== null) {
      const [,sym,cnt,open,close,mult] = match;
      if (sym) {
        const n = cnt ? +cnt : 1;
        const top = countStack[countStack.length-1];
        top[sym] = (top[sym]||0) + n;
      } else if (open) {
        countStack.push({});
      } else if (close) {
        const m = mult ? +mult : 1;
        const done = countStack.pop();
        const parent = countStack[countStack.length-1];
        for (const [s,c] of Object.entries(done)) {
          parent[s] = (parent[s]||0) + c*m;
        }
      }
    }
    const counts = countStack[0];
    const molarMass = Object.entries(counts).reduce(
      (sum,[el,n]) => sum + (ATOMIC_WEIGHTS[el]||0)*n, 0
    );
    return { formula, counts, molarMass: +molarMass.toFixed(3), charge: 0 };
  }

  static parseReaction(expr) {
    const parts = expr.split('->');
    if (parts.length !== 2) throw new Error('Expected: Reactants -> Products');
    const parseSide = s => s.split('+').map(p => {
      const t = p.trim();
      const m = t.match(/^(\d*)(.*)/);
      return { molecule: this.parseFormula(m[2].trim()), coefficient: m[1] ? +m[1] : 1 };
    }).filter(x => x.molecule.formula);
    return { reactants: parseSide(parts[0]), products: parseSide(parts[1]), timestamp: Date.now() };
  }

  static getElementColor(el) {
    const map = {H:'#fff',C:'#333',O:'#f33',N:'#33f',Cl:'#1fe',S:'#ff3',P:'#f90',Fe:'#da7e5c'};
    return map[el]||'#f0f';
  }
}

// IMPROVEMENT: Enhanced null-space solver with better forward/back substitution
class ReactionSolver {
  static balance(expr) {
    const raw = ChemicalParser.parseReaction(expr);
    const { reactants, products } = raw;
    const allMols = [...reactants,...products];
    const elements = [...new Set(allMols.flatMap(m => Object.keys(m.molecule.counts)))];

    const matrix = elements.map(el =>
      allMols.map((m,i) => {
        const c = m.molecule.counts[el]||0;
        return i < reactants.length ? c : -c;
      })
    );

    const sol = this._nullSpace(matrix, allMols.length);
    if (sol && sol.every(v => v > 0)) {
      const coeffs = this._integerize(sol);
      reactants.forEach((m,i) => m.coefficient = coeffs[i]);
      products.forEach((m,i) => m.coefficient = coeffs[reactants.length+i]);
      return {
        reactants:{molecules:reactants}, products:{molecules:products},
        isBalanced:true,
        massConservation: this._checkMass(reactants,products),
        timestamp: Date.now()
      };
    }
    return {
      reactants:{molecules:reactants}, products:{molecules:products},
      isBalanced:false, timestamp:Date.now(), errorDetails:'NO_SOLUTION'
    };
  }

  static _nullSpace(mat, cols) {
    const rows = mat.length;
    if (!rows) return null;
    const m = mat.map(r=>[...r]);
    let piv = 0;
    for (let j=0; j<cols && piv<rows; j++) {
      let mx = piv;
      for (let i=piv+1;i<rows;i++) if(Math.abs(m[i][j])>Math.abs(m[mx][j])) mx=i;
      [m[piv],m[mx]] = [m[mx],m[piv]];
      if (Math.abs(m[piv][j])<=1e-10) continue;
      const scale = m[piv][j];
      for (let k=j;k<cols;k++) m[piv][k]/=scale;
      for (let i=0;i<rows;i++) {
        if(i!==piv && Math.abs(m[i][j])>1e-12) {
          const f = m[i][j];
          for(let k=j;k<cols;k++) m[i][k]-=f*m[piv][k];
        }
      }
      piv++;
    }
    const sol = new Array(cols).fill(0);
    sol[cols-1] = 1;
    for(let i=piv-1;i>=0;i--) {
      let pc=-1;
      for(let j=0;j<cols;j++) if(Math.abs(m[i][j])>1e-10){pc=j;break;}
      if(pc!==-1) {
        let sum=0;
        for(let j=pc+1;j<cols;j++) sum+=m[i][j]*sol[j];
        sol[pc]=-sum/m[i][pc];
      }
    }
    if(!sol.every(v=>!isNaN(v)&&v>1e-10)) return null;
    // Normalize all positive
    const minV = Math.min(...sol);
    if (minV < 0) return null;
    return sol;
  }

  static _integerize(coeffs) {
    for(let mult=1;mult<=500;mult++) {
      const trial = coeffs.map(c=>c*mult);
      if(trial.every(t=>Math.abs(t-Math.round(t))<1e-4)) return trial.map(t=>Math.round(t));
    }
    return coeffs.map(Math.round);
  }

  static _checkMass(r,p) {
    const sum = s=>s.reduce((a,m)=>a+m.molecule.molarMass*m.coefficient,0);
    return Math.abs(sum(r)-sum(p))<0.1;
  }
}

// ====================================================================
// SECTION 2: AI SERVICE — uses Claude API (no exposed key)
// ====================================================================

async function analyzeReactionWithAI(expression) {
  const prompt = `Analyze this chemical reaction: "${expression}"

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "overview": "simple 2-sentence explanation",
  "mechanism": "technical mechanism explanation",
  "reactionType": "one of: Synthesis, Decomposition, Combustion, Single Replacement, Double Replacement, Acid-Base, Redox, Electrophilic Aromatic Substitution, Unknown",
  "enthalpy": <number kJ/mol, estimate>,
  "entropy": <number J/mol·K, estimate>,
  "gibbs": <number kJ/mol, estimate>
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.find(b=>b.type==='text')?.text || '';
  const clean = text.replace(/```json|```/g,'').trim();
  return JSON.parse(clean);
}

// ====================================================================
// SECTION 3: STATE MANAGEMENT
// ====================================================================

const CATALOG = [
  { cat:'Basic', items:[
    { label:'Haber (Ammonia)', formula:'N2 + H2 -> NH3', diff:'L1' },
    { label:'Combustion CH₄',  formula:'CH4 + O2 -> CO2 + H2O', diff:'L2' },
    { label:'Water Formation', formula:'H2 + O2 -> H2O', diff:'L1' },
    { label:'Iron Rusting',    formula:'Fe + O2 -> Fe2O3', diff:'L2' },
    { label:'CO₂ from CaCO₃', formula:'CaCO3 -> CaO + CO2', diff:'L2' },
  ]},
  { cat:'Aromatic', items:[
    { label:'EAS Nitration',   formula:'C6H6 + HNO3 -> C6H5NO2 + H2O', diff:'L3' },
    { label:'Benzene Combustion', formula:'C6H6 + O2 -> CO2 + H2O', diff:'L3' },
  ]},
  { cat:'Acid-Base', items:[
    { label:'Neutralisation',  formula:'HCl + NaOH -> NaCl + H2O', diff:'L1' },
    { label:'H₂SO₄ + NaOH',  formula:'H2SO4 + NaOH -> Na2SO4 + H2O', diff:'L2' },
    { label:'CaCO₃ + HCl',   formula:'CaCO3 + HCl -> CaCl2 + H2O + CO2', diff:'L2' },
  ]},
  { cat:'Redox', items:[
    { label:'Copper + Silver', formula:'Cu + AgNO3 -> Cu(NO3)2 + Ag', diff:'L3' },
    { label:'Thermite',        formula:'Al + Fe2O3 -> Al2O3 + Fe', diff:'L3' },
  ]},
];

const INITIAL = {
  activeTab:'workspace', inputExpression:'', currentReaction:null,
  currentSteps:[], history:[], reactionLog:[], isProcessing:false,
  error:null, commandOpen:false, compareSlots:[],
  settings:{ enableAI:true, enforceStoichiometry:true, syncDelay:0 },
  envParams:{ temp:298, pressure:1.0 }, envLocked:false,
};

function reducer(s, a) {
  switch(a.type) {
    case 'TAB':           return {...s, activeTab:a.v};
    case 'INPUT':         return {...s, inputExpression:a.v};
    case 'REACTION':      return {...s, currentReaction:a.v, isProcessing:false};
    case 'PROCESSING':    return {...s, isProcessing:a.v};
    case 'STEPS':         return {...s, currentSteps:a.v};
    case 'ERROR':         return {...s, error:a.v, isProcessing:false};
    case 'CLEAR_ERR':     return {...s, error:null};
    case 'HIST':          return {...s, history:[a.v,...s.history.filter(x=>x!==a.v)].slice(0,50)};
    case 'LOG':           return {...s, reactionLog:[a.v,...s.reactionLog].slice(0,100)};
    case 'RESET':         return {...INITIAL};
    case 'CMD':           return {...s, commandOpen:!s.commandOpen};
    case 'ENV':           return {...s, envParams:{...s.envParams,...a.v}};
    case 'ENV_LOCK':      return {...s, envLocked:!s.envLocked};
    case 'SETTINGS':      return {...s, settings:{...s.settings,...a.v}};
    case 'ADD_COMPARE': {
      if(s.compareSlots.length>=2||s.compareSlots.find(x=>x.expression===a.v.expression)) return s;
      return {...s, compareSlots:[...s.compareSlots,a.v]};
    }
    case 'RM_COMPARE':    return {...s, compareSlots:s.compareSlots.filter((_,i)=>i!==a.v)};
    case 'CLEAR_COMPARE': return {...s, compareSlots:[]};
    default:              return s;
  }
}

// ====================================================================
// SECTION 4: SHARED HOOKS
// ====================================================================

function useDebounce(val, delay=300) {
  const [dv, setDv] = useState(val);
  useEffect(()=>{ const t=setTimeout(()=>setDv(val),delay); return ()=>clearTimeout(t); },[val,delay]);
  return dv;
}

function useKey(combo, fn) {
  useEffect(()=>{
    const h = e => {
      const ctrl = combo.includes('ctrl') ? e.ctrlKey||e.metaKey : true;
      const shift = combo.includes('shift') ? e.shiftKey : !combo.includes('shift') || true;
      const key = combo.split('+').pop().toLowerCase();
      if(ctrl && e.key.toLowerCase()===key) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[combo,fn]);
}

// ====================================================================
// SECTION 5: FORMULA RENDERER
// ====================================================================

function Fmt({ f }) {
  return (
    <span>
      {f.split(/(\d+)/).map((p,i) =>
        /^\d+$/.test(p)
          ? <sub key={i} style={{fontSize:'0.7em',position:'relative',bottom:'-0.15em'}}>{p}</sub>
          : p
      )}
    </span>
  );
}

// ====================================================================
// SECTION 6: 3D MOLECULAR VIEWER
// ====================================================================

function MolViewer3D({ formula }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = el.clientWidth || 400, H = el.clientHeight || 300;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, W/H, 0.1, 1000);
    cam.position.set(0,0,9);
    const rend = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
    rend.setPixelRatio(Math.min(devicePixelRatio,2));
    rend.setSize(W,H);
    el.appendChild(rend.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,0.5));
    const sun = new THREE.DirectionalLight(0xffffff,1);
    sun.position.set(10,15,10); scene.add(sun);
    const rim = new THREE.PointLight(0x56a099,40);
    rim.position.set(-10,-5,-10); scene.add(rim);

    // Build molecule
    const parsed = ChemicalParser.parseFormula(formula);
    const elems = Object.entries(parsed.counts).flatMap(([e,n])=>Array(n).fill(e));
    const n = elems.length;
    const R = Math.max(1.5, n*0.45);

    const sphereG = new THREE.SphereGeometry(1,32,32);
    const cylG = new THREE.CylinderGeometry(0.08,0.08,1,10);
    const group = new THREE.Group();
    const atoms = [];

    const fib = (idx,total,r) => {
      if(total===1) return new THREE.Vector3(0,0,0);
      const phi = Math.acos(1-(2*idx)/(total-1));
      const theta = Math.sqrt(total*Math.PI)*phi;
      return new THREE.Vector3(r*Math.sin(phi)*Math.cos(theta),r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi));
    };

    elems.forEach((e,i)=>{
      const th = ELEM_THREE[e]||ELEM_THREE.default;
      const mat = new THREE.MeshPhysicalMaterial({
        color:th.color,emissive:th.emissive,emissiveIntensity:0.1,
        roughness:0.2,metalness:0.35,clearcoat:0.8,clearcoatRoughness:0.1
      });
      const mesh = new THREE.Mesh(sphereG,mat);
      const pos = fib(i,n,R);
      mesh.scale.setScalar(th.r*0.5);
      mesh.position.copy(pos);
      group.add(mesh);
      atoms.push({mesh,base:pos.clone(),phase:Math.random()*Math.PI*2});
    });

    const bondMat = new THREE.MeshPhysicalMaterial({color:0x555566,metalness:0.9,roughness:0.1,transparent:true,opacity:0.7});
    const bonds = [];
    const thresh = R < 3 ? 3.0 : R*0.9;
    for(let i=0;i<atoms.length;i++) for(let j=i+1;j<atoms.length;j++) {
      if(atoms[i].base.distanceTo(atoms[j].base)<thresh) {
        const b = new THREE.Mesh(cylG,bondMat);
        group.add(b);
        bonds.push({mesh:b,a:i,b:j});
      }
    }
    const box = new THREE.Box3().setFromObject(group);
    group.position.sub(box.getCenter(new THREE.Vector3()));
    scene.add(group);

    // Manual rotation
    let isDragging=false, rotX=0, rotY=0, lastX=0, lastY=0, zoom=9;
    const c = rend.domElement;
    c.style.cursor='grab';
    c.addEventListener('pointerdown',e=>{isDragging=true;lastX=e.clientX;lastY=e.clientY;c.style.cursor='grabbing';c.setPointerCapture(e.pointerId);});
    c.addEventListener('pointermove',e=>{if(!isDragging)return;rotY+=(e.clientX-lastX)*0.01;rotX+=(e.clientY-lastY)*0.01;lastX=e.clientX;lastY=e.clientY;});
    c.addEventListener('pointerup',()=>{isDragging=false;c.style.cursor='grab';});
    c.addEventListener('wheel',e=>{zoom=Math.max(3,Math.min(20,zoom+e.deltaY*0.01));cam.position.z=zoom;},{passive:true});

    const t0=performance.now();
    const up = new THREE.Vector3(0,1,0), tmp = new THREE.Vector3();
    let raf;
    const animate=()=>{
      raf=requestAnimationFrame(animate);
      const t=(performance.now()-t0)/1000;
      if(!isDragging) rotY+=0.005;
      group.rotation.y=rotY; group.rotation.x=rotX;
      atoms.forEach(a=>{ a.mesh.position.y=a.base.y+Math.sin(t*3+a.phase)*0.02; });
      bonds.forEach(b=>{
        const p1=atoms[b.a].mesh.position, p2=atoms[b.b].mesh.position;
        tmp.subVectors(p2,p1);
        const len=tmp.length();
        b.mesh.scale.set(1,len,1);
        b.mesh.position.addVectors(p1,tmp.multiplyScalar(0.5));
        b.mesh.quaternion.setFromUnitVectors(up,tmp.normalize());
      });
      rend.render(scene,cam);
    };
    animate();

    const onResize=()=>{
      const w=el.clientWidth,h=el.clientHeight;
      cam.aspect=w/h; cam.updateProjectionMatrix(); rend.setSize(w,h);
    };
    window.addEventListener('resize',onResize);

    return ()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',onResize);
      sphereG.dispose(); cylG.dispose(); bondMat.dispose();
      atoms.forEach(a=>a.mesh.material.dispose());
      rend.dispose();
      if(el.contains(rend.domElement)) el.removeChild(rend.domElement);
    };
  },[formula]);

  return <div ref={ref} style={{width:'100%',height:'100%',background:'white'}} />;
}

// ====================================================================
// SECTION 7: COMMAND PALETTE — NEW FEATURE
// ====================================================================

function CommandPalette({ isOpen, onClose, state, dispatch }) {
  const [q,setQ] = useState('');
  const inputRef = useRef(null);
  const [sel,setSel] = useState(0);

  useEffect(()=>{ if(isOpen){setQ('');setSel(0);setTimeout(()=>inputRef.current?.focus(),50);} },[isOpen]);

  const items = useMemo(()=>{
    const navs = [
      {t:'nav',icon:<FlaskConical size={13}/>,label:'Laboratory',sub:'Reaction workspace',act:()=>dispatch({type:'TAB',v:'workspace'})},
      {t:'nav',icon:<Atom size={13}/>,label:'Simulator',sub:'Quantum sim & 3D viewer',act:()=>dispatch({type:'TAB',v:'simulate'})},
      {t:'nav',icon:<BarChart3 size={13}/>,label:'Analytics',sub:'Telemetry & reaction log',act:()=>dispatch({type:'TAB',v:'analytics'})},
      {t:'nav',icon:<GitCompare size={13}/>,label:'Compare Mode',sub:'Side-by-side reaction comparison',act:()=>dispatch({type:'TAB',v:'compare'})},
    ];
    if(!q.trim()) return navs;
    const qL=q.toLowerCase();
    const res=[];
    CATALOG.forEach(cat=>cat.items.forEach(item=>{
      if(item.label.toLowerCase().includes(qL)||item.formula.toLowerCase().includes(qL))
        res.push({t:'reaction',icon:<FlaskConical size={13}/>,label:item.label,sub:item.formula,
          act:()=>{dispatch({type:'INPUT',v:item.formula});dispatch({type:'TAB',v:'workspace'});}});
    }));
    state.history.forEach(h=>{
      if(h.toLowerCase().includes(qL))
        res.push({t:'history',icon:<Clock size={13}/>,label:h,sub:'From history',
          act:()=>{dispatch({type:'INPUT',v:h});dispatch({type:'TAB',v:'workspace'});}});
    });
    return res;
  },[q,state.history]);

  useEffect(()=>setSel(0),[items]);

  const run = useCallback(i=>{
    const item = items[i||sel];
    if(item){ item.act(); onClose(); }
  },[items,sel,onClose]);

  const onKeyDown = e=>{
    if(e.key==='Escape') onClose();
    else if(e.key==='ArrowDown'){e.preventDefault();setSel(s=>Math.min(s+1,items.length-1));}
    else if(e.key==='ArrowUp'){e.preventDefault();setSel(s=>Math.max(s-1,0));}
    else if(e.key==='Enter'){e.preventDefault();run(sel);}
  };

  if(!isOpen) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(2,2,10,0.7)',zIndex:9000,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'10vh'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:580,background:'#FDFCFB',border:'3px solid #1A1A1A',boxShadow:'8px 8px 0px #1A1A1A',fontFamily:'monospace'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'2px solid #1A1A1A',background:'#EAE8E4'}}>
          <Search size={15} style={{color:'#1A1A1A',flexShrink:0}}/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search reactions, navigate, run commands…"
            style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:13,fontWeight:'bold',color:'#1A1A1A',fontFamily:'monospace'}}/>
          <div style={{display:'flex',gap:6}}>
            {[['↑↓','Navigate'],['↵','Run'],['ESC','Close']].map(([k,l])=>(
              <span key={k} style={{fontSize:9,fontWeight:'bold',display:'flex',gap:3,alignItems:'center',color:'#666'}}>
                <kbd style={{padding:'1px 5px',border:'1px solid #1A1A1A',background:'white',borderRadius:2}}>{k}</kbd>
              </span>
            ))}
          </div>
        </div>
        <div style={{maxHeight:380,overflowY:'auto'}}>
          {items.length===0&&(
            <div style={{padding:24,textAlign:'center',fontSize:11,color:'#666'}}>No results for "{q}"</div>
          )}
          {items.map((item,i)=>(
            <button key={i} onClick={()=>run(i)}
              onMouseEnter={()=>setSel(i)}
              style={{
                display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 14px',
                border:'none',borderBottom:'1px solid #EAE8E4',cursor:'pointer',textAlign:'left',
                background: i===sel ? '#D4FF00' : 'white',
                transition:'background 0.1s'
              }}>
              <div style={{
                width:28,height:28,border:'1.5px solid #1A1A1A',display:'flex',alignItems:'center',
                justifyContent:'center',background: i===sel ? 'white' : '#EAE8E4',flexShrink:0
              }}>{item.icon}</div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:12,fontWeight:'bold',color:'#1A1A1A'}}>{item.label}</p>
                <p style={{margin:0,fontSize:10,color:'#666'}}>{item.sub}</p>
              </div>
              <ArrowRight size={12} style={{color:'#1A1A1A',opacity:i===sel?1:0}}/>
            </button>
          ))}
        </div>
        <div style={{padding:'8px 14px',borderTop:'2px solid #1A1A1A',background:'#1A1A1A',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:6,height:6,background:'#D4FF00',borderRadius:'50%',animation:'pulse 1.5s infinite'}}/>
          <span style={{fontSize:9,fontWeight:'bold',color:'#D4FF00',letterSpacing:'0.2em',textTransform:'uppercase'}}>OWDA Command Interface — Press Ctrl+K anytime</span>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// SECTION 8: EXPORT SYSTEM — NEW FEATURE
// ====================================================================

function ExportPanel({ log }) {
  const [copied,setCopied] = useState(false);
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(log,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'),{href:url,download:'owda-reactions.json'});
    a.click(); URL.revokeObjectURL(url);
  };
  const exportCSV = () => {
    const h = ['expression','reactionType','enthalpy','entropy','gibbs','isBalanced','isExothermic','timestamp'];
    const rows = log.map(r=>h.map(k=>r[k]??'').join(','));
    const blob = new Blob([[h.join(','),...rows].join('\n')],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'),{href:url,download:'owda-reactions.csv'});
    a.click(); URL.revokeObjectURL(url);
  };
  const copyClipboard = async () => {
    await navigator.clipboard.writeText(JSON.stringify(log,null,2));
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  };
  const S = {btn:{padding:'8px 16px',border:'2px solid #1A1A1A',fontFamily:'monospace',fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:'2px 2px 0 #1A1A1A',transition:'all 0.1s'}};
  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button style={{...S.btn,background:'#D4FF00',color:'#1A1A1A'}} onClick={exportJSON}><FileText size={12}/>Export JSON</button>
      <button style={{...S.btn,background:'white',color:'#1A1A1A'}} onClick={exportCSV}><Table2 size={12}/>Export CSV</button>
      <button style={{...S.btn,background:copied?'#1A1A1A':'white',color:copied?'#D4FF00':'#1A1A1A'}} onClick={copyClipboard}>
        {copied?<Check size={12}/>:<Copy size={12}/>}{copied?'Copied!':'Copy JSON'}
      </button>
    </div>
  );
}

// ====================================================================
// SECTION 9: WORKSPACE PAGE — ENHANCED
// ====================================================================

function WorkspacePage({ state, dispatch }) {
  const [localInput,setLocalInput] = useState(state.inputExpression);
  const [expandedCat,setExpandedCat] = useState(null);
  const [showPicker,setShowPicker] = useState(false);
  const inputRef = useRef(null);
  const debouncedInput = useDebounce(localInput, 100);

  // NEW: live validation indicator
  const hasArrow = debouncedInput.includes('->');
  const inputState = !debouncedInput.trim() ? 'empty' : hasArrow ? 'valid' : 'warning';

  useEffect(()=>{ setLocalInput(state.inputExpression); },[state.inputExpression]);

  const solve = useCallback(async ()=>{
    const expr = localInput.trim();
    if(!expr||state.isProcessing) return;
    dispatch({type:'PROCESSING',v:true});
    dispatch({type:'CLEAR_ERR'});
    dispatch({type:'INPUT',v:expr});
    dispatch({type:'HIST',v:expr});
    try {
      const balanced = ReactionSolver.balance(expr);
      let thermo = {type:'Unknown',enthalpy:0,entropy:0,gibbs:0};
      let steps = [];

      if(state.settings.enableAI) {
        try {
          const ai = await analyzeReactionWithAI(expr);
          thermo = {type:ai.reactionType||'Unknown',enthalpy:ai.enthalpy??0,entropy:ai.entropy??0,gibbs:ai.gibbs??0};
          steps = [
            {title:'Basic Overview',desc:ai.overview,mode:'human'},
            {title:'Reaction Mechanism',desc:ai.mechanism,mode:'expert'},
            {title:'Thermodynamic Analysis',desc:`**Type:** ${ai.reactionType}\n**ΔH:** ${ai.enthalpy} kJ/mol\n**ΔS:** ${ai.entropy} J/mol·K\n**ΔG:** ${ai.gibbs} kJ/mol\n**Spontaneous:** ${ai.gibbs<0?'Yes (ΔG < 0)':'No (ΔG > 0)'}`,mode:'machine'},
          ];
        } catch(aiErr) {
          steps = [{title:'AI Analysis',desc:`AI unavailable: ${aiErr.message}`,mode:'machine'}];
        }
      } else {
        steps = [{title:'AI Disabled',desc:'Enable AI in settings for thermodynamic analysis.',mode:'machine'}];
      }

      const reaction = {
        ...balanced,
        ...(balanced.isBalanced ? {
          enthalpy:thermo.enthalpy, entropy:thermo.entropy,
          gibbs:thermo.gibbs, type:thermo.type, activationEnergy:60
        } : {})
      };
      dispatch({type:'REACTION',v:reaction});
      dispatch({type:'STEPS',v:steps});
      dispatch({type:'LOG',v:{
        expression:expr, timestamp:Date.now(), isBalanced:balanced.isBalanced,
        reactionType:thermo.type, enthalpy:thermo.enthalpy,
        entropy:thermo.entropy, gibbs:thermo.gibbs,
        isExothermic: thermo.enthalpy<0
      }});
      // NEW: offer to add to compare if already have one
      if(state.compareSlots.length===1 && balanced.isBalanced) {
        dispatch({type:'ADD_COMPARE',v:{expression:expr,reaction,thermo}});
      }
    } catch(e) {
      dispatch({type:'ERROR',v:{message:e.message,code:'ENGINE_FAULT',details:e.stack}});
    }
  },[localInput,state.isProcessing,state.settings.enableAI,state.compareSlots.length]);

  useKey('ctrl+enter', solve);
  useKey('ctrl+l', ()=>{setLocalInput('');dispatch({type:'INPUT',v:''});dispatch({type:'REACTION',v:null});});

  const insertAt = text => {
    const el = inputRef.current;
    if(!el) { setLocalInput(p=>text==='\b'?p.slice(0,-1):p+text); return; }
    if(text==='\b') {
      const s=el.selectionStart??localInput.length;
      if(s>0){ const nv=localInput.slice(0,s-1)+localInput.slice(s); setLocalInput(nv); requestAnimationFrame(()=>el.setSelectionRange(s-1,s-1)); }
      return;
    }
    const s=el.selectionStart??localInput.length, e2=el.selectionEnd??s;
    const nv=localInput.slice(0,s)+text+localInput.slice(e2);
    setLocalInput(nv);
    const np=s+text.length;
    requestAnimationFrame(()=>{el.focus();el.setSelectionRange(np,np);});
  };

  const r = state.currentReaction;
  const isExo = r?.isBalanced ? r.enthalpy<0 : false;

  const thS = {label:{fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',color:'#1A1A1A'},val:{fontSize:13,fontFamily:'monospace',fontWeight:'bold',color:'#1A1A1A'}};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Input section */}
      <div style={{background:'white',border:'2px solid #1A1A1A',boxShadow:'6px 6px 0 #1A1A1A',padding:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,borderBottom:'1px solid #EAE8E4',paddingBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{padding:6,border:'1px solid #1A1A1A',background:'#EAE8E4'}}><Terminal size={14}/></div>
            <div>
              <div style={{fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.25em',color:'#1A1A1A',fontFamily:'monospace'}}>Core Input Module</div>
              <div style={{fontSize:9,color:'#666',fontFamily:'monospace',marginTop:2}}>{state.isProcessing?'Computing…':'Press Ctrl+Enter to solve'}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{padding:'3px 8px',border:'1px solid #1A1A1A',background:state.settings.enableAI?'#D4FF00':'#EAE8E4',fontSize:9,fontWeight:'bold',fontFamily:'monospace',display:'flex',alignItems:'center',gap:4}}>
              {state.settings.enableAI?<Bot size={11}/>:<BotOff size={11}/>}
              {state.settings.enableAI?'AI ON':'AI OFF'}
            </div>
            <div style={{padding:'3px 8px',border:'1px solid #1A1A1A',background:state.isProcessing?'#1A1A1A':'white',color:state.isProcessing?'white':'#1A1A1A',fontSize:9,fontWeight:'bold',fontFamily:'monospace'}}>
              {state.isProcessing?'COMPUTING':'READY'}
            </div>
          </div>
        </div>

        {/* Main input */}
        <div style={{position:'relative',display:'flex',alignItems:'center',border:`2px solid ${inputState==='valid'?'#1A1A1A':inputState==='warning'?'#ff9900':'#CCC'}`,background:'white',boxShadow:inputState==='valid'?'4px 4px 0 #1A1A1A':'none',transition:'all 0.15s'}}>
          <div style={{padding:'0 12px',color:'#1A1A1A',opacity:0.4,flexShrink:0}}><Sparkles size={18}/></div>
          <input ref={inputRef} value={localInput}
            onChange={e=>setLocalInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')solve();if(e.key==='Escape')setShowPicker(false);}}
            placeholder="e.g.  N2 + H2 -> NH3"
            style={{flex:1,border:'none',outline:'none',background:'transparent',padding:'14px 8px',fontSize:20,fontFamily:'monospace',fontWeight:'bold',color:'#1A1A1A'}}/>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'0 8px',flexShrink:0}}>
            <button onClick={()=>setShowPicker(p=>!p)}
              style={{padding:'6px 8px',border:`1px solid #1A1A1A`,background:showPicker?'#1A1A1A':'white',color:showPicker?'white':'#1A1A1A',cursor:'pointer'}}>
              <Table2 size={14}/>
            </button>
            {localInput&&<button onClick={()=>{setLocalInput('');dispatch({type:'INPUT',v:''});dispatch({type:'REACTION',v:null});}} style={{padding:'6px 8px',border:'none',background:'#EAE8E4',cursor:'pointer',color:'#1A1A1A'}}><RotateCcw size={14}/></button>}
            <button onClick={solve} disabled={state.isProcessing||!localInput.trim()}
              style={{padding:'10px 20px',border:'1px solid #1A1A1A',background:state.isProcessing||!localInput.trim()?'#EAE8E4':'#D4FF00',color:'#1A1A1A',cursor:state.isProcessing||!localInput.trim()?'not-allowed':'pointer',fontFamily:'monospace',fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.15em',display:'flex',alignItems:'center',gap:6}}>
              {state.isProcessing?<Activity size={12} style={{animation:'spin 1s linear infinite'}}/>:<Cpu size={12}/>}
              {state.isProcessing?'Solving':'Execute'}
            </button>
          </div>
        </div>

        {/* INLINE ELEMENT PICKER — simple */}
        {showPicker&&(
          <div style={{marginTop:10,border:'2px solid #1A1A1A',padding:14,background:'#FDFCFB',boxShadow:'4px 4px 0 #1A1A1A'}}>
            <div style={{fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.2em',color:'#1A1A1A',marginBottom:8,fontFamily:'monospace'}}>Quick Elements</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
              {['H','C','N','O','S','P','Cl','Na','K','Ca','Fe','Mg','Cu','Al'].map(sym=>(
                <button key={sym} onClick={()=>insertAt(sym)}
                  style={{padding:'4px 10px',border:'1.5px solid #1A1A1A',fontFamily:'monospace',fontWeight:'bold',fontSize:12,cursor:'pointer',background:'white',boxShadow:'2px 2px 0 #1A1A1A'}}>
                  {sym}
                </button>
              ))}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {[2,3,4,5,6,'(',')','+','->'].map(t=>(
                <button key={t} onClick={()=>insertAt(t==='->'?' -> ':String(t))}
                  style={{padding:'4px 10px',border:'1.5px solid #1A1A1A',fontFamily:'monospace',fontWeight:'bold',fontSize:12,cursor:'pointer',background:'#EAE8E4',boxShadow:'2px 2px 0 #1A1A1A'}}>
                  {t}
                </button>
              ))}
              <button onClick={()=>insertAt('\b')} style={{padding:'4px 10px',border:'1.5px solid #1A1A1A',fontFamily:'monospace',fontWeight:'bold',fontSize:12,cursor:'pointer',background:'#ff6b6b',color:'white',boxShadow:'2px 2px 0 #1A1A1A'}}>⌫</button>
            </div>
          </div>
        )}

        {/* Catalog */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginTop:14}}>
          {CATALOG.map(cat=>(
            <div key={cat.cat} style={{position:'relative'}}>
              <button onClick={()=>setExpandedCat(expandedCat===cat.cat?null:cat.cat)}
                style={{width:'100%',padding:'8px 12px',border:'2px solid #1A1A1A',background:expandedCat===cat.cat?'#1A1A1A':'#EAE8E4',color:expandedCat===cat.cat?'white':'#1A1A1A',fontFamily:'monospace',fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'2px 2px 0 #1A1A1A'}}>
                {cat.cat}
                <ChevronDown size={10} style={{transform:expandedCat===cat.cat?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
              </button>
              {expandedCat===cat.cat&&(
                <div style={{position:'absolute',left:0,right:0,zIndex:100,background:'#FDFCFB',border:'2px solid #1A1A1A',boxShadow:'4px 4px 0 #1A1A1A',top:'calc(100% + 4px)',padding:6,display:'flex',flexDirection:'column',gap:4}}>
                  {cat.items.map((item,i)=>(
                    <button key={i} onClick={()=>{setLocalInput(item.formula);setExpandedCat(null);inputRef.current?.focus();}}
                      style={{padding:8,border:'1px solid transparent',background:'white',cursor:'pointer',textAlign:'left',fontFamily:'monospace'}}
                      onMouseEnter={e=>{e.target.style.background='#D4FF00';e.target.style.borderColor='#1A1A1A';}}
                      onMouseLeave={e=>{e.target.style.background='white';e.target.style.borderColor='transparent';}}>
                      <div style={{fontSize:9,color:'#666',marginBottom:2}}>{item.label} <span style={{float:'right',fontSize:7,padding:'1px 4px',border:'1px solid #1A1A1A',background:'white'}}>{item.diff}</span></div>
                      <div style={{fontSize:11,fontWeight:'bold',color:'#1A1A1A'}}>{item.formula}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Result display */}
      {r&&(
        <div style={{background:'white',border:'2px solid #1A1A1A',boxShadow:'6px 6px 0 #1A1A1A',padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,borderBottom:'1px solid #EAE8E4',paddingBottom:10}}>
            <span style={{fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.3em',fontFamily:'monospace'}}>Solution Manifest</span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:9,padding:'3px 8px',border:'2px solid #1A1A1A',background:r.isBalanced?'#D4FF00':'#ff6b6b',color:r.isBalanced?'#1A1A1A':'white',fontWeight:'bold',fontFamily:'monospace'}}>
                {r.isBalanced?'✓ BALANCED':'✗ UNBALANCED'}
              </span>
              {/* NEW: Add to Compare button */}
              {r.isBalanced&&(
                <button onClick={()=>dispatch({type:'ADD_COMPARE',v:{expression:state.inputExpression,reaction:r}})}
                  style={{padding:'3px 10px',border:'1.5px solid #1A1A1A',background:'#EAE8E4',cursor:'pointer',fontSize:9,fontWeight:'bold',fontFamily:'monospace',display:'flex',alignItems:'center',gap:4,boxShadow:'1px 1px 0 #1A1A1A'}}>
                  <GitCompare size={10}/>Compare
                </button>
              )}
            </div>
          </div>

          {/* Equation */}
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:16,padding:'16px 0',fontSize:24,fontWeight:'900',fontFamily:'monospace'}}>
            {r.reactants.molecules.map((m,i)=>(
              <span key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                {i>0&&<span style={{fontSize:18}}>+</span>}
                {m.coefficient>1&&<span style={{fontSize:18}}>{m.coefficient}</span>}
                <span style={{padding:'4px 12px',border:'2px solid #1A1A1A',boxShadow:'2px 2px 0 #1A1A1A',background:'white'}}><Fmt f={m.molecule.formula}/></span>
              </span>
            ))}
            <span style={{fontSize:20,padding:'0 8px'}}>⟶</span>
            {r.products.molecules.map((m,i)=>(
              <span key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                {i>0&&<span style={{fontSize:18}}>+</span>}
                {m.coefficient>1&&<span style={{fontSize:18}}>{m.coefficient}</span>}
                <span style={{padding:'4px 12px',border:'2px solid #1A1A1A',boxShadow:'2px 2px 0 #1A1A1A',background:'white'}}><Fmt f={m.molecule.formula}/></span>
              </span>
            ))}
          </div>

          {/* Thermo */}
          {r.isBalanced&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,borderTop:'1px solid #EAE8E4',paddingTop:16}}>
              {[['Enthalpy ΔH',`${r.enthalpy} kJ/mol`,r.enthalpy<0],['Entropy ΔS',`${r.entropy} J/K·mol`,r.entropy>0],['Gibbs ΔG',`${r.gibbs} kJ/mol`,r.gibbs<0]].map(([l,v,good])=>(
                <div key={l} style={{padding:12,border:'2px solid #1A1A1A',background:good?'#D4FF00':'#EAE8E4',boxShadow:'2px 2px 0 #1A1A1A'}}>
                  <div style={{...thS.label,marginBottom:4}}>{l}</div>
                  <div style={{...thS.val}}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Steps */}
      {state.currentSteps.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:8,borderBottom:'2px solid #1A1A1A'}}>
            <Cpu size={14}/><span style={{fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.25em',fontFamily:'monospace'}}>AI Analysis Report</span>
            <span style={{marginLeft:'auto',fontSize:9,padding:'2px 8px',border:'1px solid #1A1A1A',background:'#D4FF00',fontWeight:'bold',fontFamily:'monospace'}}>Claude Engine</span>
          </div>
          {state.currentSteps.map((step,i)=><StepCard key={i} step={step} index={i}/>)}
        </div>
      )}
    </div>
  );
}

function StepCard({step}) {
  const [open,setOpen] = useState(true);
  const cfgs = {
    human: {icon:<BookOpen size={13}/>,label:'Basic Overview',hBg:'#D4FF00',hColor:'#1A1A1A'},
    expert:{icon:<Brain size={13}/>,label:'Mechanism',hBg:'white',hColor:'#1A1A1A'},
    machine:{icon:<Code2 size={13}/>,label:'Thermodynamics',hBg:'#1A1A1A',hColor:'white'},
  };
  const c = cfgs[step.mode]||cfgs.human;
  return (
    <div style={{border:'2px solid #1A1A1A',boxShadow:'4px 4px 0 #1A1A1A',overflow:'hidden'}}>
      <button onClick={()=>setOpen(p=>!p)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:c.hBg,color:c.hColor,border:'none',borderBottom:'2px solid #1A1A1A',cursor:'pointer',fontFamily:'monospace'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>{c.icon}<span style={{fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.2em'}}>{step.title}</span></div>
        {open?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
      </button>
      {open&&(
        <div style={{padding:'14px 16px',background:'#EAE8E4',fontSize:12,fontFamily:'monospace',lineHeight:1.7,color:'#1A1A1A',fontWeight:'bold',whiteSpace:'pre-wrap'}}>
          {step.desc}
        </div>
      )}
    </div>
  );
}

// ====================================================================
// SECTION 10: SIMULATE PAGE — ENHANCED
// ====================================================================

const BOLTZMANN = 1.380649e-23, AVOGADRO = 6.02214076e23;
function mbDist(v,T,Mkg) {
  if(T<=0||Mkg<=0||v<0) return 0;
  const m=Mkg/AVOGADRO, kT=BOLTZMANN*T;
  return 4*Math.PI*Math.pow(m/(2*Math.PI*kT),1.5)*v*v*Math.exp(-m*v*v/(2*kT));
}
function buildMB(T,Mkg) {
  const vmax=Math.sqrt((2*BOLTZMANN*T*5)/(Mkg/AVOGADRO));
  return Array.from({length:61},(_,i)=>{
    const v=i*vmax/60;
    return {v:Math.round(v),f:mbDist(v,T,Mkg)*1e-3,f_ref:mbDist(v,298,Mkg)*1e-3};
  });
}

const PHASES = {H2O:{m:273.15,b:373.15},NH3:{m:195.4,b:239.8},CH4:{m:90.7,b:111.7},CO2:{m:194.7,b:194.7},O2:{m:54.4,b:90.2},N2:{m:63.2,b:77.4}};
function getPhase(f,T) { const d=PHASES[f]; if(!d) return 'gas'; return T<d.m?'solid':T<d.b?'liquid':'gas'; }

function SimulatePage({ state, dispatch }) {
  const mol = state.currentReaction?.isBalanced
    ? state.currentReaction.products.molecules[0]?.molecule
    : { formula:'H2O', molarMass:18.015 };
  const formula = mol?.formula||'H2O';
  const Mkg = (mol?.molarMass||18)/1000;
  const T = state.envParams.temp;
  const P = state.envParams.pressure;
  const R = 8.314;
  const locked = state.envLocked;

  const kin = useMemo(()=>({
    vrms: Math.sqrt((3*R*T)/Mkg).toFixed(0),
    vavg: Math.sqrt((8*R*T)/(Math.PI*Mkg)).toFixed(0),
    vmp:  Math.sqrt((2*R*T)/Mkg).toFixed(0),
    collFreq: ((P*T)/200).toFixed(2),
    stability: T>1000?'CRITICAL':T>600?'WARNING':'NOMINAL',
  }),[T,P,Mkg]);

  const phase = getPhase(formula,T);
  const phaseCfg = {solid:{label:'Solid',color:'#1A1A1A',bg:'white'},liquid:{label:'Liquid',color:'#1A1A1A',bg:'#D4FF00'},gas:{label:'Gas',color:'white',bg:'#1A1A1A'}};
  const pc = phaseCfg[phase];

  const mbData = useMemo(()=>buildMB(T,Mkg),[T,Mkg]);

  const energyData = useMemo(()=>{
    if(!state.currentReaction?.isBalanced) return [{step:'R',e:100},{step:'TS',e:160},{step:'P',e:80}];
    const base=100, dH=state.currentReaction.enthalpy, ea=60;
    const final=Math.max(10,base+dH);
    return [{step:'R',e:base,label:'Reactants'},{step:'TS',e:Math.max(base,final)+ea,label:'Transition State'},{step:'P',e:final,label:'Products'}];
  },[state.currentReaction]);

  const S={
    card:{background:'white',border:'2px solid #1A1A1A',boxShadow:'4px 4px 0 #1A1A1A',padding:20},
    label:{fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.15em',fontFamily:'monospace',color:'#1A1A1A'},
    val:{fontSize:12,fontFamily:'monospace',fontWeight:'bold',color:'#1A1A1A'},
    metric:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',border:'2px solid #1A1A1A',background:'white',boxShadow:'2px 2px 0 #1A1A1A',marginBottom:6},
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* HUD Header */}
      <div style={{...S.card,display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{border:'2px solid #1A1A1A',padding:8,background:'#EAE8E4'}}><Orbit size={24} style={{animation:'spin 12s linear infinite'}}/></div>
          <div>
            <div style={{fontSize:18,fontWeight:'900',fontFamily:'monospace',textTransform:'uppercase',fontStyle:'italic'}}>
              Horizon <span style={{background:'#D4FF00',padding:'0 8px',border:'2px solid #1A1A1A',fontStyle:'normal'}}>Simulator</span>
            </div>
            <div style={{fontSize:9,color:'#666',fontFamily:'monospace',marginTop:4,fontWeight:'bold',textTransform:'uppercase'}}>Maxwell–Boltzmann Kinetic Engine — Live</div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          {[['Temp',`${T} K`],['Press',`${P.toFixed(1)} atm`]].map(([l,v])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',border:'2px solid #1A1A1A',background:'white',boxShadow:'2px 2px 0 #1A1A1A'}}>
              {l==='Temp'?<Thermometer size={13}/>:<Gauge size={13}/>}
              <div><div style={{...S.label}}>{l}</div><div style={{fontSize:11,fontFamily:'monospace',fontWeight:'bold'}}>{v}</div></div>
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',border:'2px solid #1A1A1A',background:pc.bg,color:pc.color,boxShadow:'2px 2px 0 #1A1A1A'}}>
            {phase==='solid'?<Snowflake size={13}/>:phase==='liquid'?<Waves size={13}/>:<Wind size={13}/>}
            <span style={{fontSize:10,fontWeight:'bold',fontFamily:'monospace'}}>{pc.label}</span>
          </div>
          <button onClick={()=>dispatch({type:'ENV_LOCK'})} style={{padding:'8px 10px',border:'2px solid #1A1A1A',background:locked?'#ff6b6b':'white',cursor:'pointer',boxShadow:'2px 2px 0 #1A1A1A'}}>
            {locked?<Lock size={14}/>:<Unlock size={14}/>}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        {/* Left: Controls */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={S.card}>
            <div style={{...S.label,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #EAE8E4'}}>Target Vector</div>
            <div style={{textAlign:'center',fontSize:40,fontWeight:'900',fontFamily:'monospace',marginBottom:14}}><Fmt f={formula}/></div>
            {[['M (molar)',`${mol?.molarMass||'?'} g/mol`],['V_RMS',`${kin.vrms} m/s`],['V_avg',`${kin.vavg} m/s`],['V_mp',`${kin.vmp} m/s`],['Stability',kin.stability]].map(([l,v])=>(
              <div key={l} style={{...S.metric}}>
                <span style={{...S.label}}>{l}</span>
                <span style={{fontSize:11,fontFamily:'monospace',fontWeight:'bold',padding:'1px 6px',border:'1px solid #1A1A1A',background:l==='Stability'?(kin.stability==='NOMINAL'?'#D4FF00':kin.stability==='WARNING'?'#ff9900':'#ff6b6b'):'#EAE8E4',color:l==='Stability'&&kin.stability==='CRITICAL'?'white':'#1A1A1A'}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{...S.card,background:'#EAE8E4',opacity:locked?0.4:1,pointerEvents:locked?'none':'auto'}}>
            <div style={{...S.label,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #1A1A1A'}}>Environment Shift</div>
            {[['Temperature','temp',10,1500,1,`${T} K`],['Pressure','pressure',0.1,250,0.1,`${P.toFixed(1)} atm`]].map(([l,k,min,max,step,disp])=>(
              <div key={k} style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{...S.label}}>{l}</span>
                  <span style={{fontSize:11,fontFamily:'monospace',fontWeight:'bold',padding:'1px 6px',border:'1px solid #1A1A1A',background:'white'}}>{disp}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={state.envParams[k]}
                  onChange={e=>dispatch({type:'ENV',v:{[k]:parseFloat(e.target.value)}})}
                  style={{width:'100%',accentColor:'#1A1A1A',height:28,cursor:'pointer'}}/>
              </div>
            ))}
            <button onClick={()=>dispatch({type:'ENV',v:{temp:298,pressure:1.0}})}
              style={{width:'100%',padding:'10px',border:'2px solid #1A1A1A',background:'white',fontFamily:'monospace',fontSize:10,fontWeight:'bold',textTransform:'uppercase',cursor:'pointer',letterSpacing:'0.1em',boxShadow:'2px 2px 0 #1A1A1A'}}>
              Reset to STP
            </button>
          </div>
        </div>

        {/* Center: 3D Viewer */}
        <div style={{...S.card,padding:0,overflow:'hidden',minHeight:320,position:'relative',display:'flex',flexDirection:'column'}}>
          <div style={{position:'absolute',top:12,left:12,zIndex:10,pointerEvents:'none'}}>
            <div style={{background:'white',border:'2px solid #1A1A1A',padding:'4px 10px',boxShadow:'2px 2px 0 #1A1A1A',display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:8,height:8,background:'#D4FF00',border:'1px solid #1A1A1A',animation:'pulse 1.5s infinite'}}/>
              <span style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.2em'}}>Orbital Node 01</span>
            </div>
            <div style={{background:'white',border:'2px solid #1A1A1A',padding:'6px 12px',marginTop:6,boxShadow:'4px 4px 0 #1A1A1A',fontSize:22,fontWeight:'900',fontFamily:'monospace',fontStyle:'italic'}}>
              <Fmt f={formula}/>
            </div>
          </div>
          <div style={{flex:1,minHeight:280}}><MolViewer3D formula={formula}/></div>
          <div style={{padding:'6px 12px',borderTop:'2px solid #1A1A1A',background:'#EAE8E4',display:'flex',justifyContent:'center'}}>
            <span style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',color:'#666',textTransform:'uppercase',letterSpacing:'0.15em'}}>Drag to rotate · Scroll to zoom</span>
          </div>
        </div>

        {/* Right: Charts */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={S.card}>
            <div style={{...S.label,marginBottom:10,paddingBottom:6,borderBottom:'1px solid #EAE8E4',display:'flex',alignItems:'center',gap:6}}><Zap size={12}/>Maxwell–Boltzmann</div>
            <div style={{height:160}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mbData} margin={{top:4,right:4,left:-24,bottom:0}}>
                  <XAxis dataKey="v" tick={{fontSize:9,fontFamily:'monospace',fontWeight:'bold'}} label={{value:'v (m/s)',position:'insideBottomRight',offset:-4,fontSize:9}}/>
                  <YAxis tick={false}/>
                  <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:'white',border:'2px solid #1A1A1A',padding:'6px 10px',fontSize:10,fontFamily:'monospace',fontWeight:'bold',boxShadow:'2px 2px 0 #1A1A1A'}}><p style={{margin:0}}>v = {payload[0]?.payload?.v} m/s</p><p style={{margin:0,color:'#666'}}>f = {Number(payload[0]?.value).toExponential(2)}</p></div>:null}/>
                  <Area type="monotone" dataKey="f_ref" stroke="#1A1A1A" strokeWidth={1.5} fill="transparent" strokeDasharray="4 2"/>
                  <Area type="step" dataKey="f" stroke="#1A1A1A" strokeWidth={2} fill="#D4FF00" fillOpacity={0.8}/>
                  <ReferenceLine x={+kin.vmp} stroke="#ff6b6b" strokeWidth={2} strokeDasharray="3 3"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{fontSize:9,fontFamily:'monospace',color:'#666',marginTop:4,display:'flex',gap:12}}>
              <span>— {T}K curve &nbsp;&nbsp; - - 298K ref &nbsp;&nbsp; <span style={{color:'#ff6b6b'}}>|</span> V_mp</span>
            </div>
          </div>

          <div style={S.card}>
            <div style={{...S.label,marginBottom:10,paddingBottom:6,borderBottom:'1px solid #EAE8E4',display:'flex',alignItems:'center',gap:6}}><Activity size={12}/>Reaction Pathway</div>
            {state.currentReaction?.isBalanced ? (
              <div style={{height:130}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyData} margin={{top:4,right:4,left:-24,bottom:0}}>
                    <XAxis dataKey="step" tick={{fontSize:10,fontFamily:'monospace',fontWeight:'bold'}} stroke="#1A1A1A"/>
                    <YAxis tick={false} stroke="#1A1A1A"/>
                    <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:'white',border:'2px solid #1A1A1A',padding:'6px 10px',fontSize:10,fontFamily:'monospace',fontWeight:'bold',boxShadow:'2px 2px 0 #1A1A1A'}}><p style={{margin:0}}>{payload[0]?.payload?.label}</p><p style={{margin:0}}>E: {payload[0]?.value}</p></div>:null}/>
                    <Area type="monotone" dataKey="e" stroke="#1A1A1A" fill={state.currentReaction.enthalpy<0?'#D4FF00':'#EAE8E4'} strokeWidth={2} dot={{r:4,fill:'#1A1A1A',strokeWidth:2}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ):(
              <div style={{height:100,border:'2px dashed #1A1A1A',display:'flex',alignItems:'center',justifyContent:'center',background:'#EAE8E4'}}>
                <span style={{fontSize:10,fontFamily:'monospace',color:'#666',textTransform:'uppercase'}}>Awaiting reaction data</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// SECTION 11: ANALYTICS PAGE — ENHANCED WITH EXPORT
// ====================================================================

function AnalyticsPage({ state, dispatch }) {
  const { reactionLog:log } = state;
  const [confirmReset,setConfirmReset] = useState(false);

  const stats = useMemo(()=>{
    const total=log.length, balanced=log.filter(r=>r.isBalanced).length;
    const exo=log.filter(r=>r.isExothermic===true).length;
    const endo=log.filter(r=>r.isExothermic===false).length;
    const types={};
    log.forEach(r=>{ const t=r.reactionType||'Unknown'; types[t]=(types[t]||0)+1; });
    const typeData=Object.entries(types).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value])=>({name,value}));
    const enthData=log.filter(r=>r.enthalpy!=null).slice(0,10).reverse().map((r,i)=>({i:i+1,dH:r.enthalpy}));
    const avgH=log.filter(r=>r.enthalpy!=null).length>0
      ? (log.filter(r=>r.enthalpy!=null).reduce((s,r)=>s+r.enthalpy,0)/log.filter(r=>r.enthalpy!=null).length).toFixed(1)
      : 'N/A';
    return {total,balanced,exo,endo,typeData,enthData,avgH};
  },[log]);

  const pie=[
    {name:'Exothermic',value:stats.exo,color:'#10b981'},
    {name:'Endothermic',value:stats.endo,color:'#f97316'},
    {name:'Unknown',value:stats.balanced-stats.exo-stats.endo,color:'#888'},
  ].filter(d=>d.value>0);

  const timeAgo = ts => {
    const d=Math.floor((Date.now()-ts)/1000);
    return d<60?`${d}s`:d<3600?`${Math.floor(d/60)}m`:d<86400?`${Math.floor(d/3600)}h`:`${Math.floor(d/86400)}d`;
  };

  const S={
    card:{background:'white',border:'2px solid #1A1A1A',boxShadow:'4px 4px 0 #1A1A1A',padding:20},
    label:{fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.15em',fontFamily:'monospace',color:'#1A1A1A'},
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Header */}
      <div style={{...S.card,display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{padding:10,border:'2px solid #1A1A1A',boxShadow:'2px 2px 0 #1A1A1A'}}><BarChart3 size={24}/></div>
          <div>
            <div style={{fontSize:18,fontWeight:'900',fontStyle:'italic',textTransform:'uppercase'}}>Telemetry Analytics</div>
            <div style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',background:'#EAE8E4',border:'1px solid #1A1A1A',padding:'1px 6px',marginTop:4,display:'inline-block'}}>{stats.total} reactions logged</div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          {/* NEW: Export panel */}
          <ExportPanel log={log}/>
          {confirmReset?(
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>setConfirmReset(false)} style={{padding:'6px 12px',border:'2px solid #1A1A1A',background:'white',cursor:'pointer',fontSize:9,fontWeight:'bold',fontFamily:'monospace',boxShadow:'2px 2px 0 #1A1A1A'}}>Cancel</button>
              <button onClick={()=>{dispatch({type:'RESET'});setConfirmReset(false);}} style={{padding:'6px 12px',border:'2px solid #1A1A1A',background:'#ff6b6b',color:'white',cursor:'pointer',fontSize:9,fontWeight:'bold',fontFamily:'monospace',display:'flex',gap:4,alignItems:'center',boxShadow:'2px 2px 0 #1A1A1A'}}>
                <Trash2 size={11}/>Confirm Purge
              </button>
            </div>
          ):(
            <button onClick={()=>setConfirmReset(true)} style={{padding:'6px 12px',border:'2px solid #1A1A1A',background:'white',cursor:'pointer',fontSize:9,fontWeight:'bold',fontFamily:'monospace',display:'flex',gap:4,alignItems:'center',boxShadow:'2px 2px 0 #1A1A1A'}}>
              <Trash2 size={11}/>Purge Log
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10}}>
        {[
          {icon:<Hash size={18}/>,label:'Total',val:stats.total.toString(),bg:'white'},
          {icon:<Activity size={18}/>,label:'Balanced',val:stats.balanced.toString(),sub:stats.total>0?`${Math.round(stats.balanced/stats.total*100)}%`:null,bg:'#D4FF00'},
          {icon:<Flame size={18}/>,label:'Exothermic',val:stats.exo.toString(),bg:'#EAE8E4'},
          {icon:<TrendingUp size={18}/>,label:'Avg ΔH',val:`${stats.avgH} kJ`,bg:'white'},
        ].map(({icon,label,val,sub,bg})=>(
          <div key={label} style={{border:'2px solid #1A1A1A',background:bg,padding:16,boxShadow:'2px 2px 0 #1A1A1A',transition:'transform 0.1s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}>
            <div style={{color:'#1A1A1A',marginBottom:8}}>{icon}</div>
            <div style={{fontSize:22,fontWeight:'900',fontFamily:'monospace'}}>{val}</div>
            {sub&&<div style={{fontSize:10,fontFamily:'monospace',fontWeight:'bold',border:'1px solid #1A1A1A',background:'white',padding:'1px 4px',display:'inline-block',marginTop:4}}>{sub}</div>}
            <div style={{...S.label,marginTop:6,borderTop:'1px solid #1A1A1A',paddingTop:6}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
        {/* Enthalpy chart */}
        {stats.enthData.length>1&&(
          <div style={S.card}>
            <div style={{...S.label,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #EAE8E4',display:'flex',alignItems:'center',gap:6}}><TrendingUp size={12}/>Enthalpy Trend (last 10)</div>
            <div style={{height:150}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.enthData} barSize={20} margin={{top:8,right:8,left:-24,bottom:0}}>
                  <XAxis dataKey="i" hide/>
                  <YAxis stroke="#1A1A1A" tick={{fontSize:9,fontWeight:'bold'}}/>
                  <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:'white',border:'2px solid #1A1A1A',padding:'6px 10px',fontSize:10,fontFamily:'monospace',fontWeight:'bold',boxShadow:'2px 2px 0 #1A1A1A'}}><p style={{margin:0}}>ΔH = {payload[0].value} kJ/mol</p></div>:null}/>
                  <Bar dataKey="dH" radius={[0,0,0,0]}>
                    {stats.enthData.map((d,i)=><Cell key={i} fill={d.dH<0?'#10b981':'#f97316'} stroke="#1A1A1A" strokeWidth={1.5}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Type distribution */}
        {stats.typeData.length>0&&(
          <div style={S.card}>
            <div style={{...S.label,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #EAE8E4',display:'flex',alignItems:'center',gap:6}}><Database size={12}/>Reaction Types</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {stats.typeData.map((t,i)=>(
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:9,fontFamily:'monospace',fontWeight:'bold'}}>
                    <span>{t.name}</span><span>{t.value}</span>
                  </div>
                  <div style={{height:12,background:'#EAE8E4',border:'1px solid #1A1A1A',overflow:'hidden'}}>
                    <div style={{height:'100%',background:'#1A1A1A',width:`${stats.total>0?(t.value/stats.total*100).toFixed(0):0}%`,transition:'width 0.4s ease'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pie chart */}
        {pie.length>0&&(
          <div style={{...S.card,background:'#EAE8E4'}}>
            <div style={{...S.label,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #1A1A1A',display:'flex',alignItems:'center',gap:6}}><Activity size={12}/>Thermicity Split</div>
            <div style={{height:140}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                    {pie.map((d,i)=><Cell key={i} fill={d.color} stroke="#1A1A1A" strokeWidth={2}/>)}
                  </Pie>
                  <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:'white',border:'2px solid #1A1A1A',padding:'6px 10px',fontSize:10,fontFamily:'monospace',fontWeight:'bold'}}><p style={{margin:0}}>{payload[0].name}: {payload[0].value}</p></div>:null}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8}}>
              {pie.map((d,i)=><span key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,fontFamily:'monospace',fontWeight:'bold'}}><span style={{width:10,height:10,background:d.color,border:'1px solid #1A1A1A',display:'inline-block'}}/>{d.name}</span>)}
            </div>
          </div>
        )}

        {/* Reaction log */}
        <div style={{...S.card,background:'#D4FF00',gridColumn:'span 2'}}>
          <div style={{...S.label,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #1A1A1A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{display:'flex',alignItems:'center',gap:6}}><Clock size={12}/>Reaction Log</span>
            <span style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',background:'white',border:'1px solid #1A1A1A',padding:'1px 6px'}}>{log.length} entries</span>
          </div>
          <div style={{maxHeight:240,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
            {log.length===0&&(
              <div style={{border:'2px dashed #1A1A1A',background:'white',padding:24,textAlign:'center',fontSize:10,fontFamily:'monospace',color:'#666'}}>No reactions logged yet. Solve a reaction in the Laboratory.</div>
            )}
            {log.map((entry,i)=>(
              <div key={entry.timestamp} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'white',border:'2px solid #1A1A1A',boxShadow:'2px 2px 0 #1A1A1A',transition:'all 0.1s',cursor:'pointer'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#EAE8E4';e.currentTarget.style.transform='translateX(3px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.transform='none';}}>
                <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                  <div style={{width:8,height:8,flexShrink:0,background:entry.isBalanced?(entry.isExothermic?'#10b981':'#f97316'):'#ff6b6b',border:'1px solid #1A1A1A'}}/>
                  <div style={{minWidth:0}}>
                    <p style={{margin:0,fontSize:12,fontFamily:'monospace',fontWeight:'bold',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.expression}</p>
                    <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                      {entry.reactionType&&<span style={{fontSize:8,background:'#1A1A1A',color:'white',padding:'1px 5px',fontFamily:'monospace',fontWeight:'bold'}}>{entry.reactionType}</span>}
                      {entry.enthalpy!=null&&<span style={{fontSize:8,fontFamily:'monospace',fontWeight:'bold',border:'1px solid #1A1A1A',padding:'1px 5px',background:'white',color:entry.isExothermic?'#10b981':'#f97316'}}>ΔH={entry.enthalpy}</span>}
                    </div>
                  </div>
                </div>
                <span style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',color:'#666',flexShrink:0,paddingLeft:8}}>{timeAgo(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {log.length===0&&(
        <div style={{border:'2px dashed #1A1A1A',background:'white',padding:48,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <BarChart3 size={36} style={{color:'#CCC'}}/>
          <p style={{fontSize:11,fontFamily:'monospace',color:'#666',textTransform:'uppercase',letterSpacing:'0.15em',margin:0}}>No data yet — solve reactions in the Laboratory</p>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// SECTION 12: COMPARE PAGE — BRAND NEW FEATURE
// ====================================================================

function ComparePage({ state, dispatch }) {
  const slots = state.compareSlots;
  const S={
    card:{background:'white',border:'2px solid #1A1A1A',boxShadow:'4px 4px 0 #1A1A1A',padding:20},
    label:{fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.15em',fontFamily:'monospace',color:'#1A1A1A'},
  };

  const getWinner = (a,b,metric,lower=true) => {
    if(a==null||b==null) return null;
    if(lower) return a<b?0:b<a?1:null;
    return a>b?0:b>a?1:null;
  };

  const metrics = slots.length===2 ? [
    {label:'ΔH (kJ/mol)',key:'enthalpy',lower:true,fmt:v=>`${v} kJ`},
    {label:'ΔS (J/K·mol)',key:'entropy',lower:false,fmt:v=>`${v} J/K`},
    {label:'ΔG (kJ/mol)',key:'gibbs',lower:true,fmt:v=>`${v} kJ`},
    {label:'Spontaneous',key:'gibbs',lower:true,fmt:v=>v<0?'YES':'NO',color:v=>v<0?'#D4FF00':'#EAE8E4'},
    {label:'Type',key:'reactionType',fmt:v=>v||'Unknown',noWinner:true},
  ] : [];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Header */}
      <div style={{...S.card,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{padding:10,border:'2px solid #1A1A1A',background:'#EAE8E4',boxShadow:'2px 2px 0 #1A1A1A'}}><GitCompare size={22}/></div>
          <div>
            <div style={{fontSize:18,fontWeight:'900',fontStyle:'italic',textTransform:'uppercase'}}>Reaction Compare</div>
            <div style={{fontSize:9,fontFamily:'monospace',color:'#666',marginTop:2,fontWeight:'bold'}}>Side-by-side thermodynamic analysis · max 2 reactions</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',border:'1px solid #1A1A1A',padding:'2px 8px',background:slots.length===2?'#D4FF00':'#EAE8E4'}}>{slots.length}/2 loaded</span>
          {slots.length>0&&<button onClick={()=>dispatch({type:'CLEAR_COMPARE'})} style={{padding:'4px 10px',border:'1.5px solid #1A1A1A',background:'white',cursor:'pointer',fontSize:9,fontWeight:'bold',fontFamily:'monospace',boxShadow:'1px 1px 0 #1A1A1A'}}>Clear All</button>}
        </div>
      </div>

      {/* Instructions if empty */}
      {slots.length===0&&(
        <div style={{border:'2px dashed #1A1A1A',padding:48,textAlign:'center',background:'white',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
          <GitCompare size={40} style={{color:'#CCC'}}/>
          <div style={{fontSize:11,fontFamily:'monospace',color:'#666',textTransform:'uppercase',letterSpacing:'0.1em'}}>
            <p style={{margin:'0 0 8px'}}>To compare reactions:</p>
            <p style={{margin:'0 0 4px'}}>1. Solve a reaction in the Laboratory</p>
            <p style={{margin:'0 0 4px'}}>2. Click the <strong>Compare</strong> button on the result</p>
            <p style={{margin:0}}>3. Solve a second reaction and add it too</p>
          </div>
          <button onClick={()=>dispatch({type:'TAB',v:'workspace'})}
            style={{padding:'10px 20px',border:'2px solid #1A1A1A',background:'#D4FF00',cursor:'pointer',fontSize:10,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',boxShadow:'2px 2px 0 #1A1A1A'}}>
            Go to Laboratory →
          </button>
        </div>
      )}

      {/* Slot cards */}
      {slots.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
          {[0,1].map(i=>{
            const slot = slots[i];
            if(!slot) return (
              <div key={i} style={{border:'2px dashed #1A1A1A',padding:32,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,background:'#EAE8E4',minHeight:200}}>
                <Plus size={24} style={{color:'#CCC'}}/>
                <span style={{fontSize:10,fontFamily:'monospace',color:'#666',textTransform:'uppercase',letterSpacing:'0.1em',textAlign:'center'}}>Add Reaction {i+1}<br/>Solve in Laboratory →</span>
              </div>
            );
            const r = slot.reaction;
            return (
              <div key={i} style={{...S.card,position:'relative'}}>
                <button onClick={()=>dispatch({type:'RM_COMPARE',v:i})}
                  style={{position:'absolute',top:10,right:10,border:'1px solid #1A1A1A',background:'white',cursor:'pointer',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={12}/>
                </button>
                <div style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.2em',color:'#666',marginBottom:6}}>Reaction {i+1}</div>
                <div style={{fontSize:14,fontFamily:'monospace',fontWeight:'bold',marginBottom:12,background:'#EAE8E4',border:'1px solid #1A1A1A',padding:'6px 10px'}}>{slot.expression}</div>
                {r?.isBalanced&&(
                  <>
                    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginBottom:14,fontSize:16,fontWeight:'bold',fontFamily:'monospace'}}>
                      {r.reactants.molecules.map((m,j)=>(
                        <span key={j} style={{display:'flex',alignItems:'center',gap:4}}>
                          {j>0&&<span>+</span>}
                          {m.coefficient>1&&<span>{m.coefficient}</span>}
                          <span style={{border:'1.5px solid #1A1A1A',padding:'2px 8px'}}><Fmt f={m.molecule.formula}/></span>
                        </span>
                      ))}
                      <span>⟶</span>
                      {r.products.molecules.map((m,j)=>(
                        <span key={j} style={{display:'flex',alignItems:'center',gap:4}}>
                          {j>0&&<span>+</span>}
                          {m.coefficient>1&&<span>{m.coefficient}</span>}
                          <span style={{border:'1.5px solid #1A1A1A',padding:'2px 8px'}}><Fmt f={m.molecule.formula}/></span>
                        </span>
                      ))}
                    </div>
                    {[['ΔH',r.enthalpy,'kJ/mol',r.enthalpy<0],['ΔS',r.entropy,'J/K',r.entropy>0],['ΔG',r.gibbs,'kJ/mol',r.gibbs<0]].map(([l,v,unit,good])=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',border:'1.5px solid #1A1A1A',marginBottom:6,background:good?'#D4FF00':'#EAE8E4'}}>
                        <span style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase'}}>{l}</span>
                        <span style={{fontSize:12,fontFamily:'monospace',fontWeight:'bold'}}>{v} {unit}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison table */}
      {slots.length===2&&slots[0].reaction?.isBalanced&&slots[1].reaction?.isBalanced&&(
        <div style={S.card}>
          <div style={{...S.label,marginBottom:14,paddingBottom:8,borderBottom:'2px solid #1A1A1A'}}>Direct Comparison</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'monospace',fontSize:11}}>
              <thead>
                <tr>
                  <th style={{padding:'8px 12px',textAlign:'left',borderBottom:'2px solid #1A1A1A',fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',background:'#EAE8E4'}}>Metric</th>
                  {slots.map((s,i)=><th key={i} style={{padding:'8px 12px',textAlign:'center',borderBottom:'2px solid #1A1A1A',fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',background:'#EAE8E4'}}>Reaction {i+1}</th>)}
                  <th style={{padding:'8px 12px',textAlign:'center',borderBottom:'2px solid #1A1A1A',fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',background:'#EAE8E4'}}>Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Enthalpy ΔH','enthalpy','kJ/mol',true,null],
                  ['Entropy ΔS','entropy','J/K·mol',false,null],
                  ['Gibbs ΔG','gibbs','kJ/mol',true,null],
                  ['Spontaneous','gibbs',null,null,(v)=>v<0?'✓ Yes':'✗ No'],
                  ['Type','reactionType',null,null,(v)=>v||'Unknown'],
                ].map(([l,k,unit,lower,fmt])=>{
                  const v0=slots[0].reaction[k], v1=slots[1].reaction[k];
                  const w = lower!==null&&typeof v0==='number'&&typeof v1==='number' ? getWinner(v0,v1,k,lower) : null;
                  return (
                    <tr key={l} style={{borderBottom:'1px solid #EAE8E4'}}>
                      <td style={{padding:'8px 12px',fontWeight:'bold',color:'#1A1A1A'}}>{l}</td>
                      {[v0,v1].map((v,i)=>(
                        <td key={i} style={{padding:'8px 12px',textAlign:'center',background:w===i?'#D4FF00':'transparent',fontWeight:w===i?'bold':'normal',border:w===i?'1.5px solid #1A1A1A':'none'}}>
                          {fmt?fmt(v):`${v}${unit?' '+unit:''}`}
                        </td>
                      ))}
                      <td style={{padding:'8px 12px',textAlign:'center'}}>
                        {w!==null?<span style={{fontSize:9,background:'#1A1A1A',color:'#D4FF00',padding:'2px 8px',fontWeight:'bold'}}>R{w+1}</span>:'—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// SECTION 13: LAYOUT
// ====================================================================

function SideBar({ state, dispatch }) {
  const tabs = [
    {id:'workspace',icon:<FlaskConical size={18}/>,label:'Laboratory',desc:'Reaction Workspace'},
    {id:'simulate', icon:<Atom size={18}/>,       label:'Simulator',  desc:'Quantum Sim & 3D'},
    {id:'analytics',icon:<BarChart3 size={18}/>,  label:'Telemetry',  desc:'Data Analytics'},
    {id:'compare',  icon:<GitCompare size={18}/>, label:'Compare',    desc:`Side-by-Side (${state.compareSlots.length}/2)`},
  ];

  return (
    <nav style={{
      display:'flex', flexDirection:'column', width:220, flexShrink:0,
      borderRight:'4px solid #1A1A1A', background:'#FDFCFB',
      height:'100%', overflow:'hidden'
    }}>
      {/* Branding */}
      <div style={{padding:16,borderBottom:'4px solid #1A1A1A',background:'#ff6b6b',position:'relative'}}>
        <div style={{border:'4px solid #1A1A1A',background:'#D4FF00',padding:'10px 12px',boxShadow:'4px 4px 0 #1A1A1A',position:'relative',zIndex:1}}>
          <div style={{fontSize:14,fontWeight:'900',textTransform:'uppercase',letterSpacing:'-0.03em',fontFamily:'monospace'}}>OWDA.SYS</div>
          <div style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',background:'white',border:'1px solid #1A1A1A',padding:'1px 6px',marginTop:4,display:'inline-block',textTransform:'uppercase'}}>v5.0.0</div>
        </div>
        <div style={{display:'flex',gap:3,marginTop:10,opacity:0.7}}>
          {Array.from({length:8},(_,i)=><div key={i} style={{flex:1,height:i%2===0?16:8,background:'#1A1A1A'}}/>)}
        </div>
      </div>

      {/* Nav */}
      <div style={{padding:'12px 10px',flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
        {tabs.map(tab=>{
          const active = state.activeTab===tab.id;
          return (
            <button key={tab.id} onClick={()=>dispatch({type:'TAB',v:tab.id})}
              style={{
                display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 12px',
                border:'2px solid #1A1A1A',cursor:'pointer',textAlign:'left',
                background:active?'#1A1A1A':'white',color:active?'white':'#1A1A1A',
                boxShadow:active?'4px 4px 0 #D4FF00':'2px 2px 0 #1A1A1A',
                transform:active?'none':'none',transition:'all 0.15s',
                fontFamily:'monospace'
              }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.transform='translateX(2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>
              <div style={{position:'relative'}}>
                {tab.icon}
                {active&&<div style={{position:'absolute',top:-3,right:-3,width:6,height:6,background:'#D4FF00',borderRadius:'50%',animation:'pulse 1.5s infinite'}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em'}}>{tab.label}</div>
                <div style={{fontSize:8,opacity:0.7,fontFamily:'monospace',marginTop:1}}>{active?'STATUS: ACTIVE':tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom section */}
      <div style={{borderTop:'4px solid #1A1A1A',background:'#EAE8E4',padding:'10px'}}>
        <button onClick={()=>dispatch({type:'CMD'})}
          style={{width:'100%',padding:'8px 12px',border:'2px solid #1A1A1A',background:state.commandOpen?'#D4FF00':'white',cursor:'pointer',fontFamily:'monospace',fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'2px 2px 0 #1A1A1A'}}>
          <span style={{display:'flex',alignItems:'center',gap:6}}><Search size={12}/> Command</span>
          <kbd style={{padding:'1px 5px',border:'1px solid #1A1A1A',background:'white',fontSize:9,fontFamily:'monospace'}}>⌘K</kbd>
        </button>
        <div style={{marginTop:8,padding:10,background:'white',border:'4px solid #1A1A1A',boxShadow:'3px 3px 0 #1A1A1A'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
            <Zap size={10} style={{animation:'pulse 1.5s infinite'}}/>
            <span style={{fontSize:8,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.2em',background:'#D4FF00',border:'1px solid #1A1A1A',padding:'0 4px'}}>Status</span>
          </div>
          <div style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',fontStyle:'italic',background:'black',color:'white',padding:'2px 6px',display:'inline-block'}}>100% NOMINAL</div>
          <div style={{height:4,background:'#EAE8E4',border:'1px solid #1A1A1A',marginTop:6,overflow:'hidden',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'#ff6b6b',width:'50%',animation:'slide 2s linear infinite'}}/>
          </div>
        </div>
      </div>
    </nav>
  );
}

function TopBar({ state, dispatch }) {
  const [uptime,setUptime] = useState('00:00:00');
  useEffect(()=>{
    const t0=Date.now();
    const id=setInterval(()=>{
      const s=Math.floor((Date.now()-t0)/1000);
      const h=Math.floor(s/3600).toString().padStart(2,'0');
      const m=Math.floor((s%3600)/60).toString().padStart(2,'0');
      const sc=(s%60).toString().padStart(2,'0');
      setUptime(`${h}:${m}:${sc}`);
    },1000);
    return ()=>clearInterval(id);
  },[]);

  return (
    <header style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'8px 20px',borderBottom:'4px solid #1A1A1A',background:'#FDFCFB',
      position:'sticky',top:0,zIndex:40,boxShadow:'0 4px 0 #1A1A1A'
    }}>
      {/* Logo */}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,border:'3px solid #1A1A1A',background:'#D4FF00',boxShadow:'3px 3px 0 #1A1A1A',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg viewBox="0 0 100 100" width="26" height="26">
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="#1A1A1A" strokeWidth="8"/>
            <line x1="27" y1="39" x2="27" y2="61" stroke="#1A1A1A" strokeWidth="8"/>
            <line x1="52" y1="75" x2="71" y2="64" stroke="#1A1A1A" strokeWidth="8"/>
            <line x1="71" y1="36" x2="52" y2="25" stroke="#1A1A1A" strokeWidth="8"/>
          </svg>
        </div>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:22,fontWeight:'900',letterSpacing:'-0.05em',textTransform:'uppercase',fontFamily:'monospace'}}>OWDA.</span>
            <span style={{fontSize:9,padding:'1px 6px',border:'2px solid #1A1A1A',background:'white',fontWeight:'bold',fontFamily:'monospace'}}>ALPHA</span>
          </div>
        </div>
      </div>

      {/* Center — session info */}
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'0 20px',borderLeft:'2px solid #1A1A1A',borderRight:'2px solid #1A1A1A',height:40,background:'#EAE8E4'}}>
        <div style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',color:'#666',textTransform:'uppercase',letterSpacing:'0.1em'}}>Session</div>
        <div style={{fontFamily:'monospace',fontWeight:'900',fontSize:13,letterSpacing:'0.1em',padding:'2px 8px',border:'2px solid #1A1A1A',background:'white',boxShadow:'2px 2px 0 #1A1A1A'}}>{uptime}</div>
        <div style={{fontSize:9,fontFamily:'monospace',fontWeight:'bold',color:'#666'}}>{state.reactionLog.length} reactions</div>
      </div>

      {/* Right — controls */}
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button onClick={()=>dispatch({type:'CMD'})}
          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',border:'2px solid #1A1A1A',background:state.commandOpen?'#1A1A1A':'#D4FF00',color:state.commandOpen?'white':'#1A1A1A',cursor:'pointer',fontFamily:'monospace',fontSize:9,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.1em',boxShadow:'2px 2px 0 #1A1A1A'}}>
          <Search size={13}/>Search
          <kbd style={{padding:'1px 4px',border:'1px solid currentColor',fontSize:8,borderRadius:2,fontFamily:'monospace'}}>⌘K</kbd>
        </button>
        <button onClick={()=>dispatch({type:'SETTINGS',v:{enableAI:!state.settings.enableAI}})}
          style={{padding:'6px 10px',border:'2px solid #1A1A1A',background:state.settings.enableAI?'#D4FF00':'white',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:9,fontWeight:'bold',fontFamily:'monospace',boxShadow:'2px 2px 0 #1A1A1A'}}>
          {state.settings.enableAI?<Bot size={13}/>:<BotOff size={13}/>}
          AI
        </button>
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',border:'2px solid #1A1A1A',background:'white',boxShadow:'2px 2px 0 #1A1A1A'}}>
          <div style={{width:6,height:6,background:'#10b981',borderRadius:'50%',animation:'pulse 1.5s infinite'}}/>
          <span style={{fontSize:8,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.15em'}}>Stable</span>
        </div>
      </div>
    </header>
  );
}

// ====================================================================
// SECTION 14: MAIN APP
// ====================================================================

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Keyboard shortcuts
  useKey('ctrl+k', ()=>dispatch({type:'CMD'}));
  useKey('ctrl+1', ()=>dispatch({type:'TAB',v:'workspace'}));
  useKey('ctrl+2', ()=>dispatch({type:'TAB',v:'simulate'}));
  useKey('ctrl+3', ()=>dispatch({type:'TAB',v:'analytics'}));
  useKey('ctrl+4', ()=>dispatch({type:'TAB',v:'compare'}));

  const pageMap = {
    workspace: <WorkspacePage state={state} dispatch={dispatch}/>,
    simulate:  <SimulatePage state={state} dispatch={dispatch}/>,
    analytics: <AnalyticsPage state={state} dispatch={dispatch}/>,
    compare:   <ComparePage state={state} dispatch={dispatch}/>,
  };

  return (
    <div style={{minHeight:'100vh',background:'#FDFCFB',fontFamily:'monospace',userSelect:'none'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slide{from{left:-50%}to{left:100%}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(26,26,26,0.25);border-radius:0}
        ::-webkit-scrollbar-thumb:hover{background:rgba(26,26,26,0.5)}
      `}</style>

      {/* Frame accents */}
      <div style={{position:'fixed',top:0,left:0,right:0,height:3,background:'#1A1A1A',zIndex:9999}}/>
      <div style={{position:'fixed',bottom:0,left:0,right:0,height:3,background:'#1A1A1A',zIndex:9999}}/>
      <div style={{position:'fixed',top:0,bottom:0,left:0,width:3,background:'#1A1A1A',zIndex:9999}}/>
      <div style={{position:'fixed',top:0,bottom:0,right:0,width:3,background:'#1A1A1A',zIndex:9999}}/>

      {/* Grid background */}
      <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(26,26,26,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(26,26,26,0.04) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none',zIndex:0}}/>

      <CommandPalette isOpen={state.commandOpen} onClose={()=>dispatch({type:'CMD'})} state={state} dispatch={dispatch}/>

      <div style={{display:'flex',flexDirection:'column',height:'100vh',position:'relative',zIndex:1}}>
        <TopBar state={state} dispatch={dispatch}/>

        <div style={{display:'flex',flex:1,minHeight:0}}>
          <SideBar state={state} dispatch={dispatch}/>

          <main style={{flex:1,overflowY:'auto',padding:24,minWidth:0}}>
            {state.error&&(
              <div style={{marginBottom:16,border:'2px solid #1A1A1A',background:'#ff6b6b',padding:16,boxShadow:'4px 4px 0 #1A1A1A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <AlertTriangle size={18} style={{color:'white',flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:10,fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.2em',color:'white',fontFamily:'monospace'}}>Engine Error</div>
                    <div style={{fontSize:11,color:'white',fontFamily:'monospace',fontWeight:'bold',marginTop:2}}>{state.error.message}</div>
                  </div>
                </div>
                <button onClick={()=>dispatch({type:'CLEAR_ERR'})}
                  style={{border:'1.5px solid white',background:'transparent',color:'white',padding:'4px 12px',cursor:'pointer',fontFamily:'monospace',fontSize:9,fontWeight:'bold',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
                  <X size={11}/>Dismiss
                </button>
              </div>
            )}

            <div style={{maxWidth:1200,margin:'0 auto'}}>
              {pageMap[state.activeTab]||pageMap.workspace}
            </div>

            {/* Keyboard shortcuts hint */}
            <div style={{position:'fixed',bottom:16,right:16,fontSize:8,fontFamily:'monospace',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'0.15em',color:'#666',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,opacity:0.5,pointerEvents:'none'}}>
              <span style={{background:'#D4FF00',border:'1px solid #1A1A1A',padding:'1px 5px',color:'#1A1A1A'}}>OWDA.SYS</span>
              <span style={{background:'white',border:'1px solid #1A1A1A',padding:'1px 5px'}}>BUILD_v5.0.0</span>
              <span style={{background:'white',border:'1px solid #1A1A1A',padding:'1px 5px'}}>Ctrl+K = Command Palette</span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}