import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signToken, verifyToken } from "@/lib/token";
import type { Role } from "@/generated/prisma/client";

export { SESSION_COOKIE };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signToken({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Guards a page/layout. Redirects to /login when unauthenticated or the role
 * does not match (defense in depth on top of src/proxy.ts).
 */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && roles.length > 0 && !roles.includes(user.role)) redirect("/login");
  return user;
}