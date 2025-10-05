import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import SignUpPage from "@/modules/auth/signup.page";
import type { AppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { signup } = context.messages;
    return createMetadata(context, {
        path: "/signup",
        title: signup.title,
        description: signup.description,
        robots: {
            index: false,
            follow: false,
        },
    });
}

export default async function Page() {
    return <SignUpPage />;
}
