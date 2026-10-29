/**
 * DELETE /api/watchlist/[id]
 * Remove a watchlist entry by its row id. Only the owner can delete it.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  // Find first to enforce ownership (deleteMany is safe but returns count).
  const existing = await db.watchlistItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Watchlist item not found." }, { status: 404 });
  }

  await db.watchlistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
