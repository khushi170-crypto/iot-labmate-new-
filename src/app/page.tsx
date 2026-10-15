import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  ClipboardCheck,
  Cpu,
  HandCoins,
  LogIn,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wrench,
} from "lucide-react";
import { db } from "@/lib/db";
import { SETTING_KEYS } from "@/lib/constants";
import { getSetting } from "@/lib/settings.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [equipmentCount, categoryCount, activeBookings, provider] = await Promise.all([
    db.equipment.count({ where: { isActive: true } }),
    db.category.count(),
    db.booking.count({ where: { status: { in: ["ISSUED", "OVERDUE"] } } }),
    getSetting(SETTING_KEYS.AI_PROVIDER),
  ]);

  const stats = [
    { value: `${equipmentCount}+`, label: "IoT components in the lab" },
    { value: `${categoryCount}`, label: "Equipment categories" },
    { value: `${activeBookings}`, label: "Live loans right now" },
    { value: "24/7", label: "Book anytime online" },
  ];

  return (
    <main className="grid-bg relative flex-1 overflow-hidden">
      {/* glow blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-0 size-[480px] rounded-full bg-neon/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -left-40 size-[420px] rounded-full bg-violet-600/15 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-6xl px-6">
        {/* NAV */}
        <nav className="flex items-center justify-between py-6">
          <Link href="/" className="group flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-neon/15 text-neon transition group-hover:bg-neon/25">
              <Cpu className="size-5" />
            </span>
            IoT <span className="text-neon">LabMate</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <LogIn className="size-4" /> Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                <UserPlus className="size-4" /> Sign up
              </Button>
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="flex flex-col items-center py-16 text-center md:py-24">
          <Badge className="mb-5 border-neon/30 bg-neon/10 px-3 py-1 text-neon">
            <Sparkles className="size-3.5" /> AI-powered university IoT lab
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Borrow hardware, build projects,{" "}
            <span className="glow-text text-neon">skip the paperwork</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted md:text-xl">
            IoT LabMate gives students one place to browse lab equipment, get an
            AI-suggested kit for any project idea, and track every booking, fine,
            and complaint — while keeping assistants fully in control.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Get started free <ArrowRight className="size-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Explore a demo account
              </Button>
            </Link>
          </div>
          <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="panel flex flex-col items-center gap-1 px-4 py-6">
                <span className="glow-text text-3xl font-extrabold text-neon">{s.value}</span>
                <span className="text-sm text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16" id="features">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Everything your IoT lab run needs
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Feature
              icon={<Wrench className="size-6 text-neon" />}
              title="Smart inventory"
              text="Search and filter the full catalog of controllers, sensors, actuators and power gear with live availability."
            />
            <Feature
              icon={<Bot className="size-6 text-neon" />}
              title="AI kit builder"
              text="Describe your idea — “smart plant waterer” — and get a ready-to-borrow parts list, provider-tagged so you know if it’s a real LLM."
            />
            <Feature
              icon={<ClipboardCheck className="size-6 text-neon" />}
              title="Digital bookings"
              text="Request items in seconds, watch them move from pending to approved to issued — no more paper ledgers."
            />
            <Feature
              icon={<CalendarClock className="size-6 text-neon" />}
              title="Overdue tracking"
              text="Loan periods and deadlines are enforced automatically, with roll-back flags to keep availability accurate."
            />
            <Feature
              icon={<HandCoins className="size-6 text-neon" />}
              title="Automatic fines"
              text="Late returns are converted into itemized fines at your configured rate. Assistants can collect or waive them."
            />
            <Feature
              icon={<MessageSquareWarning className="size-6 text-neon" />}
              title="Report issues"
              text="Students flag damaged or missing gear; assistants acknowledge, fix and resolve — with a documented trail."
            />
          </div>
        </section>

        {/* ROLES */}
        <section className="py-16">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="panel flex flex-col gap-3 p-7">
              <Badge className="w-fit border-neon/30 bg-neon/10 text-neon">For students</Badge>
              <h3 className="text-2xl font-bold text-foreground">Build your project faster</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li>• Get an AI-suggested parts list for any project idea</li>
                <li>• One-click booking of available components</li>
                <li>• Track bookings, dues dates and fines in real time</li>
                <li>• Report damaged equipment directly to the lab</li>
              </ul>
              <Link href="/signup" className="mt-2">
                <Button variant="outline" size="sm">
                  Create a student account <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <div className="panel flex flex-col gap-3 p-7">
              <Badge className="w-fit border-violet-400/30 bg-violet-400/10 text-violet-400">For lab assistants</Badge>
              <h3 className="text-2xl font-bold text-foreground">Run the lab without the chaos</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li>• Approve, reject, issue and track every loan</li>
                <li>• Manage the equipment catalog, stock and conditions</li>
                <li>• Collect or waive fines from a single dashboard</li>
                <li>• Tune loan periods, fine rates and the AI provider</li>
              </ul>
              <Link href="/signup" className="mt-2">
                <Button size="sm">
                  Become a lab assistant <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* AI BANNER */}
        <section className="panel relative overflow-hidden p-8 md:p-10">
          <div aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full bg-neon/20 blur-[80px]" />
          <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-2 border-neon/30 bg-neon/10 text-neon">
                <Sparkles className="size-3.5" /> AI kit builder
              </Badge>
              <h3 className="text-2xl font-bold text-foreground">
                Currently running the{" "}
                <span className="text-neon">{provider === "llm" ? "real LLM" : "rule-based demo"}</span> engine
              </h3>
              <p className="mt-2 max-w-xl text-sm text-muted">
                The lab can switch between a fully offline, explainable rule engine and
                a configurable OpenAI-compatible LLM — with automatic fallback so the
                feature never breaks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-success" />
              <span className="text-sm font-medium text-success">Provider-tagged suggestions</span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-4 py-10 text-sm text-muted md:flex-row">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Cpu className="size-4 text-neon" /> IoT LabMate
          </span>
          <span>Built for universities &amp; makerspaces · {new Date().getFullYear()}</span>
          <Link href="/login" className="text-neon hover:underline">
            Log in to your dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="panel group p-6 transition duration-300 hover:border-neon/30 hover:bg-surface/80">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-neon/10 transition group-hover:bg-neon/20">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </div>
  );
}