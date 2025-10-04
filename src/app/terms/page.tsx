import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("terms.title"),
        description: t("terms.description"),
    };
}

export default async function TermsPage() {
    const t = await getTranslations("StaticPages.terms");
    const sections = t.raw("sections") as Array<{
        title: string;
        description: string;
    }>;

    return (
        <div className="mx-auto max-w-3xl px-[var(--container-px)] py-12 space-y-8">
            <header className="space-y-3 text-center">
                <h1 className="text-title-sm font-bold">{t("title")}</h1>
                <p className="text-muted-foreground text-balance">
                    {t("intro")}
                </p>
            </header>
            <div className="space-y-6">
                {sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                        <h2 className="text-xl font-semibold text-foreground">
                            {section.title}
                        </h2>
                        <p className="text-muted-foreground text-balance">
                            {section.description}
                        </p>
                    </section>
                ))}
            </div>
        </div>
    );
}
