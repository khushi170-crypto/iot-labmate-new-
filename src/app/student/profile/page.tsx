import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/auth/profile-form";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const row = await db.user.findUnique({ where: { id: user.id } });
  if (!row) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Update your details and password." />
      <ProfileForm
        initial={{ id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone }}
      />
    </div>
  );
}