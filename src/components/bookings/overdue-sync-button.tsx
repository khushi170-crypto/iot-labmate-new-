"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/fetcher";

export function OverdueSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setMessage(null);
    try {
      const data = await apiFetch<{ markedOverdue: number }>("/api/overdue/sync", { method: "POST" });
      setMessage(
        data.markedOverdue > 0
          ? `${data.markedOverdue} booking(s) flagged as overdue.`
          : "Everything is up to date."
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" onClick={sync} loading={loading}>
        <RefreshCw className="size-4" /> Sync overdue
      </Button>
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </div>
  );
}