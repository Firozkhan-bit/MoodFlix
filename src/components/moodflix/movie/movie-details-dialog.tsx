"use client";
/**
 * MoodFlix — Movie details dialog.
 *
 * Opens when `selectedMovieId` is set in the store. Fetches full details
 * (with similar movies) from /api/movies/[id] via TanStack Query (no manual
 * setState-in-effect). Shows poster/backdrop, metadata, cast, director,
 * trailer (when available), and the user's personalized match explanation
 * if the movie is in the current results.
 */
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Clock, Calendar, Globe, Clapperboard, Users, Video, ShieldCheck, Sparkles,
} from "lucide-react";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { api } from "@/lib/api-client";
import { MoviePoster } from "./movie-poster";
import { MovieCard } from "./movie-card";
import {
  formatRuntime, formatYear, formatRating, certificationTone,
} from "./movie-helpers";
import { MatchRing } from "./match-ring";
import type { MovieRecord } from "@/lib/recommendation/types";
import { cn } from "@/lib/utils";

export function MovieDetailsDialog() {
  const { selectedMovieId, closeMovie, results } = useMoodflix();

  const { data, isLoading, error } = useQuery({
    queryKey: ["movie", selectedMovieId],
    queryFn: () => (selectedMovieId ? api.getMovie(selectedMovieId) : null),
    enabled: !!selectedMovieId,
    staleTime: 5 * 60_000,
  });

  const movie: MovieRecord | undefined = selectedMovieId ? data?.movie : undefined;
  const similar: MovieRecord[] = selectedMovieId ? data?.similar ?? [] : [];
  const rec = results?.recommendations.find((r) => r.movie.externalId === selectedMovieId);

  return (
    <Dialog open={!!selectedMovieId} onOpenChange={(o) => !o && closeMovie()}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {movie ? movie.title : "Movie details"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Full details, cast, and personalized match explanation.
        </DialogDescription>

        <ScrollArea className="max-h-[85vh] mf-scroll">
          {isLoading && <DetailsSkeleton />}
          {error && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load movie."}
            </div>
          )}

          {movie && !isLoading && (
            <div>
              {/* Backdrop banner */}
              <div
                className="relative h-44 w-full sm:h-56"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.85)), radial-gradient(80% 120% at 30% 0%, oklch(0.66 0.21 18 / 0.4), transparent 60%)",
                }}
              >
                <div className="absolute inset-0 mf-shimmer opacity-40" />
              </div>

              <div className="relative -mt-20 px-4 pb-6 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="w-28 shrink-0 sm:w-36">
                    <MoviePoster movie={movie} showTitle={false} className="shadow-2xl shadow-black/50" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                      {movie.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {formatYear(movie.releaseDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {formatRuntime(movie.runtime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {formatRating(movie.voteAverage)} ({movie.voteCount.toLocaleString()})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> {movie.languageName}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {movie.genres.map((g) => (
                        <Badge key={g} variant="secondary" className="font-normal">{g}</Badge>
                      ))}
                      {movie.certification && (
                        <Badge variant="outline" className={cn("font-medium", certificationTone(movie.certification))}>
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          {movie.certification}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {rec && (
                    <div className="flex flex-col items-center gap-1 sm:self-center">
                      <MatchRing score={rec.score} size={64} />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        your match
                      </span>
                    </div>
                  )}
                </div>

                {/* Overview */}
                <p className="mt-5 text-sm leading-relaxed text-foreground/90">
                  {movie.overview || "No synopsis available for this title."}
                </p>

                {/* Match explanation */}
                {rec && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <Sparkles className="h-4 w-4" />
                      Why we recommended it
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                      {rec.explanation}
                    </p>
                  </div>
                )}

                {/* Crew + cast */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clapperboard className="h-3.5 w-3.5" /> Director
                    </div>
                    <p className="mt-1 text-sm">{movie.director ?? "Unknown"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> Cast
                    </div>
                    <p className="mt-1 text-sm">
                      {movie.cast.length > 0 ? movie.cast.join(", ") : "Cast unavailable"}
                    </p>
                  </div>
                </div>

                {/* Trailer */}
                <div className="mt-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Video className="h-3.5 w-3.5" /> Trailer
                  </div>
                  {movie.trailerUrl ? (
                    <Button asChild size="sm" variant="outline" className="mt-2 gap-1.5">
                      <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                        <Video className="h-3.5 w-3.5" /> Watch trailer
                      </a>
                    </Button>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Trailer unavailable in the local sample dataset.
                      {!movie.posterPath && " Configure a TMDB key to fetch real trailers."}
                    </p>
                  )}
                </div>

                {/* Similar */}
                {similar.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold">Similar movies</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {similar.slice(0, 4).map((s) => (
                        <MovieCard key={s.externalId} movie={s} compact />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function DetailsSkeleton() {
  return (
    <div className="px-4 pb-6 pt-24 sm:px-6">
      <div className="flex gap-4">
        <Skeleton className="h-40 w-28 sm:w-36" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-5 h-24 w-full" />
      <Skeleton className="mt-4 h-16 w-full" />
    </div>
  );
}
