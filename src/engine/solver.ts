import { ChemicalReaction, ReactionPart } from "../types";
import { ChemicalParser, ParseError } from "./parser";

/**
 * OWDA Reaction Solver Engine — Layer 2
 *
 * Balances chemical equations via RREF Gaussian elimination on the
 * stoichiometry matrix, then scales to smallest positive integer coefficients.
 *
 * STRICT-MODE NOTES
 * -----------------
 * noUncheckedIndexedAccess — all numeric array/matrix access uses explicit
 * non-null assertions (!) where invariants guarantee presence, or optional
 * chaining with fallbacks otherwise.
 *
 * exactOptionalPropertyTypes — thermodynamic fields use `undefined` (never 0)
 * when not yet estimated, matching the ChemicalReaction discriminated union.
 */
export class ReactionSolver {
  // ─── Public API ────────────────────────────────────────────────────────────

  public static balance(expression: string): ChemicalReaction {
    let reactants: ReactionPart[], products: ReactionPart[];

    try {
      const parsed = ChemicalParser.parseReaction(expression);
      reactants = parsed.reactants;
      products  = parsed.products;
    } catch (err) {
      const msg = err instanceof ParseError ? err.message : String(err);
      return {
        isBalanced: false,
        reactants: { molecules: [] },
        products:  { molecules: [] },
        timestamp: Date.now(),
        errorDetails: `PARSE_ERROR: ${msg}`,
      };
    }

    if (reactants.length === 0 || products.length === 0) {
      return ReactionSolver._unbalanced(
        reactants, products,
        "MALFORMED_EXPRESSION: one or both sides have no molecules.",
      );
    }

    const allMolecules = [...reactants, ...products];

    // Fast path: all single-element molecules → O(n) ratio check
    const allSingleElement = allMolecules.every(
      (p) => Object.keys(p.molecule.counts).length === 1,
    );
    if (allSingleElement) {
      return ReactionSolver._balanceByRatio(reactants, products);
    }

    // Collect unique elements
    const elementSet = new Set<string>();
    for (const part of allMolecules) {
      for (const el of Object.keys(part.molecule.counts)) {
        elementSet.add(el);
      }
    }
    const elements = Array.from(elementSet);

    if (elements.length === 0) {
      return ReactionSolver._unbalanced(
        reactants, products,
        "MALFORMED_EXPRESSION: no chemical elements found.",
      );
    }

    const numMols = allMolecules.length;

    // Build stoichiometry matrix — reactants positive, products negative
    const matrix: number[][] = elements.map((el) =>
      allMolecules.map((part, molIdx) => {
        const count = part.molecule.counts[el] ?? 0;
        return molIdx < reactants.length ? count : -count;
      }),
    );

    const solution = ReactionSolver._nullSpaceVector(matrix, numMols);
    if (!solution) {
      return ReactionSolver._unbalanced(
        reactants, products, "SINGULAR_MATRIX: system has no unique solution.",
      );
    }

    // All-negative → negate
    if (solution.every((v) => v < -1e-10)) {
      for (let i = 0; i < solution.length; i++) solution[i] = -(solution[i]!);
    }

    if (!solution.every((v) => v > 1e-10)) {
      return ReactionSolver._unbalanced(
        reactants, products,
        "MIXED_SIGN_SOLUTION: cannot balance with positive integer coefficients.",
      );
    }

    const coefficients = ReactionSolver._integerize(solution);

    if (coefficients.some((c) => c < 1)) {
      return ReactionSolver._unbalanced(
        reactants, products,
        "NEGATIVE_SOLUTION: integerisation produced zero or negative coefficients.",
      );
    }

    reactants.forEach((part, i) => {
      part.coefficient = coefficients[i]!; // integerize guarantees length matches
    });
    products.forEach((part, i) => {
      part.coefficient = coefficients[reactants.length + i]!;
    });

    return {
      isBalanced:       true,
      reactants:        { molecules: reactants },
      products:         { molecules: products },
      massConservation: ReactionSolver._validateMass(reactants, products),
      timestamp:        Date.now(),
      // Thermodynamic fields are UNDEFINED until AI analysis completes.
      // Never use 0 as a placeholder — 0 kJ/mol is a valid thermoneutral value.
      enthalpy: undefined,
      entropy:  undefined,
      gibbs:    undefined,
    };
  }

  // ─── Private: ratio balancing ──────────────────────────────────────────────

  private static _balanceByRatio(
    reactants: ReactionPart[],
    products: ReactionPart[],
  ): ChemicalReaction {
    const reactantAtoms: Record<string, number> = {};
    const productAtoms:  Record<string, number> = {};

    reactants.forEach((p) => {
      for (const [el, cnt] of Object.entries(p.molecule.counts)) {
        reactantAtoms[el] = (reactantAtoms[el] ?? 0) + cnt * p.coefficient;
      }
    });
    products.forEach((p) => {
      for (const [el, cnt] of Object.entries(p.molecule.counts)) {
        productAtoms[el] = (productAtoms[el] ?? 0) + cnt * p.coefficient;
      }
    });

    const balanced = Object.keys(reactantAtoms).every(
      (el) => reactantAtoms[el] === productAtoms[el],
    );

    return {
      isBalanced:       balanced,
      reactants:        { molecules: reactants },
      products:         { molecules: products },
      massConservation: balanced,
      timestamp:        Date.now(),
      enthalpy:         undefined,
      entropy:          undefined,
      gibbs:            undefined,
      ...(balanced ? {} : { errorDetails: "Single-element ratio mismatch" }),
    } as ChemicalReaction;
  }

