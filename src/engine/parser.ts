import { Molecule, ElementCounts, ReactionPart } from '../types';

/**
 * OWDA Chemical Language Engine — Layer 1
 *
 * Deterministic parser for chemical formulas and reaction expressions.
 * Handles nested parentheses, multi-character element symbols, and
 * optional leading stoichiometric coefficients.
 *
 * All public methods are pure functions with respect to shared state:
 * no static mutable fields are modified during parsing.
 */

// ---------------------------------------------------------------------------
// IUPAC 2021 standard atomic weights (g/mol)
// Covers all elements used by the OWDA ElementPicker (Z = 1–96)
// ---------------------------------------------------------------------------
export const ATOMIC_WEIGHTS: Readonly<Record<string, number>> = {
  H:   1.0080,  He:  4.0026,  Li:  6.9410,  Be:  9.0122,  B:  10.811,
  C:  12.011,   N:  14.007,   O:  15.999,   F:  18.998,   Ne: 20.180,
  Na: 22.990,   Mg: 24.305,   Al: 26.982,   Si: 28.085,   P:  30.974,
  S:  32.060,   Cl: 35.450,   Ar: 39.948,   K:  39.098,   Ca: 40.078,
  Sc: 44.956,   Ti: 47.867,   V:  50.942,   Cr: 51.996,   Mn: 54.938,
  Fe: 55.845,   Co: 58.933,   Ni: 58.693,   Cu: 63.546,   Zn: 65.380,
  Ga: 69.723,   Ge: 72.630,   As: 74.922,   Se: 78.971,   Br: 79.904,
  Kr: 83.798,   Rb: 85.468,   Sr: 87.620,   Y:  88.906,   Zr: 91.224,
  Nb: 92.906,   Mo: 95.950,   Tc: 97.000,   Ru:101.070,   Rh:102.906,
  Pd:106.420,   Ag:107.868,   Cd:112.411,   In:114.818,   Sn:118.710,
  Sb:121.760,   Te:127.600,   I: 126.904,   Xe:131.293,   Cs:132.905,
  Ba:137.327,   La:138.905,   Ce:140.116,   Pr:140.908,   Nd:144.242,
  Pm:145.000,   Sm:150.360,   Eu:151.964,   Gd:157.250,   Tb:158.925,
  Dy:162.500,   Ho:164.930,   Er:167.259,   Tm:168.934,   Yb:173.045,
  Lu:174.967,   Hf:178.490,   Ta:180.948,   W: 183.840,   Re:186.207,
  Os:190.230,   Ir:192.217,   Pt:195.084,   Au:196.967,   Hg:200.592,
  Tl:204.380,   Pb:207.200,   Bi:208.980,   Po:209.000,   At:210.000,
  Rn:222.000,   Fr:223.000,   Ra:226.000,   Ac:227.000,   Th:232.038,
  Pa:231.036,   U: 238.029,   Np:237.000,   Pu:244.000,   Am:243.000,
  Cm:247.000,
};

// ---------------------------------------------------------------------------
// CPK / Corey-Pauling-Koltun color scheme for molecular visualization
// ---------------------------------------------------------------------------
const ELEMENT_COLORS: Readonly<Record<string, string>> = {
  H:  '#FFFFFF', C:  '#404040', O:  '#FF3333', N:  '#3366FF',
  S:  '#FFCC00', P:  '#FF9900', F:  '#99FF33', Cl: '#1FEE1F',
  Br: '#A52929', I:  '#940094', Fe: '#DA7E5C', Cu: '#C88033',
  Zn: '#7D80B0', Na: '#AB5CF2', K:  '#8F40D4', Ca: '#3DFF00',
  Mg: '#8AFF00', Al: '#BFA6A6', Si: '#F0C8A0', Ag: '#C0C0C0',
  Au: '#FFD700', Hg: '#B8B8D0', Pb: '#575961', Ba: '#00C900',
};
const DEFAULT_ELEMENT_COLOR = '#FF00FF';

// ---------------------------------------------------------------------------
// Internal error class for typed catch blocks
// ---------------------------------------------------------------------------
export class ParseError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'PARSE_ERROR') {
    super(message);
    this.name = 'ParseError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Public parser
// ---------------------------------------------------------------------------
export class ChemicalParser {
  /**
   * Regex source for formula tokenisation.
   * A new RegExp instance is created per call to avoid shared `lastIndex` state.
   */
  private static readonly FORMULA_REGEX_SOURCE =
    /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/.source;

