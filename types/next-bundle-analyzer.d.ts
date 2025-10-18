declare module "@next/bundle-analyzer" {
    interface BundleAnalyzerConfig {
        enabled?: boolean;
        analyzerMode?: "server" | "static" | "disabled" | string;
        openAnalyzer?: boolean;
        generateStatsFile?: boolean;
        statsFilename?: string;
    }

    type ConfigEnhancer<T> = (config: T) => T;

    export default function createBundleAnalyzer<T = Record<string, unknown>>(
        options?: BundleAnalyzerConfig,
    ): ConfigEnhancer<T>;
}
