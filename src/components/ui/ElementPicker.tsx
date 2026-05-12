import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete } from 'lucide-react';

// ─── Element Data ─────────────────────────────────────────────────────────────

type ElemCategory =
  | 'nonmetal'
  | 'noble'
  | 'alkali'
  | 'alkaline'
  | 'actinide'
  | 'lanthanide'
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
  // =========================
  // Period 1
  // =========================
  { symbol: 'H',  name: 'Hydrogen',      atomic: 1,   category: 'nonmetal',        row: 1, col: 1 },
  { symbol: 'He', name: 'Helium',        atomic: 2,   category: 'noble',           row: 1, col: 18 },

  // =========================
  // Period 2
  // =========================
  { symbol: 'Li', name: 'Lithium',       atomic: 3,   category: 'alkali',          row: 2, col: 1 },
  { symbol: 'Be', name: 'Beryllium',     atomic: 4,   category: 'alkaline',        row: 2, col: 2 },
  { symbol: 'B',  name: 'Boron',         atomic: 5,   category: 'metalloid',       row: 2, col: 13 },
  { symbol: 'C',  name: 'Carbon',        atomic: 6,   category: 'nonmetal',        row: 2, col: 14 },
  { symbol: 'N',  name: 'Nitrogen',      atomic: 7,   category: 'nonmetal',        row: 2, col: 15 },
  { symbol: 'O',  name: 'Oxygen',        atomic: 8,   category: 'nonmetal',        row: 2, col: 16 },
  { symbol: 'F',  name: 'Fluorine',      atomic: 9,   category: 'halogen',         row: 2, col: 17 },
  { symbol: 'Ne', name: 'Neon',          atomic: 10,  category: 'noble',           row: 2, col: 18 },

  // =========================
  // Period 3
  // =========================
  { symbol: 'Na', name: 'Sodium',        atomic: 11,  category: 'alkali',          row: 3, col: 1 },
  { symbol: 'Mg', name: 'Magnesium',     atomic: 12,  category: 'alkaline',        row: 3, col: 2 },
  { symbol: 'Al', name: 'Aluminum',      atomic: 13,  category: 'post-transition', row: 3, col: 13 },
  { symbol: 'Si', name: 'Silicon',       atomic: 14,  category: 'metalloid',       row: 3, col: 14 },
  { symbol: 'P',  name: 'Phosphorus',    atomic: 15,  category: 'nonmetal',        row: 3, col: 15 },
  { symbol: 'S',  name: 'Sulfur',        atomic: 16,  category: 'nonmetal',        row: 3, col: 16 },
  { symbol: 'Cl', name: 'Chlorine',      atomic: 17,  category: 'halogen',         row: 3, col: 17 },
  { symbol: 'Ar', name: 'Argon',         atomic: 18,  category: 'noble',           row: 3, col: 18 },

  // =========================
  // Period 4
  // =========================
  { symbol: 'K',  name: 'Potassium',     atomic: 19,  category: 'alkali',          row: 4, col: 1 },
  { symbol: 'Ca', name: 'Calcium',       atomic: 20,  category: 'alkaline',        row: 4, col: 2 },
  { symbol: 'Sc', name: 'Scandium',      atomic: 21,  category: 'transition',      row: 4, col: 3 },
  { symbol: 'Ti', name: 'Titanium',      atomic: 22,  category: 'transition',      row: 4, col: 4 },
  { symbol: 'V',  name: 'Vanadium',      atomic: 23,  category: 'transition',      row: 4, col: 5 },
  { symbol: 'Cr', name: 'Chromium',      atomic: 24,  category: 'transition',      row: 4, col: 6 },
  { symbol: 'Mn', name: 'Manganese',     atomic: 25,  category: 'transition',      row: 4, col: 7 },
  { symbol: 'Fe', name: 'Iron',          atomic: 26,  category: 'transition',      row: 4, col: 8 },
  { symbol: 'Co', name: 'Cobalt',        atomic: 27,  category: 'transition',      row: 4, col: 9 },
  { symbol: 'Ni', name: 'Nickel',        atomic: 28,  category: 'transition',      row: 4, col: 10 },
  { symbol: 'Cu', name: 'Copper',        atomic: 29,  category: 'transition',      row: 4, col: 11 },
  { symbol: 'Zn', name: 'Zinc',          atomic: 30,  category: 'transition',      row: 4, col: 12 },
  { symbol: 'Ga', name: 'Gallium',       atomic: 31,  category: 'post-transition', row: 4, col: 13 },
  { symbol: 'Ge', name: 'Germanium',     atomic: 32,  category: 'metalloid',       row: 4, col: 14 },
  { symbol: 'As', name: 'Arsenic',       atomic: 33,  category: 'metalloid',       row: 4, col: 15 },
  { symbol: 'Se', name: 'Selenium',      atomic: 34,  category: 'nonmetal',        row: 4, col: 16 },
  { symbol: 'Br', name: 'Bromine',       atomic: 35,  category: 'halogen',         row: 4, col: 17 },
  { symbol: 'Kr', name: 'Krypton',       atomic: 36,  category: 'noble',           row: 4, col: 18 },

  // =========================
  // Period 5
  // =========================
  { symbol: 'Rb', name: 'Rubidium',      atomic: 37,  category: 'alkali',          row: 5, col: 1 },
  { symbol: 'Sr', name: 'Strontium',     atomic: 38,  category: 'alkaline',        row: 5, col: 2 },
  { symbol: 'Y',  name: 'Yttrium',       atomic: 39,  category: 'transition',      row: 5, col: 3 },
  { symbol: 'Zr', name: 'Zirconium',     atomic: 40,  category: 'transition',      row: 5, col: 4 },
  { symbol: 'Nb', name: 'Niobium',       atomic: 41,  category: 'transition',      row: 5, col: 5 },
  { symbol: 'Mo', name: 'Molybdenum',    atomic: 42,  category: 'transition',      row: 5, col: 6 },
  { symbol: 'Tc', name: 'Technetium',    atomic: 43,  category: 'transition',      row: 5, col: 7 },
  { symbol: 'Ru', name: 'Ruthenium',     atomic: 44,  category: 'transition',      row: 5, col: 8 },
  { symbol: 'Rh', name: 'Rhodium',       atomic: 45,  category: 'transition',      row: 5, col: 9 },
  { symbol: 'Pd', name: 'Palladium',     atomic: 46,  category: 'transition',      row: 5, col: 10 },
  { symbol: 'Ag', name: 'Silver',        atomic: 47,  category: 'transition',      row: 5, col: 11 },
  { symbol: 'Cd', name: 'Cadmium',       atomic: 48,  category: 'transition',      row: 5, col: 12 },
  { symbol: 'In', name: 'Indium',        atomic: 49,  category: 'post-transition', row: 5, col: 13 },
  { symbol: 'Sn', name: 'Tin',           atomic: 50,  category: 'post-transition', row: 5, col: 14 },
  { symbol: 'Sb', name: 'Antimony',      atomic: 51,  category: 'metalloid',       row: 5, col: 15 },
  { symbol: 'Te', name: 'Tellurium',     atomic: 52,  category: 'metalloid',       row: 5, col: 16 },
  { symbol: 'I',  name: 'Iodine',        atomic: 53,  category: 'halogen',         row: 5, col: 17 },
  { symbol: 'Xe', name: 'Xenon',         atomic: 54,  category: 'noble',           row: 5, col: 18 },

  // =========================
  // Period 6 (including Lanthanides)
  // =========================
  { symbol: 'Cs', name: 'Cesium',        atomic: 55,  category: 'alkali',          row: 6, col: 1 },
  { symbol: 'Ba', name: 'Barium',        atomic: 56,  category: 'alkaline',        row: 6, col: 2 },
  // Lanthanides (row 8 for visual offset in tables)
  { symbol: 'La', name: 'Lanthanum',     atomic: 57,  category: 'lanthanide',      row: 8, col: 4 },
  { symbol: 'Ce', name: 'Cerium',        atomic: 58,  category: 'lanthanide',      row: 8, col: 5 },
  { symbol: 'Pr', name: 'Praseodymium',  atomic: 59,  category: 'lanthanide',      row: 8, col: 6 },
  { symbol: 'Nd', name: 'Neodymium',     atomic: 60,  category: 'lanthanide',      row: 8, col: 7 },
  { symbol: 'Pm', name: 'Promethium',    atomic: 61,  category: 'lanthanide',      row: 8, col: 8 },
  { symbol: 'Sm', name: 'Samarium',      atomic: 62,  category: 'lanthanide',      row: 8, col: 9 },
  { symbol: 'Eu', name: 'Europium',      atomic: 63,  category: 'lanthanide',      row: 8, col: 10 },
  { symbol: 'Gd', name: 'Gadolinium',    atomic: 64,  category: 'lanthanide',      row: 8, col: 11 },
  { symbol: 'Tb', name: 'Terbium',       atomic: 65,  category: 'lanthanide',      row: 8, col: 12 },
  { symbol: 'Dy', name: 'Dysprosium',    atomic: 66,  category: 'lanthanide',      row: 8, col: 13 },
  { symbol: 'Ho', name: 'Holmium',       atomic: 67,  category: 'lanthanide',      row: 8, col: 14 },
  { symbol: 'Er', name: 'Erbium',        atomic: 68,  category: 'lanthanide',      row: 8, col: 15 },
  { symbol: 'Tm', name: 'Thulium',       atomic: 69,  category: 'lanthanide',      row: 8, col: 16 },
  { symbol: 'Yb', name: 'Ytterbium',     atomic: 70,  category: 'lanthanide',      row: 8, col: 17 },
  { symbol: 'Lu', name: 'Lutetium',      atomic: 71,  category: 'lanthanide',      row: 8, col: 18 },
  // Back to Main Transition
  { symbol: 'Hf', name: 'Hafnium',       atomic: 72,  category: 'transition',      row: 6, col: 4 },
  { symbol: 'Ta', name: 'Tantalum',      atomic: 73,  category: 'transition',      row: 6, col: 5 },
  { symbol: 'W',  name: 'Tungsten',      atomic: 74,  category: 'transition',      row: 6, col: 6 },
  { symbol: 'Re', name: 'Rhenium',       atomic: 75,  category: 'transition',      row: 6, col: 7 },
  { symbol: 'Os', name: 'Osmium',        atomic: 76,  category: 'transition',      row: 6, col: 8 },
  { symbol: 'Ir', name: 'Iridium',       atomic: 77,  category: 'transition',      row: 6, col: 9 },
  { symbol: 'Pt', name: 'Platinum',      atomic: 78,  category: 'transition',      row: 6, col: 10 },
  { symbol: 'Au', name: 'Gold',          atomic: 79,  category: 'transition',      row: 6, col: 11 },
  { symbol: 'Hg', name: 'Mercury',       atomic: 80,  category: 'transition',      row: 6, col: 12 },
  { symbol: 'Tl', name: 'Thallium',      atomic: 81,  category: 'post-transition', row: 6, col: 13 },
  { symbol: 'Pb', name: 'Lead',          atomic: 82,  category: 'post-transition', row: 6, col: 14 },
  { symbol: 'Bi', name: 'Bismuth',       atomic: 83,  category: 'post-transition', row: 6, col: 15 },
  { symbol: 'Po', name: 'Polonium',      atomic: 84,  category: 'post-transition', row: 6, col: 16 },
  { symbol: 'At', name: 'Astatine',      atomic: 85,  category: 'metalloid',       row: 6, col: 17 },
  { symbol: 'Rn', name: 'Radon',         atomic: 86,  category: 'noble',           row: 6, col: 18 },

  // =========================
  // Period 7 (including Actinides)
  // =========================
  { symbol: 'Fr', name: 'Francium',      atomic: 87,  category: 'alkali',          row: 7, col: 1 },
  { symbol: 'Ra', name: 'Radium',        atomic: 88,  category: 'alkaline',        row: 7, col: 2 },
  // Actinides (row 9 for visual offset)
  { symbol: 'Ac', name: 'Actinium',      atomic: 89,  category: 'actinide',        row: 9, col: 4 },
  { symbol: 'Th', name: 'Thorium',       atomic: 90,  category: 'actinide',        row: 9, col: 5 },
  { symbol: 'Pa', name: 'Protactinium',  atomic: 91,  category: 'actinide',        row: 9, col: 6 },
  { symbol: 'U',  name: 'Uranium',       atomic: 92,  category: 'actinide',        row: 9, col: 7 },
  { symbol: 'Np', name: 'Neptunium',     atomic: 93,  category: 'actinide',        row: 9, col: 8 },
  { symbol: 'Pu', name: 'Plutonium',     atomic: 94,  category: 'actinide',        row: 9, col: 9 },
  { symbol: 'Am', name: 'Americium',     atomic: 95,  category: 'actinide',        row: 9, col: 10 },
  { symbol: 'Cm', name: 'Curium',        atomic: 96,  category: 'actinide',        row: 9, col: 11 },
  { symbol: 'Bk', name: 'Berkelium',     atomic: 97,  category: 'actinide',        row: 9, col: 12 },
  { symbol: 'Cf', name: 'Californium',   atomic: 98,  category: 'actinide',        row: 9, col: 13 },
  { symbol: 'Es', name: 'Einsteinium',   atomic: 99,  category: 'actinide',        row: 9, col: 14 },
  { symbol: 'Fm', name: 'Fermium',       atomic: 100, category: 'actinide',        row: 9, col: 15 },
  { symbol: 'Md', name: 'Mendelevium',   atomic: 101, category: 'actinide',        row: 9, col: 16 },
  { symbol: 'No', name: 'Nobelium',      atomic: 102, category: 'actinide',        row: 9, col: 17 },
  { symbol: 'Lr', name: 'Lawrencium',    atomic: 103, category: 'actinide',        row: 9, col: 18 },
  // Back to Main Transition
  { symbol: 'Rf', name: 'Rutherfordium', atomic: 104, category: 'transition',      row: 7, col: 4 },
  { symbol: 'Db', name: 'Dubnium',       atomic: 105, category: 'transition',      row: 7, col: 5 },
  { symbol: 'Sg', name: 'Seaborgium',    atomic: 106, category: 'transition',      row: 7, col: 6 },
  { symbol: 'Bh', name: 'Bohrium',       atomic: 107, category: 'transition',      row: 7, col: 7 },
  { symbol: 'Hs', name: 'Hassium',       atomic: 108, category: 'transition',      row: 7, col: 8 },
  { symbol: 'Mt', name: 'Meitnerium',    atomic: 109, category: 'transition',      row: 7, col: 9 },
  { symbol: 'Ds', name: 'Darmstadtium',  atomic: 110, category: 'transition',      row: 7, col: 10 },
  { symbol: 'Rg', name: 'Roentgenium',   atomic: 111, category: 'transition',      row: 7, col: 11 },
  { symbol: 'Cn', name: 'Copernicium',   atomic: 112, category: 'transition',      row: 7, col: 12 },
  { symbol: 'Nh', name: 'Nihonium',      atomic: 113, category: 'post-transition', row: 7, col: 13 },
  { symbol: 'Fl', name: 'Flerovium',     atomic: 114, category: 'post-transition', row: 7, col: 14 },
  { symbol: 'Mc', name: 'Moscovium',     atomic: 115, category: 'post-transition', row: 7, col: 15 },
  { symbol: 'Lv', name: 'Livermorium',   atomic: 116, category: 'post-transition', row: 7, col: 16 },
  { symbol: 'Ts', name: 'Tennessine',    atomic: 117, category: 'halogen',         row: 7, col: 17 },
  { symbol: 'Og', name: 'Oganesson',     atomic: 118, category: 'noble',           row: 7, col: 18 },
];

