"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Boxes, ImagePlus, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { AvailabilityBadge, ConditionBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { EQUIPMENT_CONDITIONS } from "@/lib/constants";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { CategoryView, EquipmentView } from "@/lib/types";

interface FormState {
  id: string | null;
  name: string;
  categoryId: string;
  description: string;
  totalQty: number;
  availableQty: number;
  condition: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  id: null,
  name: "",
  categoryId: "",
  description: "",
  totalQty: 1,
  availableQty: 1,
  condition: "GOOD",
  imageUrl: "",
  isActive: true,
};

export function InventoryManager({
  equipment,
  categories: initialCategories,
}: {
  equipment: EquipmentView[];
  categories: CategoryView[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return equipment.filter((eq) => {
      if (categoryFilter !== "all" && eq.categoryId !== categoryFilter) return false;
      if (!term) return true;
      return eq.name.toLowerCase().includes(term) || (eq.description ?? "").toLowerCase().includes(term);
    });
  }, [equipment, search, categoryFilter]);

  function openNew() {
    setError(null);
    setForm({ ...EMPTY, categoryId: categories[0]?.id ?? "" });
  }

  function openEdit(eq: EquipmentView) {
    setError(null);
    setForm({
      id: eq.id,
      name: eq.name,
      categoryId: eq.categoryId,
      description: eq.description ?? "",
      totalQty: eq.totalQty,
      availableQty: eq.availableQty,
      condition: eq.condition,
      imageUrl: eq.imageUrl ?? "",
      isActive: eq.isActive,
    });
  }

  async function addCategory() {
    const name = window.prompt("New category name");
    if (!name || name.trim().length < 2) return;
    try {
      const created = await apiFetch<CategoryView>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => (prev ? { ...prev, categoryId: created.id } : prev));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not add category");
    }
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/equipment/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Upload failed");
      setForm((prev) => (prev ? { ...prev, imageUrl: json.data.path } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form) return;
    setError(null);
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        description: form.description,
        imageUrl: form.imageUrl,
        totalQty: form.totalQty,
        availableQty: form.availableQty,
        condition: form.condition,
        isActive: form.isActive,
      };
      if (form.id) {
        await apiFetch(`/api/equipment/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/equipment", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save equipment");
    } finally {
      setBusy(false);
    }
  }

  async function remove(eq: EquipmentView) {
    if (!window.confirm(`Delete "${eq.name}"? Equipment with booking history will be archived instead.`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/equipment/${eq.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not delete equipment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory…"
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="md:w-52">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Add equipment
        </Button>
      </div>

      {error && !form ? <p className="text-sm text-danger">{error}</p> : null}

      {form ? (
        <div className="panel space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{form.id ? "Edit equipment" : "New equipment"}</h2>
            <Button variant="ghost" size="sm" onClick={() => setForm(null)}>
              <X className="size-4" /> Cancel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Category">
              <div className="flex gap-2">
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="secondary" size="md" onClick={addCategory} aria-label="Add category">
                  <Plus className="size-4" />
                </Button>
              </div>
            </Field>
            <Field label="Condition">
              <Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                {EQUIPMENT_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Total qty">
                <Input
                  type="number"
                  min={1}
                  value={form.totalQty}
                  onChange={(e) => setForm({ ...form, totalQty: Number(e.target.value) })}
                />
              </Field>
              <Field label="Available qty">
                <Input
                  type="number"
                  min={0}
                  value={form.availableQty}
                  onChange={(e) => setForm({ ...form, availableQty: Number(e.target.value) })}
                />
              </Field>
            </div>
          </div>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-20"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted hover:text-foreground">
              <ImagePlus className="size-4" />
              {uploading ? "Uploading…" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={upload} />
            </label>
            {form.imageUrl ? (
              <div className="relative size-14 overflow-hidden rounded-lg border border-line">
                <Image src={form.imageUrl} alt="preview" fill unoptimized className="object-cover" />
              </div>
            ) : null}
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 accent-[var(--neon)]"
              />
              Active (visible to students)
            </label>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy} disabled={!form.name || !form.categoryId}>
              <Save className="size-4" /> Save
            </Button>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Boxes className="size-8 text-muted" />
          <p className="font-medium text-foreground">No equipment found</p>
          <p className="text-sm text-muted">Adjust your search or add a new component.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((eq) => (
            <div key={eq.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
                {eq.imageUrl ? (
                  <Image src={eq.imageUrl} alt={eq.name} fill unoptimized className="object-cover" />
                ) : (
                  <Boxes className="size-6 text-muted/50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{eq.name}</span>
                  {!eq.isActive ? (
                    <Badge className="border-muted/30 bg-muted/10 text-muted">Archived</Badge>
                  ) : null}
                  <ConditionBadge condition={eq.condition} />
                </div>
                <p className="mt-0.5 text-xs text-muted">{eq.category.name}</p>
                <div className="mt-1.5">
                  <AvailabilityBadge availableQty={eq.availableQty} totalQty={eq.totalQty} />
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button variant="secondary" size="sm" onClick={() => openEdit(eq)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(eq)}
                  className={cn("text-muted hover:text-danger")}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}