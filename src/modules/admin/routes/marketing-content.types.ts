export interface MarketingSectionParams {
    locale: string;
    section: string;
}

export type MarketingSectionRouteContext = {
    params: MarketingSectionParams;
};
