import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required").max(200),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: emailField,
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  role: z.enum(["STUDENT", "LAB_ASSISTANT"]).default("STUDENT"),
  inviteCode: z.string().trim().optional().or(z.literal("")),
});

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(600).optional().or(z.literal("")),
  totalQty: z.coerce.number().int().min(1, "Quantity must be at least 1").max(9999),
  availableQty: z.coerce.number().int().min(0).max(9999).optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]).default("GOOD"),
});

export const updateEquipmentSchema = createEquipmentSchema.partial().extend({
  isActive: z.coerce.boolean().optional(),
});

export const bookingItemSchema = z.object({
  equipmentId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(999),
});

export const createBookingSchema = z.object({
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(bookingItemSchema).min(1, "Select at least one item").max(50),
});

export const returnItemSchema = z.object({
  equipmentId: z.string().min(1),
  condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]).optional(),
});

export const returnBookingSchema = z.object({
  items: z.array(returnItemSchema).min(1).max(50).optional(),
});

export const complaintSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(120),
  message: z.string().trim().min(5, "Please describe the issue (at least 5 characters)").max(2000),
});

export const resolveComplaintSchema = z.object({
  resolutionNote: z.string().trim().min(2).max(2000),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  currentPassword: z.string().min(1).optional().or(z.literal("")),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(200).optional().or(z.literal("")),
});

export const updateSettingsSchema = z.object({
  fineRatePerDay: z.coerce.number().min(0).max(100000),
  loanPeriodDays: z.coerce.number().int().min(1).max(365),
  currency: z.string().trim().min(1, "Currency symbol is required").max(5),
  aiProvider: z.enum(["rule-based", "llm"]).default("rule-based"),
});

export const kitBuilderSchema = z.object({
  idea: z.string().trim().min(5, "Describe your project idea (at least 5 characters)").max(2000),
  maxItems: z.coerce.number().int().min(1).max(30).optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ReturnBookingInput = z.infer<typeof returnBookingSchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type KitBuilderInput = z.infer<typeof kitBuilderSchema>;