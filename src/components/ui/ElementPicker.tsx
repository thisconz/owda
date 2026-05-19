import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Delete } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ElemCategory =
  | "nonmetal" | "noble" | "alkali" | "alkaline" | "actinide"
  | "lanthanide" | "transition" | "post-transition" | "metalloid" | "halogen";

interface Element {
  symbol:   string;
  name:     string;
  atomic:   number;
  category: ElemCategory;
  row:      number;
  col:      number;
}

// ─── Element Data (unchanged — abbreviated for brevity; full list preserved) ──

const ELEMENTS: Element[] = [
  { symbol:"H",  name:"Hydrogen",      atomic:1,   category:"nonmetal",       row:1, col:1  },
  { symbol:"He", name:"Helium",        atomic:2,   category:"noble",          row:1, col:18 },
  { symbol:"Li", name:"Lithium",       atomic:3,   category:"alkali",         row:2, col:1  },
  { symbol:"Be", name:"Beryllium",     atomic:4,   category:"alkaline",       row:2, col:2  },
  { symbol:"B",  name:"Boron",         atomic:5,   category:"metalloid",      row:2, col:13 },
  { symbol:"C",  name:"Carbon",        atomic:6,   category:"nonmetal",       row:2, col:14 },
  { symbol:"N",  name:"Nitrogen",      atomic:7,   category:"nonmetal",       row:2, col:15 },
  { symbol:"O",  name:"Oxygen",        atomic:8,   category:"nonmetal",       row:2, col:16 },
  { symbol:"F",  name:"Fluorine",      atomic:9,   category:"halogen",        row:2, col:17 },
  { symbol:"Ne", name:"Neon",          atomic:10,  category:"noble",          row:2, col:18 },
  { symbol:"Na", name:"Sodium",        atomic:11,  category:"alkali",         row:3, col:1  },
  { symbol:"Mg", name:"Magnesium",     atomic:12,  category:"alkaline",       row:3, col:2  },
  { symbol:"Al", name:"Aluminum",      atomic:13,  category:"post-transition",row:3, col:13 },
  { symbol:"Si", name:"Silicon",       atomic:14,  category:"metalloid",      row:3, col:14 },
  { symbol:"P",  name:"Phosphorus",    atomic:15,  category:"nonmetal",       row:3, col:15 },
  { symbol:"S",  name:"Sulfur",        atomic:16,  category:"nonmetal",       row:3, col:16 },
  { symbol:"Cl", name:"Chlorine",      atomic:17,  category:"halogen",        row:3, col:17 },
  { symbol:"Ar", name:"Argon",         atomic:18,  category:"noble",          row:3, col:18 },
  { symbol:"K",  name:"Potassium",     atomic:19,  category:"alkali",         row:4, col:1  },
  { symbol:"Ca", name:"Calcium",       atomic:20,  category:"alkaline",       row:4, col:2  },
  { symbol:"Sc", name:"Scandium",      atomic:21,  category:"transition",     row:4, col:3  },
  { symbol:"Ti", name:"Titanium",      atomic:22,  category:"transition",     row:4, col:4  },
  { symbol:"V",  name:"Vanadium",      atomic:23,  category:"transition",     row:4, col:5  },
  { symbol:"Cr", name:"Chromium",      atomic:24,  category:"transition",     row:4, col:6  },
  { symbol:"Mn", name:"Manganese",     atomic:25,  category:"transition",     row:4, col:7  },
  { symbol:"Fe", name:"Iron",          atomic:26,  category:"transition",     row:4, col:8  },
  { symbol:"Co", name:"Cobalt",        atomic:27,  category:"transition",     row:4, col:9  },
  { symbol:"Ni", name:"Nickel",        atomic:28,  category:"transition",     row:4, col:10 },
  { symbol:"Cu", name:"Copper",        atomic:29,  category:"transition",     row:4, col:11 },
  { symbol:"Zn", name:"Zinc",          atomic:30,  category:"transition",     row:4, col:12 },
  { symbol:"Ga", name:"Gallium",       atomic:31,  category:"post-transition",row:4, col:13 },
  { symbol:"Ge", name:"Germanium",     atomic:32,  category:"metalloid",      row:4, col:14 },
  { symbol:"As", name:"Arsenic",       atomic:33,  category:"metalloid",      row:4, col:15 },
  { symbol:"Se", name:"Selenium",      atomic:34,  category:"nonmetal",       row:4, col:16 },
  { symbol:"Br", name:"Bromine",       atomic:35,  category:"halogen",        row:4, col:17 },
  { symbol:"Kr", name:"Krypton",       atomic:36,  category:"noble",          row:4, col:18 },
  { symbol:"Rb", name:"Rubidium",      atomic:37,  category:"alkali",         row:5, col:1  },
  { symbol:"Sr", name:"Strontium",     atomic:38,  category:"alkaline",       row:5, col:2  },
  { symbol:"Y",  name:"Yttrium",       atomic:39,  category:"transition",     row:5, col:3  },
  { symbol:"Zr", name:"Zirconium",     atomic:40,  category:"transition",     row:5, col:4  },
  { symbol:"Nb", name:"Niobium",       atomic:41,  category:"transition",     row:5, col:5  },
  { symbol:"Mo", name:"Molybdenum",    atomic:42,  category:"transition",     row:5, col:6  },
  { symbol:"Tc", name:"Technetium",    atomic:43,  category:"transition",     row:5, col:7  },
  { symbol:"Ru", name:"Ruthenium",     atomic:44,  category:"transition",     row:5, col:8  },
  { symbol:"Rh", name:"Rhodium",       atomic:45,  category:"transition",     row:5, col:9  },
  { symbol:"Pd", name:"Palladium",     atomic:46,  category:"transition",     row:5, col:10 },
  { symbol:"Ag", name:"Silver",        atomic:47,  category:"transition",     row:5, col:11 },
  { symbol:"Cd", name:"Cadmium",       atomic:48,  category:"transition",     row:5, col:12 },
  { symbol:"In", name:"Indium",        atomic:49,  category:"post-transition",row:5, col:13 },
  { symbol:"Sn", name:"Tin",           atomic:50,  category:"post-transition",row:5, col:14 },
  { symbol:"Sb", name:"Antimony",      atomic:51,  category:"metalloid",      row:5, col:15 },
  { symbol:"Te", name:"Tellurium",     atomic:52,  category:"metalloid",      row:5, col:16 },
  { symbol:"I",  name:"Iodine",        atomic:53,  category:"halogen",        row:5, col:17 },
  { symbol:"Xe", name:"Xenon",         atomic:54,  category:"noble",          row:5, col:18 },
  { symbol:"Cs", name:"Cesium",        atomic:55,  category:"alkali",         row:6, col:1  },
  { symbol:"Ba", name:"Barium",        atomic:56,  category:"alkaline",       row:6, col:2  },
  { symbol:"Hf", name:"Hafnium",       atomic:72,  category:"transition",     row:6, col:4  },
  { symbol:"Ta", name:"Tantalum",      atomic:73,  category:"transition",     row:6, col:5  },
  { symbol:"W",  name:"Tungsten",      atomic:74,  category:"transition",     row:6, col:6  },
  { symbol:"Re", name:"Rhenium",       atomic:75,  category:"transition",     row:6, col:7  },
  { symbol:"Os", name:"Osmium",        atomic:76,  category:"transition",     row:6, col:8  },
  { symbol:"Ir", name:"Iridium",       atomic:77,  category:"transition",     row:6, col:9  },
  { symbol:"Pt", name:"Platinum",      atomic:78,  category:"transition",     row:6, col:10 },
  { symbol:"Au", name:"Gold",          atomic:79,  category:"transition",     row:6, col:11 },
  { symbol:"Hg", name:"Mercury",       atomic:80,  category:"transition",     row:6, col:12 },
  { symbol:"Tl", name:"Thallium",      atomic:81,  category:"post-transition",row:6, col:13 },
  { symbol:"Pb", name:"Lead",          atomic:82,  category:"post-transition",row:6, col:14 },
  { symbol:"Bi", name:"Bismuth",       atomic:83,  category:"post-transition",row:6, col:15 },
  { symbol:"Po", name:"Polonium",      atomic:84,  category:"post-transition",row:6, col:16 },
  { symbol:"At", name:"Astatine",      atomic:85,  category:"metalloid",      row:6, col:17 },
  { symbol:"Rn", name:"Radon",         atomic:86,  category:"noble",          row:6, col:18 },
  { symbol:"Fr", name:"Francium",      atomic:87,  category:"alkali",         row:7, col:1  },
  { symbol:"Ra", name:"Radium",        atomic:88,  category:"alkaline",       row:7, col:2  },
  { symbol:"Rf", name:"Rutherfordium", atomic:104, category:"transition",     row:7, col:4  },
  { symbol:"Db", name:"Dubnium",       atomic:105, category:"transition",     row:7, col:5  },
  { symbol:"Sg", name:"Seaborgium",    atomic:106, category:"transition",     row:7, col:6  },
  { symbol:"Bh", name:"Bohrium",       atomic:107, category:"transition",     row:7, col:7  },
  { symbol:"Hs", name:"Hassium",       atomic:108, category:"transition",     row:7, col:8  },
  { symbol:"Mt", name:"Meitnerium",    atomic:109, category:"transition",     row:7, col:9  },
  { symbol:"Ds", name:"Darmstadtium",  atomic:110, category:"transition",     row:7, col:10 },
  { symbol:"Rg", name:"Roentgenium",   atomic:111, category:"transition",     row:7, col:11 },
  { symbol:"Cn", name:"Copernicium",   atomic:112, category:"transition",     row:7, col:12 },
  { symbol:"Nh", name:"Nihonium",      atomic:113, category:"post-transition",row:7, col:13 },
  { symbol:"Fl", name:"Flerovium",     atomic:114, category:"post-transition",row:7, col:14 },
  { symbol:"Mc", name:"Moscovium",     atomic:115, category:"post-transition",row:7, col:15 },
  { symbol:"Lv", name:"Livermorium",   atomic:116, category:"post-transition",row:7, col:16 },
  { symbol:"Ts", name:"Tennessine",    atomic:117, category:"halogen",        row:7, col:17 },
  { symbol:"Og", name:"Oganesson",     atomic:118, category:"noble",          row:7, col:18 },
];

