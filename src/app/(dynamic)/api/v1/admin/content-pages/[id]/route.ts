import { NextResponse } from "next/server";
import {
    type ContentPageInput,
    deleteContentPage,
    getContentPageById,
    updateContentPage,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    const page = await getContentPageById(Number(params.id));
    if (!page) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: page });
});

export const PATCH = withAdminRoute<Params>(
    async ({ request, params, user }) => {
        const body = (await request.json()) as ContentPageInput;
        const updated = await updateContentPage(
            Number(params.id),
            body,
            user.email ?? "admin",
        );
        return NextResponse.json({ data: updated });
    },
);

export const DELETE = withAdminRoute<Params>(async ({ params, user }) => {
    await deleteContentPage(Number(params.id), user.email ?? "admin");
    return NextResponse.json({ success: true });
});
