import { NextResponse } from "next/server";
import {
    getSiteSettingsPayload,
    updateSiteSettings,
    type UpdateSiteSettingsInput,
} from "@/modules/admin/services/site-settings.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const settings = await getSiteSettingsPayload();
    return NextResponse.json({ data: settings });
}

export async function PATCH(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    const body = (await request.json()) as UpdateSiteSettingsInput;
    const updated = await updateSiteSettings(
        body,
        result.user.email ?? "admin",
    );
    return NextResponse.json({ data: updated });
}
