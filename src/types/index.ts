/**
 * OWDA Core Type Definitions
 *
 * Single source of truth for all domain types.
 * Import from this file; never duplicate type definitions in component files.
 *
 * Unit conventions (enforced via JSDoc — not branded types):
 *   Enthalpy (ΔH):  kJ/mol
 *   Entropy  (ΔS):  J/mol·K
 *   Gibbs    (ΔG):  kJ/mol
 *   Energy barriers: kJ/mol
 *   Molar mass:     g/mol
 *   Temperature:    K
 *   Pressure:       atm
 */

/** Map of element symbol → atom count within one formula unit. */
export interface ElementCounts {
  readonly [element: string]: number;
}

/**
 * Parsed representation of a single chemical formula.
 *
 * Note: `charge` is always 0 in the current implementation.
 * Full ionic-equation support (Na⁺, OH⁻, etc.) is a planned extension.
 */
export interface Molecule {
  readonly formula:   string;
  readonly counts:    ElementCounts;
  /** @unit g/mol */
  readonly molarMass: number;
  /** Net ionic charge. Currently always 0 (neutral molecules only). */
  readonly charge:    number;
}

/**
 * One molecule entry on a reaction side, including its stoichiometric
 * coefficient.
 *
 * `coefficient` is intentionally mutable: the solver assigns it after
 * the null-space calculation. All other fields are readonly.
 */
export interface ReactionPart {
  readonly molecule: Molecule;
  /** Stoichiometric coefficient (positive integer ≥ 1). */
  coefficient:       number;
}

/** One side (reactants or products) of a chemical equation. */
export interface ReactionSide {
  readonly molecules: ReactionPart[];
}

/**
 * Reaction type classification returned by the AI service.
 * The `string & {}` escape hatch allows forward-compatible values
 * (e.g., if the AI returns a new type) without a TypeScript error,
 * while still providing autocomplete for the known values.
 */
export type ReactionType =
  | 'Synthesis'
  | 'Decomposition'
  | 'Combustion'
  | 'Single Replacement'
  | 'Double Replacement'
  | 'Acid-Base'
  | 'Redox'
  | 'Electrophilic Aromatic Substitution'
  | 'Nucleophilic Addition'
  | 'Polymerisation'
  | 'Photolysis'
  | 'Unknown'
  | (string & {});

/**
 * A fully balanced or definitively unbalanced chemical reaction.
 *
 * Discriminated union on `isBalanced`:
 *
 * - `isBalanced: true`  — the stoichiometry matrix has a valid positive
 *   integer solution. Thermodynamic fields may be `undefined` if the AI
 *   service was disabled or failed; they are never set to 0 as a placeholder.
 *
 * - `isBalanced: false` — the solver could not find a valid solution.
 *   No thermodynamic fields are present.
 */
export type ChemicalReaction =
  | {
      readonly isBalanced:       true;
      readonly reactants:        ReactionSide;
      readonly products:         ReactionSide;
      /** Whether Σ(reactant molar masses) ≈ Σ(product molar masses). */
      readonly massConservation: boolean;
      readonly timestamp:        number;
      readonly type?:            ReactionType;
      /**
       * Standard enthalpy of reaction at 298 K.
       * `undefined` = not yet estimated (AI pending or disabled).
       * Negative = exothermic; Positive = endothermic.
       * @unit kJ/mol
       */
      enthalpy:        number | undefined;
      /**
       * Standard entropy change at 298 K.
       * `undefined` = not yet estimated.
       * @unit J/mol·K
       */
      entropy:         number | undefined;
      /**
       * Standard Gibbs free energy change at 298 K.
       * `undefined` = not yet estimated.
       * Negative = spontaneous under standard conditions.
       * @unit kJ/mol
       */
      gibbs:           number | undefined;
      /**
       * Activation energy (Arrhenius Ea).
       * `undefined` when not modelled.
       * @unit kJ/mol
       */
      activationEnergy?: number;
    }
  | {
      readonly isBalanced:    false;
      readonly reactants:     ReactionSide;
      readonly products:      ReactionSide;
      readonly timestamp:     number;
      readonly errorDetails?: string;
    };

