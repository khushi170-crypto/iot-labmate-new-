import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/client";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireUser([Role.STUDENT]);
  return <AppShell user={user}>{children}</AppShell>;
}