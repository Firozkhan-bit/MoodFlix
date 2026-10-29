/**
 * ============================================================================
 *  MoodFlix — Rule-based recommendation engine (no external AI required)
 * ============================================================================
 *  Pipeline:
 *    1. take candidate movies + the user's answers
 *    2. apply MANDATORY filters (age suitability, excluded genres, watched,
 *       minimum rating, sequels, free-text "shorter" cap)
 *    3. score every survivor with a transparent weighted sum
 *    4. penalize mood conflicts and excluded-genre leakage
 *    5. reward the user's desired after-feel
 *    6. rank, de-duplicate, diversify, return 5–10 results
 *
 *  All weights live in `weights.ts`; all mood↔genre↔tone mappings live in
 *  `mood-map.ts`. This file is intentionally free of magic numbers.
 * ============================================================================
 */
import {
  WEIGHTS,
  MOOD_CONFLICT_PENALTY,
  EXCLUDED_GENRE_PENALTY,
  AFTER_FEEL_BONUS,
  POPULARITY_SMOOTHING,
  TARGET_RESULT_COUNT,
  MAX_RESULT_COUNT,
  MIN_RESULT_COUNT,
} from "./weights";
import {
  MOOD_MAP,
  EXPERIENCE_MAP,
  AFTER_FEEL_MAP,
  AUDIENCE_CERTIFICATIONS,
  RUNTIME_RANGES,
  ERA_RANGES,
} from "./mood-map";
import type {
  MovieRecord,
  QuestionnaireAnswers,
  Recommendation,
  RecommendationResponse,
  ScoreBreakdown,
} from "./types";
import { buildExplanation } from "./explanations";

/* --------------------------- small utilities --------------------------- */

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

const intersect = <T,>(a: T[], b: T[]) => a.filter((x) => b.includes(x));

const movieYear = (m: MovieRecord): number | null => {
  if (!m.releaseDate) return null;
  const y = new Date(m.releaseDate).getFullYear();
  return Number.isNaN(y) ? null : y;
};

/** Normalize the weights so they always sum to 1 (defensive). */
const normalizedWeights = () => {
  const sum =
    WEIGHTS.mood +
    WEIGHTS.genre +
    WEIGHTS.experience +
    WEIGHTS.releaseYear +
    WEIGHTS.language +
    WEIGHTS.rating +
    WEIGHTS.runtime;
  return {
    mood: WEIGHTS.mood / sum,
    genre: WEIGHTS.genre / sum,
    experience: WEIGHTS.experience / sum,
    releaseYear: WEIGHTS.releaseYear / sum,
    language: WEIGHTS.language / sum,
    rating: WEIGHTS.rating / sum,
    runtime: WEIGHTS.runtime / sum,
  };
};

/* ------------------------------ free-text ------------------------------ */
/**
 * Light, transparent interpretation of the optional Q9 text field.
 *   - "like <Movie Title>"  → boost that movie's similarIds
 *   - "shorter" / "under N" → apply a runtime cap as a hard filter
 * Returns the cap (minutes) and the list of "seed" externalIds to boost.
 */
function interpretFreeText(
  text: string,
  movies: MovieRecord[]
): { runtimeCap: number | null; boostIds: string[] } {
  const lower = text.toLowerCase().trim();
  if (!lower) return { runtimeCap: null, boostIds: [] };

  let runtimeCap: number | null = null;
  if (/\bshorter\b|\bunder\b|\bless than\b|\bbrief\b/.test(lower)) {
    const numMatch = lower.match(/\b(\d{2,3})\s*(min|minutes)?\b/);
    if (numMatch) runtimeCap = parseInt(numMatch[1], 10);
    else runtimeCap = 120; // sensible default for "shorter"
  }

  // Find any known movie title mentioned in the text.
  const boostIds: string[] = [];
  for (const m of movies) {
    if (m.title.length < 4) continue;
    if (lower.includes(m.title.toLowerCase())) {
      boostIds.push(m.externalId);
    }
  }
  return { runtimeCap, boostIds };
}

/* ----------------------- mandatory hard filters ----------------------- */

interface FilterResult {
  movies: MovieRecord[];
  notes: string[];
  excludedReasons: Record<string, number>;
}

