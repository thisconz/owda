import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import {
  EngineState,
  ChemicalReaction,
  ReactionError,
  ExplanationStep,
  ReactionHistoryEntry,
} from "../types";
import type { AIThermodynamics } from "../services/aiService";

// ---------------------------------------------------------------------------
// AI Models
// ---------------------------------------------------------------------------

export type AIModelType = "claude-3-5" | "gpt-4o" | "o1-mini" | "gemini-1-5";

export interface AIModelInfo {
  id: AIModelType;
  label: string;
  provider: string;
}

export const AI_MODELS: readonly AIModelInfo[] = [
  {
    id: "claude-3-5",
    label: "Claude 3.5 Sonnet",
    provider: "Anthropic",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
  },
  {
    id: "o1-mini",
    label: "o1-mini",
    provider: "OpenAI",
  },
  {
    id: "gemini-1-5",
    label: "Gemini 1.5 Pro",
    provider: "Google",
  },
] as const;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

const MAX_LOG_ENTRIES = 100;

const LOG_DEBOUNCE_MS = 2000;

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export interface SolverNetwork {
  online: boolean;
  useProxy: boolean;
  endpoint?: string;
  simulateOffline: boolean;
  timeoutMs: number;
  retryCount: number;
}

const DEFAULT_NETWORK: Readonly<SolverNetwork> = {
  online: true,
  useProxy: false,
  endpoint: undefined,
  simulateOffline: false,
  timeoutMs: 15_000,
  retryCount: 3,
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SolverSettings {
  enableAI: boolean;
  enforceStoichiometry: boolean;
  AIModel: AIModelType;
  /** Artificial API delay in ms (0 = instant). Useful for demos. */
  syncDelay: number;
  theme: "dark" | "terminal";
}

const DEFAULT_SETTINGS: Readonly<SolverSettings> = {
  enableAI: true,
  enforceStoichiometry: true,
  AIModel: "claude-3-5",
  syncDelay: 0,
  theme: "dark",
};

const VALID_THEMES = new Set<SolverSettings["theme"]>(["dark", "terminal"]);

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface OWDAStore extends EngineState {
  settings: SolverSettings;
  network: SolverNetwork;
  actions: {
    /** Update the raw text in the reaction input field. */
    setInputExpression: (expr: string) => void;

    /**
     * Store a newly balanced (or unbalanced) reaction.
     * Thermodynamic fields (enthalpy/entropy/gibbs) default to 0 until
     * `applyThermodynamics` is called with AI results.
     */
    setReaction: (reaction: ChemicalReaction | undefined) => void;

    /**
     * Patch thermodynamic values onto the current balanced reaction.
     * No-op if there is no current reaction or it is unbalanced.
     */
    applyThermodynamics: (thermo: AIThermodynamics) => void;

    setActivationEnergy: (ea: number | undefined) => void;
    setProcessing: (loading: boolean) => void;
    toggleViewMode: () => void;

    /** Add expression to history (MRU — deduplicates and moves to front). */
    addToHistory: (expr: string) => void;

    setSteps: (steps: ExplanationStep[]) => void;

    /** Append a reaction log entry (debounced — ignores duplicates within 2 s). */
    appendReactionLog: (entry: ReactionHistoryEntry) => void;

    setError: (error: ReactionError | undefined) => void;
    clearError: () => void;

    /** Reset workspace state only; preserves settings. */
    resetWorkspace: () => void;

    /** Full factory reset: clears workspace state AND settings. */
    factoryReset: () => void;

    /** Patch solver/UI settings (validated). */
    updateSettings: (patch: Partial<SolverSettings>) => void;

    /** Patch solver/UI network (validated). */
    updateNetwork: (patch: Partial<SolverNetwork>) => void;
  };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const WORKSPACE_INITIAL: Omit<EngineState, never> = {
  inputExpression: "",
  currentReaction: undefined,
  currentSteps: [],
  activationEnergy: undefined,
  history: [],
  reactionLog: [],
  isProcessing: false,
  viewMode: "3d",
  error: undefined,
};

// ---------------------------------------------------------------------------
// localStorage guard — prevents QuotaExceededError from crashing the app
// ---------------------------------------------------------------------------

function makeSafeStorage(): StateStorage {
  const base = createJSONStorage(() => localStorage);
  return {
    getItem: (name) => {
      try {
        return (base as unknown as StateStorage).getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        (base as unknown as StateStorage).setItem(name, value);
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === "QuotaExceededError" ||
            err.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          if (process.env.NODE_ENV) {
            console.warn(
              "[OWDA Store] localStorage quota exceeded — state not persisted.",
            );
          }
        }
      }
    },
    removeItem: (name) => {
      try {
        (base as unknown as StateStorage).removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function validateSettingsPatch(
  patch: Partial<SolverSettings>,
): Partial<SolverSettings> {
  const clean: Partial<SolverSettings> = { ...patch };

  if (typeof clean.syncDelay === "number") {
    clean.syncDelay = Math.max(0, Math.min(5_000, Math.round(clean.syncDelay)));
  }
  if (
    "theme" in clean &&
    !VALID_THEMES.has(clean.theme as SolverSettings["theme"])
  ) {
    delete clean.theme;
    if (process.env.NODE_ENV) {
      console.warn("[OWDA Store] Invalid theme value ignored:", patch.theme);
    }
  }
  return clean;
}

function validateNetworkPatch(
  patch: Partial<SolverNetwork>,
): Partial<SolverNetwork> {
  const clean: Partial<SolverNetwork> = { ...patch };

  if (typeof clean.timeoutMs === "number") {
    clean.timeoutMs = Math.max(
      1000,
      Math.min(120_000, Math.round(clean.timeoutMs)),
    );
  }
  if (typeof clean.retryCount === "number") {
    clean.retryCount = Math.max(0, Math.min(10, Math.round(clean.retryCount)));
  }
  if ("endpoint" in clean && typeof clean.endpoint === "string") {
    try {
      new URL(clean.endpoint);
    } catch {
      delete clean.endpoint;

      if (process.env.NODE_ENV) {
        console.warn("[OWDA Network] Invalid endpoint ignored.");
      }
    }
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Duplicate log-entry guard
// ---------------------------------------------------------------------------

/** Track the timestamp of the last appended expression to debounce duplicates. */
const _lastLogTime = new Map<string, number>();

function isDuplicateLogEntry(entry: ReactionHistoryEntry): boolean {
  const last = _lastLogTime.get(entry.expression);
  if (last !== undefined && Date.now() - last < 2_000) return true;
  _lastLogTime.set(entry.expression, Date.now());
  // Prevent unbounded growth of the tracking map
  if (_lastLogTime.size > 200) {
    const oldest = Array.from(_lastLogTime.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, MAX_LOG_ENTRIES)
      .map(([k]) => k);
    oldest.forEach((k) => _lastLogTime.delete(k));
  }
  return false;
}

export const useOWDAStore = create<OWDAStore>()(
  persist(
    (set, get) => {
      // ── Action implementations ────────────────────────────────────────────
      // Defined as named references so the `actions` object is structurally
      // stable — selectors won't cause re-renders just because other state
      // slices changed.

      const setInputExpression = (inputExpression: string) =>
        set({ inputExpression });

      const setReaction = (currentReaction: ChemicalReaction | undefined) =>
        set({
          currentReaction,
          error: currentReaction ? undefined : get().error,
          isProcessing: false,
        });

      const applyThermodynamics = (thermo: AIThermodynamics) =>
        set((state) => {
          const reaction = state.currentReaction;
          if (!reaction || !reaction.isBalanced) return state;

          const updated: ChemicalReaction = {
            ...reaction,
            enthalpy: thermo.enthalpy ?? reaction.enthalpy,
            entropy: thermo.entropy ?? reaction.entropy,
            gibbs: thermo.gibbs ?? reaction.gibbs,
            type: (thermo.type as ChemicalReaction["type"]) ?? reaction.type,
          };
          return { currentReaction: updated };
        });

      const setActivationEnergy = (activationEnergy: number | undefined) =>
        set({ activationEnergy });

      const setProcessing = (isProcessing: boolean) => set({ isProcessing });

      const toggleViewMode = () =>
        set((state) => ({
          viewMode: state.viewMode === "2d" ? "3d" : "2d",
        }));

      const addToHistory = (expr: string) =>
        set((state) => {
          if (!expr.trim()) return state;
          const filtered = state.history.filter((h) => h !== expr);
          return { history: [expr, ...filtered].slice(0, 50) as string[] };
        });

      const setSteps = (currentSteps: ExplanationStep[]) =>
        set({ currentSteps });

      const appendReactionLog = (entry: ReactionHistoryEntry) => {
        if (isDuplicateLogEntry(entry)) return;
        set((state) => ({
          reactionLog: [entry, ...state.reactionLog].slice(0, MAX_LOG_ENTRIES),
        }));
      };

      const setError = (error: ReactionError | undefined) =>
        set({ error, isProcessing: false });

      const clearError = () => set({ error: undefined });

      const resetWorkspace = () => set({ ...WORKSPACE_INITIAL });

      const factoryReset = () =>
        set({
          ...WORKSPACE_INITIAL,
          settings: { ...DEFAULT_SETTINGS },
          network: { ...DEFAULT_NETWORK },
        });

      const updateSettings = (patch: Partial<SolverSettings>) =>
        set((state) => ({
          settings: { ...state.settings, ...validateSettingsPatch(patch) },
        }));

      const updateNetwork = (patch: Partial<SolverNetwork>) =>
        set((state) => ({
          network: { ...state.network, ...validateNetworkPatch(patch) },
        }));

      // ── Initial store shape ───────────────────────────────────────────────
      return {
        ...WORKSPACE_INITIAL,
        settings: { ...DEFAULT_SETTINGS },
        network: { ...DEFAULT_NETWORK },

        actions: {
          setInputExpression,
          setReaction,
          applyThermodynamics,
          setActivationEnergy,
          setProcessing,
          toggleViewMode,
          addToHistory,
          setSteps,
          appendReactionLog,
          setError,
          clearError,
          resetWorkspace,
          factoryReset,
          updateSettings,
          updateNetwork,
        },
      };
    },
    {
      name: "owda-synthesis-storage-v5",
      storage: makeSafeStorage(),

      /**
       * Persist only the fields that are meaningful across sessions.
       * Excludes: currentReaction, currentSteps, isProcessing, error,
       *           activationEnergy, inputExpression (transient UI state).
       */
      partialize: (state) => ({
        history: state.history.slice(0, MAX_HISTORY),
        viewMode: state.viewMode,
        reactionLog: state.reactionLog.slice(0, MAX_HISTORY),
        settings: state.settings,
        newtork: state.network,
      }),

      /**
       * Migration from v4 storage schema.
       * v4 stored `enthalpy: 0` when AI was disabled (false thermoneutral).
       * v5 uses `undefined` for "not measured". Convert 0 entries that have
       * no `reactionType` (i.e. they were stored from a non-AI run) to
       * `enthalpy: undefined`.
       */
      version: 5,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>;

        if (version < 5) {
          const log = Array.isArray(state["reactionLog"])
            ? (state["reactionLog"] as ReactionHistoryEntry[]).map((entry) => ({
                ...entry,
                enthalpy:
                  entry.enthalpy === 0 && !entry.reactionType
                    ? undefined
                    : entry.enthalpy,
              }))
            : [];
          state["reactionLog"] = log;
        }

        return state as unknown as OWDAStore;
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors (stable references — use these instead of inline lambdas)
// ---------------------------------------------------------------------------

/** All store actions. Reference-stable between renders. */
export const useOWDAActions = () => useOWDAStore((state) => state.actions);

/** The current balanced or unbalanced reaction, or `undefined`. */
export const useCurrentReaction = () =>
  useOWDAStore((state) => state.currentReaction);

/** The current AI explanation steps. */
export const useCurrentSteps = () =>
  useOWDAStore((state) => state.currentSteps);

/** Solver and UI settings. */
export const useSolverSettings = () => useOWDAStore((state) => state.settings);

export const useSolverNetwork = () => useOWDAStore((state) => state.network);

/**
 * Returns whether the current reaction is exothermic (`true`),
 * endothermic (`false`), or indeterminate (`undefined`).
 */
export const useIsExothermic = (): boolean | undefined =>
  useOWDAStore((state) => {
    const reaction = state.currentReaction;
    if (!reaction || !reaction.isBalanced) return undefined;
    if (reaction.enthalpy === 0) return undefined; // 0 = not measured, not thermoneutral
    return reaction.enthalpy !== undefined && reaction.enthalpy < 0;
  });