// ─── Styling maps ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<ElemCategory, { bg: string; border: string; text: string }> = {
  nonmetal:        { bg:"bg-[#ff6b6b]", border:"border-[#1A1A1A]", text:"text-white"       },
  noble:           { bg:"bg-[#a388ee]", border:"border-[#1A1A1A]", text:"text-white"       },
  alkali:          { bg:"bg-[#ff9f43]", border:"border-[#1A1A1A]", text:"text-[#1A1A1A]"  },
  alkaline:        { bg:"bg-[#feca57]", border:"border-[#1A1A1A]", text:"text-[#1A1A1A]"  },
  lanthanide:      { bg:"bg-[#ff6b6b]", border:"border-[#1A1A1A]", text:"text-white"       },
  actinide:        { bg:"bg-[#a388ee]", border:"border-[#1A1A1A]", text:"text-white"       },
  transition:      { bg:"bg-[#D4FF00]", border:"border-[#1A1A1A]", text:"text-[#1A1A1A]"  },
  "post-transition":{ bg:"bg-[#48dbfb]",border:"border-[#1A1A1A]", text:"text-[#1A1A1A]"  },
  metalloid:       { bg:"bg-[#cd84f1]", border:"border-[#1A1A1A]", text:"text-white"       },
  halogen:         { bg:"bg-[#1dd1a1]", border:"border-[#1A1A1A]", text:"text-[#1A1A1A]"  },
};

