/**
 * MoodFlix — global UI store (Zustand).
 *
 * Holds view-routing state, the questionnaire answers, the last results,
 * and the movie-details dialog. Data that belongs to the signed-in user
 * (watchlist / watched / preferences) is fetched via TanStack Query in the
 * components that need it — this store stays focused on navigation + the
 * recommendation flow so guests and signed-in users share the same UX.
 */
import { create } from "zustand";
import type {
  QuestionnaireAnswers,
  RecommendationResponse,
} from "@/lib/recommendation/types";
import { defaultAnswers } from "@/lib/recommendation/types";

export type ViewKey = "landing" | "questionnaire" | "results" | "watchlist" | "about";

export type SortKey = "best" | "rating" | "year" | "runtime";

interface MoodflixState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  goToQuestionnaire: () => void;
  goToResults: () => void;

  answers: QuestionnaireAnswers;
  setAnswer: <K extends keyof QuestionnaireAnswers>(
    key: K,
    value: QuestionnaireAnswers[K]
  ) => void;
  patchAnswers: (patch: Partial<QuestionnaireAnswers>) => void;
  resetAnswers: () => void;

  results: RecommendationResponse | null;
  setResults: (r: RecommendationResponse | null) => void;

  loading: boolean;
  setLoading: (b: boolean) => void;

  error: string | null;
  setError: (e: string | null) => void;

  // session-scoped exclusions for the "replace this movie" feature
  excludedIds: string[];
  excludeMovie: (externalId: string) => void;
  clearExclusions: () => void;

  sort: SortKey;
  setSort: (s: SortKey) => void;

  // movie details dialog
  selectedMovieId: string | null;
  openMovie: (externalId: string) => void;
  closeMovie: () => void;

  // auth dialog
  authDialogOpen: boolean;
  authMode: "login" | "register";
  openAuth: (mode?: "login" | "register") => void;
  closeAuth: () => void;
}

export const useMoodflix = create<MoodflixState>((set) => ({
  view: "landing",
  setView: (v) => set({ view: v }),
  goToQuestionnaire: () => set({ view: "questionnaire" }),
  goToResults: () => set({ view: "results" }),

  answers: defaultAnswers(),
  setAnswer: (key, value) =>
    set((state) => ({ answers: { ...state.answers, [key]: value } })),
  patchAnswers: (patch) =>
    set((state) => ({ answers: { ...state.answers, ...patch } })),
  resetAnswers: () => set({ answers: defaultAnswers(), results: null, excludedIds: [] }),

  results: null,
  setResults: (r) => set({ results: r }),

  loading: false,
  setLoading: (b) => set({ loading: b }),

  error: null,
  setError: (e) => set({ error: e }),

  excludedIds: [],
  excludeMovie: (externalId) =>
    set((state) =>
      state.excludedIds.includes(externalId)
        ? state
        : { excludedIds: [...state.excludedIds, externalId] }
    ),
  clearExclusions: () => set({ excludedIds: [] }),

  sort: "best",
  setSort: (s) => set({ sort: s }),

  selectedMovieId: null,
  openMovie: (externalId) => set({ selectedMovieId: externalId }),
  closeMovie: () => set({ selectedMovieId: null }),

  authDialogOpen: false,
  authMode: "login",
  openAuth: (mode = "login") => set({ authDialogOpen: true, authMode: mode }),
  closeAuth: () => set({ authDialogOpen: false }),
}));
