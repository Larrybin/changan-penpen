import MarketingLandingPage from "@/modules/marketing/landing.page";

import { resolveAppUrl, ensureAbsoluteUrl } from "@/lib/seo";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

export default async function HomePage() {
    const settings = await getSiteSettingsPayload();
    const appUrl = resolveAppUrl(settings);
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