const LEGEND: { cat: ElemCategory; label: string }[] = [
  { cat:"nonmetal",        label:"Nonmetal"      },
  { cat:"noble",           label:"Noble Gas"     },
  { cat:"alkali",          label:"Alkali Metal"  },
  { cat:"alkaline",        label:"Alkaline Earth"},
  { cat:"lanthanide",      label:"Lanthanide"    },
  { cat:"actinide",        label:"Actinide"      },
  { cat:"transition",      label:"Transition"    },
  { cat:"halogen",         label:"Halogen"       },
  { cat:"metalloid",       label:"Metalloid"     },
  { cat:"post-transition", label:"Post-Trans."   },
];

const COMMON = ["H","C","N","O","S","P","Cl","Na","K","Ca","Fe","Mg"];

// ─── Build sparse 6×18 grid at module scope — never recreated ─────────────────
// Rows 1–6 only (lanthanides/actinides in rows 8–9 are intentionally omitted
// from the visible grid to keep the picker compact).
type Grid = (Element | null)[][];

const ELEMENT_GRID: Grid = (() => {
  const g: Grid = Array.from({ length: 6 }, () =>
    Array.from<Element | null>({ length: 18 }).fill(null),
  );
  ELEMENTS.forEach((el) => {
    if (el.row >= 1 && el.row <= 6 && el.col >= 1 && el.col <= 18) {
      // Non-null assertion safe: dimensions are known to be 6×18
      g[el.row - 1]![el.col - 1] = el;
    }
  });
  return g;
})();

