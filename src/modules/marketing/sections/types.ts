export type HeroSectionData = {
    badge: string;
    emoji: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta?: string;
    primaryAriaLabel?: string;
    secondaryAriaLabel?: string;
    primaryActions?: string;
    featuresLabel?: string;
    featurePrefix?: string;
    support?: Record<string, string>;
};

export type FeaturesSectionData = {
    title: string;
    items: Array<{
        title: string;
        description: string;
    }>;
    learnMore?: string;
};

export type WhySectionItem = {
    title: string;
    description: string;
};

export type FaqSectionData = {
    title: string;
    items: Array<{
        question: string;
        answer: string;
    }>;
    supportingCopy?: string;
};

export type TrustSectionData = {
    title: string;
    description: string;
    items: Array<{
        quote: string;
        author: string;
        role: string;
    }>;
    callout?: string;
    socialProfiles?: string[];
};

export type CtaSectionData = {
    title: string;
    description: string;
    primaryCta: string;
};
