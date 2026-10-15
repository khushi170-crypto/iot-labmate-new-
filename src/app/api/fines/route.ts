import { apiError, json, requireApiUser } from "@/lib/api";
import { listFines } from "@/lib/fines.service";
import { Role } from "@/generated/prisma/client";

export async function GET() {
  try {
    const user = await requireApiUser();
    if (user.role === Role.STUDENT) {
      return json(await listFines({ studentId: user.id, includeRelations: true }));
    }
    return json(await listFines({ includeRelations: true }));
  } catch (error) {
    return apiError(error);
  }
}