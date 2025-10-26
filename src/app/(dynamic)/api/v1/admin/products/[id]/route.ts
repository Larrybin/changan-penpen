import { NextResponse } from "next/server";
import {
    deleteProduct,
    getProductById,
    type ProductInput,
    updateProduct,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    const product = await getProductById(Number(params.id));
    if (!product) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
});

export const PATCH = withAdminRoute<Params>(
    async ({ request, params, user }) => {
        const body = (await request.json()) as ProductInput;
        const updated = await updateProduct(
            Number(params.id),
            body,
            user.email ?? "admin",
        );
        return NextResponse.json({ data: updated });
    },
);

export const DELETE = withAdminRoute<Params>(async ({ params, user }) => {
    await deleteProduct(Number(params.id), user.email ?? "admin");
    return NextResponse.json({ success: true });
});
