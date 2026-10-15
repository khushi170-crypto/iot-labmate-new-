"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquarePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ComplaintStatusBadge } from "@/components/ui/status-badge";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn, formatDateTime } from "@/lib/utils";
import { COMPLAINT_STATUSES, COMPLAINT_STATUS_META } from "@/lib/constants";
import type { ComplaintStatus } from "@/generated/prisma/client";
import type { ComplaintView } from "@/lib/types";

export function ComplaintsBoard({
  mode,
  complaints,
}: {
  mode: "student" | "assistant";
  complaints: ComplaintView[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ComplaintStatus | "ALL">("ALL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = filter === "ALL" ? complaints : complaints.filter((c) => c.status === filter);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/complaints", {
        method: "POST",
        body: JSON.stringify({ subject, message }),
      });
      setSubject("");
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not submit complaint");
    }
  }

  async function action(id: string, fn: (id: string) => Promise<unknown>) {
    setError(null);
    setBusyId(id);
    try {
      await fn(id);
      setNote("");
      setNoteOpen(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {mode === "student" ? (
        <form onSubmit={create} className="panel space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <MessageSquarePlus className="size-4 text-neon" /> Report an issue
          </h2>
          <Field label="Subject">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Missing jumper wires in my kit"
              required
            />
          </Field>
          <Field label="Details">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the problem so the lab assistant can help quickly…"
              required
            />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" size="sm">
            Submit complaint
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...COMPLAINT_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                filter === s
                  ? "border-neon/50 bg-neon/10 text-neon"
                  : "border-line text-muted hover:border-neon/30 hover:text-foreground"
              )}
            >
              {s === "ALL" ? "All" : COMPLAINT_STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="panel px-6 py-14 text-center text-sm text-muted">
          {mode === "student" ? "You haven't reported any issues yet." : "No complaints in this view."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{c.subject}</h3>
                    <ComplaintStatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {mode === "assistant" && c.student
                      ? `${c.student.name} · ${c.student.email} · `
                      : ""}
                    {formatDateTime(c.createdAt)}
                    {c.handledBy ? ` · handled by ${c.handledBy.name}` : ""}
                  </p>
                </div>
                {mode === "assistant" && c.status !== "RESOLVED" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {c.status === "OPEN" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busyId === c.id}
                        onClick={() =>
                          action(c.id, (id) =>
                            apiFetch(`/api/complaints/${id}`, {
                              method: "POST",
                              body: JSON.stringify({ action: "acknowledge" }),
                            })
                          )
                        }
                      >
                        Acknowledge
                      </Button>
                    ) : null}
                    <Button size="sm" onClick={() => setNoteOpen(noteOpen === c.id ? null : c.id)}>
                      Resolve
                    </Button>
                  </div>
                ) : null}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{c.message}</p>

              {c.resolutionNote ? (
                <p className="mt-3 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success">
                  <Check className="mr-1 inline size-4" /> {c.resolutionNote}
                </p>
              ) : null}

              {mode === "assistant" && noteOpen === c.id ? (
                <div className="mt-4 space-y-2 rounded-lg border border-line bg-surface p-3">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Resolution note (visible to the student)…"
                    className="min-h-16"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setNoteOpen(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={note.trim().length < 2}
                      loading={busyId === c.id}
                      onClick={() =>
                        action(c.id, (id) =>
                          apiFetch(`/api/complaints/${id}`, {
                            method: "POST",
                            body: JSON.stringify({ action: "resolve", resolutionNote: note }),
                          })
                        )
                      }
                    >
                      <Send className="size-3.5" /> Mark resolved
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}