import { PageHeader } from "@/components/ui/page-header";
import { KitBuilder } from "@/components/ai/kit-builder";
import { requireUser } from "@/lib/session";

export const metadata = { title: "AI Kit Builder" };

export default async function KitBuilderPage() {
  await requireUser();
  return (
    <div>
      <PageHeader
        title="AI Kit Builder"
        description="Describe your project and get a suggested parts list you can request in one click."
      />
      <KitBuilder />
    </div>
  );
}