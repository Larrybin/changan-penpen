import { loadStaticConfigSync } from "@/lib/static-config";
import {
    type StaticAboutContent,
    StaticAboutPage,
} from "@/modules/static-pages/about";

export const dynamic = "force-static";

export default function AboutPage() {
    const config = loadStaticConfigSync("en");
    const page = config.messages.StaticPages.about as StaticAboutContent;
    const structuredData = (
        config.metadata.structuredData as Record<string, unknown>
    ).about;
    return (
        <>
            <StaticAboutPage content={page} />
            <script
                id="about-structured-data"
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data must be embedded as raw JSON
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData ?? {}),
                }}
            />
        </>
    );
}
