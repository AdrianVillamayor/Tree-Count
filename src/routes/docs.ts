import { Hono } from "hono";

const docsRoutes = new Hono();

const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Tree Count API",
        description: "X Visits = 1 Tree — Shop visit tracking service",
        version: "1.0.0",
    },
    paths: {
        "/api/visits": {
            post: {
                summary: "Register a visit",
                description: "Records a customer visit from a device. Creates the customer if it doesn't exist. Plants a tree after every X visits.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["customerId"],
                                properties: {
                                    customerId: { type: "string", minLength: 4, maxLength: 32, example: "user-1" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Visit registered",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        customer: { $ref: "#/components/schemas/Customer" },
                                        treePlanted: { type: "boolean" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "customerId must be between 4 and 32 characters" },
                },
            },
        },
        "/api/visits/per-hour": {
            get: {
                summary: "Get visits aggregated per hour",
                responses: {
                    "200": {
                        description: "Visits per hour",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            hour: { type: "string", example: "2026-05-11 17:00" },
                                            count: { type: "integer", example: 5 },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/customers": {
            get: {
                summary: "Get all customers",
                responses: {
                    "200": {
                        description: "List of customers",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Customer" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/customers/{id}": {
            get: {
                summary: "Get customer by ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Customer found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Customer" },
                            },
                        },
                    },
                    "404": { description: "Customer not found" },
                },
            },
        },
        "/api/config": {
            get: {
                summary: "Get service configuration",
                responses: {
                    "200": {
                        description: "Current config",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        visitsPerTree: { type: "integer", example: 5 },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/health": {
            get: {
                summary: "Health check",
                description: "Returns OK when the API process is accepting requests.",
                responses: {
                    "200": {
                        description: "Service is healthy",
                        content: {
                            "text/plain": {
                                schema: { type: "string", example: "OK" },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            Customer: {
                type: "object",
                properties: {
                    id: { type: "string", example: "user-1" },
                    visitCount: { type: "integer", example: 5 },
                    treesPlanted: { type: "integer", example: 1 },
                    lastConnectionAt: { type: "string", format: "date-time" },
                },
            },
        },
    },
};

docsRoutes.get("/openapi.json", (c) => c.json(openApiSpec));

docsRoutes.get("/", (c) => {
    return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tree Count — API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({ url: "/docs/openapi.json", dom_id: "#swagger-ui" });
    </script>
</body>
</html>`);
});

export { docsRoutes };
