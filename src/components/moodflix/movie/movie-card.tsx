"use client";
/**
 * MoodFlix — MovieCard
 *
 * A compact, cinematic card showing poster, title, year, runtime, genres,
 * rating, certification, and a compatibility match ring (when a score is
 * provided). Includes action buttons for watchlist / watched / details.
 *
 * Used in: results, watchlist, landing samples.
 */
import { Bookmark, BookmarkCheck, Check, Eye, EyeOff, Info, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoviePoster } from "./movie-poster";
import { MatchRing } from "./match-ring";
import {
  formatRuntime,
  formatYear,
  formatRating,
  certificationTone,
} from "./movie-helpers";
import { useToggleWatchlist, useToggleWatched, useMovieUserState } from "@/hooks/use-user-movies";
import { useMoodflix } from "@/lib/store/moodflix-store";
import type { MovieRecord } from "@/lib/recommendation/types";

interface MovieCardProps {
  movie: MovieRecord;
  rank?: number;
  score?: number;
  explanation?: string;
  onOpen?: (externalId: string) => void;
  onExclude?: (externalId: string) => void;
  compact?: boolean;
  className?: string;
}

export function MovieCard({
  movie,
  rank,
  score,
  explanation,
  onOpen,
  onExclude,
  compact = false,
  className,
}: MovieCardProps) {
  const { openMovie } = useMoodflix();
  const { inWatchlist, isWatched, isAuthed } = useMovieUserState(movie.externalId);
  const toggleWatchlist = useToggleWatchlist();
  const toggleWatched = useToggleWatched();
  const open = onOpen ?? openMovie;

  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 transition-all hover:border-amber-500/40 hover:bg-card hover:shadow-xl hover:shadow-black/30",
        className
      )}
    >
      {/* Poster */}
      <button
        onClick={() => open(movie.externalId)}
        className="relative w-24 shrink-0 overflow-hidden rounded-lg transition-transform group-hover:scale-[1.02] focus-visible:outline-none sm:w-28"
        aria-label={`View details for ${movie.title}`}
      >
        <MoviePoster movie={movie} showTitle={false} />
        {rank != null && (
          <span className="absolute left-1 top-1 grid h-6 min-w-6 place-items-center rounded-md bg-black/70 px-1.5 text-xs font-bold text-amber-300">
            #{rank}
          </span>
        )}
      </button>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {movie.title}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{formatYear(movie.releaseDate)}</span>
              <span aria-hidden>·</span>
              <span>{formatRuntime(movie.runtime)}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formatRating(movie.voteAverage)}
                <span className="text-muted-foreground/70">
                  ({movie.voteCount.toLocaleString()})
                </span>
              </span>
            </div>
          </div>

          {score != null && <MatchRing score={score} size={52} />}
        </div>

        {/* Genre + certification badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {movie.genres.slice(0, 3).map((g) => (
            <Badge key={g} variant="secondary" className="font-normal">
              {g}
            </Badge>
          ))}
          {movie.certification && (
            <Badge
              variant="outline"
              className={cn("font-medium", certificationTone(movie.certification))}
            >
              {movie.certification}
            </Badge>
          )}
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {movie.languageName}
          </Badge>
        </div>

        {/* Explanation (results only) */}
        {!compact && explanation && (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-foreground/80">
            <span className="font-medium text-amber-300">Why: </span>
            {explanation}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <Button size="sm" variant="default" onClick={() => open(movie.externalId)} className="gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Details
          </Button>

          <Button
            size="sm"
            variant={inWatchlist ? "secondary" : "outline"}
            onClick={() =>
              isAuthed
                ? toggleWatchlist.mutate({ externalId: movie.externalId, add: !inWatchlist })
                : undefined
            }
            disabled={toggleWatchlist.isPending}
            className="gap-1.5"
            title={inWatchlist ? "In your watchlist" : "Add to watchlist"}
          >
            {inWatchlist ? (
              <BookmarkCheck className="h-3.5 w-3.5 text-amber-300" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{inWatchlist ? "Saved" : "Watchlist"}</span>
          </Button>

          <Button
            size="sm"
            variant={isWatched ? "secondary" : "outline"}
            onClick={() =>
              isAuthed
                ? toggleWatched.mutate({ externalId: movie.externalId, add: !isWatched })
                : undefined
            }
            disabled={toggleWatched.isPending}
            className="gap-1.5"
            title={isWatched ? "Marked as watched" : "Mark as watched"}
          >
            {isWatched ? (
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isWatched ? "Watched" : "Watched"}</span>
          </Button>

          {onExclude && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onExclude(movie.externalId)}
              className="ml-auto text-muted-foreground hover:text-rose-300"
              title="Exclude this and get a replacement"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Replace</span>
            </Button>
          )}
        </div>

        {!isAuthed && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/70">
            Sign in to save movies or track what you've watched.
          </p>
        )}
      </div>
    </article>
  );
}
