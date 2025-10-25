import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
    // Uncomment to enable R2 cache,
    // It should be imported as:
    // `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
    // See https://opennext.js.org/cloudflare/caching for more details
    // incrementalCache: r2IncrementalCache,
});

config.functions = {
    ogImage: {
        runtime: "edge",
        routes: ["app/opengraph-image/route"],
        patterns: ["/opengraph-image*"],
    },
};

export default config;
