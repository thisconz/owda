import { ChemicalReaction, ElementCounts, Molecule } from '../types';
import { ChemicalParser } from './parser';

/**
 * OWDA Reaction Solver Engine (Layer 2)
 * High-performance algebraic solver for stoichiometry using Gaussian Elimination.
 */
export class ReactionSolver {
  /**
   * Balances a chemical equation using Null Space Linear Algebra.
   */
  public static balance(expression: string): ChemicalReaction {
    const raw = ChemicalParser.parseReaction(expression);
    const { reactants, products } = raw;

    const allMolecules = [...reactants, ...products];
    const elements = Array.from(new Set(
      allMolecules.flatMap(m => Object.keys(m.molecule.counts))
    ));

    // 1. Build the Matrix (Rows: Elements, Cols: Molecules)
    const matrix: number[][] = elements.map(el => {
      return allMolecules.map((m, i) => {
        const count = m.molecule.counts[el] || 0;
        // Reactants are positive, products are negative in the linear system
        return i < reactants.length ? count : -count;
      });
    });

    // 2. Solve the System using Gaussian Elimination
    const solution = this.findNullSpaceVector(matrix);

    if (solution && solution.every(v => v > 0)) {
      // 3. Normalize to Smallest Integers
      const scaledCoeffs = this.integerize(solution);
      
      reactants.forEach((m, i) => m.coefficient = scaledCoeffs[i]);
      products.forEach((m, i) => m.coefficient = scaledCoeffs[reactants.length + i]);

      return {
        reactants: { molecules: reactants },
        products: { molecules: products },
        isBalanced: true,
        // Optional properties (e.g., enthalpy) should be handled via store or extension
        massConservation: this.validateMass(reactants, products),
        timestamp: Date.now()
      } as ChemicalReaction;
    }

    return { 
      reactants: { molecules: reactants }, 
      products: { molecules: products }, 
      isBalanced: false,
      timestamp: Date.now(),
      errorDetails: "NO_TRIVIAL_SOLUTION_FOUND"
    } as ChemicalReaction;
  }

  private static findNullSpaceVector(matrix: number[][]): number[] | null {
    const rows = matrix.length;
    if (rows === 0) return null;
    const cols = matrix[0].length;
    let pivot = 0;

    // Forward Elimination / Reduced Row Echelon Form
    for (let j = 0; j < cols && pivot < rows; j++) {
      let max = pivot;
      for (let i = pivot + 1; i < rows; i++) {
        if (Math.abs(matrix[i][j]) > Math.abs(matrix[max][j])) max = i;
      }

      [matrix[pivot], matrix[max]] = [matrix[max], matrix[pivot]];

      if (Math.abs(matrix[pivot][j]) <= 1e-10) continue;

      for (let i = 0; i < rows; i++) {
        if (i !== pivot) {
          const factor = matrix[i][j] / matrix[pivot][j];
          for (let k = j; k < cols; k++) {
            matrix[i][k] -= factor * matrix[pivot][k];
          }
        }
      }
      pivot++;
    }

    const solution = new Array(cols).fill(0);
    // Setting the free variable (last column) to 1 to find a non-zero vector
    solution[cols - 1] = 1; 

    for (let i = pivot - 1; i >= 0; i--) {
      let rowPivotCol = -1;
      for (let j = 0; j < cols; j++) {
        if (Math.abs(matrix[i][j]) > 1e-10) {
          rowPivotCol = j;
          break;
        }
      }
      if (rowPivotCol !== -1) {
        let sum = 0;
        for (let j = rowPivotCol + 1; j < cols; j++) {
          sum += matrix[i][j] * solution[j];
        }
        solution[rowPivotCol] = -sum / matrix[i][rowPivotCol];
      }
    }

    // Ensure all coefficients are positive; physical reactions don't have negative coefficients
    return solution.every(v => !isNaN(v) && v > 1e-10) ? solution : null;
  }

  private static integerize(coeffs: number[]): number[] {
    const tolerance = 1e-4;
    // Increased range slightly for complex organic reactions
    for (let multiplier = 1; multiplier <= 500; multiplier++) {
      const trial = coeffs.map(c => c * multiplier);
      if (trial.every(t => Math.abs(t - Math.round(t)) < tolerance)) {
        return trial.map(t => Math.round(t));
      }
    }
    return coeffs.map(c => Math.round(c));
  }

  private static validateMass(reactants: any[], products: any[]): boolean {
    const sumMass = (side: any[]) => side.reduce((acc, m) => 
      acc + ((m.molecule.molarMass ?? 0) * (m.coefficient ?? 1)), 0
    );
    const rMass = sumMass(reactants);
    const pMass = sumMass(products);
    
    return Math.abs(rMass - pMass) < 0.01;
  }
}