/**
 * MoodFlix — movie data service.
 *
 * Provides candidate movies for the recommendation engine. Source order:
 *   1. Prisma `Movie` cache (populated by the seed script or TMDB refresh).
 *   2. Falls back to the curated local sample dataset if the cache is empty.
 *
 * All JSON fields from Prisma are coerced back into typed arrays here so the
 * rest of the app never deals with `unknown`.
 */
import { db } from "@/lib/db";
import { SAMPLE_MOVIES, SAMPLE_MOVIE_BY_ID } from "@/lib/data/sample-movies";
import type { MovieRecord } from "@/lib/recommendation/types";

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const asMoodKeyArray = (v: unknown): MovieRecord["moodTags"] =>
  Array.isArray(v) ? (v.filter((x): x is string => typeof x === "string") as MovieRecord["moodTags"]) : [];

/** Convert a Prisma Movie row into our typed MovieRecord. */
export function prismaMovieToRecord(row: {
  externalId: string;
  title: string;
  overview: string;
  releaseDate: Date | null;
  runtime: number;
  genres: unknown;
  language: string;
  languageName: string;
  certification: string | null;
  voteAverage: number;
  voteCount: number;
  director: string | null;
  cast: unknown;
  trailerUrl: string | null;
  moodTags: unknown;
  emotionalTone: unknown;
  similarIds: unknown;
  tags: unknown;
  posterPath: string | null;
  backdropPath: string | null;
  isLocal: boolean;
}): MovieRecord {
  return {
    externalId: row.externalId,
    title: row.title,
    overview: row.overview,
    releaseDate: row.releaseDate ? row.releaseDate.toISOString() : null,
    runtime: row.runtime,
    genres: asStringArray(row.genres),
    language: row.language,
    languageName: row.languageName,
    certification: row.certification,
    voteAverage: row.voteAverage,
    voteCount: row.voteCount,
    director: row.director,
    cast: asStringArray(row.cast),
    trailerUrl: row.trailerUrl,
    moodTags: asMoodKeyArray(row.moodTags),
    emotionalTone: asStringArray(row.emotionalTone),
    similarIds: asStringArray(row.similarIds),
    tags: asStringArray(row.tags),
    posterPath: row.posterPath,
    backdropPath: row.backdropPath,
    isLocal: row.isLocal,
  };
}

/** Return all candidate movies (DB cache, or sample fallback). */
export async function getCandidateMovies(): Promise<MovieRecord[]> {
  try {
    const rows = await db.movie.findMany();
    if (rows.length > 0) {
      return rows.map(prismaMovieToRecord);
    }
  } catch (err) {
    // If the DB isn't reachable, gracefully fall back to sample data.
    console.warn("[movie-service] DB read failed, using sample dataset:", err);
  }
  return SAMPLE_MOVIES;
}

/** Look up a single movie by externalId (DB first, then sample). */
export async function getMovieByExternalId(
  externalId: string
): Promise<MovieRecord | null> {
  try {
    const row = await db.movie.findUnique({ where: { externalId } });
    if (row) return prismaMovieToRecord(row);
  } catch (err) {
    console.warn("[movie-service] DB read failed:", err);
  }
  return SAMPLE_MOVIE_BY_ID.get(externalId) ?? null;
}

/** Look up several movies by externalId (preserves DB-or-sample fallback). */
export async function getMoviesByExternalIds(
  externalIds: string[]
): Promise<MovieRecord[]> {
  const fromSample = SAMPLE_MOVIES.filter((m) => externalIds.includes(m.externalId));
  let dbRows: MovieRecord[] = [];
  try {
    const rows = await db.movie.findMany({ where: { externalId: { in: externalIds } } });
    dbRows = rows.map(prismaMovieToRecord);
  } catch (err) {
    console.warn("[movie-service] DB read failed:", err);
  }
  // Prefer DB rows; fill gaps from sample.
  const seen = new Set(dbRows.map((r) => r.externalId));
  const merged = [...dbRows, ...fromSample.filter((m) => !seen.has(m.externalId))];
  return merged;
}

/** Seed the database with the curated sample dataset (idempotent upsert). */
export async function seedSampleMovies(): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;
  for (const m of SAMPLE_MOVIES) {
    const result = await db.movie.upsert({
      where: { externalId: m.externalId },
      create: {
        externalId: m.externalId,
        title: m.title,
        overview: m.overview,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        runtime: m.runtime,
        genres: m.genres,
        language: m.language,
        languageName: m.languageName,
        certification: m.certification,
        voteAverage: m.voteAverage,
        voteCount: m.voteCount,
        director: m.director,
        cast: m.cast,
        trailerUrl: m.trailerUrl,
        moodTags: m.moodTags,
        emotionalTone: m.emotionalTone,
        similarIds: m.similarIds,
        tags: m.tags,
        isLocal: true,
      },
      update: {
        title: m.title,
        overview: m.overview,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        runtime: m.runtime,
        genres: m.genres,
        language: m.language,
        languageName: m.languageName,
        certification: m.certification,
        voteAverage: m.voteAverage,
        voteCount: m.voteCount,
        director: m.director,
        cast: m.cast,
        trailerUrl: m.trailerUrl,
        moodTags: m.moodTags,
        emotionalTone: m.emotionalTone,
        similarIds: m.similarIds,
        tags: m.tags,
        isLocal: true,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) inserted++;
    else updated++;
  }
  return { inserted, updated };
}

/**
 * Make sure a movie row exists in the DB (used by watchlist/watched POST).
 * If the DB has it, return its internal id; otherwise create it from the
 * sample dataset if known. Returns null if the externalId is unknown.
 */
export async function ensureMovieExists(externalId: string): Promise<string | null> {
  const existing = await db.movie.findUnique({
    where: { externalId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const sample = SAMPLE_MOVIE_BY_ID.get(externalId);
  if (!sample) return null;

  const created = await db.movie.create({
    data: {
      externalId: sample.externalId,
      title: sample.title,
      overview: sample.overview,
      releaseDate: sample.releaseDate ? new Date(sample.releaseDate) : null,
      runtime: sample.runtime,
      genres: sample.genres,
      language: sample.language,
      languageName: sample.languageName,
      certification: sample.certification,
      voteAverage: sample.voteAverage,
      voteCount: sample.voteCount,
      director: sample.director,
      cast: sample.cast,
      trailerUrl: sample.trailerUrl,
      moodTags: sample.moodTags,
      emotionalTone: sample.emotionalTone,
      similarIds: sample.similarIds,
      tags: sample.tags,
      isLocal: true,
    },
    select: { id: true },
  });
  return created.id;
}
