import { z } from "zod";

export const visitRequestSchema = z.object({
    customerId: z
        .string()
        .min(4, "customerId must be at least 4 characters")
        .max(32, "customerId must be at most 32 characters"),
    idempotencyKey: z
        .string()
        .min(1, "idempotencyKey must be at least 1 character")
        .max(64, "idempotencyKey must be at most 64 characters")
        .optional(),
});

export type VisitRequest = z.infer<typeof visitRequestSchema>;
