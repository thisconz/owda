import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete } from 'lucide-react';

// ─── Element Data ─────────────────────────────────────────────────────────────

type ElemCategory =
  | 'nonmetal'
  | 'noble'
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'halogen';

interface Element {
  symbol: string;
  name: string;
  atomic: number;
  category: ElemCategory;
  row: number;
  col: number;
}

const ELEMENTS: Element[] = [
  // Row 1
  { symbol: 'H',  name: 'Hydrogen',   atomic: 1,  category: 'nonmetal',       row: 1, col: 1  },
  { symbol: 'He', name: 'Helium',     atomic: 2,  category: 'noble',          row: 1, col: 18 },
  // Row 2
  { symbol: 'Li', name: 'Lithium',    atomic: 3,  category: 'alkali',         row: 2, col: 1  },
  { symbol: 'Be', name: 'Beryllium',  atomic: 4,  category: 'alkaline',       row: 2, col: 2  },
  { symbol: 'B',  name: 'Boron',      atomic: 5,  category: 'metalloid',      row: 2, col: 13 },
  { symbol: 'C',  name: 'Carbon',     atomic: 6,  category: 'nonmetal',       row: 2, col: 14 },
  { symbol: 'N',  name: 'Nitrogen',   atomic: 7,  category: 'nonmetal',       row: 2, col: 15 },
  { symbol: 'O',  name: 'Oxygen',     atomic: 8,  category: 'nonmetal',       row: 2, col: 16 },
  { symbol: 'F',  name: 'Fluorine',   atomic: 9,  category: 'halogen',        row: 2, col: 17 },
  { symbol: 'Ne', name: 'Neon',       atomic: 10, category: 'noble',          row: 2, col: 18 },
  // Row 3
  { symbol: 'Na', name: 'Sodium',     atomic: 11, category: 'alkali',         row: 3, col: 1  },
  { symbol: 'Mg', name: 'Magnesium',  atomic: 12, category: 'alkaline',       row: 3, col: 2  },
  { symbol: 'Al', name: 'Aluminum',   atomic: 13, category: 'post-transition',row: 3, col: 13 },
  { symbol: 'Si', name: 'Silicon',    atomic: 14, category: 'metalloid',      row: 3, col: 14 },
  { symbol: 'P',  name: 'Phosphorus', atomic: 15, category: 'nonmetal',       row: 3, col: 15 },
  { symbol: 'S',  name: 'Sulfur',     atomic: 16, category: 'nonmetal',       row: 3, col: 16 },
  { symbol: 'Cl', name: 'Chlorine',   atomic: 17, category: 'halogen',        row: 3, col: 17 },
  { symbol: 'Ar', name: 'Argon',      atomic: 18, category: 'noble',          row: 3, col: 18 },
  // Row 4 (partial — most common)
  { symbol: 'K',  name: 'Potassium',  atomic: 19, category: 'alkali',         row: 4, col: 1  },
  { symbol: 'Ca', name: 'Calcium',    atomic: 20, category: 'alkaline',       row: 4, col: 2  },
  { symbol: 'Fe', name: 'Iron',       atomic: 26, category: 'transition',     row: 4, col: 8  },
  { symbol: 'Ni', name: 'Nickel',     atomic: 28, category: 'transition',     row: 4, col: 10 },
  { symbol: 'Cu', name: 'Copper',     atomic: 29, category: 'transition',     row: 4, col: 11 },
  { symbol: 'Zn', name: 'Zinc',       atomic: 30, category: 'transition',     row: 4, col: 12 },
  { symbol: 'Br', name: 'Bromine',    atomic: 35, category: 'halogen',        row: 4, col: 17 },
  // Row 5 (partial)
  { symbol: 'Ag', name: 'Silver',     atomic: 47, category: 'transition',     row: 5, col: 11 },
  { symbol: 'I',  name: 'Iodine',     atomic: 53, category: 'halogen',        row: 5, col: 17 },
  // Row 6 (partial)
  { symbol: 'Au', name: 'Gold',       atomic: 79, category: 'transition',     row: 6, col: 11 },
  { symbol: 'Pb', name: 'Lead',       atomic: 82, category: 'post-transition',row: 6, col: 14 },
];

