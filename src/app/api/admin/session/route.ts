import { NextResponse } from "next/server";
import { checkAdminAccessFromHeaders } from "@/modules/admin/utils/admin-access";
import { getCurrentUser } from "@/modules/auth/utils/auth-utils";

export async function GET(request: Request) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const allowed = await checkAdminAccessFromHeaders(
        request.headers,
        user.email,
    );

    if (!allowed) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user });
}
