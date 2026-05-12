import { Hono } from "hono";
import { getVisitsPerHour, recordVisit } from "@crud/visit.js";
import { env } from "@/config/settings.js";

const visitRoutes = new Hono();

visitRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const { customerId } = body;

    if (!customerId || typeof customerId !== "string" || customerId.length < 4 || customerId.length > 32) {
        return c.json({ error: "customerId must be between 4 and 32 characters" }, 400);
    }

    const { treePlanted, ...customer } = await recordVisit(customerId, env.visitsPerTree);

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
