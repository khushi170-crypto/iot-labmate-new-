import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { buildKit } from "@/lib/ai";
import { kitBuilderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const body = await request.json();
    const parsed = kitBuilderSchema.parse(body);
    const result = await buildKit(parsed.idea, parsed.maxItems ?? 12);
    return json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}