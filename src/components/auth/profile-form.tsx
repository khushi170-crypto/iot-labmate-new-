"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import type { Role } from "@/generated/prisma/client";

export function ProfileForm({ initial }: { initial: { id: string; name: string; email: string; role: Role; phone: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<{ ok?: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      setStatus({ ok: true, message: "Profile updated." });
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch (err) {
      setStatus({ message: err instanceof ApiClientError ? err.message : "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel max-w-xl space-y-4 p-6">
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email" hint="Email cannot be changed — it's your login.">
        <Input value={initial.email} disabled />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
      </Field>

      <div className="my-4 border-t border-line" />

      <p className="text-sm font-medium text-muted">Change password</p>
      <Field label="Current password" hint="Required only when setting a new password.">
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
      </Field>
      <Field label="New password">
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" />
      </Field>

      {status ? (
        <p className={status.ok ? "text-sm text-success" : "text-sm text-danger"}>{status.message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          <Save className="size-4" /> Save changes
        </Button>
      </div>
    </form>
  );
}