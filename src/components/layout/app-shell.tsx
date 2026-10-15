import Link from "next/link";
import { Cpu } from "lucide-react";
import type { ReactNode } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/constants";
import type { SessionUser } from "@/lib/session";

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const roleLabel = ROLE_LABEL[user.role];

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 p-5 backdrop-blur lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-neon/15 text-neon">
            <Cpu className="size-5" />
          </span>
          IoT <span className="text-neon">LabMate</span>
        </Link>
        <SidebarNav role={user.role} />
        <div className="mt-auto space-y-3 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-neon/15 text-sm font-bold text-neon">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted">{roleLabel}</p>
            </div>
          </div>
          <LogoutButton compact />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <MobileNav role={user.role} name={user.name} roleLabel={roleLabel} />
            <Link href="/" className="flex items-center gap-2 text-base font-bold text-foreground lg:hidden">
              <Cpu className="size-5 text-neon" /> LabMate
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:block">{user.email}</span>
            <Badge className="border-neon/30 bg-neon/10 text-neon">{roleLabel}</Badge>
          </div>
        </header>
        <main className="grid-bg flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}