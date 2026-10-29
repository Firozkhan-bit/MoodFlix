/**
 * POST /api/recommendations
 *
 * Body: {
 *   answers: QuestionnaireAnswers,
 *   excludeIds?: string[],   // session-scoped exclusions for the "replace" feature
 *   save?: boolean           // persist the session for the signed-in user
 * }
 *
 * Returns a RecommendationResponse with 5–10 ranked recommendations,
 * per-movie scoring breakdown, a human explanation, and transparency notes.
 *
 * Validation enforces the same option sets the UI offers, so a hand-crafted
 * request cannot smuggle in unknown moods/genres/languages.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { recommend } from "@/lib/recommendation/engine";
import { getCandidateMovies } from "@/lib/movie-service";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import {
  VALID_MOODS, VALID_EXPERIENCES, VALID_AFTERS, VALID_RUNTIMES,
  VALID_ERAS, VALID_AUDIENCES, VALID_LANGUAGES, VALID_GENRES,
} from "@/lib/data/options";
import type { QuestionnaireAnswers } from "@/lib/recommendation/types";

const answersSchema = z.object({
  moods: z.array(z.enum(VALID_MOODS as [string, ...string[]])).default([]),
  experience: z.enum(VALID_EXPERIENCES as [string, ...string[]]),
  runtime: z.enum(VALID_RUNTIMES as [string, ...string[]]),
  era: z.enum(VALID_ERAS as [string, ...string[]]),
  audience: z.enum(VALID_AUDIENCES as [string, ...string[]]),
  genres: z.array(z.enum(VALID_GENRES as [string, ...string[]])).default([]),
  language: z.enum(VALID_LANGUAGES as [string, ...string[]]),
  afterFeel: z.enum(VALID_AFTERS as [string, ...string[]]),
  minRating: z.number().min(0).max(10).default(0),
  excludeGenres: z.array(z.string()).default([]),
  excludeWatched: z.boolean().default(false),
  includeSequels: z.boolean().default(true),
  freeText: z.string().max(300).default(""),
});

const bodySchema = z.object({
  answers: answersSchema,
  excludeIds: z.array(z.string()).default([]),
  save: z.boolean().default(false),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answers, excludeIds, save } = parsed.data;
  const user = await getCurrentUser();

  // Resolve already-watched externalIds (used only when excludeWatched is on).
  let watchedExternalIds: string[] = [];
  if (user) {
    const watched = await db.watchedMovie.findMany({
      where: { userId: user.id },
      include: { movie: { select: { externalId: true } } },
    });
    watchedExternalIds = watched.map((w) => w.movie.externalId);
  }

  const candidates = await getCandidateMovies();

  const result = recommend({
    answers: answers as unknown as QuestionnaireAnswers,
    candidates,
    // Watched movies only excluded when the user opted in (Q9 toggle).
    watchedExternalIds: answers.excludeWatched ? watchedExternalIds : [],
    // Session-scoped exclusions (Replace feature) are ALWAYS applied.
    excludeIds,
  });

  // Optionally persist the session for a signed-in user.
  if (save && user && result.recommendations.length > 0) {
    try {
      const sessionRow = await db.recommendationSession.create({
        data: {
          userId: user.id,
          answers: answers as unknown as QuestionnaireAnswers,
          results: {
            create: result.recommendations.map((r) => ({
              movie: { connect: { externalId: r.movie.externalId } },
              rank: r.rank,
              score: r.score,
              breakdown: r.breakdown,
              explanation: r.explanation,
            })),
          },
        },
      });
      return NextResponse.json({ ...result, sessionId: sessionRow.id });
    } catch (err) {
      console.warn("[recommendations] failed to save session:", err);
    }
  }

  return NextResponse.json(result);
}
