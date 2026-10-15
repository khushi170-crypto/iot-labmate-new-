import { PageHeader } from "@/components/ui/page-header";
import { StudentFines } from "@/components/fines/student-fines";
import { requireUser } from "@/lib/session";
import { listFines } from "@/lib/fines.service";
import { onlinePaymentsEnabled } from "@/lib/payments.service";
import { getCurrency } from "@/lib/settings.service";

export const metadata = { title: "My Fines" };

export default async function StudentFinesPage() {
  const user = await requireUser();
  const [fines, currency] = await Promise.all([
    listFines({ studentId: user.id, includeRelations: true }),
    getCurrency(),
  ]);

  return (
    <div>
      <PageHeader
        title="My fines"
        description="Review fines from late returns and pay them online with a secure card or UPI checkout."
      />
      <StudentFines fines={fines as never} currency={currency} paymentsEnabled={onlinePaymentsEnabled()} />
    </div>
  );
}
