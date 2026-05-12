import { Hono } from "hono";
import { customerRoutes } from "./customer.js";
import { visitRoutes } from "./visit.js";
import { env } from "@/config/settings.js";

const routes = new Hono();

routes.get("/config", (c) => c.json({ visitsPerTree: env.visitsPerTree }));

routes.get("/health", (c) => c.text("OK"));

routes.route("/customers", customerRoutes);
routes.route("/visits", visitRoutes);

export { routes };
