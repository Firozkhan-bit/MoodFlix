/**
 * GET /api/movies/[id]
 * Fetch full movie details, resolving `similarIds` into similar MovieRecord[].
 */
import { NextResponse } from "next/server";
import { getMovieByExternalId, getMoviesByExternalIds } from "@/lib/movie-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movie = await getMovieByExternalId(id);
  if (!movie) {
    return NextResponse.json({ error: "Movie not found." }, { status: 404 });
  }

  const similar = await getMoviesByExternalIds(movie.similarIds);

  return NextResponse.json({ movie, similar });
}
