import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireUser } from "@/lib/session";
import { getAllSettings, hasLlmApiKey } from "@/lib/settings.service";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser();
  const settings = await getAllSettings();

  return (
    <div>
      <PageHeader
        title="Lab settings"
        description="Configure loan periods, fine rates and the AI engine."
      />
      <SettingsForm
        initial={{
          fineRatePerDay: settings.fineRatePerDay,
          loanPeriodDays: settings.loanPeriodDays,
          currency: settings.currency,
          aiProvider: settings.aiProvider,
        }}
        llmConfigured={hasLlmApiKey()}
      />
    </div>
  );
}