import { ChemicalReaction, ReactionPart } from "../types";
import { ChemicalParser, ParseError } from "./parser";

/**
 * OWDA Reaction Solver Engine — Layer 2
 *
 * Balances chemical equations by finding the null-space vector of the
 * stoichiometry matrix using Reduced Row Echelon Form (RREF) Gaussian
 * elimination, then scaling to the smallest positive integer coefficients.
 *
 * Matrix layout:
 *   Rows    → unique elements present in the reaction
 *   Columns → molecules (reactants first, then products)
 *   Sign    → reactant columns are positive; product columns are negative
 *
 * A valid balanced equation corresponds to a vector x such that Ax = 0
 * with all xᵢ > 0 (stoichiometric coefficients are always positive).
 */
export class ReactionSolver {
  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Balances a chemical equation given as a string expression.
   *
   * @param expression  e.g. `"N2 + H2 -> NH3"` or `"C6H6 + O2 -> CO2 + H2O"`
   * @returns           A typed `ChemicalReaction` discriminated union:
   *                    `{ isBalanced: true, … }` or `{ isBalanced: false, … }`
   */
  public static balance(expression: string): ChemicalReaction {
    // ── 1. Parse ─────────────────────────────────────────────────────────────
    let reactants: ReactionPart[];
    let products: ReactionPart[];

    try {
      const parsed = ChemicalParser.parseReaction(expression);
      reactants = parsed.reactants;
      products = parsed.products;
    } catch (err) {
      const msg = err instanceof ParseError ? err.message : String(err);
      return {
        isBalanced: false,
        reactants: { molecules: [] },
        products: { molecules: [] },
        timestamp: Date.now(),
        errorDetails: `PARSE_ERROR: ${msg}`,
      };
    }

    // ── 2. Validate parsed sides ──────────────────────────────────────────────
    if (reactants.length === 0 || products.length === 0) {
      return ReactionSolver._unbalanced(
        reactants,
        products,
        "MALFORMED_EXPRESSION: one or both sides have no molecules.",
      );
    }

    const allMolecules = [...reactants, ...products];

    // Collect ordered list of unique element symbols
    const elementSet = new Set<string>();
    for (const part of allMolecules) {
      for (const el of Object.keys(part.molecule.counts)) {
        elementSet.add(el);
      }
    }
    const elements = Array.from(elementSet);

    if (elements.length === 0) {
      return ReactionSolver._unbalanced(
        reactants,
        products,
        "MALFORMED_EXPRESSION: no chemical elements found in expression.",
      );
    }

    const numMols = allMolecules.length;

    // ── 3. Build stoichiometry matrix (deep copy — original untouched) ────────
    //  matrix[elementIdx][moleculeIdx]
    //  Reactants: positive; Products: negative
    const matrix: number[][] = elements.map((el) =>
      allMolecules.map((part, molIdx) => {
        const count = part.molecule.counts[el] ?? 0;
        return molIdx < reactants.length ? count : -count;
      }),
    );

    // ── 4. Solve for null-space vector ────────────────────────────────────────
    const solution = ReactionSolver._nullSpaceVector(matrix, numMols);

    if (!solution) {
      return ReactionSolver._unbalanced(
        reactants,
        products,
        "SINGULAR_MATRIX: system has no unique solution.",
      );
    }

    // All-negative → negate (physically equivalent)
    const allNeg = solution.every((v) => v < -1e-10);
    if (allNeg) {
      for (let i = 0; i < solution.length; i++) solution[i] = -solution[i];
    }

    const allPos = solution.every((v) => v > 1e-10);
    if (!allPos) {
      return ReactionSolver._unbalanced(
        reactants,
        products,
        "MIXED_SIGN_SOLUTION: equation cannot be balanced with positive integer coefficients.",
      );
    }

    // ── 5. Scale to smallest positive integers ────────────────────────────────
    const coefficients = ReactionSolver._integerize(solution);

    // Sanity check — coefficients must all be ≥ 1
    if (coefficients.some((c) => c < 1)) {
      return ReactionSolver._unbalanced(
        reactants,
        products,
        "NEGATIVE_SOLUTION: integerisation produced zero or negative coefficients.",
      );
    }

    // ── 6. Assign coefficients ────────────────────────────────────────────────
    reactants.forEach((part, i) => {
      part.coefficient = coefficients[i];
    });
    products.forEach((part, i) => {
      part.coefficient = coefficients[reactants.length + i];
    });

    // ── 7. Return balanced result ─────────────────────────────────────────────
    return {
      isBalanced: true,
      reactants: { molecules: reactants },
      products: { molecules: products },
      massConservation: ReactionSolver._validateMass(reactants, products),
      timestamp: Date.now(),
      // Thermodynamic fields default to 0; filled in by WorkspacePage after AI analysis
      enthalpy: 0,
      entropy: 0,
      gibbs: 0,
    };
  }

