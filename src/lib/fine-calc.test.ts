import { describe, expect, it } from "vitest";
import { computeDaysLate, computeFineAmount, DAY_MS } from "@/lib/fine-calc";

describe("computeDaysLate", () => {
  const due = new Date("2026-01-10T10:00:00Z");

  it("returns 0 when returned early", () => {
    expect(computeDaysLate(due, new Date("2026-01-09T10:00:00Z"))).toBe(0);
  });

  it("returns 0 when returned exactly on time", () => {
    expect(computeDaysLate(due, new Date(due.getTime()))).toBe(0);
  });

  it("rounds a partial day up", () => {
    expect(computeDaysLate(due, new Date(due.getTime() + 1000))).toBe(1);
    expect(computeDaysLate(due, new Date(due.getTime() + DAY_MS + 1000))).toBe(2);
  });

  it("counts whole late days", () => {
    expect(computeDaysLate(due, new Date(due.getTime() + 3 * DAY_MS))).toBe(3);
  });
});

describe("computeFineAmount", () => {
  it("multiplies days by rate", () => {
    expect(computeFineAmount(3, 10)).toBe(30);
  });

  it("supports fractional rates and rounds to cents", () => {
    expect(computeFineAmount(3, 2.5)).toBe(7.5);
    expect(computeFineAmount(3, 0.333)).toBe(1);
  });

  it("returns 0 for no late days", () => {
    expect(computeFineAmount(0, 10)).toBe(0);
  });
});
