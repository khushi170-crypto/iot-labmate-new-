import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { deleteEquipment, updateEquipment } from "@/lib/equipment.service";
import { updateEquipmentSchema } from "@/lib/validators";
import { Role } from "@/generated/prisma/client";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = updateEquipmentSchema.parse(body);
    const updated = await updateEquipment(id, parsed);
    return json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const { id } = await ctx.params;
    const result = await deleteEquipment(id);
    return json(result);
  } catch (error) {
    return apiError(error);
  }
}