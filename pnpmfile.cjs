const TRIM = process.env.PNPM_TRIM_INSTALL === "true";

function dropByPattern(source, patterns) {
    if (!source) {
        return;
    }

    for (const pattern of patterns) {
        for (const name of Object.keys(source)) {
            if (pattern.test(name)) {
                delete source[name];
            }
        }
    }
}

function keepOnly(source, allowList) {
    if (!source) {
        return;
    }

    for (const name of Object.keys(source)) {
        if (!allowList.includes(name)) {
            delete source[name];
        }
    }
}

module.exports = {
    hooks: {
        readPackage(pkg, context) {
            if (!TRIM) {
                return pkg;
            }

            switch (pkg.name) {
                case "next": {
                    if (pkg.optionalDependencies) {
                        keepOnly(pkg.optionalDependencies, [
                            "@next/swc-linux-x64-gnu",
                        ]);
                    }
                    break;
                }
                case "@biomejs/biome": {
                    if (pkg.optionalDependencies) {
                        keepOnly(pkg.optionalDependencies, [
                            "@biomejs/cli-linux-x64-gnu",
                        ]);
                    }
                    break;
                }
                case "sharp": {
                    if (pkg.optionalDependencies) {
                        keepOnly(pkg.optionalDependencies, [
                            "@img/sharp-linux-x64",
                            "@img/sharp-libvips-linux-x64",
                        ]);
                    }
                    break;
                }
                case "@cloudflare/workerd": {
                    if (pkg.optionalDependencies) {
                        keepOnly(pkg.optionalDependencies, []);
                    }
                    break;
                }
                case "@opennextjs/cloudflare": {
                    if (pkg.dependencies) {
                        dropByPattern(pkg.dependencies, [
                            /^cloudflare$/i,
                            /^rclone\.js$/i,
                            /^@dotenvx\/dotenvx$/i,
                        ]);
                    }
                    break;
                }
                default: {
                    break;
                }
            }

            if (pkg.name === "next-cf-app") {
                const dropFromRoot = [
                    "@opennextjs/cloudflare",
                    "typescript",
                    "@biomejs/biome",
                    "wrangler",
                    "miniflare",
                    "@cloudflare/workerd",
                ];

                for (const depField of [
                    "dependencies",
                    "devDependencies",
                    "optionalDependencies",
                    "peerDependencies",
                ]) {
                    const container = pkg[depField];
                    if (!container) {
                        continue;
                    }

                    for (const name of dropFromRoot) {
                        delete container[name];
                    }
                }
            }

            return pkg;
        },
    },
};