// ---------------------------------------------------------------------------
// AI explanation
// ---------------------------------------------------------------------------

/**
 * One panel in the AI analysis report.
 *
 * `mode` controls which visual style is applied in the UI:
 * - `'human'`   — plain-English overview (yellow header)
 * - `'expert'`  — technical mechanism (white header)
 * - `'machine'` — thermodynamic data / code (black header)
 */
export interface ExplanationStep {
  title:       string;
  /** Markdown-formatted content rendered via ReactMarkdown. */
  description: string;
  mode:        'human' | 'expert' | 'machine';
}

// ---------------------------------------------------------------------------
// Analytics / History
// ---------------------------------------------------------------------------

/**
 * Lightweight snapshot of a solved reaction stored in the reaction log.
 * Does not include full molecule data to keep the persisted payload small.
 */
export interface ReactionHistoryEntry {
  expression:    string;
  /** Unix timestamp (ms) when the reaction was solved. */
  timestamp:     number;
  isBalanced:    boolean;
  reactionType?: string;
  /**
   * Estimated enthalpy.
   * `undefined` if AI was disabled or failed.
   * @unit kJ/mol
   */
  enthalpy?:     number;
  entropy?:      number;
  gibbs?:        number;
  /**
   * `true`  = exothermic (ΔH < 0)
   * `false` = endothermic (ΔH > 0)
   * `undefined` = enthalpy unknown
   */
  isExothermic?: boolean;
}

// ---------------------------------------------------------------------------
// Compare feature
// ---------------------------------------------------------------------------

/**
 * One slot in the side-by-side reaction comparison view.
 * Holds the original expression string plus the solved reaction.
 */
export interface CompareSlot {
  expression: string;
  reaction:   ChemicalReaction;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Known error codes raised by the engine layers.
 * The `string & {}` escape hatch allows unexpected codes to pass through
 * without breaking the error boundary while still providing autocomplete.
 */
export type ErrorCode =
  | 'PARSE_ERROR'
  | 'MALFORMED_EXPRESSION'
  | 'ENGINE_FAULT'
  | 'SINGULAR_MATRIX'
  | 'NEGATIVE_SOLUTION'
  | 'MIXED_SIGN_SOLUTION'
  | 'AI_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | (string & {});

/** Structured error stored in engine state and shown by the crash handler. */
export interface ReactionError {
  readonly message: string;
  readonly code?:   ErrorCode;
  /** Stack trace or extended diagnostic. Never shown in production UI. */
  readonly details?: string;
}

// ---------------------------------------------------------------------------
// Global engine state
// ---------------------------------------------------------------------------

/**
 * The complete application state managed by the Zustand store.
 *
 * Persisted fields (survive page refresh):
 *   history, reactionLog, viewMode, settings
 *
 * Transient fields (reset on refresh):
 *   inputExpression, currentReaction, currentSteps,
 *   activationEnergy, isProcessing, error
 */
export interface EngineState {
  inputExpression:  string;
  currentReaction:  ChemicalReaction | undefined;
  currentSteps:     ExplanationStep[];
  /** @unit kJ/mol */
  activationEnergy: number | undefined;
  history:          ReadonlyArray<string>;
  reactionLog:      ReadonlyArray<ReactionHistoryEntry>;
  isProcessing:     boolean;
  viewMode:         '2d' | '3d';
  error:            ReactionError | undefined;
}

// ---------------------------------------------------------------------------
// Utility / helper types
// ---------------------------------------------------------------------------

/**
 * The three thermodynamic display values shown in the workspace and compare
 * pages. All are `undefined` when the AI has not yet analysed the reaction.
 */
export interface ThermoDisplayValues {
  /** @unit kJ/mol */
  enthalpy: number | undefined;
  /** @unit J/mol·K */
  entropy:  number | undefined;
  /** @unit kJ/mol */
  gibbs:    number | undefined;
}

/** Convenience type for a non-empty readonly string array. */
export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];