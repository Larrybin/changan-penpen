export type StaticAboutContent = {
    title: string;
    intro: string;
    sections: Array<{
        title: string;
        description: string;
    }>;
};

export function StaticAboutPage({ content }: { content: StaticAboutContent }) {
    return (
        <div className="mx-auto max-w-3xl space-y-8 px-[var(--container-px)] py-12">
            <header className="space-y-3 text-center">
                <h1 className="font-bold text-title-sm">{content.title}</h1>
                <p className="text-balance text-muted-foreground">
                    {content.intro}
                </p>
            </header>
            <div className="space-y-6">
                {content.sections.map((section) => (
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
    );
}
