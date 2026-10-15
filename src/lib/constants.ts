export type Role = "STUDENT" | "LAB_ASSISTANT";

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  LAB_ASSISTANT: "Lab Assistant",
};

export const SETTING_KEYS = {
  FINE_RATE_PER_DAY: "fineRatePerDay",
  LOAN_PERIOD_DAYS: "loanPeriodDays",
  CURRENCY: "currency",
  AI_PROVIDER: "aiProvider",
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.FINE_RATE_PER_DAY]: "10",
  [SETTING_KEYS.LOAN_PERIOD_DAYS]: "7",
  [SETTING_KEYS.CURRENCY]: "$",
  [SETTING_KEYS.AI_PROVIDER]: "rule-based",
};

export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ISSUED"
  | "RETURNED"
  | "OVERDUE"
  | "CANCELLED";

export const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ISSUED",
  "RETURNED",
  "OVERDUE",
  "CANCELLED",
];

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; className: string; hint: string }
> = {
  PENDING: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30", hint: "Awaiting approval" },
  APPROVED: { label: "Approved", className: "bg-neon-soft/15 text-neon-soft border-neon-soft/30", hint: "Ready to issue" },
  REJECTED: { label: "Rejected", className: "bg-danger/15 text-danger border-danger/30", hint: "Not approved" },
  ISSUED: { label: "Issued", className: "bg-neon/15 text-neon border-neon/30", hint: "Equipment in your hands" },
  RETURNED: { label: "Returned", className: "bg-success/15 text-success border-success/30", hint: "Closed" },
  OVERDUE: { label: "Overdue", className: "bg-danger/20 text-danger border-danger/40", hint: "Return is late — fine applies" },
  CANCELLED: { label: "Cancelled", className: "bg-muted/15 text-muted border-muted/30", hint: "Cancelled by student" },
};

export type EquipmentCondition = "NEW" | "GOOD" | "FAIR" | "DAMAGED";

export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["NEW", "GOOD", "FAIR", "DAMAGED"];

export const EQUIPMENT_CONDITION_META: Record<EquipmentCondition, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-success/15 text-success border-success/30" },
  GOOD: { label: "Good", className: "bg-neon/15 text-neon border-neon/30" },
  FAIR: { label: "Fair", className: "bg-warning/15 text-warning border-warning/30" },
  DAMAGED: { label: "Damaged", className: "bg-danger/15 text-danger border-danger/30" },
};

export type FineStatus = "UNPAID" | "PAID" | "WAIVED";

export const FINE_STATUS_META: Record<FineStatus, { label: string; className: string }> = {
  UNPAID: { label: "Unpaid", className: "bg-danger/15 text-danger border-danger/30" },
  PAID: { label: "Paid", className: "bg-success/15 text-success border-success/30" },
  WAIVED: { label: "Waived", className: "bg-muted/15 text-muted border-muted/30" },
};

export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export const COMPLAINT_STATUSES: ComplaintStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED"];

export const COMPLAINT_STATUS_META: Record<ComplaintStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-danger/15 text-danger border-danger/30" },
  IN_REVIEW: { label: "In review", className: "bg-warning/15 text-warning border-warning/30" },
  RESOLVED: { label: "Resolved", className: "bg-success/15 text-success border-success/30" },
};

export const DEMO_ACCOUNTS = [
  { role: "Student", email: "student@labmate.edu", password: "student123", dashboard: "/student" },
  { role: "Lab Assistant", email: "assistant@labmate.edu", password: "assistant123", dashboard: "/assistant" },
] as const;