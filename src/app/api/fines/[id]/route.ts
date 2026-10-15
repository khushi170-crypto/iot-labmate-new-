import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { updateFineStatus } from "@/lib/fines.service";
import { Role, FineStatus } from "@/generated/prisma/client";

const actionSchema = z.object({
  status: z.enum([FineStatus.PAID, FineStatus.WAIVED]),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = actionSchema.parse(body);
    const fine = await updateFineStatus(id, parsed.status);
    return json(fine);
  } catch (error) {
    if (error instanceof z.ZodError) return fail("Invalid status", 422);
    return apiError(error);
  }
}