const CATEGORY_COLORS: Record<ElemCategory, { bg: string; border: string; text: string }> = {
  nonmetal:        { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-300'     },
  noble:           { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-300'  },
  alkali:          { bg: 'bg-red-500/10',      border: 'border-red-500/30',     text: 'text-red-300'     },
  alkaline:        { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-300'  },
  transition:      { bg: 'bg-owda-teal/10',   border: 'border-owda-teal/30',   text: 'text-owda-teal'   },
  'post-transition': { bg: 'bg-blue-500/10', border: 'border-blue-500/30',    text: 'text-blue-300'    },
  metalloid:       { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-300'  },
  halogen:         { bg: 'bg-green-500/10',   border: 'border-green-500/30',   text: 'text-green-300'   },
};

const LEGEND: { cat: ElemCategory; label: string }[] = [
  { cat: 'nonmetal',        label: 'Nonmetal'      },
  { cat: 'noble',           label: 'Noble Gas'     },
  { cat: 'alkali',          label: 'Alkali Metal'  },
  { cat: 'alkaline',        label: 'Alkaline Earth'},
  { cat: 'transition',      label: 'Transition'    },
  { cat: 'halogen',         label: 'Halogen'       },
  { cat: 'metalloid',       label: 'Metalloid'     },
  { cat: 'post-transition', label: 'Post-Trans.'   },
];

// ─── Quick-Access Row ─────────────────────────────────────────────────────────

const COMMON: string[] = ['H', 'C', 'N', 'O', 'S', 'P', 'Cl', 'Na', 'K', 'Ca', 'Fe', 'Mg'];

// ─── Component ───────────────────────────────────────────────────────────────

interface ElementPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export const ElementPicker: React.FC<ElementPickerProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [hovered, setHovered] = React.useState<Element | null>(null);

  // Build a sparse grid: row 1-6, col 1-18
  const grid: (Element | null)[][] = Array.from({ length: 6 }, () =>
    Array.from({ length: 18 }, () => null)
  );
  ELEMENTS.forEach((el) => {
    if (el.row <= 6 && el.col <= 18) {
      grid[el.row - 1][el.col - 1] = el;
    }
  });

  const handleClick = (el: Element) => {
    onInsert(el.symbol);
  };

  const handleNumber = (n: number) => {
    onInsert(String(n));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-[#07071a] border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-owda-gray">
                Element_Picker
              </span>
              {hovered ? (
                <span className="text-[11px] font-mono text-owda-teal mt-0.5">
                  {hovered.atomic} — {hovered.name}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-owda-gray/40 mt-0.5">
                  Click to insert
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 text-owda-gray hover:text-owda-snow rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Access */}
          <div className="mb-4">
            <p className="text-[8px] font-mono text-owda-gray/40 uppercase tracking-widest mb-2">
              Common
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON.map((sym) => {
                const el = ELEMENTS.find((e) => e.symbol === sym)!;
                const c = CATEGORY_COLORS[el.category];
                return (
                  <button
                    key={sym}
                    onClick={() => handleClick(el)}
                    className={`px-2.5 py-1.5 rounded-lg border ${c.bg} ${c.border} ${c.text} text-[11px] font-mono font-bold hover:brightness-125 transition-all active:scale-95`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscript Numbers */}
          <div className="mb-4">
            <p className="text-[8px] font-mono text-owda-gray/40 uppercase tracking-widest mb-2">
              Subscripts
            </p>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => handleNumber(n)}
                  className="w-8 h-8 rounded-lg border border-owda-teal/20 bg-owda-teal/5 text-owda-teal font-mono font-black text-xs hover:bg-owda-teal/15 transition-all active:scale-95"
                >
                  {n}
                </button>
              ))}
              {/* Arrow / brackets */}
              {['(', ')', '->', '+'].map((t) => (
                <button
                  key={t}
                  onClick={() => onInsert(t === '->' ? ' -> ' : t)}
                  className="px-2 h-8 rounded-lg border border-white/10 bg-white/5 text-owda-snow/60 font-mono text-xs hover:bg-white/10 transition-all active:scale-95"
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => onInsert('\b')} // signal backspace
                className="w-8 h-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 font-mono text-xs hover:bg-red-500/10 transition-all active:scale-95 flex items-center justify-center"
              >
                <Delete className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Full Grid */}
          <div className="overflow-x-auto">
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: 'repeat(18, minmax(28px, 1fr))', minWidth: 520 }}
            >
              {grid.map((row, ri) =>
                row.map((el, ci) => {
                  if (!el) {
                    return <div key={`${ri}-${ci}`} className="w-7 h-7" />;
                  }
                  const c = CATEGORY_COLORS[el.category];
                  return (
                    <motion.button
                      key={el.symbol}
                      whileHover={{ scale: 1.15, zIndex: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleClick(el)}
                      onMouseEnter={() => setHovered(el)}
                      onMouseLeave={() => setHovered(null)}
                      className={`relative w-7 h-7 rounded border ${c.bg} ${c.border} ${c.text} flex items-center justify-center text-[9px] font-mono font-bold hover:brightness-150 transition-all`}
                      title={`${el.name} (${el.atomic})`}
                    >
                      {el.symbol}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/5">
            {LEGEND.map(({ cat, label }) => {
              const c = CATEGORY_COLORS[cat];
              return (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm border ${c.bg} ${c.border}`} />
                  <span className="text-[8px] font-mono text-owda-gray/50 uppercase">{label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};