import { NextResponse } from "next/server";

import { ApiError } from "@/lib/http-error";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { adminUserIdParamsSchema } from "@/modules/users-admin/schemas";
import { getUserDetail } from "@/modules/users-admin/services/user.service";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    const parsed = adminUserIdParamsSchema.parse(params);

    const detail = await getUserDetail(parsed.id);

    if (!detail) {
        throw new ApiError("Not found", { status: 404, code: "NOT_FOUND" });
    }

    return NextResponse.json({ data: detail });
});
