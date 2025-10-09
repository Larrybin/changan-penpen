import { getCloudflareContext } from "@opennextjs/cloudflare";

import { ensureAbsoluteUrl, resolveAppUrl } from "@/lib/seo";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import MarketingLandingPage from "@/modules/marketing/landing.page";

export default async function HomePage() {
    const settings = await getSiteSettingsPayload();
    let envAppUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL;
    if (!envAppUrl) {
        try {
            const { env } = await getCloudflareContext({ async: true });
            envAppUrl = env.NEXT_PUBLIC_APP_URL;
        } catch (_error) {
            envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
        }
    }
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
        <MarketingLandingPage
            appUrl={appUrl}
            structuredDataImage={structuredDataImage}
            siteName={siteName}
        />
    );
}
