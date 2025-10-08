import { getCloudflareContext } from "@opennextjs/cloudflare";

import { ensureAbsoluteUrl, resolveAppUrl } from "@/lib/seo";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import MarketingLandingPage from "@/modules/marketing/landing.page";

export default async function HomePage() {
    const settings = await getSiteSettingsPayload();
    const { env } = await getCloudflareContext({ async: true });
    const appUrl = resolveAppUrl(settings, {
        envAppUrl: env.NEXT_PUBLIC_APP_URL,
    });
    const ogImageSource = settings.seoOgImage?.trim().length
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
        />
    );
}