const CATEGORY_COLORS: Record<ElemCategory, { bg: string; border: string; text: string }> = {
  nonmetal:        { bg: 'bg-[#ff6b6b]',     border: 'border-[#1A1A1A]',     text: 'text-white'     },
  noble:           { bg: 'bg-[#a388ee]',  border: 'border-[#1A1A1A]',  text: 'text-white'  },
  alkali:          { bg: 'bg-[#ff9f43]',      border: 'border-[#1A1A1A]',     text: 'text-[#1A1A1A]'     },
  alkaline:        { bg: 'bg-[#feca57]',  border: 'border-[#1A1A1A]',  text: 'text-[#1A1A1A]'  },
  lanthanide:      { bg: 'bg-[#ff6b6b]',     border: 'border-[#1A1A1A]',     text: 'text-white'     },
  actinide:        { bg: 'bg-[#a388ee]',  border: 'border-[#1A1A1A]',  text: 'text-white'  },
  transition:      { bg: 'bg-[#D4FF00]',   border: 'border-[#1A1A1A]',   text: 'text-[#1A1A1A]'   },
  'post-transition': { bg: 'bg-[#48dbfb]', border: 'border-[#1A1A1A]',    text: 'text-[#1A1A1A]'    },
  metalloid:       { bg: 'bg-[#cd84f1]',  border: 'border-[#1A1A1A]',  text: 'text-white'  },
  halogen:         { bg: 'bg-[#1dd1a1]',   border: 'border-[#1A1A1A]',   text: 'text-[#1A1A1A]'   },
};

