"use client";
/**
 * MoodFlix — MoviePoster
 *
 * Renders a deterministic, cinematic gradient "poster" for a movie using
 * only CSS. The gradient is derived from the movie's primary genre + a hash
 * of its title, so every movie gets a stable, recognizable identity without
 * needing a remote image (important in offline/sample-data mode).
 *
 * If a real TMDB `posterPath` is present (production with a TMDB key), we
 * render the remote image instead.
 */
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MovieRecord } from "@/lib/recommendation/types";

/** Genre → [accent1, accent2] oklch color pair. Warm, cinematic, no blue/indigo. */
const GENRE_PALETTE: Record<string, [string, string]> = {
  Action: ["oklch(0.62 0.21 25)", "oklch(0.45 0.18 350)"],
  Adventure: ["oklch(0.72 0.16 145)", "oklch(0.5 0.14 175)"],
  Animation: ["oklch(0.78 0.16 70)", "oklch(0.66 0.2 300)"],
  Comedy: ["oklch(0.8 0.16 95)", "oklch(0.62 0.2 30)"],
  Crime: ["oklch(0.4 0.05 60)", "oklch(0.5 0.12 350)"],
  Documentary: ["oklch(0.6 0.1 170)", "oklch(0.45 0.08 200)"],
  Drama: ["oklch(0.5 0.12 20)", "oklch(0.4 0.1 300)"],
  Fantasy: ["oklch(0.6 0.18 290)", "oklch(0.7 0.15 150)"],
  Horror: ["oklch(0.3 0.05 60)", "oklch(0.45 0.18 350)"],
  Mystery: ["oklch(0.45 0.12 270)", "oklch(0.35 0.1 60)"],
  Romance: ["oklch(0.66 0.2 10)", "oklch(0.6 0.16 340)"],
  "Science Fiction": ["oklch(0.6 0.14 220)", "oklch(0.45 0.16 180)"],
  Thriller: ["oklch(0.4 0.1 20)", "oklch(0.35 0.08 60)"],
  War: ["oklch(0.45 0.1 80)", "oklch(0.35 0.06 30)"],
  Western: ["oklch(0.6 0.12 70)", "oklch(0.45 0.1 40)"],
  Family: ["oklch(0.72 0.16 70)", "oklch(0.6 0.18 150)"],
  Music: ["oklch(0.7 0.2 300)", "oklch(0.6 0.16 30)"],
  default: ["oklch(0.5 0.12 60)", "oklch(0.35 0.1 350)"],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function posterGradient(movie: { title: string; genres: string[] }): {
  background: string;
  angle: number;
} {
  const primary = movie.genres[0] ?? "default";
  const [a, b] = GENRE_PALETTE[primary] ?? GENRE_PALETTE.default;
  const hash = hashString(movie.title);
  const angle = hash % 360;
  return { angle, background: `linear-gradient(${angle}deg, ${a}, ${b})` };
}

interface MoviePosterProps {
  movie: Pick<MovieRecord, "externalId" | "title" | "genres" | "releaseDate" | "posterPath">;
  className?: string;
  showTitle?: boolean;
  rounded?: "sm" | "md" | "lg";
}

export function MoviePoster({
  movie,
  className,
  showTitle = true,
  rounded = "lg",
}: MoviePosterProps) {
  const { background } = useMemo(() => posterGradient(movie), [movie]);
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "";

  const radius = rounded === "lg" ? "rounded-xl" : rounded === "md" ? "rounded-lg" : "rounded-md";

  if (movie.posterPath) {
    // Production mode with TMDB imagery.
    return (
      <div className={cn("relative aspect-[2/3] overflow-hidden", radius, className)}>
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
          alt={`Poster for ${movie.title}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden flex flex-col justify-between p-3",
        radius,
        className
      )}
      style={{ background }}
      role="img"
      aria-label={`Poster for ${movie.title}`}
    >
      {/* subtle film-grain / vignette */}
      <div
        className="absolute inset-0 opacity-50 mix-blend-soft-light pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 10%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(120% 80% at 80% 90%, rgba(0,0,0,0.45), transparent 60%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/80">
          MoodFlix
        </span>
        {movie.genres[0] && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/80 bg-black/20 rounded px-1.5 py-0.5">
            {movie.genres[0]}
          </span>
        )}
      </div>
      {showTitle && (
        <div className="relative">
          <div className="text-white/70 text-[10px] uppercase tracking-widest mb-1">
            {year}
          </div>
          <h3 className="text-white font-semibold leading-tight drop-shadow-sm line-clamp-4 text-lg">
            {movie.title}
          </h3>
        </div>
      )}
    </div>
  );
}
