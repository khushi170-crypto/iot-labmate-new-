import { PageHeader } from "@/components/ui/page-header";
import { ComplaintsBoard } from "@/components/complaints/complaints-board";
import { requireUser } from "@/lib/session";
import { listComplaints } from "@/lib/complaint.service";
import type { ComplaintView } from "@/lib/types";

export const metadata = { title: "Complaints" };

export default async function AssistantComplaintsPage() {
  await requireUser();
  const complaints = await listComplaints();

  return (
    <div>
      <PageHeader
        title="Complaints"
        description="Acknowledge, investigate and resolve student reports about equipment."
      />
      <ComplaintsBoard mode="assistant" complaints={complaints as unknown as ComplaintView[]} />
    </div>
  );
}