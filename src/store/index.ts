import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  EngineState,
  ChemicalReaction,
  ReactionError,
  ExplanationStep,
  ReactionHistoryEntry,
} from '../types';

// ─── Settings ────────────────────────────────────────────────────────────────

export interface SolverSettings {
  enableAI: boolean;
  enforceStoichiometry: boolean;
  syncDelay: number;
  theme: 'dark' | 'terminal';
}

const DEFAULT_SETTINGS: SolverSettings = {
  enableAI: true,
  enforceStoichiometry: true,
  syncDelay: 0,
  theme: 'dark',
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface OWDAStore extends EngineState {
  settings: SolverSettings;
  actions: {
    setInputExpression: (expr: string) => void;
    setReaction: (reaction: ChemicalReaction | undefined) => void;
    setActivationEnergy: (ea: number | undefined) => void;
    setProcessing: (loading: boolean) => void;
    toggleViewMode: () => void;
    addToHistory: (expr: string) => void;
    setSteps: (steps: ExplanationStep[]) => void;
    appendReactionLog: (entry: ReactionHistoryEntry) => void;
    setError: (error: ReactionError | undefined) => void;
    clearError: () => void;
    resetWorkspace: () => void;
    updateSettings: (patch: Partial<SolverSettings>) => void;
  };
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: EngineState = {
  inputExpression: '',
  currentReaction: undefined,
  currentSteps: [],
  activationEnergy: undefined,
  history: [],
  reactionLog: [],
  isProcessing: false,
  viewMode: '3d',
  error: undefined,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useOWDAStore = create<OWDAStore>()(
  persist(
    (set) => ({
      ...initialState,
      settings: DEFAULT_SETTINGS,

      actions: {
        setInputExpression: (inputExpression) => set({ inputExpression }),

        setReaction: (currentReaction) =>
          set((state) => ({
            currentReaction,
            error: currentReaction ? undefined : state.error,
            isProcessing: false,
          })),

        setActivationEnergy: (activationEnergy) => set({ activationEnergy }),

        setProcessing: (isProcessing) => set({ isProcessing }),

        toggleViewMode: () =>
          set((state) => ({
            viewMode: state.viewMode === '2d' ? '3d' : '2d',
          })),

        addToHistory: (expr) =>
          set((state) => {
            if (!expr || state.history[0] === expr) return state;
            return { history: [expr, ...state.history].slice(0, 50) };
          }),

        setSteps: (currentSteps) => set({ currentSteps }),

        appendReactionLog: (entry) =>
          set((state) => ({
            reactionLog: [entry, ...state.reactionLog].slice(0, 100),
          })),

        setError: (error) => set({ error, isProcessing: false }),

        clearError: () => set({ error: undefined }),

        resetWorkspace: () =>
          set({ ...initialState, history: [], reactionLog: [] }),

        updateSettings: (patch) =>
          set((state) => ({ settings: { ...state.settings, ...patch } })),
      },
    }),
    {
      name: 'owda-synthesis-storage-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        history: state.history,
        viewMode: state.viewMode,
        reactionLog: state.reactionLog,
        settings: state.settings,
      }),
    }
  )
);

// ─── Selectors ───────────────────────────────────────────────────────────────

export const useOWDAActions = () => useOWDAStore((state) => state.actions);
export const useCurrentReaction = () => useOWDAStore((state) => state.currentReaction);
export const useCurrentSteps = () => useOWDAStore((state) => state.currentSteps);
export const useSolverSettings = () => useOWDAStore((state) => state.settings);

export const useIsExothermic = () =>
  useOWDAStore((state) => {
    const r = state.currentReaction;
    if (r && r.isBalanced) return r.enthalpy < 0;
    return undefined;
  });
  