/**
 * /api/watched
 *  GET   — list the signed-in user's watched movies (externalIds + dates)
 *  POST  — mark { externalId } as watched (unique per user)
 *
 * Private: requires authentication.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ensureMovieExists, prismaMovieToRecord } from "@/lib/movie-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const items = await db.watchedMovie.findMany({
    where: { userId: user.id },
    include: { movie: true },
    orderBy: { watchedAt: "desc" },
  });
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      watchedAt: i.watchedAt,
      movie: prismaMovieToRecord(i.movie),
    })),
  });
}

const addSchema = z.object({ externalId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "externalId is required." }, { status: 400 });
  }

  const movieId = await ensureMovieExists(parsed.data.externalId);
  if (!movieId) {
    return NextResponse.json({ error: "Unknown movie." }, { status: 404 });
  }

  const item = await db.watchedMovie.upsert({
    where: { userId_movieId: { userId: user.id, movieId } },
    create: { userId: user.id, movieId },
    update: {},
    include: { movie: true },
  });

  return NextResponse.json(
    { id: item.id, watchedAt: item.watchedAt, movie: prismaMovieToRecord(item.movie) },
    { status: 201 }
  );
}
