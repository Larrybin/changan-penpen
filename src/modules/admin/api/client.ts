import { createApiClient } from "@/lib/api-client";

export const adminApiClient = createApiClient({
    baseUrl: "/api/v1/admin",
    credentials: "include",
});
