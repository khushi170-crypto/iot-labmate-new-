import { jwtVerify, SignJWT } from "jose";
import { envString } from "@/lib/env";

export const SESSION_COOKIE = "lm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: "STUDENT" | "LAB_ASSISTANT";
}

function getSecret(): Uint8Array {
  const secret = envString("AUTH_SECRET");
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, name: payload.name, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || !payload.role) return null;
    return {
      userId: payload.userId,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
      role: payload.role as TokenPayload["role"],
    };
  } catch {
    return null;
  }
}