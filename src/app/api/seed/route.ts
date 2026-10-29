/**
 * POST /api/seed
 * Convenience endpoint that populates the DB with the curated sample dataset.
 * Safe to call multiple times (idempotent upsert). Used on first app load.
 */
import { NextResponse } from "next/server";
import { seedSampleMovies } from "@/lib/movie-service";

export async function POST() {
  try {
    const result = await seedSampleMovies();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[seed] failed:", err);
    return NextResponse.json({ error: "Seeding failed." }, { status: 500 });
  }
}
