import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { createEquipment, listEquipment } from "@/lib/equipment.service";
import { createEquipmentSchema } from "@/lib/validators";
import { Role } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const categoryId = url.searchParams.get("category") ?? undefined;
    const includeInactive = url.searchParams.get("includeInactive") === "1";
    const equipment = await listEquipment({ search, categoryId, includeInactive });
    return json(equipment);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const body = await request.json();
    const parsed = createEquipmentSchema.parse(body);
    const created = await createEquipment(parsed);
    return json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}