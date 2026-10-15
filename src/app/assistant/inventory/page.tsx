import { PageHeader } from "@/components/ui/page-header";
import { InventoryManager } from "@/components/equipment/inventory-manager";
import { requireUser } from "@/lib/session";
import { listCategories, listEquipment } from "@/lib/equipment.service";
import type { CategoryView, EquipmentView } from "@/lib/types";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  await requireUser();
  const [equipment, categories] = await Promise.all([
    listEquipment({ includeInactive: true }),
    listCategories(),
  ]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Add, edit and archive lab equipment and keep stock levels accurate."
      />
      <InventoryManager
        equipment={equipment as unknown as EquipmentView[]}
        categories={categories as unknown as CategoryView[]}
      />
    </div>
  );
}