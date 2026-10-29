/**
 * ============================================================================
 *  MoodFlix — Recommendation scoring weights
 * ============================================================================
 *  This is the ONE place to tune how much each preference influences the
 *  final compatibility score. The engine (`engine.ts`) imports these weights
 *  and never hard-codes its own.
 *
 *  Each weight is a fraction of 1.0. They should sum to 1.0 — the engine
 *  normalizes them defensively, but please keep them balanced.
 *
 *  Design rationale (matches the product brief):
 *   - Mood is the heart of MoodFlix, so it carries the biggest weight.
 *   - Genre is the next strongest signal for relevance.
 *   - Desired viewing experience is a strong emotional signal.
 *   - Release era, language, rating, and runtime fine-tune the ranking.
 *
 *  You can safely tweak these numbers and the engine will re-balance.
 * ============================================================================
 */
export const WEIGHTS = {
  mood: 0.3,        // 30% — mood + emotional-tone compatibility
  genre: 0.2,       // 20% — genre compatibility
  experience: 0.15, // 15% — desired viewing experience
  releaseYear: 0.1, // 10% — release-era preference
  language: 0.1,    // 10% — preferred language
  rating: 0.1,      // 10% — quality / rating preference
  runtime: 0.05,    // 5%  — runtime suitability
} as const;

/** How many recommendations to return when enough candidates exist. */
export const TARGET_RESULT_COUNT = 8;
export const MIN_RESULT_COUNT = 5;
export const MAX_RESULT_COUNT = 10;

/**
 * Hard penalty applied when a movie directly conflicts with the user's mood
 * (e.g. the user wants to relax but the movie is pure horror). Expressed as
 * a fraction subtracted from the 0..100 total.
 */
export const MOOD_CONFLICT_PENALTY = 0.35;

/**
 * Penalty for movies in an explicitly excluded genre. By design excluded
 * genres are usually filtered out entirely (hard filter), but if a movie
 * slips through (e.g. multi-genre), this dampens it instead of silently
 * dropping it.
 */
export const EXCLUDED_GENRE_PENALTY = 0.5;

/** Reward multiplier when the after-feel matches the movie's tone tags. */
export const AFTER_FEEL_BONUS = 0.12;

/** Small bonus for higher vote counts so we prefer widely-seen quality films. */
export const POPULARITY_SMOOTHING = 0.05;

/** TMDB endpoint base (used by the TMDB service module if a key is present). */
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMG_BASE = "https://image.tmdb.org/t/p";
