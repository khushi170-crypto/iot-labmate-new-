import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import type { CreateEquipmentInput, UpdateEquipmentInput } from "@/lib/validators";

export interface EquipmentListOptions {
  search?: string;
  categoryId?: string;
  includeInactive?: boolean;
}

function buildWhere(opts: EquipmentListOptions) {
  const where: {
    isActive?: boolean;
    categoryId?: string;
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (!opts.includeInactive) where.isActive = true;
  if (opts.categoryId) where.categoryId = opts.categoryId;

  if (opts.search?.trim()) {
    const term = opts.search.trim();
    where.OR = [
      { name: { contains: term } },
      { description: { contains: term } },
      { category: { name: { contains: term } } },
    ];
  }
  return where;
}

export async function listEquipment(opts: EquipmentListOptions = {}) {
  return db.equipment.findMany({
    where: buildWhere(opts),
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

export async function getEquipment(id: string) {
  return db.equipment.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function ensureCategory(categoryId: string): Promise<void> {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new ApiError(400, "Category does not exist");
}

export async function createEquipment(input: CreateEquipmentInput & { categoryId: string }) {
  await ensureCategory(input.categoryId);
  const availableQty = input.availableQty ?? input.totalQty;
  return db.equipment.create({
    data: {
      name: input.name,
      categoryId: input.categoryId,
      description: input.description || null,
      imageUrl: input.imageUrl || null,
      totalQty: input.totalQty,
      availableQty: Math.min(availableQty, input.totalQty),
      condition: input.condition ?? "GOOD",
    },
    include: { category: true },
  });
}

export async function updateEquipment(id: string, input: UpdateEquipmentInput) {
  const existing = await db.equipment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Equipment not found");

  if (input.categoryId) await ensureCategory(input.categoryId);

  let availableQty = existing.availableQty;
  const totalQty = input.totalQty ?? existing.totalQty;
  if (input.availableQty !== undefined) availableQty = input.availableQty;
  if (input.totalQty !== undefined && input.totalQty !== existing.totalQty) {
    // Keep availability consistent when total changes
    const delta = input.totalQty - existing.totalQty;
    availableQty = Math.max(0, existing.availableQty + delta);
  }
  if (availableQty > totalQty) availableQty = totalQty;
  if (availableQty < 0) throw new ApiError(400, "Available quantity cannot be negative");

  return db.equipment.update({
    where: { id },
    data: {
      name: input.name,
      categoryId: input.categoryId,
      description: input.description === "" ? null : input.description,
      imageUrl: input.imageUrl === "" ? null : input.imageUrl,
      totalQty: input.totalQty,
      availableQty,
      condition: input.condition,
      isActive: input.isActive,
    },
    include: { category: true },
  });
}

export async function deleteEquipment(id: string): Promise<{ soft: boolean }> {
  const existing = await db.equipment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Equipment not found");

  const hasHistory = await db.bookingItem.count({ where: { equipmentId: id } });

  if (hasHistory > 0) {
    await db.equipment.update({ where: { id }, data: { isActive: false, availableQty: 0 } });
    return { soft: true };
  }

  await db.equipment.delete({ where: { id } });
  return { soft: false };
}

export { slugify };

export async function listCategories() {
  return db.category.findMany({
    include: { _count: { select: { equipment: true } } },
    orderBy: { name: "asc" },
  });
}