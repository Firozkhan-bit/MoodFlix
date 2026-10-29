/**
 * MoodFlix — Recommendation engine shared types.
 *
 * These types are used by:
 *  - the questionnaire UI (answers the user gives)
 *  - the scoring engine (`engine.ts`)
 *  - the recommendation REST endpoint (`/api/recommendations`)
 *  - the explanation generator (`explanations.ts`)
 *
 * Keeping them in one place makes the data flow from the user's clicks
 * to the final ranked list easy to follow for a beginner reading the code.
 */

/* ----------------------- Questionnaire answers ----------------------- */

/** Keys for the selectable moods in Question 1 (see MOOD_MAP in `mood-map.ts`). */
export type MoodKey =
  | "happy_energetic"
  | "sad_emotional"
  | "stressed_relax"
  | "bored_curious"
  | "romantic"
  | "excited_adventurous"
  | "good_laugh"
  | "dark_mysterious"
  | "inspired"
  | "mind_bending";

/** Keys for the desired viewing experience (Question 2). */
export type ExperienceKey =
  | "light_comforting"
  | "funny_entertaining"
  | "emotional_meaningful"
  | "intense_suspense"
  | "action_packed"
  | "thought_provoking"
  | "scary"
  | "romantic_exp"
  | "surprise_me";

/** Runtime buckets in minutes (Question 3). */
export type RuntimePref =
  | "under_90"
  | "90_120"
  | "120_150"
  | "over_150"
  | "no_limit";

/** Release-era buckets (Question 4). */
export type EraPref =
  | "before_1980"
  | "1980_1999"
  | "2000_2009"
  | "2010_2019"
  | "2020_onwards"
  | "any_year";

/** Audience selector (Question 5). */
export type AudiencePref =
  | "children"
  | "family"
  | "teenagers"
  | "adults"
  | "no_preference";

/** Desired post-watch feeling (Question 8). */
export type AfterFeelKey =
  | "happier"
  | "relaxed"
  | "emotionally_moved"
  | "excited"
  | "thoughtful"
  | "inspired"
  | "surprised"
  | "a_little_scared"
  | "doesnt_matter";

/** The full answers object captured by the questionnaire. */
export interface QuestionnaireAnswers {
  moods: MoodKey[];                 // Q1 — multi-select
  experience: ExperienceKey;        // Q2 — single
  runtime: RuntimePref;             // Q3 — single
  era: EraPref;                     // Q4 — single
  audience: AudiencePref;           // Q5 — single
  genres: string[];                 // Q6 — multi-select ("Any genre" represented as [])
  language: string;                 // Q7 — single ("Any language" => "any")
  afterFeel: AfterFeelKey;          // Q8 — single
  // Q9 — optional advanced filters
  minRating: number;                // 0..10
  excludeGenres: string[];          // hard exclude
  excludeWatched: boolean;          // hard exclude already-watched
  includeSequels: boolean;           // default true
  freeText: string;                 // optional, "a movie like X but shorter"
}

/** A convenience factory for an empty/default answers object. */
export function defaultAnswers(): QuestionnaireAnswers {
  return {
    moods: [],
    experience: "thought_provoking",
    runtime: "no_limit",
    era: "any_year",
    audience: "no_preference",
    genres: [],
    language: "any",
    afterFeel: "doesnt_matter",
    minRating: 0,
    excludeGenres: [],
    excludeWatched: false,
    includeSequels: true,
    freeText: "",
  };
}

/* ---------------------------- Movie model ---------------------------- */
/**
 * The normalized movie shape used by the engine.
 * This mirrors what we store in the `Movie` Prisma model but with the
 * JSON arrays already parsed into real TypeScript arrays.
 */
export interface MovieRecord {
  externalId: string;
  title: string;
  overview: string;
  releaseDate: string | null; // ISO date or null
  runtime: number;            // minutes
  genres: string[];
  language: string;           // code e.g. "en"
  languageName: string;        // e.g. "English"
  certification: string | null; // e.g. "PG-13"
  voteAverage: number;         // 0..10
  voteCount: number;
  director: string | null;
  cast: string[];
  trailerUrl: string | null;
  moodTags: MoodKey[];         // which moods this movie suits
  emotionalTone: string[];    // free-form tone tags e.g. "uplifting"
  similarIds: string[];
  tags: string[];              // e.g. ["sequel","classic","indie","short"]
  posterPath?: string | null;
  backdropPath?: string | null;
  isLocal?: boolean;
}

/* --------------------------- Scoring output --------------------------- */

export interface ScoreBreakdown {
  mood: number;            // 0..1
  genre: number;           // 0..1
  experience: number;      // 0..1
  releaseYear: number;     // 0..1
  language: number;        // 0..1
  rating: number;          // 0..1
  runtime: number;         // 0..1
  penalty: number;         // 0..1 negative applied to total
  total: number;           // 0..100 weighted final score
}

export interface Recommendation {
  movie: MovieRecord;
  rank: number;
  score: number;          // 0..100
  breakdown: ScoreBreakdown;
  explanation: string;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  candidateCount: number;
  afterFilterCount: number;
  notes: string[];          // warnings / guidance e.g. "strict runtime limit applied"
  answers: QuestionnaireAnswers;
}
