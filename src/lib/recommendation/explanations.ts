/**
 * MoodFlix — Explanation generator.
 *
 * Builds a short, human-readable "why this matches" string for every
 * recommendation, referencing the user's actual answers and the movie's
 * real metadata. Never invents facts, ratings, or availability — it only
 * restates data the engine already used to score the movie.
 */
import { MOOD_MAP, EXPERIENCE_MAP, AFTER_FEEL_MAP, RUNTIME_RANGES, ERA_RANGES } from "./mood-map";
import type { MovieRecord, QuestionnaireAnswers, ScoreBreakdown } from "./types";

const runtimeLabel = (pref: QuestionnaireAnswers["runtime"]): string | null => {
  if (pref === "no_limit") return null;
  const [min, max] = RUNTIME_RANGES[pref];
  if (max == null) return `over ${min} minutes`;
  return `${min}–${max} minutes`;
};

const eraLabel = (era: QuestionnaireAnswers["era"]): string | null => {
  if (era === "any_year") return null;
  const [start, end] = ERA_RANGES[era];
  if (era === "before_1980") return "before 1980";
  if (era === "2020_onwards") return "released in 2020 or later";
  return `released between ${start} and ${end}`;
};

const languageLabel = (lang: string): string | null => {
  if (lang === "any" || lang === "other") return null;
  const names: Record<string, string> = {
    en: "English", ml: "Malayalam", hi: "Hindi", ta: "Tamil", te: "Telugu",
    ko: "Korean", ja: "Japanese",
  };
  return names[lang] ?? null;
};

/**
 * Build the explanation. We collect clauses in order and join them so the
 * sentence always reads naturally regardless of which questions the user
 * answered.
 */
export function buildExplanation(
  movie: MovieRecord,
  answers: QuestionnaireAnswers,
  breakdown: ScoreBreakdown
): string {
  const clauses: string[] = [];

  // Lead with mood if it scored well.
  if (answers.moods.length > 0 && breakdown.mood >= 0.5) {
    const labels = answers.moods.map((m) => MOOD_MAP[m].label.toLowerCase());
    clauses.push(`matches your “${labels.join(" / ")}” mood`);
  }

  // Experience.
  if (answers.experience && answers.experience !== "surprise_me" && breakdown.experience >= 0.4) {
    clauses.push(`feels ${EXPERIENCE_MAP[answers.experience].label.toLowerCase()}`);
  }

  // Genres the user wants that the movie has.
  if (answers.genres.length > 0) {
    const matched = movie.genres.filter((g) => answers.genres.includes(g));
    if (matched.length > 0) {
      clauses.push(`is a ${matched.slice(0, 2).join(" / ").toLowerCase()} film`);
    }
  } else if (movie.genres.length > 0) {
    clauses.push(`is a ${movie.genres.slice(0, 2).join(" / ").toLowerCase()} film`);
  }

  // Runtime preference.
  const rl = runtimeLabel(answers.runtime);
  if (rl) {
    const within =
      answers.runtime === "no_limit"
        ? false
        : (() => {
            const [min, max] = RUNTIME_RANGES[answers.runtime];
            return movie.runtime >= min && (max == null || movie.runtime <= max);
          })();
    clauses.push(within ? `fits your ${rl} window (${movie.runtime} min)` : `runs ${movie.runtime} minutes`);
  } else {
    clauses.push(`runs ${movie.runtime} minutes`);
  }

  // Era.
  const el = eraLabel(answers.era);
  if (el) {
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
    if (year == null) {
      clauses.push(el);
    } else if (answers.era !== "any_year") {
      const [start, end] = ERA_RANGES[answers.era];
      const inRange = year >= start && year <= end;
      clauses.push(
        inRange
          ? `${el} (${year})`
          : `released in ${year} (just outside your ${el})`
      );
    } else {
      clauses.push(`released in ${year}`);
    }
  }

  // Language.
  const ll = languageLabel(answers.language);
  if (ll && movie.language === answers.language) {
    clauses.push(`in ${ll}`);
  }

  // Rating / quality.
  if (breakdown.rating >= 0.7) {
    clauses.push(`has a strong audience rating (${movie.voteAverage.toFixed(1)}/10 from ${movie.voteCount.toLocaleString()} votes)`);
  } else if (answers.minRating > 0) {
    clauses.push(`meets your ${answers.minRating.toFixed(1)}+ rating floor (${movie.voteAverage.toFixed(1)}/10)`);
  }

  // After-feel.
  if (answers.afterFeel !== "doesnt_matter" && breakdown.penalty === 0) {
    const af = AFTER_FEEL_MAP[answers.afterFeel].label.toLowerCase();
    clauses.push(`should leave you feeling ${af}`);
  }

  // Free-text mention.
  if (answers.freeText && answers.freeText.trim().length > 0) {
    clauses.push(`echoes what you described (“${answers.freeText.trim().slice(0, 60)}”)`);
  }

  // Compose: "Recommended because it matches your mood, is a drama film, ..."
  const subject = `“${movie.title}”`;
  const body = clauses.join(", ");
  let sentence = `Recommended because ${subject} ${body}.`;

  // Conflict note (honest).
  if (breakdown.penalty > 0) {
    sentence += " It slightly conflicts with one of your moods, so it ranked lower.";
  }

  return sentence;
}
