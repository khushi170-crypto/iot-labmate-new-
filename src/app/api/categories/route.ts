import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { listCategories } from "@/lib/equipment.service";
import { slugify } from "@/lib/utils";
import { Role } from "@/generated/prisma/client";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function GET() {
  try {
    await requireApiUser();
    return json(await listCategories());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const parsed = categorySchema.parse(await request.json());

    const existing = await db.category.findFirst({
      where: { OR: [{ name: parsed.name }, { slug: slugify(parsed.name) }] },
    });
    if (existing) return json(existing);

    const category = await db.category.create({
      data: {
        name: parsed.name,
        slug: slugify(parsed.name),
        description: parsed.description || null,
      },
    });
    return json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}