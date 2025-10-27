import { NextResponse } from "next/server";

import { ApiError } from "@/lib/http-error";
import { getUserDetail } from "@/modules/admin/services/user.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { adminUserIdParamsSchema } from "@/modules/admin/users/schemas";

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
