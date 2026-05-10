/**
 * OWDA Core Chemical Types - Version 2.0
 * Optimized for stoichiometric calculations and engine state safety.
 */

/** 
 * Branded types for physical units to prevent mixing kJ and J 
 */
type KiloJoules = number;
type JoulesPerKelvin = number;

export interface ElementCounts {
  readonly [element: string]: number;
}

export interface Molecule {
  readonly formula: string;
  readonly counts: ElementCounts;
  readonly molarMass: number; 
  readonly charge: number;
}

/** 
 * Flat structure for parts, reused in ReactionSide 
 */
export interface ReactionPart {
  molecule: Molecule;
  coefficient: number;
}

export interface ReactionSide {
  readonly molecules: ReactionPart[];
}

/**
 * ChemicalReaction is now a Discriminated Union.
 * This prevents accessing 'enthalpy' or 'massConservation' if isBalanced is false.
 */
export type ChemicalReaction = 
  | {
      readonly isBalanced: true;
      readonly reactants: ReactionSide;
      readonly products: ReactionSide;
      readonly massConservation: boolean;
      readonly timestamp: number;
      readonly type: ReactionType;
      readonly enthalpy: KiloJoules;
      readonly entropy: JoulesPerKelvin;
      readonly gibbs: KiloJoules;
      readonly activationEnergy?: KiloJoules;
    }
  | {
      readonly isBalanced: false;
      readonly reactants: ReactionSide;
      readonly products: ReactionSide;
      readonly timestamp: number;
      readonly errorDetails?: string;
    };

export type ReactionType = 
  | 'Synthesis' 
  | 'Decomposition' 
  | 'Combustion' 
  | 'Single Replacement' 
  | 'Double Replacement' 
  | 'Acid-Base' 
  | 'Redox' 
  | 'Unknown';

/**
 * Global Engine State
 */
export interface EngineState {
  readonly inputExpression: string;
  readonly currentReaction: ChemicalReaction | undefined;
  readonly activationEnergy: number | undefined; 
  readonly history: readonly string[]; // Immutable history array
  readonly isProcessing: boolean;
  readonly viewMode: '2d' | '3d';
  readonly error: ReactionError | undefined;
}

export interface ReactionError {
  readonly message: string;
  readonly code: 'PARSING_ERROR' | 'BALANCING_ERROR' | 'NETWORK_FAILURE';
  readonly details?: string;
}