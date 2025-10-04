import { NextResponse } from "next/server";
import {
    createProduct,
    listProducts,
} from "@/modules/admin/services/catalog.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const products = await listProducts();
    return NextResponse.json({ data: products, total: products.length });
}

export async function POST(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    const body = await request.json();
    const created = await createProduct(body, result.user.email ?? "admin");
    return NextResponse.json({ data: created });
}
