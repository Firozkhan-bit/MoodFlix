/**
 * MoodFlix — TMDB service module (optional).
 *
 * If `TMDB_API_KEY` is set in the environment, this module can fetch real
 * movie metadata from The Movie Database. If the key is absent (the default
 * in this sandbox), every function returns null/empty and the movie service
 * falls back to the curated local sample dataset (`sample-movies.ts`).
 *
 * The engine NEVER depends on TMDB being available — it scores whatever
 * MovieRecord list it is handed.
 */
import { TMDB_BASE_URL } from "@/lib/recommendation/weights";
import type { MovieRecord, MoodKey } from "@/lib/recommendation/types";

const apiKey = process.env.TMDB_API_KEY?.trim();

export function isTmdbConfigured(): boolean {
  return !!apiKey;
}

/** Map a TMDB genre id to our normalized genre name. */
const TMDB_GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  14: "Fantasy",
  27: "Horror",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10751: "Family",
  10402: "Music",
  10770: "TV Movie",
};

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  original_language: string;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  certification?: string | null;
  credits?: { cast: { name: string }[]; crew: { name: string; job: string }[] };
  videos?: { results: { site: string; key: string; type: string }[] };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!apiKey) return null;
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), {
      // Next.js 16 fetch caching
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Convert a raw TMDB movie object into our normalized MovieRecord.
 * Mood tags are derived conservatively from genres/keywords since we do not
 * invent them — production deployments should maintain a richer local map.
 */
export function tmdbToMovieRecord(raw: TmdbMovie): MovieRecord {
  const genres = (raw.genres ?? []).map((g) => TMDB_GENRE_NAMES[g.id] ?? g.name);
  const director =
    raw.credits?.crew.find((c) => c.job === "Director")?.name ?? null;
  const cast = (raw.credits?.cast ?? []).slice(0, 8).map((c) => c.name);
  const trailer =
    raw.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    )?.key ?? null;

  // Conservative mood inference from genres only (documented, not invented).
  const moodTags: MoodKey[] = [];
  if (genres.includes("Comedy")) moodTags.push("happy_energetic", "good_laugh");
  if (genres.includes("Horror")) moodTags.push("dark_mysterious");
  if (genres.includes("Romance")) moodTags.push("romantic");
  if (genres.includes("Science Fiction") || genres.includes("Mystery"))
    moodTags.push("mind_bending", "bored_curious");
  if (genres.includes("Drama")) moodTags.push("sad_emotional");

  return {
    externalId: `tmdb-${raw.id}`,
    title: raw.title,
    overview: raw.overview ?? "",
    releaseDate: raw.release_date ?? null,
    runtime: raw.runtime ?? 0,
    genres,
    language: raw.original_language ?? "en",
    languageName: languageName(raw.original_language ?? "en"),
    certification: raw.certification ?? null,
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    director,
    cast,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer}` : null,
    moodTags,
    emotionalTone: [],
    similarIds: [],
    tags: [],
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    isLocal: false,
  };
}

function languageName(code: string): string {
  const names: Record<string, string> = {
    en: "English", ml: "Malayalam", hi: "Hindi", ta: "Tamil", te: "Telugu",
    ko: "Korean", ja: "Japanese", es: "Spanish", fr: "French",
  };
  return names[code] ?? code.toUpperCase();
}

/** Discover popular movies (used to refresh the cache). Returns [] if no key. */
export async function discoverPopular(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<{ results: TmdbMovie[] }>("/discover/movie", {
    sort_by: "popularity.desc",
    page: String(page),
    "vote_count.gte": "200",
  });
  return data?.results ?? [];
}

/** Fetch full movie details (with credits + videos appended). */
export async function getMovieDetails(tmdbId: number): Promise<MovieRecord | null> {
  const data = await tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`, {
    append_to_response: "credits,videos,release_dates",
  });
  if (!data) return null;
  return tmdbToMovieRecord(data);
}
