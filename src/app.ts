import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { routes } from "@routes/index.js";
import { docsRoutes } from "@routes/docs.js";

const app = new Hono();

app.use("*", logger());
app.route("/api", routes);
app.route("/docs", docsRoutes);

app.use("/static/*", serveStatic({ root: "src/public", rewriteRequestPath: (path) => path.replace("/static", "") }));

app.get("/", serveStatic({ root: "src/public", path: "index.html" }));

export { app };
