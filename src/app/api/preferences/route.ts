/**
 * /api/preferences
 *  GET — return the signed-in user's saved preferences (or defaults).
 *  PUT — upsert the signed-in user's preferences.
 *
 * Private: requires authentication.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const preferencesSchema = z.object({
  genres: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  minRating: z.number().min(0).max(10).default(0),
  maxRuntime: z.number().int().min(0).max(300).nullable().default(null),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const prefs = await db.userPreference.findUnique({ where: { userId: user.id } });
  if (!prefs) {
    return NextResponse.json({ genres: [], languages: [], minRating: 0, maxRuntime: null });
  }
  return NextResponse.json({
    genres: prefs.genres,
    languages: prefs.languages,
    minRating: prefs.minRating,
    maxRuntime: prefs.maxRuntime,
  });
}

export async function PUT(req: Request) {
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
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const prefs = await db.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      genres: parsed.data.genres,
      languages: parsed.data.languages,
      minRating: parsed.data.minRating,
      maxRuntime: parsed.data.maxRuntime,
    },
    update: {
      genres: parsed.data.genres,
      languages: parsed.data.languages,
      minRating: parsed.data.minRating,
      maxRuntime: parsed.data.maxRuntime,
    },
  });

  return NextResponse.json({
    genres: prefs.genres,
    languages: prefs.languages,
    minRating: prefs.minRating,
    maxRuntime: prefs.maxRuntime,
  });
}
