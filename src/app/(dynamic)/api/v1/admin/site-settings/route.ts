import { NextResponse } from "next/server";
import {
    getSiteSettingsPayload,
    type UpdateSiteSettingsInput,
    updateSiteSettings,
} from "@/modules/admin/services/site-settings.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const GET = withAdminRoute(async () => {
    const settings = await getSiteSettingsPayload();
    return NextResponse.json({ data: settings });
});

export const PATCH = withAdminRoute(async ({ request, user }) => {
    const body = (await request.json()) as UpdateSiteSettingsInput;
    const updated = await updateSiteSettings(body, user.email ?? "admin");
    return NextResponse.json({ data: updated });
});
