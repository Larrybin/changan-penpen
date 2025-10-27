import { NextResponse } from "next/server";
import {
    createProduct,
    listProducts,
    type ProductInput,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const GET = withAdminRoute(async () => {
    const products = await listProducts();
    return NextResponse.json({ data: products, total: products.length });
});

export const POST = withAdminRoute(async ({ request, user }) => {
    const body = (await request.json()) as ProductInput;
    const created = await createProduct(body, user.email ?? "admin");
    return NextResponse.json({ data: created });
});
