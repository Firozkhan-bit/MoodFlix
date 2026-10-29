/**
 * MoodFlix — server-side session helper.
 * Wraps `getServerSession` so API routes can read the current user id without
 * importing auth options everywhere.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser(): Promise<{ id: string; email: string; name?: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const id = (session.user as { id?: string }).id;
  if (!id) return null;
  return { id, email: session.user.email ?? "", name: session.user.name ?? undefined };
}
