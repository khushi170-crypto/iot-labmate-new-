import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/token";

const STUDENT_PATH = "/student";
const ASSISTANT_PATH = "/assistant";
const AUTH_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  const isStudentRoute = pathname.startsWith(STUDENT_PATH);
  const isAssistantRoute = pathname.startsWith(ASSISTANT_PATH);

  if (isStudentRoute || isAssistantRoute) {
    const requiredRole = isStudentRoute ? "STUDENT" : "LAB_ASSISTANT";
    if (!payload || payload.role !== requiredRole) {
      if (!payload) {
        const url = new URL("/login", request.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      const home = payload.role === "LAB_ASSISTANT" ? ASSISTANT_PATH : STUDENT_PATH;
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  if (AUTH_PATHS.includes(pathname) && payload) {
    const home = payload.role === "LAB_ASSISTANT" ? ASSISTANT_PATH : STUDENT_PATH;
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/assistant/:path*", "/login", "/signup"],
};