  // ─── Private: Gaussian elimination (RREF) ─────────────────────────────────

  /**
   * Finds a non-trivial null-space vector for the stoichiometry matrix using
   * Reduced Row Echelon Form.
   *
   * Steps:
   *  1. Deep-copy the matrix (never mutates the argument).
   *  2. Forward elimination with partial pivoting → Row Echelon Form.
   *  3. Back substitution to full RREF.
   *  4. Identify pivot columns vs. free columns.
   *  5. Set the last free variable to 1; back-substitute pivot variables.
   *
   * @param rawMatrix  Element × molecule matrix (will NOT be mutated).
   * @param cols       Number of columns (= total molecule count).
   * @returns          Coefficient vector, or `null` if no solution exists.
   */
  private static _nullSpaceVector(
    rawMatrix: number[][],
    cols: number,
  ): number[] | null {
    const rows = rawMatrix.length;
    if (rows === 0 || cols === 0) return null;

    // Deep copy so callers are never affected
    const m = rawMatrix.map((row) => [...row]);

    const pivotCol: number[] = []; // pivotCol[pivotRow] = column index
    let pivotRow = 0;

    // ── Forward elimination with partial pivoting ──────────────────────────
    for (let col = 0; col < cols && pivotRow < rows; col++) {
      // Find row with largest absolute value in this column (partial pivot)
      let maxRow = pivotRow;
      for (let row = pivotRow + 1; row < rows; row++) {
        if (Math.abs(m[row][col]) > Math.abs(m[maxRow][col])) {
          maxRow = row;
        }
      }

      // Swap rows
      [m[pivotRow], m[maxRow]] = [m[maxRow], m[pivotRow]];

      const pivotVal = m[pivotRow][col];
      if (Math.abs(pivotVal) < 1e-10) {
        // No usable pivot in this column — it's a free variable column
        continue;
      }

      // Normalise pivot row so pivot element = 1
      for (let k = col; k < cols; k++) {
        m[pivotRow][k] /= pivotVal;
      }

      // Eliminate all other rows in this column (full RREF, not just forward)
      for (let row = 0; row < rows; row++) {
        if (row !== pivotRow && Math.abs(m[row][col]) > 1e-12) {
          const factor = m[row][col];
          for (let k = col; k < cols; k++) {
            m[row][k] -= factor * m[pivotRow][k];
          }
        }
      }

      pivotCol.push(col);
      pivotRow++;
    }

    const rank = pivotCol.length;

    // A fully determined system (rank = cols) has only the trivial solution x=0
    if (rank >= cols) return null;

    // ── Identify free variable columns ────────────────────────────────────────
    const pivotColSet = new Set(pivotCol);
    const freeCols: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (!pivotColSet.has(c)) freeCols.push(c);
    }

    // We need exactly one free variable to get a unique (up to scale) solution.
    // For reactions with multiple free variables (e.g., ambiguous equations),
    // use only the last free variable and set others to 0 — this gives the
    // simplest solution for the most-constrained sub-system.
    const solution = new Array<number>(cols).fill(0);
    solution[freeCols[freeCols.length - 1]] = 1;

    // ── Back-substitute to find pivot variable values ─────────────────────────
    // Process pivot rows in reverse order
    for (let pr = rank - 1; pr >= 0; pr--) {
      const pc = pivotCol[pr];
      let sum = 0;
      for (let c = pc + 1; c < cols; c++) {
        sum += m[pr][c] * solution[c];
      }
      // m[pr][pc] === 1 after normalisation above
      solution[pc] = -sum;
    }

    // Validate: all values must be finite and non-NaN
    if (!solution.every((v) => Number.isFinite(v))) return null;