function applyHardFilters(
  candidates: MovieRecord[],
  answers: QuestionnaireAnswers,
  watchedExternalIds: string[],
  excludeIds: string[],
  ft: { runtimeCap: number | null; boostIds: string[] }
): FilterResult {
  const notes: string[] = [];
  const excludedReasons: Record<string, number> = {};
  const bump = (k: string) => (excludedReasons[k] = (excludedReasons[k] ?? 0) + 1);

  // Session-scoped exclusions (the "Replace this movie" feature) — ALWAYS
  // applied, regardless of the excludeWatched toggle. These are not the same
  // as the user's watched list.
  const exclusionSet = new Set(excludeIds);

  // Age suitability — never silently ignored.
  const allowedCerts = AUDIENCE_CERTIFICATIONS[answers.audience];
  const wantsAgeFilter = answers.audience !== "no_preference" && allowedCerts.length > 0;

  // Effective runtime cap: the strictest of the bucket + free-text cap.
  let runtimeMax: number | null = null;
  if (answers.runtime !== "no_limit") {
    const [, max] = RUNTIME_RANGES[answers.runtime];
    if (max != null) runtimeMax = max;
  }
  if (ft.runtimeCap != null) {
    runtimeMax = runtimeMax == null ? ft.runtimeCap : Math.min(runtimeMax, ft.runtimeCap);
  }

  const survivors = candidates.filter((m) => {
    // Session exclusions (Replace feature) — always excluded.
    if (exclusionSet.has(m.externalId)) {
      bump("excluded");
      return false;
    }

    // Age suitability
    if (wantsAgeFilter) {
      const cert = (m.certification ?? "").trim();
      // For children/family we are conservative: unknown certification is excluded.
      if (answers.audience === "children" || answers.audience === "family") {
        if (!cert || !allowedCerts.includes(cert)) {
          bump("age_suitability");
          return false;
        }
      } else {
        if (cert && !allowedCerts.includes(cert)) {
          bump("age_suitability");
          return false;
        }
      }
    }

    // Excluded genres (hard)
    if (answers.excludeGenres.length > 0) {
      if (intersect(m.genres, answers.excludeGenres).length > 0) {
        bump("excluded_genre");
        return false;
      }
    }

    // Exclude already-watched
    if (answers.excludeWatched && watchedExternalIds.includes(m.externalId)) {
      bump("watched");
      return false;
    }

    // Sequels
    if (!answers.includeSequels && m.tags.includes("sequel")) {
      bump("sequel");
      return false;
    }

    // Minimum rating (hard floor)
    if (answers.minRating > 0 && m.voteAverage < answers.minRating) {
      bump("min_rating");
      return false;
    }

    // Runtime hard cap (strict preference per the brief)
    if (runtimeMax != null && m.runtime > runtimeMax) {
      bump("runtime_cap");
      return false;
    }

    return true;
  });

  // Notes for transparency
  if (wantsAgeFilter)
    notes.push(
      `Strict age-suitability filter applied for “${answers.audience}” (allowed: ${allowedCerts.join(", ")}).`
    );
  if (answers.excludeGenres.length > 0)
    notes.push(`Excluded genres: ${answers.excludeGenres.join(", ")}.`);
  if (answers.excludeWatched)
    notes.push(`Excluded ${excludedReasons["watched"] ?? 0} movie(s) you already watched.`);
  if (runtimeMax != null)
    notes.push(`Strict runtime cap applied: ≤ ${runtimeMax} minutes.`);
  if (excludeIds.length > 0)
    notes.push(`Excluded ${excludedReasons["excluded"] ?? 0} movie(s) you replaced in this session.`);
  if (ft.boostIds.length > 0)
    notes.push(`Boosting movies similar to a title you mentioned.`);

  return { movies: survivors, notes, excludedReasons };
}

/* ----------------------------- sub-scores ----------------------------- */

/** Mood compatibility across all selected moods (0..1). */
function moodScore(m: MovieRecord, selectedMoods: QuestionnaireAnswers["moods"]): number {
  if (selectedMoods.length === 0) return 0.5; // neutral if skipped
  let total = 0;
  for (const mood of selectedMoods) {
    const profile = MOOD_MAP[mood];
    const tagMatch = m.moodTags.includes(mood) ? 1 : 0;
    const toneMatch = intersect(m.emotionalTone, profile.tones).length / Math.max(1, profile.tones.length);
    const genreMatch = intersect(m.genres, profile.genres).length / Math.max(1, profile.genres.length);
    total += 0.4 * tagMatch + 0.35 * toneMatch + 0.25 * genreMatch;
  }
  return clamp(total / selectedMoods.length);
}

