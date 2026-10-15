import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { getAllSettings, setSetting } from "@/lib/settings.service";
import { SETTING_KEYS } from "@/lib/constants";
import { updateSettingsSchema } from "@/lib/validators";
import { Role } from "@/generated/prisma/client";

export async function GET() {
  try {
    await requireApiUser();
    const settings = await getAllSettings();
    return json(settings);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const body = await request.json();
    const parsed = updateSettingsSchema.parse(body);

    await setSetting(SETTING_KEYS.FINE_RATE_PER_DAY, String(parsed.fineRatePerDay));
    await setSetting(SETTING_KEYS.LOAN_PERIOD_DAYS, String(parsed.loanPeriodDays));
    await setSetting(SETTING_KEYS.CURRENCY, parsed.currency);
    await setSetting(SETTING_KEYS.AI_PROVIDER, parsed.aiProvider);

    return json(await getAllSettings());
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}