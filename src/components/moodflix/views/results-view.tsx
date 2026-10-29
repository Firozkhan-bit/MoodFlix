"use client";
/**
 * MoodFlix — Results view.
 *
 * Renders 5–10 ranked recommendations with match scores + explanations,
 * plus controls to sort, change preferences, generate a fresh set, and
 * exclude-and-replace individual titles.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal, RefreshCw, Sparkles, Info, ChevronDown, Loader2, Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MovieCard } from "@/components/moodflix/movie/movie-card";
import { useMoodflix, type SortKey } from "@/lib/store/moodflix-store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { movieYear } from "@/components/moodflix/movie/movie-helpers";

const SORT_LABELS: Record<SortKey, string> = {
  best: "Best match",
  rating: "Highest rated",
  year: "Newest first",
  runtime: "Shortest first",
};

export function ResultsView() {
  const {
    results, setResults, sort, setSort, answers, excludedIds, excludeMovie,
    setView, setLoading, loading,
  } = useMoodflix();
  const { status } = useSession();

  const sorted = useMemo(() => {
    if (!results) return [];
    const list = [...results.recommendations];
    switch (sort) {
      case "rating":
        return list.sort((a, b) => b.movie.voteAverage - a.movie.voteAverage);
      case "year":
        return list.sort((a, b) => (movieYear(b.movie) ?? 0) - (movieYear(a.movie) ?? 0));
      case "runtime":
        return list.sort((a, b) => a.movie.runtime - b.movie.runtime);
      default:
        return list.sort((a, b) => b.score - a.score || a.rank - b.rank);
    }
  }, [results, sort]);

  const rerun = async (opts?: { addExcludeId?: string }) => {
    setLoading(true);
    try {
      const excludeIds = opts?.addExcludeId
        ? Array.from(new Set([...excludedIds, opts.addExcludeId]))
        : excludedIds;
      if (opts?.addExcludeId) excludeMovie(opts.addExcludeId);
      const res = await api.recommend({
        answers,
        excludeIds,
        save: status === "authenticated",
      });
      setResults(res);
      if (res.recommendations.length === 0) {
        toast.info("No matches with the current filters. Try relaxing one.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const onExclude = (externalId: string) => {
    toast.message("Finding a replacement…");
    rerun({ addExcludeId: externalId });
  };

  /* ---------- Empty / loading states ---------- */
  if (loading && !results) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        <h2 className="text-xl font-semibold">Finding your matches…</h2>
        <p className="text-sm text-muted-foreground">
          Scoring the catalog against your mood, genres, runtime and more.
        </p>
      </div>
    );
  }

  if (!results || results.recommendations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-300">
          <Film className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold">No matches found</h2>
        <p className="mt-2 text-muted-foreground">
          Your strict filters left no candidates. Try relaxing one of these:
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {results?.notes.map((n, i) => (
            <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
          ))}
          {(!results?.notes || results.notes.length === 0) && (
            <Badge variant="outline" className="text-xs">Try “No time limit” or “Any year”</Badge>
          )}
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <Button variant="outline" onClick={() => setView("questionnaire")}>
            <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Change preferences
          </Button>
          <Button onClick={() => rerun()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- Results ---------- */
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Your matches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.recommendations.length} of {results.afterFilterCount} candidates ranked for you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger id="sort" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setView("questionnaire")} className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Change</span>
          </Button>
          <Button
            size="sm"
            onClick={() => rerun()}
            disabled={loading}
            className="gap-1.5 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="hidden sm:inline">New set</span>
          </Button>
        </div>
      </div>

      {/* Notes */}
      {results.notes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {results.notes.slice(0, 4).map((n, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground"
            >
              <Info className="h-3 w-3" />
              {n}
            </span>
          ))}
        </div>
      )}

      {/* List */}
      <div className="mt-6 grid gap-4">
        {sorted.map((rec, i) => (
          <motion.div
            key={rec.movie.externalId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <MovieCard
              movie={rec.movie}
              rank={sort === "best" ? rec.rank : undefined}
              score={rec.score}
              explanation={rec.explanation}
              onExclude={onExclude}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-6 text-center">
        <Sparkles className="h-6 w-6 text-amber-400" />
        <p className="text-sm text-muted-foreground">
          Not feeling these? Generate a fresh set or tweak your preferences.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setView("questionnaire")} className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" /> Change preferences
          </Button>
          <Button onClick={() => rerun()} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Generate a new set
          </Button>
        </div>
      </div>
    </div>
  );
}
