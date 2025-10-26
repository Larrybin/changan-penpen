import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/config";
import { omitMessages } from "@/lib/intl";
import AdminLayout from "@/modules/admin/admin.layout";
import { generateAdminMetadata } from "@/modules/admin/metadata";

const ADMIN_OMIT_NAMESPACES = ["Marketing"] as const;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin",
        robots: { index: false, follow: false },
    });
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = resolveAppLocale(await getLocale());
    const allMessages = await getMessages({ locale });
    const messages = omitMessages(allMessages, ADMIN_OMIT_NAMESPACES);

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <AdminLayout>{children}</AdminLayout>
        </NextIntlClientProvider>
    );
}
