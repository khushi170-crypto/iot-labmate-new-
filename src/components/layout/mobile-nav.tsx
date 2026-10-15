"use client";

import { useState } from "react";
import { Cpu, Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import type { Role } from "@/generated/prisma/client";

export function MobileNav({ role, name, roleLabel }: { role: Role; name: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg border border-line text-muted hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 border-r border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-foreground">
                <Cpu className="size-5 text-neon" /> IoT LabMate
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
            <div className="mt-auto space-y-3 border-t border-line pt-4">
              <div>
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted">{roleLabel}</p>
              </div>
              <LogoutButton compact />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}