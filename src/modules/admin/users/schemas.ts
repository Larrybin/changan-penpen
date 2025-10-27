import { z } from "zod/v4";

export const adminUserIdParamsSchema = z.object({
    id: z
        .string()
        .trim()
        .min(1, "User ID is required")
        .max(128, "User ID is too long"),
});

export type AdminUserIdParamsInput = z.infer<typeof adminUserIdParamsSchema>;
