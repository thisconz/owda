import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import {
  EngineState,
  ChemicalReaction,
  ReactionError,
  ExplanationStep,
  ReactionHistoryEntry,
  ReactionType,
} from "../types";
import type { AIThermodynamics } from "../services/aiService";
import {
  AI_MODELS_LIST,
  DEFAULT_MODEL_ID,
  AIModelId,
  isValidModelId,
} from "../config/models";

// ---------------------------------------------------------------------------
// Re-export AI model types for legacy component imports
// ---------------------------------------------------------------------------
export type { AIModelId };
export { AI_MODELS_LIST as AI_MODELS, DEFAULT_MODEL_ID };
/** @deprecated Use AIModelId from config/models instead */
export type AIModelType = AIModelId;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIMITS = {
  history:     50,  // expression input history (MRU)
  reactionLog: 100, // analytics log entries
  dedupMap:    50,  // max entries tracked for duplicate suppression
} as const;

const DEDUP_WINDOW_MS = 2_000; // ignore identical entries within 2 s

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export interface SolverNetwork {
  online: boolean;
  /** @future Custom proxy support — currently not wired to transport */
  useProxy: boolean;
  /** @future Enterprise proxy endpoint — currently unused */
  endpoint?: string;
  timeoutMs: number;
  retryCount: number;
}

