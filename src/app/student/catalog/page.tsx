import { PageHeader } from "@/components/ui/page-header";
import { EquipmentBrowser } from "@/components/equipment/equipment-browser";
import { requireUser } from "@/lib/session";
import { listCategories, listEquipment } from "@/lib/equipment.service";
import type { CategoryView, EquipmentView } from "@/lib/types";

export const metadata = { title: "Equipment Catalog" };

export default async function CatalogPage() {
  await requireUser();
  const [equipment, categories] = await Promise.all([listEquipment(), listCategories()]);

  return (
    <div>
      <PageHeader
        title="Equipment catalog"
        description="Browse available lab components and submit a booking request."
      />
      <EquipmentBrowser
        equipment={equipment as unknown as EquipmentView[]}
        categories={categories as unknown as CategoryView[]}
      />
    </div>
  );
}