  // ─── Private: RREF null-space solver ──────────────────────────────────────

  private static _nullSpaceVector(rawMatrix: number[][], cols: number): number[] | null {
    const rows = rawMatrix.length;
    if (rows === 0 || cols === 0) return null;

    // Deep-copy — never mutate arguments
    const m: number[][] = rawMatrix.map((row) => [...row]);
    const pivotCol: number[] = [];
    let pivotRow = 0;

    for (let col = 0; col < cols && pivotRow < rows; col++) {
      // Partial pivoting
      let maxRow = pivotRow;
      for (let row = pivotRow + 1; row < rows; row++) {
        if (Math.abs(m[row]![col]!) > Math.abs(m[maxRow]![col]!)) maxRow = row;
      }

      // Swap rows
      const tmp = m[pivotRow]!;
      m[pivotRow] = m[maxRow]!;
      m[maxRow]   = tmp;

      const pivotVal = m[pivotRow]![col]!;
      if (Math.abs(pivotVal) < 1e-10) continue;

      // Normalise pivot row
      for (let k = col; k < cols; k++) {
        m[pivotRow]![k] = m[pivotRow]![k]! / pivotVal;
      }

      // Full RREF elimination
      for (let row = 0; row < rows; row++) {
        if (row === pivotRow) continue;
        const factor = m[row]![col]!;
        if (Math.abs(factor) < 1e-12) continue;
        for (let k = col; k < cols; k++) {
          m[row]![k] = m[row]![k]! - factor * m[pivotRow]![k]!;
        }
      }

      pivotCol.push(col);
      pivotRow++;
    }

    const rank = pivotCol.length;
    if (rank >= cols) return null;

    const pivotColSet = new Set(pivotCol);
    const freeCols: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (!pivotColSet.has(c)) freeCols.push(c);
    }

    const solution = new Array<number>(cols).fill(0);
    // Non-null assertion: freeCols has at least one element (rank < cols guarantees it)
    solution[freeCols.at(-1)!] = 1;

    for (let pr = rank - 1; pr >= 0; pr--) {
      const pc = pivotCol[pr]!;
      let sum = 0;
      for (let c = pc + 1; c < cols; c++) {
        sum += m[pr]![c]! * solution[c]!;
      }
      solution[pc] = -sum;
    }

    if (!solution.every((v) => Number.isFinite(v))) return null;
    return solution;
  }

  // ─── Private: LCM integerisation ──────────────────────────────────────────

  private static _integerize(coeffs: number[]): number[] {
    const MAX_DENOM = 1000;
    const rationals = coeffs.map((c) => ReactionSolver._toRational(c, MAX_DENOM));

    const lcmDenom = rationals.reduce(
      (acc, r) => ReactionSolver._lcm(acc, r[1]),
      1,
    );

    const scaled = rationals.map((r) => Math.round((r[0] * lcmDenom) / r[1]));

    const g = scaled.reduce((acc, v) => ReactionSolver._gcd(acc, Math.abs(v)), 0);
    const reduced = g > 1 ? scaled.map((v) => Math.round(v / g)) : scaled;

    if (reduced.some((v) => v <= 0)) return ReactionSolver._integerizeFallback(coeffs);
    return reduced;
  }

  private static _toRational(x: number, maxDenom: number): [number, number] {
    if (x <= 0) return [1, 1];

    let lo: [number, number] = [0, 1];
    let hi: [number, number] = [1, 1];
    let best: [number, number] = [Math.round(x), 1];
    let bestErr = Math.abs(x - best[0]);

    for (let iter = 0; iter < 200; iter++) {
      const medP = lo[0] + hi[0];
      const medQ = lo[1] + hi[1];
      if (medQ > maxDenom) break;

      const err = Math.abs(x - medP / medQ);
      if (err < bestErr) { bestErr = err; best = [medP, medQ]; }
      if (err < 1e-9) break;

      if (x > medP / medQ) lo = [medP, medQ];
      else                  hi = [medP, medQ];
    }

    return best;
  }

  private static _gcd(a: number, b: number): number {
    a = Math.abs(a); b = Math.abs(b);
    while (b > 0) { const t = b; b = a % b; a = t; }
    return a;
  }

  private static _lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / ReactionSolver._gcd(a, b);
  }

  private static _integerizeFallback(coeffs: number[]): number[] {
    const TOL = 1e-4;
    for (let mult = 1; mult <= 1000; mult++) {
      const trial = coeffs.map((c) => c * mult);
      if (trial.every((t) => Math.abs(t - Math.round(t)) < TOL)) {
        return trial.map((t) => Math.round(t));
      }
    }
    return coeffs.map((c) => Math.max(1, Math.round(c)));
  }

  // ─── Private: mass conservation ───────────────────────────────────────────

  private static _validateMass(reactants: ReactionPart[], products: ReactionPart[]): boolean {
    const sumMass = (parts: ReactionPart[]): number =>
      parts.reduce((acc, part) => {
        if (!Number.isFinite(part.molecule.molarMass) || part.molecule.molarMass < 0) return acc;
        return acc + part.molecule.molarMass * (part.coefficient ?? 1);
      }, 0);

    return Math.abs(sumMass(reactants) - sumMass(products)) < 0.1;
  }

  // ─── Private: unbalanced factory ──────────────────────────────────────────

  private static _unbalanced(
    reactants: ReactionPart[],
    products: ReactionPart[],
    errorDetails: string,
  ): ChemicalReaction {
    return {
      isBalanced: false,
      reactants: { molecules: reactants },
      products:  { molecules: products },
      timestamp: Date.now(),
      errorDetails,
    };
  }
}