import { z } from "zod";
import { ApiError, apiError, fail, json, requireApiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { updateProfileSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireApiUser();
    const row = await db.user.findUnique({ where: { id: user.id } });
    if (!row) return fail("Not found", 404);
    return json({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      phone: row.phone,
      createdAt: row.createdAt,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const existing = await db.user.findUnique({ where: { id: user.id } });
    if (!existing) return fail("Not found", 404);

    const data: { name?: string; phone?: string | null; passwordHash?: string } = {
      name: parsed.name,
      phone: parsed.phone || null,
    };

    if (parsed.newPassword) {
      if (!parsed.currentPassword) throw new ApiError(400, "Current password is required");
      const valid = await verifyPassword(parsed.currentPassword, existing.passwordHash);
      if (!valid) throw new ApiError(400, "Current password is incorrect");
      data.passwordHash = await hashPassword(parsed.newPassword);
    }

    const updated = await db.user.update({ where: { id: user.id }, data });
    return json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}