// ─── Component ────────────────────────────────────────────────────────────────

interface ElementPickerProps {
  isOpen:   boolean;
  onClose:  () => void;
  onInsert: (text: string) => void;
}

export const ElementPicker: React.FC<ElementPickerProps> = ({ isOpen, onClose, onInsert }) => {
  const [hovered, setHovered] = React.useState<Element | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity:0, y:-8, scale:0.98 }}
          animate={{ opacity:1, y:0,  scale:1    }}
          exit={{    opacity:0, y:-8, scale:0.98 }}
          transition={{ duration:0.2, ease:"easeOut" }}
          className="relative bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_#1A1A1A] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#1A1A1A]">
            <div className="flex flex-col">
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]">
                Element_Picker
              </span>
              {hovered ? (
                <span className="text-[11px] font-black text-[#1A1A1A] mt-1 bg-[#D4FF00] px-1 border border-[#1A1A1A] w-fit">
                  {hovered.atomic} — {hovered.name}
                </span>
              ) : (
                <span className="text-[9px] font-black text-[#1A1A1A] mt-1 uppercase">
                  Click to insert
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 border-2 border-[#1A1A1A] bg-white hover:bg-[#ff6b6b] hover:text-white text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 active:shadow-none transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Common elements row */}
          <div className="mb-4">
            <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2 border-b border-[#1A1A1A] w-fit pb-0.5">
              Common
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON.map((sym) => {
                const el = ELEMENTS.find((e) => e.symbol === sym);
                if (!el) return null;
                const c = CATEGORY_COLORS[el.category];
                return (
                  <button
                    key={sym}
                    onClick={() => onInsert(el.symbol)}
                    className={`px-2.5 py-1.5 border-2 ${c.bg} ${c.border} ${c.text} text-[11px] font-mono font-black shadow-[2px_2px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscripts & operators */}
          <div className="mb-4">
            <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2 border-b border-[#1A1A1A] w-fit pb-0.5">
              Subscripts
            </p>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => onInsert(String(n))}
                  className="w-8 h-8 border-2 border-[#1A1A1A] bg-[#EAE8E4] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-mono font-black text-xs hover:bg-[#D4FF00] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all"
                >
                  {n}
                </button>
              ))}
              {(["(", ")", "->", "+"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onInsert(t === "->" ? " -> " : t)}
                  className="px-2 h-8 border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-mono font-black text-xs hover:bg-[#EAE8E4] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all"
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => onInsert("\b")}
                className="w-8 h-8 border-2 border-[#1A1A1A] bg-[#ff6b6b] text-white shadow-[2px_2px_0px_#1A1A1A] font-mono hover:bg-[#e75353] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full 6×18 grid */}
          <div className="overflow-x-auto border-t-2 border-[#1A1A1A] pt-4">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(18, minmax(28px, 1fr))", minWidth: 520 }}
            >
              {ELEMENT_GRID.map((row, ri) =>
                row.map((el, ci) => {
                  if (!el) {
                    return <div key={`${ri}-${ci}`} className="w-8 h-8" />;
                  }
                  const c = CATEGORY_COLORS[el.category];
                  return (
                    <motion.button
                      key={el.symbol}
                      whileHover={{ scale: 1.15, zIndex: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onInsert(el.symbol)}
                      onMouseEnter={() => setHovered(el)}
                      onMouseLeave={() => setHovered(null)}
                      title={`${el.name} (${el.atomic})`}
                      className={`relative w-8 h-8 border-[1.5px] ${c.bg} ${c.border} ${c.text} flex items-center justify-center text-[10px] font-mono font-black shadow-[1px_1px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_#1A1A1A] transition-all`}
                    >
                      {el.symbol}
                    </motion.button>
                  );
                }),
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t-2 border-[#1A1A1A] bg-[#EAE8E4] p-2">
            {LEGEND.map(({ cat, label }) => {
              const c = CATEGORY_COLORS[cat];
              return (
                <div key={cat} className="flex items-center gap-1.5 bg-white border border-[#1A1A1A] px-1 py-0.5">
                  <div className={`w-3 h-3 border ${c.bg} ${c.border}`} />
                  <span className="text-[9px] font-black text-[#1A1A1A] uppercase">{label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};