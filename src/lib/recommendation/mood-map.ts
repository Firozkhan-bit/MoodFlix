/**
 * ============================================================================
 *  MoodFlix — Mood / experience → genre & tone mapping
 * ============================================================================
 *  This is the documented bridge between fuzzy human feelings ("I want
 *  something mind-bending") and concrete movie metadata (genres, tones).
 *
 *  Every mapping here is INTENTIONAL and explainable — the recommendation
 *  engine references these tables when it scores a movie, and the
 *  explanation generator uses them to tell the user *why* a movie matched.
 *
 *  Movie records carry their own `moodTags` and `emotionalTone` so the
 *  engine can match directly; these tables provide the genre fallbacks
 *  used when a movie's tags overlap with the chosen mood.
 * ============================================================================
 */
import type {
  MoodKey,
  ExperienceKey,
  AfterFeelKey,
  AudiencePref,
} from "./types";

interface MoodProfile {
  label: string;
  /** Genres that typically satisfy this mood. */
  genres: string[];
  /** Free-form tone tags the engine matches against `movie.emotionalTone`. */
  tones: string[];
  /** Genres that conflict with this mood (penalized). */
  avoidGenres: string[];
}

/**
 * The 10 moods from Question 1 of the questionnaire.
 * Keys match `MoodKey` in types.ts.
 */
export const MOOD_MAP: Record<MoodKey, MoodProfile> = {
  happy_energetic: {
    label: "Happy and energetic",
    genres: ["Comedy", "Music", "Adventure", "Animation"],
    tones: ["uplifting", "fun", "joyful", "energetic"],
    avoidGenres: ["Horror"],
  },
  sad_emotional: {
    label: "Sad or emotional",
    genres: ["Drama", "Romance"],
    tones: ["emotional", "moving", "tearjerker", "bittersweet"],
    avoidGenres: ["Comedy"],
  },
  stressed_relax: {
    label: "Stressed and looking to relax",
    genres: ["Animation", "Family", "Comedy", "Fantasy"],
    tones: ["comforting", "calm", "wholesome", "cozy"],
    avoidGenres: ["Horror", "Thriller"],
  },
  bored_curious: {
    label: "Bored and curious",
    genres: ["Mystery", "Science Fiction", "Thriller", "Adventure"],
    tones: ["intriguing", "curious", "twisty"],
    avoidGenres: [],
  },
  romantic: {
    label: "Romantic",
    genres: ["Romance", "Comedy", "Drama"],
    tones: ["romantic", "tender", "swoon"],
    avoidGenres: ["Horror"],
  },
  excited_adventurous: {
    label: "Excited and adventurous",
    genres: ["Action", "Adventure", "Science Fiction"],
    tones: ["thrilling", "adrenaline", "epic"],
    avoidGenres: [],
  },
  good_laugh: {
    label: "Looking for a good laugh",
    genres: ["Comedy"],
    tones: ["funny", "hilarious", "witty"],
    avoidGenres: ["Horror", "Drama"],
  },
  dark_mysterious: {
    label: "Want something dark or mysterious",
    genres: ["Mystery", "Thriller", "Horror", "Crime"],
    tones: ["dark", "moody", "noir", "eerie"],
    avoidGenres: ["Comedy", "Family"],
  },
  inspired: {
    label: "Want to feel inspired",
    genres: ["Drama", "Documentary", "Biography"],
    tones: ["inspiring", "uplifting", "triumphant"],
    avoidGenres: ["Horror"],
  },
  mind_bending: {
    label: "Want a mind-bending experience",
    genres: ["Science Fiction", "Mystery", "Thriller"],
    tones: ["mind-bending", "cerebral", "surreal", "complex"],
    avoidGenres: [],
  },
};

interface ExperienceProfile {
  label: string;
  genres: string[];
  tones: string[];
  avoidGenres: string[];
}