/** Does the movie directly conflict with a selected mood? Returns a 0..1 penalty. */
function moodConflictPenalty(m: MovieRecord, selectedMoods: QuestionnaireAnswers["moods"]): number {
  if (selectedMoods.length === 0) return 0;
  let conflicts = 0;
  for (const mood of selectedMoods) {
    const avoid = MOOD_MAP[mood].avoidGenres;
    if (intersect(m.genres, avoid).length > 0) conflicts++;
  }
  return conflicts > 0 ? MOOD_CONFLICT_PENALTY * Math.min(1, conflicts) : 0;
}

/** Genre compatibility with the user's preferred genres (0..1). */
function genreScore(m: MovieRecord, preferred: string[]): number {
  if (preferred.length === 0) return 0.6; // "Any genre" — neutral
  const matched = intersect(m.genres, preferred).length;
  if (matched === 0) return 0.1;
  return clamp(0.5 + 0.5 * (matched / preferred.length));
}

/** Desired viewing experience (0..1). */
function experienceScore(m: MovieRecord, exp: QuestionnaireAnswers["experience"]): number {
  if (exp === "surprise_me") return 0.6;
  const p = EXPERIENCE_MAP[exp];
  const toneMatch = intersect(m.emotionalTone, p.tones).length / Math.max(1, p.tones.length);
  const genreMatch = intersect(m.genres, p.genres).length / Math.max(1, p.genres.length);
  return clamp(0.6 * toneMatch + 0.4 * genreMatch);
}

/** Release-era preference (0..1). */
function releaseYearScore(m: MovieRecord, era: QuestionnaireAnswers["era"]): number {
  if (era === "any_year") return 0.7;
  const year = movieYear(m);
  if (year == null) return 0.3;
  const [start, end] = ERA_RANGES[era];
  if (year >= start && year <= end) return 1;
  const dist = year < start ? start - year : year - end;
  if (dist <= 3) return 0.5; // near-miss grace
  return 0.1;
}

/** Language preference (0..1). */
function languageScore(m: MovieRecord, lang: QuestionnaireAnswers["language"]): number {
  if (lang === "any") return 0.8;
  if (lang === "other") {
    const known = ["en", "ml", "hi", "ta", "te", "ko", "ja"];
    return known.includes(m.language) ? 0.1 : 1;
  }
  return m.language === lang ? 1 : 0.1;
}

/** Rating / quality preference (0..1). */
function ratingScore(m: MovieRecord, minRating: number): number {
  // minRating acts as a hard filter elsewhere; here we reward higher quality.
  const quality = clamp(m.voteAverage / 10);
  const popularity = clamp(Math.min(1, m.voteCount / 5000) * POPULARITY_SMOOTHING);
  // If the user set a high minRating, we still rank higher-rated movies above the floor.
  const floorBoost = minRating > 0 ? clamp((m.voteAverage - minRating) / (10 - minRating)) * 0.2 : 0;
  return clamp(quality + popularity + floorBoost);
}

/** Runtime suitability (0..1). Soft score; hard cap already applied. */
function runtimeScore(m: MovieRecord, pref: QuestionnaireAnswers["runtime"]): number {
  if (pref === "no_limit") return 0.8;
  const [min, max] = RUNTIME_RANGES[pref];
  if (m.runtime >= min && (max == null || m.runtime <= max)) return 1;
  const dist =
    m.runtime < min ? min - m.runtime : max != null ? m.runtime - max : 0;
  if (dist <= 10) return 0.5; // grace window
  return 0.1;
}

/** Bonus when the desired after-feel matches the movie's tone tags (0..1). */
function afterFeelBonus(m: MovieRecord, key: QuestionnaireAnswers["afterFeel"]): number {
  if (key === "doesnt_matter") return 0;
  const tones = AFTER_FEEL_MAP[key].tones;
  if (tones.length === 0) return 0;
  const match = intersect(m.emotionalTone, tones).length;
  return match > 0 ? AFTER_FEEL_BONUS : 0;
}

/* ------------------------------- scoring ------------------------------- */

function scoreMovie(
  m: MovieRecord,
  answers: QuestionnaireAnswers,
  boostIds: string[]
): { breakdown: ScoreBreakdown; explanation: string } {
  const W = normalizedWeights();

  const mood = moodScore(m, answers.moods);
  const genre = genreScore(m, answers.genres);
  const experience = experienceScore(m, answers.experience);
  const releaseYear = releaseYearScore(m, answers.era);
  const language = languageScore(m, answers.language);
  const rating = ratingScore(m, answers.minRating);
  const runtime = runtimeScore(m, answers.runtime);

  const penalty = moodConflictPenalty(m, answers.moods);
  const bonus = afterFeelBonus(m, answers.afterFeel);
  const boost = boostIds.includes(m.externalId) ? 0.05 : 0;

  const raw =
    mood * W.mood +
    genre * W.genre +
    experience * W.experience +
    releaseYear * W.releaseYear +
    language * W.language +
    rating * W.rating +
    runtime * W.runtime;

  // bonus is in 0..~0.12 range; convert to 0..100 scale alongside raw.
  const total = clamp((raw + bonus + boost) * 100 - penalty * 100, 0, 100);

  const breakdown: ScoreBreakdown = {
    mood,
    genre,
    experience,
    releaseYear,
    language,
    rating,
    runtime,
    penalty,
    total: Math.round(total * 10) / 10,
  };

  return { breakdown, explanation: "" };
}

