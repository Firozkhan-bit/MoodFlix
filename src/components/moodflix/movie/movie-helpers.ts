/**
 * MoodFlix — small display helpers for movie metadata.
 */
import type { MovieRecord } from "@/lib/recommendation/types";

export function formatRuntime(minutes: number): string {
  if (!minutes || minutes <= 0) return "Runtime unknown";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatYear(date: string | null): string {
  if (!date) return "—";
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? "—" : String(y);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function movieYear(movie: MovieRecord): number | null {
  if (!movie.releaseDate) return null;
  const y = new Date(movie.releaseDate).getFullYear();
  return Number.isNaN(y) ? null : y;
}

/** Match percentage for display, capped 0..100 with a floor for visual nicety. */
export function matchPercent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Color class for a content certification badge. */
export function certificationTone(cert: string | null): string {
  if (!cert) return "bg-white/10 text-white/70 border-white/10";
  const c = cert.toUpperCase();
  if (["G", "U", "TV-Y", "TV-G", "AL"].includes(c))
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (["PG", "TV-Y7", "UA", "6"].includes(c))
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (["PG-13", "12", "12A", "TV-14", "13+"].includes(c))
    return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  if (["R", "15", "16", "18", "18+", "A", "TV-MA", "NC-17"].includes(c))
    return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  return "bg-white/10 text-white/70 border-white/10";
}
