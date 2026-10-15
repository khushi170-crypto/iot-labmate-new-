import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { Role } from "@/generated/prisma/client";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

export async function POST(request: Request) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file uploaded");

    if (!ALLOWED.has(file.type)) throw new Error("Only PNG, JPEG, WEBP, GIF or SVG images are allowed");
    if (file.size > MAX_SIZE) throw new Error("Image must be 2MB or smaller");

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return json({ path: `/uploads/${name}` }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) return fail(error.message, 400);
    return apiError(error);
  }
}