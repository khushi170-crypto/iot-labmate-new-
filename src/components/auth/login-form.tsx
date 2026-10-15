"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/fetcher";

interface LoginResponse {
  redirect: string;
}

const DEMO = [
  { label: "Student", email: "student@labmate.edu", password: "student123", icon: GraduationCap },
  { label: "Lab Assistant", email: "assistant@labmate.edu", password: "assistant123", icon: ShieldCheck },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : data.redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function fillDemo(demo: (typeof DEMO)[number]) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
      <Field label="Password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </Field>

      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {!loading && <LogIn className="size-4" />} Sign in
      </Button>

      <div className="pt-2">
        <p className="mb-2 text-center text-xs text-muted">Or use a demo account</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO.map((demo) => (
            <Button
              key={demo.email}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemo(demo)}
            >
              <demo.icon className="size-4" /> {demo.label}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}