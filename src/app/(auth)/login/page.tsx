import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import LoginPage from "@/modules/auth/login.page";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { login } = context.messages;
    return createMetadata(context, {
        path: "/login",
        title: login.title,
        description: login.description,
        robots: {
            index: false,
            follow: false,
        },
    });
}

export default async function Page() {
    return <LoginPage />;
}
