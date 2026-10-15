import type { BookingStatus, ComplaintStatus, EquipmentCondition, FineStatus, Role } from "@/generated/prisma/client";

export type DateLike = string | Date;

export interface CategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface EquipmentView {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalQty: number;
  availableQty: number;
  condition: EquipmentCondition;
  isActive: boolean;
  categoryId: string;
  category: CategoryView;
}

export interface BookingItemView {
  id: string;
  quantity: number;
  equipmentId: string;
  equipment: Pick<EquipmentView, "id" | "name" | "imageUrl" | "category">;
  conditionOnIssue: EquipmentCondition | null;
  conditionOnReturn: EquipmentCondition | null;
}

export interface FineView {
  id: string;
  amount: number;
  daysLate: number;
  rateApplied: number;
  status: FineStatus;
  createdAt: DateLike;
  paidAt: DateLike | null;
}

export interface BookingView {
  id: string;
  code: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: DateLike;
  approvedAt: DateLike | null;
  issuedAt: DateLike | null;
  dueAt: DateLike | null;
  returnedAt: DateLike | null;
  student?: { id: string; name: string; email: string } | null;
  items: BookingItemView[];
  fine?: FineView | null;
}

export interface ComplaintView {
  id: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  resolutionNote: string | null;
  createdAt: DateLike;
  resolvedAt: DateLike | null;
  student?: { id: string; name: string; email: string } | null;
  handledBy?: { id?: string; name: string } | null;
}

export interface SessionUserView {
  id: string;
  name: string;
  email: string;
  role: Role;
}
