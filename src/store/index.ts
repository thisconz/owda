import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EngineState, ChemicalReaction, ReactionError } from '../types';

/**
 * OWDA Store Version 3.0
 * Features: Persistence, Computed State, and Atomic Resets
 */
interface OWDAStore extends EngineState {
  // Atomic Actions
  actions: {
    setInputExpression: (expr: string) => void;
    setReaction: (reaction: ChemicalReaction | undefined) => void;
    setActivationEnergy: (ea: number | undefined) => void;
    setProcessing: (loading: boolean) => void;
    toggleViewMode: () => void;
    addToHistory: (expr: string) => void;
    setError: (error: ReactionError | undefined) => void;
    clearError: () => void;
    resetWorkspace: () => void;
  };
}

const initialState: EngineState = {
  inputExpression: '',
  currentReaction: undefined,
  activationEnergy: undefined,
  history: [],
  isProcessing: false,
  viewMode: '3d',
  error: undefined,
};

export const useOWDAStore = create<OWDAStore>()(
  persist(
    (set) => ({
      ...initialState,

      actions: {
        setInputExpression: (inputExpression) => set({ inputExpression }),

        setReaction: (currentReaction) =>
          set((state) => ({
            currentReaction,
            // Side effect: only clear error if a valid reaction is provided
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
            return {
              history: [expr, ...state.history].slice(0, 50),
            };
          }),

        setError: (error) => set({ error, isProcessing: false }),

        clearError: () => set({ error: undefined }),

        resetWorkspace: () => set({ ...initialState, history: [] }),
      },
    }),
    {
      name: 'owda-synthesis-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist history and viewMode, keep engine state volatile
      partialize: (state) => ({ 
        history: state.history, 
        viewMode: state.viewMode 
      }),
    }
  )
);

/**
 * Custom Selectors (Performance Optimization)
 * Prevents unnecessary re-renders of the WorkspacePage
 */
export const useOWDAActions = () => useOWDAStore((state) => state.actions);
export const useCurrentReaction = () => useOWDAStore((state) => state.currentReaction);
export const useIsExothermic = () => useOWDAStore((state) => {
  if (state.currentReaction?.isBalanced) {
    return state.currentReaction.enthalpy < 0;
  }
  return undefined;
});