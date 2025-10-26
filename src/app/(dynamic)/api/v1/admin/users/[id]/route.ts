import { NextResponse } from "next/server";
import { getUserDetail } from "@/modules/admin/services/user.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    if (!params.id) {
        return NextResponse.json(
            { message: "User ID is required" },
            { status: 400 },
        );
    }

    const detail = await getUserDetail(params.id);

    if (!detail) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: detail });
});
