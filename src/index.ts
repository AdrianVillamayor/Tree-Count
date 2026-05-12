import { serve } from "@hono/node-server";
import { env } from "@/config/settings.js";
import { app } from "@/app.js";
import { initDb } from "@db/index.js";

await initDb();

serve({ fetch: app.fetch, port: env.port }, () => {
    console.log(`Server running on http://localhost:${env.port}`);
});
