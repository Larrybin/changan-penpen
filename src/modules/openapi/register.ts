import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { registerAdminPaths } from "./registrations/admin";
import { registerCreditsPaths } from "./registrations/credits";
import { registerServerActionPaths } from "./registrations/server-actions";
import { registerSummarizePaths } from "./registrations/summarize";
import { registerUsagePaths } from "./registrations/usage";

export function registerAllOpenApiPaths(registry: OpenAPIRegistry) {
    registerSummarizePaths(registry);
    registerUsagePaths(registry);
    registerCreditsPaths(registry);
    registerAdminPaths(registry);
    registerServerActionPaths(registry);
}