  // ─── parseFormula ──────────────────────────────────────────────────────────

  /**
   * Parses a chemical formula string into a `Molecule` descriptor.
   *
   * Supports:
   * - Multi-character symbols: `Fe`, `Cl`, `Ca`
   * - Subscripts:              `H2O`, `C6H12O6`
   * - Nested parentheses:      `Al2(SO4)3`, `Ca(OH)2`, `Cu(NH3)4SO4`
   *
   * @throws {ParseError} on malformed input (unmatched parens, unknown tokens, etc.)
   */
  public static parseFormula(formula: string): Molecule {
    if (typeof formula !== 'string' || !formula.trim()) {
      throw new ParseError(
        `Invalid formula: ${JSON.stringify(formula)}. Expected a non-empty string.`
      );
    }

    const trimmed = formula.trim();

    // Stack of element-count scopes.
    // Index 0 is the root scope; each '(' pushes a new scope; ')' pops and merges.
    const stack: Array<Record<string, number>> = [{}];
    let molarMass = 0;

    // Fresh RegExp instance per call — no shared lastIndex
    const regex = new RegExp(ChemicalParser.FORMULA_REGEX_SOURCE, 'g');
    let match: RegExpExecArray | null;
    let lastMatchEnd = 0;

    while ((match = regex.exec(trimmed)) !== null) {
      // Detect unrecognised characters between matches
      if (match.index > lastMatchEnd) {
        const gap = trimmed.slice(lastMatchEnd, match.index);
        if (gap.trim()) {
          throw new ParseError(
            `Unrecognised token "${gap}" in formula "${trimmed}"`
          );
        }
      }
      lastMatchEnd = match.index + match[0].length;

      const [, symbol, countStr, openParen, closeParen, closeCountStr] = match;

      if (symbol) {
        // ── Atom ──────────────────────────────────────────────────────────────
        const count = countStr ? parseInt(countStr, 10) : 1;
        if (count <= 0) {
          throw new ParseError(
            `Invalid atom count "${countStr}" for element "${symbol}" in formula "${trimmed}"`
          );
        }

        const weight = ATOMIC_WEIGHTS[symbol];
        if (weight === undefined) {
          // Unknown element: log a warning but continue so the formula can be
          // partially balanced. Molar mass contribution is 0.
          console.warn(
            `[OWDA Parser] Unknown element "${symbol}" in "${trimmed}". ` +
            'Molar mass contribution set to 0. Add it to ATOMIC_WEIGHTS to fix.'
          );
        }

        const top = stack[stack.length - 1];
        top[symbol] = (top[symbol] ?? 0) + count;
        molarMass += (weight ?? 0) * count;

      } else if (openParen) {
        // ── Open group ────────────────────────────────────────────────────────
        stack.push({});

      } else if (closeParen) {
        // ── Close group ───────────────────────────────────────────────────────
        if (stack.length < 2) {
          throw new ParseError(
            `Unmatched closing parenthesis in formula "${trimmed}"`
          );
        }

        const multiplier = closeCountStr ? parseInt(closeCountStr, 10) : 1;
        if (multiplier <= 0) {
          throw new ParseError(
            `Invalid group multiplier "${closeCountStr}" in formula "${trimmed}"`
          );
        }

        const closed = stack.pop()!;
        const parent = stack[stack.length - 1];

        for (const [sym, cnt] of Object.entries(closed)) {
          parent[sym] = (parent[sym] ?? 0) + cnt * multiplier;
          // Molar mass for 1 copy was already accumulated atom-by-atom above.
          // Add (multiplier − 1) additional copies here.
          molarMass += (ATOMIC_WEIGHTS[sym] ?? 0) * cnt * (multiplier - 1);
        }
      }
    }

    // Check for leftover characters after the last token
    if (lastMatchEnd < trimmed.length) {
      const tail = trimmed.slice(lastMatchEnd);
      if (tail.trim()) {
        throw new ParseError(
          `Unrecognised trailing characters "${tail}" in formula "${trimmed}"`
        );
      }
    }

    // Unmatched open parenthesis
    if (stack.length !== 1) {
      throw new ParseError(
        `Unmatched opening parenthesis in formula "${trimmed}"`
      );
    }

    const counts = stack[0] as ElementCounts;

    if (Object.keys(counts).length === 0) {
      throw new ParseError(
        `No valid element symbols found in formula "${trimmed}"`
      );
    }

    return {
      formula: trimmed,
      counts,
      molarMass: Number(molarMass.toFixed(4)),
      charge: 0,
    };
  }

