import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { resolveComplaint, updateComplaintStatus } from "@/lib/complaint.service";
import { ComplaintStatus, Role } from "@/generated/prisma/client";

const bodySchema = z.object({
  action: z.enum(["resolve", "acknowledge"]),
  resolutionNote: z.string().trim().min(2).max(2000).optional().or(z.literal("")),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const assistant = await requireApiUser([Role.LAB_ASSISTANT]);
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = bodySchema.parse(body);

    switch (parsed.action) {
      case "resolve":
        return json(await resolveComplaint(id, assistant.id, parsed.resolutionNote ?? "Resolved"));
      case "acknowledge":
        return json(await updateComplaintStatus(id, ComplaintStatus.IN_REVIEW));
      default:
        return fail("Unknown action", 400);
    }
  } catch (error) {
    if (error instanceof z.ZodError) return fail("Invalid request", 422);
    return apiError(error);
  }
}