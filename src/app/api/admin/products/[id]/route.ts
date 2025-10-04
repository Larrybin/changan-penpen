import { NextResponse } from "next/server";
import {
    deleteProduct,
    getProductById,
    updateProduct,
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

    const product = await getProductById(Number(params.id));
    if (!product) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
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
    const updated = await updateProduct(
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

    await deleteProduct(Number(params.id), result.user.email ?? "admin");
    return NextResponse.json({ success: true });
}