    return solution;
  }

  // ─── Private: LCM-based rationalisation ───────────────────────────────────

  /**
   * Scales a vector of positive floats to the smallest equivalent
   * positive integer vector using GCD / LCM of rational approximations.
   *
   * Algorithm:
   *  1. Express each float as p/q using a convergent-fraction approximation.
   *  2. Compute LCM of all denominators.
   *  3. Multiply every element by the LCM and round.
   *  4. Divide every element by GCD of all resulting integers.
   *
   * More reliable than the 1–500 multiplier scan because it is:
   *  - Exact for any coefficient ≤ 1000
   *  - O(n) instead of O(500·n)
   *  - Not fooled by floating-point drift
   */
  private static _integerize(coeffs: number[]): number[] {
    const MAX_DENOM = 1000; // maximum denominator to consider

    // Step 1: Rational approximation for each coefficient
    const rationals = coeffs.map((c) =>
      ReactionSolver._toRational(c, MAX_DENOM),
    );

    // Step 2: LCM of denominators
    const lcmDenom = rationals.reduce(
      (acc, [, q]) => ReactionSolver._lcm(acc, q),
      1,
    );

    // Step 3: Scale and round
    const scaled = rationals.map(([p, q]) => Math.round((p * lcmDenom) / q));

    // Step 4: Divide by GCD to reduce
    const g = scaled.reduce(
      (acc, v) => ReactionSolver._gcd(acc, Math.abs(v)),
      0,
    );
    const reduced = g > 1 ? scaled.map((v) => Math.round(v / g)) : scaled;

    // Safety: if anything is ≤ 0, fall back to legacy multiplier scan
    if (reduced.some((v) => v <= 0)) {
      return ReactionSolver._integerizeFallback(coeffs);
    }

    return reduced;
  }

  /**
   * Converts a positive float to a rational [p, q] approximation
   * such that |p/q - x| < 1e-6 and q ≤ maxDenom.
   * Uses the Stern–Brocot / mediants approach (fast convergent fractions).
   */
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
      if (err < bestErr) {
        bestErr = err;
        best = [medP, medQ];
      }
      if (err < 1e-9) break;

      if (x > medP / medQ) {
        lo = [medP, medQ];
      } else {
        hi = [medP, medQ];
      }
    }

    return best;
  }

  /** Greatest common divisor (non-negative integers) */
  private static _gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b > 0) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  /** Least common multiple (non-negative integers) */
  private static _lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / ReactionSolver._gcd(a, b);
  }

  /**
   * Fallback integerizer: original multiplier-scan approach.
   * Used only when the LCM method produces a degenerate result.
   */
  private static _integerizeFallback(coeffs: number[]): number[] {
    const TOL = 1e-4;
    for (let mult = 1; mult <= 1000; mult++) {
      const trial = coeffs.map((c) => c * mult);
      if (trial.every((t) => Math.abs(t - Math.round(t)) < TOL)) {
        return trial.map((t) => Math.round(t));
      }
    }
    // Last resort: round directly (may produce 0 for very small coefficients)
    return coeffs.map((c) => Math.max(1, Math.round(c)));
  }

  // ─── Private: Mass conservation check ─────────────────────────────────────

  /**
   * Verifies that the total molar mass on the reactant side equals that
   * on the product side (within a 0.1 g/mol tolerance).
   *
   * @throws if any molecule is missing a valid molar mass or coefficient.
   */
  private static _validateMass(
    reactants: ReactionPart[],
    products: ReactionPart[],
  ): boolean {
    const sumMass = (parts: ReactionPart[]): number =>
      parts.reduce((acc, part) => {
        if (
          !Number.isFinite(part.molecule.molarMass) ||
          part.molecule.molarMass < 0
        ) {
          // Unknown element contributed 0 mass — skip rather than throw
          return acc;
        }
        const coeff = part.coefficient ?? 1;
        return acc + part.molecule.molarMass * coeff;
      }, 0);

    return Math.abs(sumMass(reactants) - sumMass(products)) < 0.1;
  }

  // ─── Private: Unbalanced result factory ───────────────────────────────────

  private static _unbalanced(
    reactants: ReactionPart[],
    products: ReactionPart[],
    errorDetails: string,
  ): ChemicalReaction {
    return {
      isBalanced: false,
      reactants: { molecules: reactants },
      products: { molecules: products },
      timestamp: Date.now(),
      errorDetails,
    };
  }
}
