import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neon",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neon" | "warning" | "danger" | "success" | "violet";
  hint?: string;
}) {
  const toneClass = {
    neon: "bg-neon/10 text-neon",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
    violet: "bg-violet-500/10 text-violet-400",
  }[tone];

  return (
    <div className="panel flex items-center gap-4 p-5">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", toneClass)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="truncate text-sm text-muted">{label}</p>
        {hint ? <p className="text-xs text-muted/70">{hint}</p> : null}
      </div>
    </div>
  );
}