const LEGEND: { cat: ElemCategory; label: string }[] = [
  { cat: 'nonmetal',        label: 'Nonmetal'      },
  { cat: 'noble',           label: 'Noble Gas'     },
  { cat: 'alkali',          label: 'Alkali Metal'  },
  { cat: 'alkaline',        label: 'Alkaline Earth'},
  { cat: 'lanthanide',      label: 'Lanthanide'    },
  { cat: 'actinide',        label: 'Actinide'      },
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

          {/* Quick Access */}
          <div className="mb-4">
            <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2 border-b border-[#1A1A1A] w-fit pb-0.5">
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
                    className={`px-2.5 py-1.5 border-2 ${c.bg} ${c.border} ${c.text} text-[11px] font-mono font-black shadow-[2px_2px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscript Numbers */}
          <div className="mb-4">
            <p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2 border-b border-[#1A1A1A] w-fit pb-0.5">
              Subscripts
            </p>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => handleNumber(n)}
                  className="w-8 h-8 border-2 border-[#1A1A1A] bg-[#EAE8E4] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-mono font-black text-xs hover:bg-[#D4FF00] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none"
                >
                  {n}
                </button>
              ))}
              {/* Arrow / brackets */}
              {['(', ')', '->', '+'].map((t) => (
                <button
                  key={t}
                  onClick={() => onInsert(t === '->' ? ' -> ' : t)}
                  className="px-2 h-8 border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-mono font-black text-xs hover:bg-[#EAE8E4] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none"
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => onInsert('\b')} // signal backspace
                className="w-8 h-8 border-2 border-[#1A1A1A] bg-[#ff6b6b] text-white shadow-[2px_2px_0px_#1A1A1A] font-mono hover:bg-[#e75353] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full Grid */}
          <div className="overflow-x-auto border-t-2 border-[#1A1A1A] pt-4">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: 'repeat(18, minmax(28px, 1fr))', minWidth: 520 }}
            >
              {grid.map((row, ri) =>
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
                      onClick={() => handleClick(el)}
                      onMouseEnter={() => setHovered(el)}
                      onMouseLeave={() => setHovered(null)}
                      className={`relative w-8 h-8 border-[1.5px] ${c.bg} ${c.border} ${c.text} flex items-center justify-center text-[10px] font-mono font-black shadow-[1px_1px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_#1A1A1A] transition-all`}
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