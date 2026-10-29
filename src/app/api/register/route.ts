/**
 * POST /api/register
 * Body: { name?, email, password }
 * Creates a user with a scrypt-hashed password. Returns 409 if the email
 * is already taken. No sensitive data is logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  await db.user.create({
    data: {
      email: normalized,
      name: name?.trim() || null,
      passwordHash: hashPassword(password),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