/** The 9 viewing experiences from Question 2. */
export const EXPERIENCE_MAP: Record<ExperienceKey, ExperienceProfile> = {
  light_comforting: {
    label: "Light and comforting",
    genres: ["Animation", "Family", "Comedy"],
    tones: ["comforting", "light", "wholesome"],
    avoidGenres: ["Horror", "Thriller"],
  },
  funny_entertaining: {
    label: "Funny and entertaining",
    genres: ["Comedy", "Adventure"],
    tones: ["funny", "entertaining", "witty"],
    avoidGenres: ["Horror"],
  },
  emotional_meaningful: {
    label: "Emotional and meaningful",
    genres: ["Drama", "Romance"],
    tones: ["emotional", "meaningful", "moving"],
    avoidGenres: ["Comedy"],
  },
  intense_suspense: {
    label: "Intense and suspense",
    genres: ["Thriller", "Mystery", "Crime"],
    tones: ["suspenseful", "tense", "gripping"],
    avoidGenres: ["Comedy", "Family"],
  },
  action_packed: {
    label: "Action-packed",
    genres: ["Action", "Adventure", "Science Fiction"],
    tones: ["action-packed", "thrilling"],
    avoidGenres: [],
  },
  thought_provoking: {
    label: "Thought-provoking",
    genres: ["Science Fiction", "Drama", "Mystery", "Documentary"],
    tones: ["thought-provoking", "cerebral", "mind-bending"],
    avoidGenres: [],
  },
  scary: {
    label: "Scary",
    genres: ["Horror", "Thriller"],
    tones: ["scary", "creepy", "dread"],
    avoidGenres: ["Comedy", "Family"],
  },
  romantic_exp: {
    label: "Romantic",
    genres: ["Romance", "Comedy", "Drama"],
    tones: ["romantic", "tender"],
    avoidGenres: ["Horror"],
  },
  surprise_me: {
    label: "Surprise me",
    genres: [],
    tones: [],
    avoidGenres: [],
  },
};

/** Maps "how do you want to feel afterward" (Q8) to tone tags we reward. */
export const AFTER_FEEL_MAP: Record<AfterFeelKey, { label: string; tones: string[] }> = {
  happier: { label: "Happier", tones: ["uplifting", "fun", "joyful", "wholesome"] },
  relaxed: { label: "Relaxed", tones: ["calm", "comforting", "cozy", "light"] },
  emotionally_moved: { label: "Emotionally moved", tones: ["emotional", "moving", "bittersweet"] },
  excited: { label: "Excited", tones: ["thrilling", "epic", "action-packed"] },
  thoughtful: { label: "Thoughtful", tones: ["thought-provoking", "cerebral"] },
  inspired: { label: "Inspired", tones: ["inspiring", "triumphant", "uplifting"] },
  surprised: { label: "Surprised", tones: ["twisty", "surreal", "mind-bending"] },
  a_little_scared: { label: "A little scared", tones: ["scary", "creepy", "eerie"] },
  doesnt_matter: { label: "It doesn't matter", tones: [] },
};

/**
 * Audience → acceptable content certifications (TMDB-style ratings).
 * Used by the engine as a HARD filter for age suitability.
 * We deliberately do not assume every movie with a rating is suitable for
 * every viewer; this is a conservative allow-list.
 */
export const AUDIENCE_CERTIFICATIONS: Record<AudiencePref, string[]> = {
  children: ["G", "TV-Y", "TV-Y7", "U", "AL"],
  family: ["G", "PG", "TV-Y", "TV-Y7", "TV-G", "U", "AL", "6"],
  teenagers: ["G", "PG", "PG-13", "TV-14", "12", "12A", "13+", "15", "16"],
  adults: [
    "G", "PG", "PG-13", "R", "NC-17", "TV-14", "TV-MA",
    "15", "16", "18", "18+", "A", "U", "UA", "AL",
  ],
  no_preference: [], // no filter
};

/** Runtime buckets → [min, max] minutes (max null = unbounded). */
export const RUNTIME_RANGES: Record<
  Exclude<import("./types").RuntimePref, "no_limit">,
  [number, number | null]
> = {
  under_90: [0, 90],
  "90_120": [90, 120],
  "120_150": [120, 150],
  over_150: [150, null],
};

/** Era buckets → [startYear, endYear] inclusive. */
export const ERA_RANGES: Record<
  Exclude<import("./types").EraPref, "any_year">,
  [number, number]
> = {
  before_1980: [1900, 1979],
  "1980_1999": [1980, 1999],
  "2000_2009": [2000, 2009],
  "2010_2019": [2010, 2019],
  "2020_onwards": [2020, 2100],
};

/** Helper: list all selectable mood keys + labels for the questionnaire UI. */
export const MOOD_OPTIONS = (Object.entries(MOOD_MAP) as [MoodKey, MoodProfile][]).map(
  ([key, profile]) => ({ key, label: profile.label })
);

/** Helper: list all selectable experience keys + labels. */
export const EXPERIENCE_OPTIONS = (
  Object.entries(EXPERIENCE_MAP) as [ExperienceKey, ExperienceProfile][]
).map(([key, profile]) => ({ key, label: profile.label }));

/** Helper: list all after-feel keys + labels. */
export const AFTER_FEEL_OPTIONS = (
  Object.entries(AFTER_FEEL_MAP) as [AfterFeelKey, { label: string; tones: string[] }][]
).map(([key, profile]) => ({ key, label: profile.label }));
