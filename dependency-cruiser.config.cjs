/**
 * Dependency-cruiser configuration enforcing admin 子域之间的边界。
 */
module.exports = {
    extends: "dependency-cruiser/configs/recommended",
    forbidden: [
        {
            name: "no-cross-tenant-admin",
            severity: "error",
            comment:
                "Tenant 管理模块只能依赖自身、admin-shared 或平台层能力",
            from: { path: "^src/modules/tenant-admin/" },
            to: {
                path: "^src/modules/admin/(?!shared)",
            },
        },
        {
            name: "no-cross-users-admin",
            severity: "error",
            comment:
                "Users 管理模块只能依赖自身、admin-shared 或平台层能力",
            from: { path: "^src/modules/users-admin/" },
            to: {
                path: "^src/modules/admin/(?!shared)",
            },
        },
        {
            name: "no-cross-module-internals",
            severity: "warn",
            comment:
                "一个子域不应直接引用其它子域的内部实现文件",
            from: { path: "^src/modules/([a-z0-9-]+)/" },
            to: {
                path: "^src/modules/(?!admin-shared)(?!\\1)[a-z0-9-]+/",
            },
        },
    ],
    options: {
        doNotFollow: {
            dependencyTypes: ["npm", "npm-dev"],
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: "tsconfig.json",
        },
        enhancedResolveOptions: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
    },
};
