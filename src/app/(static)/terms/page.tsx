import { loadStaticConfigSync } from "@/lib/static-config";

type StaticPolicyPage = {
    title: string;
    intro: string;
    sections: Array<{ title: string; description: string }>;
};

export const dynamic = "force-static";

export default function TermsPage() {
    const config = loadStaticConfigSync("en");
    const page = config.messages.StaticPages.terms as StaticPolicyPage;
    const structuredData = (
        config.metadata.structuredData as Record<string, unknown>
    ).terms;
    const sections = Array.isArray(page.sections) ? page.sections : [];
    return (
        <>
            <div className="mx-auto max-w-3xl space-y-8 px-[var(--container-px)] py-12">
                <header className="space-y-3 text-center">
                    <h1 className="font-bold text-title-sm">{page.title}</h1>
                    <p className="text-balance text-muted-foreground">
                        {page.intro}
                    </p>
                </header>
                <div className="space-y-6">
                    {sections.map((section) => (
                        <section key={section.title} className="space-y-2">
                            <h2 className="font-semibold text-foreground text-xl">
                                {section.title}
                            </h2>
                            <p className="text-balance text-muted-foreground">
                                {section.description}
                            </p>
                        </section>
                    ))}
                </div>
            </div>
            <script
                id="terms-structured-data"
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data must be embedded as raw JSON
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData ?? {}),
                }}
            />
        </>
    );
}