const DEFAULT_NETWORK: Readonly<SolverNetwork> = {
  online: true,
  useProxy: false,
  endpoint: undefined,
  timeoutMs: 15_000,
  retryCount: 3,
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SolverSettings {
  enableAI: boolean;
  enforceStoichiometry: boolean;
  AIModel: AIModelId;
  /** Artificial API delay in ms (0 = instant). Useful for demos. */
  syncDelay: number;
  theme: "dark" | "terminal";
}

const DEFAULT_SETTINGS: Readonly<SolverSettings> = {
  enableAI: true,
  enforceStoichiometry: true,
  AIModel: DEFAULT_MODEL_ID,
  syncDelay: 0,
  theme: "dark",
};

const VALID_THEMES = new Set<SolverSettings["theme"]>(["dark", "terminal"]);

// ---------------------------------------------------------------------------
// Persisted state shape
// ---------------------------------------------------------------------------
type PersistedOWDAState = Pick<
  OWDAStore,
  "history" | "viewMode" | "reactionLog" | "settings" | "network"
>;

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface OWDAStore extends EngineState {
  settings: SolverSettings;
  network: SolverNetwork;
  /**
   * Internal dedup tracker — NOT persisted, NOT part of EngineState.
   * Lives in the store to avoid module-level globals that break HMR.
   */
  _logDedup: Map<string, number>;

  actions: {
    setInputExpression: (expr: string) => void;
    setReaction: (reaction: ChemicalReaction | undefined) => void;
    applyThermodynamics: (thermo: AIThermodynamics) => void;
    setActivationEnergy: (ea: number | undefined) => void;
    setProcessing: (loading: boolean) => void;
    toggleViewMode: () => void;
    addToHistory: (expr: string) => void;
    setSteps: (steps: ExplanationStep[]) => void;
    appendReactionLog: (entry: ReactionHistoryEntry) => void;
    setError: (error: ReactionError | undefined) => void;
    clearError: () => void;
    resetWorkspace: () => void;
    factoryReset: () => void;
    updateSettings: (patch: Partial<SolverSettings>) => void;
    updateNetwork: (patch: Partial<SolverNetwork>) => void;
  };
}

// ---------------------------------------------------------------------------
// Initial workspace state (transient — reset on tab refresh)
// ---------------------------------------------------------------------------

const WORKSPACE_INITIAL: Omit<EngineState, never> = {
  inputExpression: "",
  currentReaction: undefined,
  currentSteps:    [],
  activationEnergy: undefined,
  history:         [],
  reactionLog:     [],
  isProcessing:    false,
  viewMode:        "3d",
  error:           undefined,
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
          if (process.env.NODE_ENV === "development") {
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
  if ("theme" in clean && !VALID_THEMES.has(clean.theme as SolverSettings["theme"])) {
    delete clean.theme;
    if (process.env.NODE_ENV === "development") {
      console.warn("[OWDA Store] Invalid theme value ignored:", patch.theme);
    }
  }
  if ("AIModel" in clean && !isValidModelId(clean.AIModel)) {
    clean.AIModel = DEFAULT_MODEL_ID;
    if (process.env.NODE_ENV === "development") {
      console.warn("[OWDA Store] Invalid AIModel value — reset to default.");
    }
  }
  return clean;
}

function validateNetworkPatch(
  patch: Partial<SolverNetwork>,
): Partial<SolverNetwork> {
  const clean: Partial<SolverNetwork> = { ...patch };

  if (typeof clean.timeoutMs === "number") {
    clean.timeoutMs = Math.max(1_000, Math.min(120_000, Math.round(clean.timeoutMs)));
  }
  if (typeof clean.retryCount === "number") {
    clean.retryCount = Math.max(0, Math.min(10, Math.round(clean.retryCount)));
  }
  if ("endpoint" in clean && typeof clean.endpoint === "string") {
    try {
      new URL(clean.endpoint);
    } catch {
      delete clean.endpoint;
      if (process.env.NODE_ENV === "development") {
        console.warn("[OWDA Network] Invalid endpoint URL ignored.");
      }
    }
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Duplicate log-entry guard (no module-level mutable state)
// ---------------------------------------------------------------------------

/**
 * Checks and updates the dedup map stored inside the Zustand store.
 * Returns true if this entry is a duplicate within DEDUP_WINDOW_MS.
 *
 * Map management: when the map exceeds LIMITS.dedupMap entries, the
 * single oldest entry is evicted (O(n) scan, acceptable for n ≤ 50).
 */
function checkAndRecordDuplicate(
  dedup: Map<string, number>,
  entry: ReactionHistoryEntry,
): boolean {
  const now = Date.now();
  const last = dedup.get(entry.expression);

  if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
    return true; // duplicate
  }

  dedup.set(entry.expression, now);

  // Evict oldest single entry when over limit (keeps map bounded)
  if (dedup.size > LIMITS.dedupMap) {
    let oldestKey = "";
    let oldestTime = Infinity;
    dedup.forEach((time, key) => {
      if (time < oldestTime) { oldestTime = time; oldestKey = key; }
    });
    if (oldestKey) dedup.delete(oldestKey);
  }

  return false; // not a duplicate
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useOWDAStore = create<OWDAStore>()(
  persist(
    (set, get) => {
      // ── Action implementations ─────────────────────────────────────────────
      // All defined as named consts so the `actions` object shape is stable.
      // Zustand creates this object once; its reference never changes between
      // renders, so useOWDAActions() subscribers never re-render spuriously.

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
          if (!reaction?.isBalanced) return state;

          const updated: ChemicalReaction = {
            ...reaction,
            enthalpy: thermo.enthalpy !== undefined ? thermo.enthalpy : reaction.enthalpy,
            entropy:  thermo.entropy  !== undefined ? thermo.entropy  : reaction.entropy,
            gibbs:    thermo.gibbs    !== undefined ? thermo.gibbs    : reaction.gibbs,
            type:     thermo.type !== "Unknown"
                        ? (thermo.type as ReactionType)
                        : reaction.type,
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
          return { history: [expr, ...filtered].slice(0, LIMITS.history) };
        });

      const setSteps = (currentSteps: ExplanationStep[]) =>
        set({ currentSteps });

      const appendReactionLog = (entry: ReactionHistoryEntry) => {
        const { _logDedup } = get();
        if (checkAndRecordDuplicate(_logDedup, entry)) return;
        set((state) => ({
          reactionLog: [entry, ...state.reactionLog].slice(0, LIMITS.reactionLog),
        }));
      };

      const setError = (error: ReactionError | undefined) =>
        set({ error, isProcessing: false });

      const clearError = () => set({ error: undefined });

      const resetWorkspace = () =>
        set({
          ...WORKSPACE_INITIAL,
          // Preserve _logDedup so dedup state survives workspace resets
          _logDedup: get()._logDedup,
        });

      const factoryReset = () =>
        set({
          ...WORKSPACE_INITIAL,
          _logDedup: new Map<string, number>(),
          settings: { ...DEFAULT_SETTINGS },
          network:  { ...DEFAULT_NETWORK },
        });

      const updateSettings = (patch: Partial<SolverSettings>) =>
        set((state) => ({
          settings: { ...state.settings, ...validateSettingsPatch(patch) },
        }));

      const updateNetwork = (patch: Partial<SolverNetwork>) =>
        set((state) => ({
          network: { ...state.network, ...validateNetworkPatch(patch) },
        }));

      // ── Initial store shape ────────────────────────────────────────────────
      return {
        ...WORKSPACE_INITIAL,
        _logDedup: new Map<string, number>(),
        settings:  { ...DEFAULT_SETTINGS },
        network:   { ...DEFAULT_NETWORK },

        /**
         * Stable action object — reference is constant across renders.
         * Do NOT spread or destructure at module level.
         * Always access via: const actions = useOWDAActions()
         */
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
      name: "owda-synthesis-storage-v6",
      storage: makeSafeStorage(),

      /**
       * Only persist fields that are meaningful across sessions.
       * Excluded (transient): currentReaction, currentSteps, isProcessing,
       * error, activationEnergy, inputExpression, _logDedup.
       */
      partialize: (state): PersistedOWDAState => ({
        history:     state.history.slice(0, LIMITS.history),
        viewMode:    state.viewMode,
        reactionLog: state.reactionLog.slice(0, LIMITS.reactionLog),
        settings:    state.settings,
        network:     state.network,
      }),

      version: 6,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>;

        // v4→v5: 0-enthalpy without reactionType → undefined
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

        // v5→v6: migrate old AIModel IDs to new format
        if (version < 6) {
          const settings = state["settings"] as Record<string, unknown> | undefined;
          if (settings) {
            const modelMap: Record<string, string> = {
              "qwen":        "qwen-coder-free",
              "mistral":     "mistral-small-free",
              "deepseek":    "deepseek-v3-free",
              "llama":       "llama-3-3-free",
              "gemini":      "gemini-flash-free",
            };
            const oldModel = settings["AIModel"] as string | undefined;
            if (oldModel && oldModel in modelMap) {
              settings["AIModel"] = modelMap[oldModel];
            } else if (!isValidModelId(oldModel)) {
              settings["AIModel"] = DEFAULT_MODEL_ID;
            }
          }
        }

        return state as unknown as OWDAStore;
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors (stable references — always prefer these over inline lambdas)
// ---------------------------------------------------------------------------

/** All store mutations in one stable reference. NEVER triggers re-renders. */
export const useOWDAActions      = () => useOWDAStore((s) => s.actions);

// Workspace state
export const useCurrentReaction  = () => useOWDAStore((s) => s.currentReaction);
export const useIsProcessing     = () => useOWDAStore((s) => s.isProcessing);
export const useInputExpression  = () => useOWDAStore((s) => s.inputExpression);
export const useReactionLog      = () => useOWDAStore((s) => s.reactionLog);
export const useViewMode         = () => useOWDAStore((s) => s.viewMode);
export const useError            = () => useOWDAStore((s) => s.error);
export const useCurrentSteps     = () => useOWDAStore((s) => s.currentSteps);
export const useActivationEnergy = () => useOWDAStore((s) => s.activationEnergy);

// Settings & network
export const useSolverSettings   = () => useOWDAStore((s) => s.settings);
export const useSolverNetwork    = () => useOWDAStore((s) => s.network);
/** @deprecated Use useSolverSettings instead */
export const useSettings         = useSolverSettings;

/**
 * Returns whether the current reaction is exothermic (`true`),
 * endothermic / thermoneutral (`false`), or indeterminate (`undefined`
 * when no reaction is loaded or AI has not yet returned enthalpy data).
 *
 * IMPORTANT: ΔH = 0 (thermoneutral) correctly returns `false` — it is
 * NOT treated as "unknown". Only `undefined` means "not yet estimated".
 */
export const useIsExothermic = (): boolean | undefined =>
  useOWDAStore((state) => {
    const reaction = state.currentReaction;
    if (!reaction?.isBalanced) return undefined;
    if (reaction.enthalpy === undefined) return undefined;
    return reaction.enthalpy < 0; // 0 = thermoneutral = not exothermic
  });