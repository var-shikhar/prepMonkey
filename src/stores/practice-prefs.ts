import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface DrillPrefs {
  domains: number[];
  skills: string[];
  count: string;
  instant: boolean;
  timed: boolean;
  pool: 'bank' | 'imported' | 'all';
  difficulty: string;
  /** only questions reported as asked in real interviews */
  askedOnly?: boolean;
}

interface PracticePrefsState {
  drills: Record<string, DrillPrefs>;
  mockDifficulty: Record<string, string>;
  /** the role the learner is preparing for (1–5); shared across exams */
  role: number | null;
  saveDrill: (examId: string, prefs: DrillPrefs) => void;
  saveMockDifficulty: (examId: string, difficulty: string) => void;
  setRole: (role: number | null) => void;
}

/**
 * Remembers each exam's last drill setup and mock difficulty on this device,
 * so returning learners start from their own defaults. Hydrated on the client
 * only (see `skipHydration`) to keep server rendering deterministic.
 */
export const usePracticePrefs = create<PracticePrefsState>()(
  persist(
    (set) => ({
      drills: {},
      mockDifficulty: {},
      role: null,
      saveDrill: (examId, prefs) => set((s) => ({ drills: { ...s.drills, [examId]: prefs } })),
      saveMockDifficulty: (examId, difficulty) => set((s) => ({ mockDifficulty: { ...s.mockDifficulty, [examId]: difficulty } })),
      setRole: (role) => set({ role }),
    }),
    { name: 'quizzmonkey.practice', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
