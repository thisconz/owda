/**
 * OWDA Core Chemical Types - Version 1.0
 * Optimized for stoichiometric calculations, AI analysis, and engine state safety.
 */

/** Branded types for physical units to prevent mixing kJ and J */
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

/** Flat structure for parts, reused in ReactionSide */
export interface ReactionPart {
  molecule: Molecule;
  coefficient: number;
}

export interface ReactionSide {
  readonly molecules: ReactionPart[];
}

/**
 * ChemicalReaction is a Discriminated Union.
 * Guards access to thermodynamic fields when isBalanced is false.
 */
export type ChemicalReaction =
  | {
      readonly isBalanced: true;
      readonly reactants: ReactionSide;
      readonly products: ReactionSide;
      readonly massConservation: boolean;
      readonly timestamp: number;
      readonly type?: ReactionType;
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
  | 'Electrophilic Aromatic Substitution'
  | 'Unknown';

/**
 * AI Explanation Step — returned by AIService and stored in engine state.
 * mode: 'human' = plain language, 'expert' = technical/mechanism, 'machine' = JSON/code
 */
export interface ExplanationStep {
  title: string;
  description: string;
  mode: 'human' | 'expert' | 'machine';
}

/**
 * Reaction History Entry — a snapshot of a solved reaction for the analytics view.
 */
export interface ReactionHistoryEntry {
  expression: string;
  timestamp: number;
  isBalanced: boolean;
  reactionType?: string;
  enthalpy?: number;
  isExothermic?: boolean;
}

/**
 * Global Engine State
 */
export interface EngineState {
  readonly inputExpression: string;
  readonly currentReaction: ChemicalReaction | undefined;
  readonly currentSteps: ExplanationStep[];
  readonly activationEnergy: number | undefined;
  readonly history: readonly string[];
  readonly reactionLog: readonly ReactionHistoryEntry[];
  readonly isProcessing: boolean;
  readonly viewMode: '2d' | '3d';
  readonly error: ReactionError | undefined;
}

/**
 * ReactionError — flexible code field to accept solver/parser/network errors.
 */
export interface ReactionError {
  readonly message: string;
  readonly code?: string;
  readonly details?: string;
}