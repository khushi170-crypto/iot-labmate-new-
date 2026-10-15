import { z } from "zod";
import { ApiError, fail, json } from "@/lib/api";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";
import type { Role } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);

    const user = await db.user.findUnique({ where: { email: parsed.email } });
    if (!user || !(await verifyPassword(parsed.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role as Role };
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role as Role });

    return json({ user: safeUser, redirect: user.role === "LAB_ASSISTANT" ? "/assistant" : "/student" });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    if (error instanceof ApiError) return fail(error.message, error.status);
    console.error("[api/auth/login]", error);
    return fail("Internal server error", 500);
  }
}