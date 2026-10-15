"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface SignupResponse {
  redirect: string;
}

type Role = "STUDENT" | "LAB_ASSISTANT";

export function SignupForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<SignupResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, inviteCode }),
      });
      router.replace(data.redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <RoleButton active={role === "STUDENT"} onClick={() => setRole("STUDENT")} icon={<GraduationCap className="size-4" />}>
          Student
        </RoleButton>
        <RoleButton
          active={role === "LAB_ASSISTANT"}
          onClick={() => setRole("LAB_ASSISTANT")}
          icon={<ShieldCheck className="size-4" />}
        >
          Lab Assistant
        </RoleButton>
      </div>

      <Field label="Full name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" required />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@labmate.edu"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Password" hint="At least 6 characters">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
      </Field>

      {role === "LAB_ASSISTANT" ? (
        <Field label="Invite code" hint="Ask your lab administrator for the code">
          <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="LAB-XXXX" required />
        </Field>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {!loading && <UserPlus className="size-4" />} Create account
      </Button>
    </form>
  );
}

function RoleButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
        active
          ? "border-neon/50 bg-neon/10 text-neon"
          : "border-line bg-surface text-muted hover:border-line hover:bg-surface-2"
      )}
    >
      {icon}
      {children}
    </button>
  );
}