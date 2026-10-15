import { PageHeader } from "@/components/ui/page-header";
import { ComplaintsBoard } from "@/components/complaints/complaints-board";
import { requireUser } from "@/lib/session";
import { listStudentComplaints } from "@/lib/complaint.service";
import type { ComplaintView } from "@/lib/types";

export const metadata = { title: "My Complaints" };

export default async function StudentComplaintsPage() {
  const user = await requireUser();
  const complaints = await listStudentComplaints(user.id);

  return (
    <div>
      <PageHeader
        title="Complaints"
        description="Report damaged or missing equipment and follow the resolution status."
      />
      <ComplaintsBoard mode="student" complaints={complaints as unknown as ComplaintView[]} />
    </div>
  );
}