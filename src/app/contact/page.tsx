import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("contact.title"),
        description: t("contact.description"),
    };
}

export default async function ContactPage() {
    const t = await getTranslations("StaticPages.contact");
    const sections = t.raw("sections") as Array<{
        title: string;
        description: string;
    }>;
    const details = t.raw("details") as Array<{
        label: string;
        value: string;
    }>;

    return (
        <div className="mx-auto max-w-3xl px-[var(--container-px)] py-12 space-y-8">
            <header className="space-y-3 text-center">
                <h1 className="text-title-sm font-bold">{t("title")}</h1>
                <p className="text-muted-foreground text-balance">
                    {t("intro")}
                </p>
            </header>
            <section className="bg-muted/40 border border-border rounded-lg p-6">
                <ul className="space-y-3 text-sm text-foreground">
                    {details.map((detail) => (
                        <li
                            key={detail.label}
                            className="flex flex-col xs:flex-row xs:items-center xs:justify-between"
                        >
                            <span className="font-medium">{detail.label}</span>
                            <span className="text-muted-foreground xs:text-right">
                                {detail.value}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
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
