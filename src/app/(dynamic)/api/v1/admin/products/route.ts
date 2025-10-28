import { NextResponse } from "next/server";
import { products } from "@/db";
import {
    createProduct,
    listProducts,
    type ProductInput,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

type ProductSelectableField = keyof typeof products.$inferSelect;

function resolveFields(values: string[]): ProductSelectableField[] {
    const seen = new Set<string>();
    const resolved: ProductSelectableField[] = [];
    values.forEach((value) => {
        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) {
            return;
        }
        if (trimmed in products) {
            seen.add(trimmed);
            resolved.push(trimmed as ProductSelectableField);
        }
    });
    return resolved;
}

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const rawFields = url.searchParams.getAll("fields");
    const candidateFields = rawFields.flatMap((entry) => entry.split(","));
    const fields = resolveFields(candidateFields);
    const view = url.searchParams.get("view");

    const items = await listProducts({
        fields: fields.length > 0 ? fields : undefined,
        view: view ?? null,
    });

    return NextResponse.json({ data: items, total: items.length });
});

export const POST = withAdminRoute(async ({ request, user }) => {
    const body = (await request.json()) as ProductInput;
    const created = await createProduct(body, user.email ?? "admin");
    return NextResponse.json({ data: created });
});
