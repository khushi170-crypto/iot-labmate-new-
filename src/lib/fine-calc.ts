export const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole number of late days (ceil). Returns 0 when returnedAt is on or before dueAt. */
export function computeDaysLate(dueAt: Date, returnedAt: Date): number {
  const diff = returnedAt.getTime() - dueAt.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

export function computeFineAmount(daysLate: number, ratePerDay: number): number {
  return Math.round(daysLate * ratePerDay * 100) / 100;
}