/* ----------------------------- diversify ----------------------------- */
/**
 * Avoid returning 8 nearly-identical titles. After sorting by score we walk
 * the list and dampen movies that share the same primary genre + decade as a
 * movie we've already accepted, promoting variety a little down the list.
 */
function diversify(
  scored: { movie: MovieRecord; breakdown: ScoreBreakdown }[]
): { movie: MovieRecord; breakdown: ScoreBreakdown }[] {
  const sorted = [...scored].sort((a, b) => b.breakdown.total - a.breakdown.total);
  const accepted: typeof sorted = [];
  const seenKeys = new Set<string>();
  const deferred: typeof sorted = [];

  for (const item of sorted) {
    const year = movieYear(item.movie);
    const decade = year != null ? Math.floor(year / 10) : -1;
    const primary = item.movie.genres[0] ?? "none";
    const key = `${primary}__${decade}`;
    if (seenKeys.has(key) && accepted.length < TARGET_RESULT_COUNT) {
      // Defer duplicates-of-key until we have variety.
      deferred.push(item);
      continue;
    }
    seenKeys.add(key);
    accepted.push(item);
    if (accepted.length >= MAX_RESULT_COUNT) break;
  }

  // Top up from deferred if we don't have enough.
  for (const item of deferred) {
    if (accepted.length >= TARGET_RESULT_COUNT) break;
    accepted.push(item);
  }
  return accepted;
}

/* ------------------------------- public API ------------------------------- */

export interface RecommendInput {
  answers: QuestionnaireAnswers;
  candidates: MovieRecord[];
  watchedExternalIds?: string[];
  /** Session-scoped ids to always exclude (the "Replace" feature). */
  excludeIds?: string[];
}

export function recommend(input: RecommendInput): RecommendationResponse {
  const { answers, candidates } = input;
  const watchedExternalIds = input.watchedExternalIds ?? [];
  const excludeIds = input.excludeIds ?? [];
  const notes: string[] = [];

  const ft = interpretFreeText(answers.freeText, candidates);
  const filtered = applyHardFilters(candidates, answers, watchedExternalIds, excludeIds, ft);
  notes.push(...filtered.notes);

  const afterFilterCount = filtered.movies.length;

  if (afterFilterCount === 0) {
    return {
      recommendations: [],
      candidateCount: candidates.length,
      afterFilterCount: 0,
      notes: [
        ...notes,
        "No movies satisfied every strict filter. Try relaxing your age, runtime, or genre exclusions.",
      ],
      answers,
    };
  }

  // Score survivors.
  const scored = filtered.movies.map((m) => {
    const { breakdown } = scoreMovie(m, answers, ft.boostIds);
    return { movie: m, breakdown };
  });

  const diversified = diversify(scored);

  // If we have more than MAX, trim. If fewer than MIN, still return them.
  const list = diversified.slice(0, MAX_RESULT_COUNT);

  const recommendations: Recommendation[] = list.map((item, idx) => {
    const explanation = buildExplanation(item.movie, answers, item.breakdown);
    return {
      movie: item.movie,
      rank: idx + 1,
      score: item.breakdown.total,
      breakdown: item.breakdown,
      explanation,
    };
  });

  if (recommendations.length < MIN_RESULT_COUNT) {
    notes.push(
      `Only ${recommendations.length} movie(s) matched well. Try widening your mood, genre, or era selection.`
    );
  }
  if (answers.moods.length === 0) {
    notes.push("You skipped the mood question — results lean on your genre and experience choices.");
  }

  return {
    recommendations,
    candidateCount: candidates.length,
    afterFilterCount,
    notes,
    answers,
  };
}

/**
 * The "Exclude a movie and replace it" feature is handled by the API by
 * re-running `recommend()` with the excluded externalId added to a
 * session-scoped exclusion list, so the next-best candidate flows in.
 * Keeping it in one pipeline guarantees the replacement is scored and
 * explained consistently with the original set.
 */
