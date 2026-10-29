/**
 * MoodFlix — Questionnaire option lists.
 *
 * The single source of truth for what the user can pick in each step.
 * The API validates incoming answers against these lists, so the UI and the
 * backend can never disagree about what is selectable.
 */
import { MOOD_OPTIONS, EXPERIENCE_OPTIONS, AFTER_FEEL_OPTIONS } from "@/lib/recommendation/mood-map";
import type {
  MoodKey,
  ExperienceKey,
  RuntimePref,
  EraPref,
  AudiencePref,
  AfterFeelKey,
} from "@/lib/recommendation/types";

export const MOOD_QUESTION_OPTIONS = MOOD_OPTIONS;
export const EXPERIENCE_QUESTION_OPTIONS = EXPERIENCE_OPTIONS;
export const AFTER_FEEL_QUESTION_OPTIONS = AFTER_FEEL_OPTIONS;

export const RUNTIME_OPTIONS: { key: RuntimePref; label: string; hint: string }[] = [
  { key: "under_90", label: "Under 90 minutes", hint: "Quick watch" },
  { key: "90_120", label: "90–120 minutes", hint: "Standard length" },
  { key: "120_150", label: "120–150 minutes", hint: "A longer sit" },
  { key: "over_150", label: "More than 150 minutes", hint: "Epic length" },
  { key: "no_limit", label: "No time limit", hint: "Anything goes" },
];

export const ERA_OPTIONS: { key: EraPref; label: string }[] = [
  { key: "before_1980", label: "Classic cinema — before 1980" },
  { key: "1980_1999", label: "Retro — 1980 to 1999" },
  { key: "2000_2009", label: "2000 to 2009" },
  { key: "2010_2019", label: "2010 to 2019" },
  { key: "2020_onwards", label: "2020 onwards" },
  { key: "any_year", label: "Any year" },
];

export const AUDIENCE_OPTIONS: { key: AudiencePref; label: string; hint: string }[] = [
  { key: "children", label: "Children", hint: "Only G / U / TV-Y" },
  { key: "family", label: "Family", hint: "G / PG / U / AL" },
  { key: "teenagers", label: "Teenagers", hint: "Up to PG-13 / 12+" },
  { key: "adults", label: "Adults", hint: "Any rating" },
  { key: "no_preference", label: "Just me — no preference", hint: "No age filter" },
];

/** Genres selectable in Q6. Matches TMDB-style genre names used in the dataset. */
export const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
];

export const LANGUAGE_OPTIONS: { key: string; label: string; code: string }[] = [
  { key: "en", label: "English", code: "en" },
  { key: "ml", label: "Malayalam", code: "ml" },
  { key: "hi", label: "Hindi", code: "hi" },
  { key: "ta", label: "Tamil", code: "ta" },
  { key: "te", label: "Telugu", code: "te" },
  { key: "ko", label: "Korean", code: "ko" },
  { key: "ja", label: "Japanese", code: "ja" },
  { key: "other", label: "Other languages", code: "other" },
  { key: "any", label: "Any language", code: "any" },
];

/** Validation sets used by the API route. */
export const VALID_MOODS = MOOD_OPTIONS.map((o) => o.key) as MoodKey[];
export const VALID_EXPERIENCES = EXPERIENCE_OPTIONS.map((o) => o.key) as ExperienceKey[];
export const VALID_AFTERS = AFTER_FEEL_OPTIONS.map((o) => o.key) as AfterFeelKey[];
export const VALID_RUNTIMES = RUNTIME_OPTIONS.map((o) => o.key) as RuntimePref[];
export const VALID_ERAS = ERA_OPTIONS.map((o) => o.key) as EraPref[];
export const VALID_AUDIENCES = AUDIENCE_OPTIONS.map((o) => o.key) as AudiencePref[];
export const VALID_LANGUAGES = LANGUAGE_OPTIONS.map((o) => o.key);
export const VALID_GENRES = [...GENRE_OPTIONS];
