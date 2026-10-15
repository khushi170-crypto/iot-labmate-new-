"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Minus, Package, PackageSearch, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { AvailabilityBadge, ConditionBadge } from "@/components/ui/status-badge";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { CategoryView, EquipmentView } from "@/lib/types";

export function EquipmentBrowser({
  equipment,
  categories,
}: {
  equipment: EquipmentView[];
  categories: CategoryView[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return equipment.filter((eq) => {
      if (categoryId !== "all" && eq.categoryId !== categoryId) return false;
      if (!term) return true;
      return (
        eq.name.toLowerCase().includes(term) ||
        (eq.description ?? "").toLowerCase().includes(term) ||
        eq.category.name.toLowerCase().includes(term)
      );
    });
  }, [equipment, search, categoryId]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ equipment: equipment.find((e) => e.id === id)!, quantity: qty }))
        .filter((entry) => entry.equipment),
    [cart, equipment]
  );

  function setQty(eq: EquipmentView, qty: number) {
    const clamped = Math.max(0, Math.min(qty, eq.availableQty));
    setCart((prev) => {
      const next = { ...prev };
      if (clamped <= 0) delete next[eq.id];
      else next[eq.id] = clamped;
      return next;
    });
    setSuccess(null);
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    if (cartItems.length === 0) {
      setError("Add at least one item to your request.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          notes,
          items: cartItems.map((c) => ({ equipmentId: c.equipment.id, quantity: c.quantity })),
        }),
      });
      setSuccess("Booking request submitted! Track it under My Bookings.");
      setCart({});
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        {/* Filters */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={categoryId === "all"} onClick={() => setCategoryId("all")}>
              All
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.name}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
            <PackageSearch className="size-8 text-muted" />
            <p className="font-medium text-foreground">No components found</p>
            <p className="text-sm text-muted">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((eq) => {
              const qty = cart[eq.id] ?? 0;
              const unavailable = eq.availableQty <= 0;
              return (
                <div key={eq.id} className="panel flex flex-col overflow-hidden">
                  <div className="relative flex h-36 items-center justify-center bg-surface-2">
                    {eq.imageUrl ? (
                      <Image src={eq.imageUrl} alt={eq.name} fill unoptimized className="object-cover" />
                    ) : (
                      <Package className="size-10 text-muted/50" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight text-foreground">{eq.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-muted">{eq.category.name}</p>
                    {eq.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{eq.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <AvailabilityBadge availableQty={eq.availableQty} totalQty={eq.totalQty} />
                      <ConditionBadge condition={eq.condition} />
                    </div>

                    <div className="mt-auto pt-4">
                      {unavailable ? (
                        <Button variant="secondary" size="sm" className="w-full" disabled>
                          Unavailable
                        </Button>
                      ) : qty > 0 ? (
                        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-2 py-1">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => setQty(eq, qty - 1)}
                            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="text-sm font-semibold text-foreground">{qty}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            disabled={qty >= eq.availableQty}
                            onClick={() => setQty(eq, qty + 1)}
                            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => setQty(eq, 1)}>
                          <Plus className="size-4" /> Add to request
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <ShoppingCart className="size-4 text-neon" /> Request cart
          </h2>

          {cartItems.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No items yet. Add components from the catalog.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {cartItems.map(({ equipment: eq, quantity }) => (
                <li key={eq.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground">{eq.name}</span>
                  <span className="text-muted">× {quantity}</span>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setQty(eq, 0)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Project note (optional) — e.g. smart irrigation prototype"
              className="min-h-20"
            />
          </div>

          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          {success ? (
            <p className="mt-3 flex items-start gap-1.5 text-sm text-success">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {success}
            </p>
          ) : null}

          <Button className="mt-4 w-full" onClick={submit} loading={submitting} disabled={cartItems.length === 0}>
            Submit request
          </Button>
        </div>
      </aside>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-neon/50 bg-neon/10 text-neon"
          : "border-line text-muted hover:border-neon/30 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}