import { NextResponse } from "next/server";
import {
    deleteContentPage,
    getContentPageById,
    updateContentPage,
} from "@/modules/admin/services/catalog.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const page = await getContentPageById(Number(params.id));
    if (!page) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: page });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    const body = await request.json();
    const updated = await updateContentPage(
        Number(params.id),
        body,
        result.user.email ?? "admin",
    );
    return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    await deleteContentPage(Number(params.id), result.user.email ?? "admin");
    return NextResponse.json({ success: true });
}
