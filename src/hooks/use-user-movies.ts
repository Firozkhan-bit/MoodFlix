"use client";
/**
 * MoodFlix — watchlist & watched data hooks (TanStack Query).
 *
 * Centralizes fetching + optimistic mutations so any component can read or
 * toggle a movie's watchlist / watched state with one call.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api, type WatchlistItem, type WatchedItem } from "@/lib/api-client";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { toast } from "sonner";

const WATCHLIST_KEY = ["watchlist"] as const;
const WATCHED_KEY = ["watched"] as const;

export function useWatchlist() {
  const { status } = useSession();
  const enabled = status === "authenticated";
  return useQuery<{ items: WatchlistItem[] }>({
    queryKey: WATCHLIST_KEY,
    queryFn: api.getWatchlist,
    enabled,
  });
}

export function useWatched() {
  const { status } = useSession();
  const enabled = status === "authenticated";
  return useQuery<{ items: WatchedItem[] }>({
    queryKey: WATCHED_KEY,
    queryFn: api.getWatched,
    enabled,
  });
}

export function useMovieUserState(externalId: string) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const watchlist = useWatchlist();
  const watched = useWatched();

  const inWatchlist =
    watchlist.data?.items.some((i) => i.movie.externalId === externalId) ?? false;
  const isWatched =
    watched.data?.items.some((i) => i.movie.externalId === externalId) ?? false;

  return { inWatchlist, isWatched, isAuthed };
}

export function useToggleWatchlist() {
  const qc = useQueryClient();
  const { openAuth } = useMoodflix();

  return useMutation({
    mutationFn: async ({
      externalId,
      add,
    }: {
      externalId: string;
      add: boolean;
    }) => {
      if (add) return api.addToWatchlist(externalId);
      // Need the watchlist item id to delete.
      const wl = await api.getWatchlist();
      const item = wl.items.find((i) => i.movie.externalId === externalId);
      if (!item) return null;
      return api.removeFromWatchlist(item.id);
    },
    onMutate: async ({ externalId, add }) => {
      await qc.cancelQueries({ queryKey: WATCHLIST_KEY });
      const prev = qc.getQueryData<{ items: WatchlistItem[] }>(WATCHLIST_KEY);
      if (prev) {
        const next = add
          ? {
              items: [
                {
                  id: "temp-" + externalId,
                  addedAt: new Date().toISOString(),
                  movie: { externalId, title: "", overview: "", releaseDate: null, runtime: 0, genres: [], language: "", languageName: "", certification: null, voteAverage: 0, voteCount: 0, director: null, cast: [], trailerUrl: null, moodTags: [], emotionalTone: [], similarIds: [], tags: [] },
                },
                ...prev.items,
              ],
            }
          : { items: prev.items.filter((i) => i.movie.externalId !== externalId) };
        qc.setQueryData(WATCHLIST_KEY, next);
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(WATCHLIST_KEY, ctx.prev);
      const msg = err instanceof Error ? err.message : "Could not update watchlist";
      if (msg.toLowerCase().includes("authentication")) {
        openAuth("login");
        toast.info("Sign in to save movies to your watchlist.");
      } else {
        toast.error(msg);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
    onSuccess: (_data, { add }) => {
      toast.success(add ? "Added to watchlist" : "Removed from watchlist");
    },
  });
}

export function useToggleWatched() {
  const qc = useQueryClient();
  const { openAuth } = useMoodflix();

  return useMutation({
    mutationFn: async ({ externalId, add }: { externalId: string; add: boolean }) => {
      if (add) return api.markWatched(externalId);
      // No delete endpoint required by the brief; treat as a soft toggle that
      // only adds. We still update the cache locally for a snappy UI.
      return null;
    },
    onMutate: async ({ externalId, add }) => {
      await qc.cancelQueries({ queryKey: WATCHED_KEY });
      const prev = qc.getQueryData<{ items: WatchedItem[] }>(WATCHED_KEY);
      if (prev) {
        const next = add
          ? {
              items: [
                {
                  id: "temp-w-" + externalId,
                  watchedAt: new Date().toISOString(),
                  movie: { externalId, title: "", overview: "", releaseDate: null, runtime: 0, genres: [], language: "", languageName: "", certification: null, voteAverage: 0, voteCount: 0, director: null, cast: [], trailerUrl: null, moodTags: [], emotionalTone: [], similarIds: [], tags: [] },
                },
                ...prev.items,
              ],
            }
          : { items: prev.items.filter((i) => i.movie.externalId !== externalId) };
        qc.setQueryData(WATCHED_KEY, next);
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(WATCHED_KEY, ctx.prev);
      const msg = err instanceof Error ? err.message : "Could not update watched list";
      if (msg.toLowerCase().includes("authentication")) {
        openAuth("login");
        toast.info("Sign in to track what you've watched.");
      } else {
        toast.error(msg);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: WATCHED_KEY });
    },
    onSuccess: (_data, { add }) => {
      toast.success(add ? "Marked as watched" : "Removed from watched");
    },
  });
}
