import { getLocale, getMessages } from "next-intl/server";

import type { AppLocale } from "@/i18n/config";
import { ensureAbsoluteUrl, resolveAppUrl } from "@/lib/seo";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import MarketingLandingPage from "@/modules/marketing/landing.page";
import { MarketingMessagesProvider } from "@/modules/marketing/marketing-messages-provider";

export default async function HomePage() {
    const locale = (await getLocale()) as AppLocale;
    const settings = await getSiteSettingsPayload();
    const marketingMessages = await getMessages({
        locale,
        namespaces: ["Marketing"],
    });
    // 避免在构建时触发 Cloudflare runtime；仅读取进程环境变量
    const envAppUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = resolveAppUrl(settings, {
        envAppUrl,
    });
    const ogImageSource = settings.seoOgImage?.trim().length
        ? settings.seoOgImage.trim()
        : "/og-image.svg";
    const structuredDataImage = ensureAbsoluteUrl(ogImageSource, appUrl);
    const siteName = settings.siteName?.trim().length
        ? settings.siteName.trim()
        : undefined;
    return (
        <MarketingMessagesProvider messages={marketingMessages}>
            <MarketingLandingPage
                appUrl={appUrl}
                structuredDataImage={structuredDataImage}
                siteName={siteName}
            />
        </MarketingMessagesProvider>
    );
}
