import { getLocale } from "next-intl/server";

import { resolveAppLocale } from "@/i18n/config";
import { ensureAbsoluteUrl, resolveAppUrl } from "@/lib/seo";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import MarketingLandingPage from "@/modules/marketing/landing.page";

export default async function HomePage() {
    const locale = resolveAppLocale(await getLocale());
    const settings = await getSiteSettingsPayload();
    // 避免在构建时触发 Cloudflare runtime；仅读取进程环境变量
    const envAppUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = resolveAppUrl(settings, {
        envAppUrl,
    });
    const defaultLocale = settings.defaultLanguage;
    const localizedOgImage =
        settings.seoOgImageLocalized?.[defaultLocale]?.trim() ?? "";
    const ogImageSource = localizedOgImage.length
        ? localizedOgImage
        : settings.seoOgImage?.trim().length
          ? settings.seoOgImage.trim()
          : "/og-image.svg";
    const structuredDataImage = ensureAbsoluteUrl(ogImageSource, appUrl);
    const siteName = settings.siteName?.trim().length
        ? settings.siteName.trim()
        : undefined;
    return (
        <MarketingLandingPage
            appUrl={appUrl}
            structuredDataImage={structuredDataImage}
            siteName={siteName}
            locale={locale}
        />
    );
}
