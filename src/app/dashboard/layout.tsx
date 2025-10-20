import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Toast from "@/components/ui/toast";
import { resolveAppLocale } from "@/i18n/config";
import { omitMessages } from "@/lib/intl";
import DashboardLayout from "@/modules/dashboard/dashboard.layout";

const DASHBOARD_OMIT_NAMESPACES = ["Marketing"] as const;

export const dynamic = "force-dynamic";

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = resolveAppLocale(await getLocale());
    const allMessages = await getMessages({ locale });
    const messages = omitMessages(allMessages, DASHBOARD_OMIT_NAMESPACES);

    return (
        <>
            <NextIntlClientProvider locale={locale} messages={messages}>
                <DashboardLayout>{children}</DashboardLayout>
            </NextIntlClientProvider>
            <Toast />
        </>
    );
}