  // ─── parseReaction ─────────────────────────────────────────────────────────

  /**
   * Parses a full chemical reaction expression.
   *
   * Format: `"2H2 + O2 -> 2H2O"`
   *
   * Rules:
   * - Exactly one `->` separator required.
   * - Each side split on `+`.
   * - Optional integer coefficient before the formula: `3Fe2O3`, `H2O`.
   * - Whitespace around operators is trimmed.
   *
   * @throws {ParseError} on any structural or formula-level malformation.
   */
  public static parseReaction(expression: string): {
    reactants: ReactionPart[];
    products: ReactionPart[];
    timestamp: number;
  } {
    if (typeof expression !== 'string' || !expression.trim()) {
      throw new ParseError('Reaction expression must be a non-empty string.');
    }

    const arrowIndex = expression.indexOf('->');
    if (arrowIndex === -1) {
      throw new ParseError(
        'Malformed expression: missing "->". Expected "Reactants -> Products".',
        'MALFORMED_EXPRESSION'
      );
    }
    if (expression.indexOf('->', arrowIndex + 1) !== -1) {
      throw new ParseError(
        'Malformed expression: multiple "->" found. Expected exactly one arrow.',
        'MALFORMED_EXPRESSION'
      );
    }

    const reactantStr = expression.slice(0, arrowIndex);
    const productStr  = expression.slice(arrowIndex + 2);

    if (!reactantStr.trim()) {
      throw new ParseError(
        'Malformed expression: reactant side is empty.',
        'MALFORMED_EXPRESSION'
      );
    }
    if (!productStr.trim()) {
      throw new ParseError(
        'Malformed expression: product side is empty.',
        'MALFORMED_EXPRESSION'
      );
    }

    return {
      reactants: ChemicalParser._parseSide(reactantStr, 'reactant'),
      products:  ChemicalParser._parseSide(productStr,  'product'),
      timestamp: Date.now(),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Parses one side of a reaction (reactants OR products) into an array
   * of `ReactionPart` objects.
   */
  private static _parseSide(sideStr: string, side: 'reactant' | 'product'): ReactionPart[] {
    const tokens = sideStr
      .split('+')
      .map(t => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      throw new ParseError(
        `Malformed expression: ${side} side has no molecules.`,
        'MALFORMED_EXPRESSION'
      );
    }

    return tokens.map(token => {
      // Match optional integer coefficient followed by a formula starting
      // with an uppercase letter. Coefficient and formula may be separated
      // by optional whitespace.
      const match = token.match(/^(\d+)?\s*([A-Z][A-Za-z0-9()[\]]*)\s*$/);
      if (!match) {
        throw new ParseError(
          `Cannot parse ${side} "${token}". ` +
          'Expected optional integer coefficient followed by a formula (e.g. "2H2O" or "Fe2O3").',
          'MALFORMED_EXPRESSION'
        );
      }

      const coefficient = match[1] ? parseInt(match[1], 10) : 1;
      const formulaStr  = match[2];

      if (coefficient <= 0) {
        throw new ParseError(
          `Invalid coefficient ${coefficient} for ${side} "${token}". Coefficients must be positive integers.`,
          'MALFORMED_EXPRESSION'
        );
      }

      return {
        molecule: ChemicalParser.parseFormula(formulaStr),
        coefficient,
      };
    });
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  /**
   * Returns the CPK colour for an element symbol.
   * Falls back to magenta (`#FF00FF`) for unknown elements.
   */
  public static getElementColor(element: string): string {
    return ELEMENT_COLORS[element] ?? DEFAULT_ELEMENT_COLOR;
  }

  /**
   * Returns `true` if the element symbol is in the known atomic weights table.
   */
  public static isKnownElement(symbol: string): boolean {
    return Object.prototype.hasOwnProperty.call(ATOMIC_WEIGHTS, symbol);
  }

  /**
   * Returns the atomic weight for a symbol, or `null` if unknown.
   */
  public static getAtomicWeight(symbol: string): number | null {
    return ATOMIC_WEIGHTS[symbol] ?? null;
  }
}