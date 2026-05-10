import { Molecule, ElementCounts, ReactionPart } from '../types';

/**
 * OWDA Chemical Language Engine (Layer 1)
 * High-performance deterministic parser for stoichiometry and molecular topology.
 */

// Atomic weights for molar mass calculations (Standardized)
const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, 
  O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, 
  Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, 
  Fe: 55.845, Cu: 63.546, Zn: 65.38, Ag: 107.868, Au: 196.967,
};

export class ChemicalParser {
  // Enhanced Regex to capture Elements, Numbers, and Parentheses
  private static ELEMENT_REGEX = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;

  /**
   * Parses complex formulas including parentheses: e.g., "Al2(SO4)3"
   */
  public static parseFormula(formula: string): Molecule {
    const stack: ElementCounts[] = [{}];
    let molarMass = 0;

    this.ELEMENT_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.ELEMENT_REGEX.exec(formula)) !== null) {
      const [, symbol, countStr, openParen, closeParen, closeCountStr] = match;

      if (symbol) {
        const count = countStr === '' ? 1 : parseInt(countStr, 10);
        const currentScope = stack[stack.length - 1] as Record<string, number>;
        currentScope[symbol] = (currentScope[symbol] || 0) + count;
        molarMass += (ATOMIC_WEIGHTS[symbol] || 0) * count;
      } 
      else if (openParen) {
        stack.push({});
      } 
      else if (closeParen) {
        const multiplier = closeCountStr === '' ? 1 : parseInt(closeCountStr, 10);
        const finishedScope = stack.pop();
        const parentScope = stack[stack.length - 1] as Record<string, number>;

        if (finishedScope && parentScope) {
          Object.entries(finishedScope).forEach(([sym, cnt]) => {
            const addedCount = cnt * multiplier;
            // Now permitted because parentScope is cast to Record
            parentScope[sym] = (parentScope[sym] || 0) + addedCount;
            molarMass += (ATOMIC_WEIGHTS[sym] || 0) * (cnt * (multiplier - 1));
          });
        }
      }
    }

    return {
      formula,
      counts: stack[0],
      molarMass: Number(molarMass.toFixed(3)),
      charge: 0, 
    };
  }

  /**
   * Parses full chemical equations: "2H2 + O2 -> 2H2O"
   */
  public static parseReaction(expression: string) {
    const parts = expression.split('->');
    if (parts.length !== 2) {
        throw new Error('MALFORMED_EXPRESSION: Expected "Reactants -> Products"');
    }

    const parseSide = (sideStr: string): ReactionPart[] => {
      return sideStr.split('+').map(part => {
        const trimmed = part.trim();
        // Separates leading coefficient from the formula
        const match = trimmed.match(/^(\d*)(.*)$/);
        const coeff = (match && match[1]) ? parseInt(match[1], 10) : 1;
        const formula = (match && match[2]) ? match[2].trim() : '';

        return {
          molecule: this.parseFormula(formula),
          coefficient: coeff
        };
      });
    };

    return {
      reactants: parseSide(parts[0]),
      products: parseSide(parts[1]),
      timestamp: Date.now()
    };
  }

  /**
   * Standardized CPK Color Mapping for OWDA UI
   * Used for visual rendering in WorkspacePage.
   */
  public static getElementColor(element: string): string {
    const colors: Record<string, string> = {
      H: '#FFFFFF', // White
      C: '#333333', // Dark Gray
      O: '#FF3333', // Red
      N: '#3333FF', // Blue
      Cl: '#1FF01F', // Green
      S: '#FFFF33', // Yellow
      P: '#FF9900', // Orange
      F: '#FFFF30', // Light Yellow
      Fe: '#DA7E5C', // Rust
      Cu: '#C88033'  // Bronze
    };
    return colors[element] || '#FF00FF'; // Magenta fallback
  }
}