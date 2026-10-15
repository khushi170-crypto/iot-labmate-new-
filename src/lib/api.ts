import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function json<T>(data: T, init?: { status?: number; headers?: HeadersInit }): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return fail(error.message, error.status);
  }
  if (error instanceof Error) {
    console.error("[api]", error);
    return fail(error.message || "Internal server error", 500);
  }
  console.error("[api]", error);
  return fail("Internal server error", 500);
}

/** Throws ApiError when the request is not authenticated (or the role is wrong). */
export async function requireApiUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw new ApiError(403, "You don't have permission to perform this action");
  }
  return user;
}