import {
  CalendarCheck,
  ClipboardList,
  HandCoins,
  LayoutDashboard,
  MessageSquareWarning,
  PackageSearch,
  Settings,
  Sparkles,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/catalog", label: "Equipment", icon: PackageSearch },
  { href: "/student/kit-builder", label: "AI Kit Builder", icon: Sparkles },
  { href: "/student/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/student/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/student/profile", label: "Profile", icon: UserRound },
];

export const ASSISTANT_NAV: NavItem[] = [
  { href: "/assistant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant/inventory", label: "Inventory", icon: Wrench },
  { href: "/assistant/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/assistant/fines", label: "Fines", icon: HandCoins },
  { href: "/assistant/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/assistant/settings", label: "Settings", icon: Settings },
];

export function navForRole(role: Role): NavItem[] {
  return role === "LAB_ASSISTANT" ? ASSISTANT_NAV : STUDENT_NAV;
}