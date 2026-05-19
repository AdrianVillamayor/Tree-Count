import { Hono } from "hono";
import { getVisitsPerHour, recordVisit } from "@crud/visit.js";
import { env } from "@/config/settings.js";
import { visitRequestSchema } from "@/validation/visit.js";

const visitRoutes = new Hono();

visitRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const parsed = visitRequestSchema.safeParse(body);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return c.json({ error: firstError.message }, 400);
    }

    const { customerId, idempotencyKey } = parsed.data;
    const { treePlanted, ...customer } = await recordVisit(customerId, env.visitsPerTree, idempotencyKey);

    return c.json({
        customer,
        treePlanted,
    }, 201);
});

visitRoutes.get("/per-hour", async (c) => {
    const data = await getVisitsPerHour();
    return c.json(data);
});

export { visitRoutes };
