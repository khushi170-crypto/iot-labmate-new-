import { z } from "zod";
import { ApiError, fail, json } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { getAssistantSignupCode } from "@/lib/settings.service";
import { signupSchema } from "@/lib/validators";
import type { Role } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.parse(body);
    const inviteCode = getAssistantSignupCode();

    if (parsed.role === "LAB_ASSISTANT") {
      if (!inviteCode) throw new ApiError(403, "Lab Assistant signup is currently disabled");
      if (!parsed.inviteCode?.trim() || parsed.inviteCode.trim() !== inviteCode) {
        throw new ApiError(403, "Invalid Lab Assistant invite code");
      }
    }

    const existing = await db.user.findUnique({ where: { email: parsed.email } });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await hashPassword(parsed.password);
    const user = await db.user.create({
      data: { name: parsed.name, email: parsed.email, role: parsed.role, passwordHash },
    });

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role as Role };
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role as Role });

    return json(
      { user: safeUser, redirect: user.role === "LAB_ASSISTANT" ? "/assistant" : "/student" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input", 422);
    }
    if (error instanceof ApiError) return fail(error.message, error.status);
    console.error("[api/auth/signup]", error);
    return fail("Internal server error", 500);
  }
}