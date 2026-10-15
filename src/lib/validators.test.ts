import { describe, expect, it } from "vitest";
import {
  createBookingSchema,
  loginSchema,
  signupSchema,
  updateSettingsSchema,
} from "@/lib/validators";

describe("loginSchema", () => {
  it("normalizes email casing and whitespace", () => {
    const parsed = loginSchema.parse({ email: "  Student@LabMate.EDU ", password: "x" });
    expect(parsed.email).toBe("student@labmate.edu");
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("defaults the role to STUDENT", () => {
    const parsed = signupSchema.parse({ name: "Ada", email: "a@b.co", password: "secret" });
    expect(parsed.role).toBe("STUDENT");
  });

  it("requires a password of at least 6 characters", () => {
    expect(signupSchema.safeParse({ name: "Ada", email: "a@b.co", password: "123" }).success).toBe(false);
  });
});

describe("createBookingSchema", () => {
  it("rejects an empty item list", () => {
    expect(createBookingSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("coerces string quantities to numbers", () => {
    const parsed = createBookingSchema.parse({ items: [{ equipmentId: "eq1", quantity: "3" }] });
    expect(parsed.items[0].quantity).toBe(3);
  });
});

describe("updateSettingsSchema", () => {
  it("rejects a negative fine rate", () => {
    const result = updateSettingsSchema.safeParse({
      fineRatePerDay: -1,
      loanPeriodDays: 7,
      currency: "$",
      aiProvider: "rule-based",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid payload", () => {
    const result = updateSettingsSchema.safeParse({
      fineRatePerDay: 5,
      loanPeriodDays: "14",
      currency: "$",
      aiProvider: "llm",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.loanPeriodDays).toBe(14);
  });
});
