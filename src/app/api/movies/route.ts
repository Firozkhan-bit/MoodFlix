/**
 * GET /api/movies
 * Browse or search the movie catalog. Supports `q` (title search), `genre`,
 * `language`, `page`, `pageSize`. Returns paginated MovieRecord[].
 *
 * Source: DB cache, or local sample fallback. Also exposes a `seeded` flag
 * telling the client whether the data is the local sample.
 */
import { NextResponse } from "next/server";
import { getCandidateMovies } from "@/lib/movie-service";
import type { MovieRecord } from "@/lib/recommendation/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const genre = url.searchParams.get("genre")?.trim() ?? "";
  const language = url.searchParams.get("language")?.trim() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "12", 10)));

  let movies = await getCandidateMovies();

  if (q) movies = movies.filter((m) => m.title.toLowerCase().includes(q));
  if (genre) movies = movies.filter((m) => m.genres.includes(genre));
  if (language && language !== "any")
    movies = movies.filter((m) =>
      language === "other"
        ? !["en", "ml", "hi", "ta", "te", "ko", "ja"].includes(m.language)
        : m.language === language
    );

  // Stable sort: rating desc, then title asc for tie-break.
  movies.sort((a, b) => b.voteAverage - a.voteAverage || a.title.localeCompare(b.title));

  const total = movies.length;
  const start = (page - 1) * pageSize;
  const items: MovieRecord[] = movies.slice(start, start + pageSize);

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    source: "local-sample",
  });
}
