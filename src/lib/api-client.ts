/**
 * MoodFlix — API client (browser-side fetch wrappers).
 * Every method talks to the Next.js API routes via relative URLs (so the
 * gateway/proxy works in any deployment). Returns typed promises.
 */
import type {
  QuestionnaireAnswers,
  RecommendationResponse,
  MovieRecord,
} from "@/lib/recommendation/types";

export interface MovieListItem {
  items: MovieRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  source: string;
}

export interface WatchlistItem {
  id: string;
  addedAt: string;
  movie: MovieRecord;
}

export interface WatchedItem {
  id: string;
  watchedAt: string;
  movie: MovieRecord;
}

export interface UserPreferences {
  genres: string[];
  languages: string[];
  minRating: number;
  maxRuntime: number | null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  /* ---- Auth ---- */
  register: (body: { name?: string; email: string; password: string }) =>
    request<{ ok: true }>("/api/register", { method: "POST", body: JSON.stringify(body) }),

  /* ---- Movies ---- */
  listMovies: (params: {
    q?: string;
    genre?: string;
    language?: string;
    page?: number;
    pageSize?: number;
  } = {}) => {
    const url = new URL("/api/movies", window.location.origin);
    for (const [k, v] of Object.entries(params))
      if (v != null && v !== "") url.searchParams.set(k, String(v));
    return request<MovieListItem>(url.toString());
  },

  getMovie: (externalId: string) =>
    request<{ movie: MovieRecord; similar: MovieRecord[] }>(`/api/movies/${externalId}`),

  /* ---- Recommendations ---- */
  recommend: (body: {
    answers: QuestionnaireAnswers;
    excludeIds?: string[];
    save?: boolean;
  }) => request<RecommendationResponse>("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  /* ---- Watchlist ---- */
  getWatchlist: () => request<{ items: WatchlistItem[] }>("/api/watchlist"),
  addToWatchlist: (externalId: string) =>
    request<WatchlistItem>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ externalId }),
    }),
  removeFromWatchlist: (id: string) =>
    request<{ ok: true }>(`/api/watchlist/${id}`, { method: "DELETE" }),

  /* ---- Watched ---- */
  getWatched: () => request<{ items: WatchedItem[] }>("/api/watched"),
  markWatched: (externalId: string) =>
    request<WatchedItem>("/api/watched", {
      method: "POST",
      body: JSON.stringify({ externalId }),
    }),

  /* ---- Preferences ---- */
  getPreferences: () => request<UserPreferences>("/api/preferences"),
  updatePreferences: (body: UserPreferences) =>
    request<UserPreferences>("/api/preferences", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /* ---- Seed ---- */
  seed: () => request<{ ok: true; inserted: number; updated: number }>("/api/seed", { method: "POST" }),
};
