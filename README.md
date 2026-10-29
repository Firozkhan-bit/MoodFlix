# MoodFlix 🎬

**Find the movie that fits your mood.**

MoodFlix is a mood-based movie recommendation website. You answer a short,
friendly questionnaire about how you feel and what you're in the mood for, and
MoodFlix returns **5–10 personally matched movies** — each with a clear,
honest explanation of *why* it fits your answers.

It is powered by a **transparent, rule-based scoring engine** (no black box),
works fully offline with a curated sample dataset, and can switch to live TMDB
metadata when an API key is provided.

> **Note on the stack.** The original brief proposed React + Vite on the
> frontend and Python + Django on the backend. This implementation delivers
> the **same functionality** as a single, cohesive **Next.js 16 full-stack**
> app (frontend + API + database + recommendation engine in one project),
> which is easier to run, review, and maintain for a portfolio.

---

## ✨ Features

- **9-step interactive questionnaire** with progress indicator, jump-to-step,
  back/skip, and inline guidance. Collects mood, desired experience, runtime,
  era, audience, genres, language, after-feel, and optional advanced filters.
- **Transparent scoring engine** with configurable weights (mood 30%, genre
  20%, experience 15%, release-year 10%, language 10%, rating 10%, runtime 5%).
- **Mandatory hard filters** for age suitability, excluded genres, minimum
  rating, runtime cap, sequels, and already-watched titles — never silently
  ignored.
