import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="grid-bg relative flex flex-1 items-center justify-center px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 right-0 size-96 rounded-full bg-neon/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-0 size-96 rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-neon">
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <div className="panel p-8">
          <div className="mb-6 text-center">
            <Link href="/" className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-neon/15 text-neon">
              <Cpu className="size-6" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          IoT LabMate — smart IoT lab management for universities &amp; makerspaces.
        </p>
      </div>
    </main>
  );
}