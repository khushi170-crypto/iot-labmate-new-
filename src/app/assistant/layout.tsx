import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/session";
import { Role } from "@/generated/prisma/client";

export default async function AssistantLayout({ children }: { children: ReactNode }) {
  const user = await requireUser([Role.LAB_ASSISTANT]);
  return <AppShell user={user}>{children}</AppShell>;
}