- **Personalized explanations** for every recommendation ("Recommended
  because…") built from the user's actual answers.
- **Movie details dialog** with poster, overview, director, cast,
  certification, trailer link (when available), and similar movies.
- **Accounts & watchlist** — register/log in to save a watchlist, mark movies
  as watched, and keep preferences. **Guests can get recommendations without
  an account.**
- **Sort, replace, and regenerate** — sort by best match / rating / year /
  runtime, exclude a movie to get a replacement, or generate a fresh set.
- **Cinematic, responsive dark UI** with accessible contrast, keyboard
  navigation, visible focus states, and a sticky footer.
- **Offline-first** — runs on a curated local dataset of 55+ films across 9
  languages and 7 decades. Optional TMDB integration.

---

## 🧱 Tech stack

| Layer        | Technology |
|--------------|------------|
| Framework    | Next.js 16 (App Router) + TypeScript 5 |
| Styling      | Tailwind CSS 4 + shadcn/ui (New York) |
| Database     | Prisma ORM + SQLite (Postgres-ready schema) |
| Auth         | NextAuth.js v4 (Credentials provider, JWT sessions) |
| Server state | TanStack Query |
| Client state | Zustand |
| Animation    | Framer Motion |
| Movie data    | Curated local sample dataset, optional TMDB API |

---

## 📁 Project structure

```
moodflix/  (repo root)
├── prisma/
│   └── schema.prisma              # User, Account, Session, Movie, WatchlistItem,
│                                 #   WatchedMovie, UserPreference, RecommendationSession
├── src/
│   ├── app/
│   │   ├── page.tsx              # Single user-facing route (view router)
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── globals.css           # Cinematic dark theme
│   │   └── api/                  # REST endpoints (see API docs below)
│   │       ├── auth/[...nextauth]/
│   │       ├── register/
│   │       ├── movies/  movies/[id]/
│   │       ├── recommendations/
│   │       ├── watchlist/  watchlist/[id]/
│   │       ├── watched/
│   │       ├── preferences/
│   │       └── seed/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── moodflix/             # Header, Footer, AppShell, AuthDialog,
│   │   │                         #   views/ (landing, questionnaire, results,
│   │   │                         #   watchlist, about), movie/ (poster, card,
│   │   │                         #   details dialog, match ring)
│   │   └── providers.tsx         # NextAuth SessionProvider + React Query
│   ├── hooks/                    # use-user-movies (watchlist/watched hooks)
│   └── lib/
│       ├── recommendation/      # ⭐ the engine
│       │   ├── types.ts           #   shared types
│       │   ├── weights.ts        #   ⭐ configurable scoring weights
│       │   ├── mood-map.ts       #   mood/experience → genre/tone mapping
│       │   ├── engine.ts         #   scoring + filtering + ranking
│       │   └── explanations.ts  #   "why this matches" generator
│       ├── data/
│       │   ├── sample-movies.ts  # curated offline dataset (55+ films)
│       │   └── options.ts        # questionnaire option lists + validation
│       ├── auth.ts               # NextAuth config
│       ├── password.ts           # scrypt hashing (no extra deps)
│       ├── tmdb.ts               # optional TMDB service (graceful fallback)
│       ├── movie-service.ts     # DB cache ↔ sample fallback
│       ├── api-client.ts        # typed fetch wrappers
│       └── store/moodflix-store.ts  # Zustand UI store
├── .env.example
└── package.json
```

---

## 🚀 Setup

### Prerequisites

- **Node.js 18+** (or **Bun**, which is used in this repo)
- That's it — SQLite is file-based, no separate database server needed.

### Install & run

```bash
# 1. Install dependencies
bun install            # or: npm install

# 2. Configure environment variables
cp .env.example .env   # then edit .env (set NEXTAUTH_SECRET)

# 3. Create the SQLite database + tables
bun run db:push        # or: npx prisma db push

# 4. (Optional) Generate the Prisma client
bun run db:generate    # usually done automatically by db:push

# 5. Start the dev server
bun run dev            # or: npm run dev
```

The app runs at **http://localhost:3000**. The sample movie dataset is seeded
automatically on first load (and is also served from memory as a fallback).

> **Windows users:** the same commands work in PowerShell/CMD if you use
> `npm` instead of `bun` (or install Bun via
> `powershell -c "irm bun.sh/install.ps1 | iex"`). There is only **one**
> server to start (`bun run dev`) — no separate frontend/backend processes.

### Environment variables (`.env`)

| Variable          | Required | Description |
|-------------------|----------|-------------|
| `DATABASE_URL`    | yes      | SQLite path, e.g. `file:./db/custom.db` |
| `NEXTAUTH_SECRET` | yes      | Random string for signing JWTs (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`    | yes      | App URL, `http://localhost:3000` in dev |
| `TMDB_API_KEY`    | no       | Optional. Enables live TMDB metadata. Blank = use sample data. |

---

## 🔌 API documentation

All endpoints are relative to the app root (e.g. `/api/movies`). JSON in/out.
Private endpoints return `401` without a valid session.

### Movies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/movies` | public | Browse/search. Query: `q`, `genre`, `language`, `page`, `pageSize`. Returns paginated `{ items, page, pageSize, total, totalPages, source }`. |
| `GET`  | `/api/movies/[id]` | public | Full movie details + resolved `similar` movies. `id` is the stable external id (e.g. `mf-3`). |

### Recommendations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/recommendations` | public | Submit questionnaire answers, receive ranked recommendations. Body: `{ answers, excludeIds?, save? }`. Returns `{ recommendations[], candidateCount, afterFilterCount, notes[], answers }`. Each recommendation has `movie`, `rank`, `score` (0–100), `breakdown`, and `explanation`. |

#### Example request

```jsonc
POST /api/recommendations
{
  "answers": {
    "moods": ["mind_bending"],
    "experience": "thought_provoking",
    "runtime": "90_120",
    "era": "2010_2019",
    "audience": "adults",
    "genres": ["Science Fiction"],
    "language": "any",
    "afterFeel": "thoughtful",
    "minRating": 0,
    "excludeGenres": ["Horror"],
    "excludeWatched": false,
    "includeSequels": true,
    "freeText": ""
  },
  "excludeIds": [],
  "save": true
}
```

### Watchlist (private)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/api/watchlist` | yes | List the user's watchlist. |
| `POST`   | `/api/watchlist` | yes | Add `{ externalId }`. Idempotent. |
| `DELETE` | `/api/watchlist/[id]` | yes | Remove a watchlist row (owner only). |

### Watched (private)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/watched` | yes | List watched movies. |
| `POST` | `/api/watched` | yes | Mark `{ externalId }` as watched. Idempotent. |

### Preferences (private)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/preferences` | yes | Saved preferences (or defaults). |
| `PUT` | `/api/preferences` | yes | Upsert `{ genres, languages, minRating, maxRuntime }`. |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/register` | `{ name?, email, password }` → creates an account. |
| `*`    | `/api/auth/*` | NextAuth handlers (login, session, etc.). |

### Seed

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/seed` | Upserts the curated sample dataset into the DB. Idempotent. |

---

## 🧠 The recommendation engine

The engine lives in `src/lib/recommendation/` and is intentionally readable.

### Pipeline

1. **Retrieve candidates** — from the Prisma `Movie` cache, or the in-memory
   sample dataset if the cache is empty.
2. **Apply mandatory hard filters** (never silently ignored):
   - Age suitability (conservative for children/family — unknown ratings excluded)
   - Excluded genres
   - Already-watched (when opted in)
   - Sequels (when opted out)
   - Minimum rating floor
   - Runtime cap (the bucket max, plus any free-text "shorter" cap)
   - Session exclusions (the "Replace" feature)
3. **Score each survivor** on 7 weighted criteria (see weights below).
4. **Penalize** mood conflicts (e.g. horror when you wanted to relax) and
   genre leakage.
5. **Reward** the desired after-feel and any free-text "like X" boost.
6. **Diversify** so the top results aren't all the same genre+decade.
7. **Rank** and return 5–10 results, each with a personalized explanation.

### Configurable weights (`src/lib/recommendation/weights.ts`)

| Criterion | Weight |
|-----------|--------|
| Mood & emotional tone | **30%** |
| Genre compatibility | 20% |
| Desired experience | 15% |
| Release era | 10% |
| Language | 10% |
| Rating & quality | 10% |
| Runtime suitability | 5% |

Tune these numbers in one file and the engine rebalances automatically.

### Mood → genre/tone mapping (`src/lib/recommendation/mood-map.ts`)

Every mood (Q1) and experience (Q2) maps to recommended genres, tone tags, and
genres to avoid. Movies also carry their own `moodTags` and `emotionalTone`,
so matching is direct and explainable — never invented from the title.

---

## 🎥 Movie data & TMDB

By default MoodFlix runs on a **curated local sample** of 55+ films across
English, Malayalam, Hindi, Tamil, Telugu, Korean, Japanese, and more.

**Honesty notes:**
- Titles, release years, runtimes, genres, directors, languages and
  certifications reflect well-known public information.
- `voteAverage` / `voteCount` are **approximate sample values** — clearly
  labeled in the UI as local sample data. They are overwritten with real
  TMDB numbers when a key is configured.
- `trailerUrl` is `null` in sample mode; the UI shows "trailer unavailable
  in the local sample dataset" rather than fabricating a link.
- We **never** claim a movie is available on a streaming service unless that
  has been verified through a supported data source.

### Enabling TMDB

1. Get a key at <https://www.themoviedb.org/settings/api>.
2. Set `TMDB_API_KEY` in `.env`.
3. Restart the server. The `lib/tmdb.ts` module will fetch real metadata,
   posters, cast, and trailers; `lib/movie-service.ts` caches them in the
   `Movie` table.

The engine never depends on TMDB being available — it scores whatever
`MovieRecord[]` it receives.

---

## 🔒 Security & reliability

- Passwords hashed with **scrypt** (Node built-in, no extra deps); never logged.
- Private endpoints (watchlist, watched, preferences) require a session.
- Watchlist rows are scoped to the authenticated user; deletes enforce ownership.
- All API inputs validated with **Zod** against the same option sets the UI uses.
- Prisma parameterized queries (no SQL injection).
- Graceful fallbacks: if the DB or TMDB is unreachable, the app still works on
  the in-memory sample dataset.
- Loading, error, empty-result, and retry states throughout the UI.

---

## ✅ Verification checklist

This project was verified end-to-end in the browser:

- [x] Landing page renders (hero, how-it-works, sample catalog, CTA).
- [x] Questionnaire: 9 steps, progress, jump-to-step, back/skip, validation hints.
- [x] Recommendations: 5–10 ranked results with match % and explanations.
- [x] Movie details dialog (poster, metadata, cast, director, similar, trailer note).
- [x] Sort by best/rating/year/runtime.
- [x] "Replace" a movie → excluded, replacement arrives.
- [x] Strict age filter for children (only G/U-rated titles).
- [x] Register + login (NextAuth credentials).
- [x] Add to watchlist → appears in Watchlist view (count updates).
- [x] Guest watchlist prompt.
- [x] Responsive (mobile nav, layouts) + sticky footer (short & long pages).
- [x] No console/runtime errors; ESLint clean.

---

## 📜 License

Sample movie metadata is used for educational/demo purposes only and is not
affiliated with any streaming service. MoodFlix code is MIT-licensed — use it
freely for your portfolio.
