import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { createComplaint, listComplaints, listStudentComplaints } from "@/lib/complaint.service";
import { complaintSchema } from "@/lib/validators";
import { Role, type ComplaintStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    if (user.role === Role.STUDENT) {
      return json(await listStudentComplaints(user.id));
    }
    const status = (new URL(request.url).searchParams.get("status") as ComplaintStatus | null) ?? undefined;
    return json(await listComplaints({ status }));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser([Role.STUDENT]);
    const body = await request.json();
    const parsed = complaintSchema.parse(body);
    const complaint = await createComplaint(user.id, parsed);
    return json(complaint, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}