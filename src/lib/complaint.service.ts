import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { ComplaintInput } from "@/lib/validators";
import type { ComplaintStatus } from "@/generated/prisma/client";

export async function createComplaint(studentId: string, input: ComplaintInput) {
  return db.complaint.create({
    data: {
      studentId,
      subject: input.subject,
      message: input.message,
    },
  });
}

export async function listStudentComplaints(studentId: string) {
  return db.complaint.findMany({
    where: { studentId },
    include: { handledBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listComplaints(opts: { status?: ComplaintStatus } = {}) {
  return db.complaint.findMany({
    where: opts.status ? { status: opts.status } : undefined,
    include: {
      student: { select: { id: true, name: true, email: true } },
      handledBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveComplaint(complaintId: string, assistantId: string, resolutionNote: string) {
  const complaint = await db.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new ApiError(404, "Complaint not found");
  return db.complaint.update({
    where: { id: complaintId },
    data: {
      status: "RESOLVED",
      resolutionNote,
      handledById: assistantId,
      resolvedAt: new Date(),
    },
  });
}

export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
  const complaint = await db.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new ApiError(404, "Complaint not found");
  return db.complaint.update({ where: { id: complaintId }, data: { status } });
}