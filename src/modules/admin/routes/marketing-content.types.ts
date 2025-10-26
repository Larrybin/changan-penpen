export type MarketingSectionRouteContext = {
    params: Promise<{
        locale: string;
        section: string;
    }>;
};
