import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: [
        "./src/schemas/customer.ts",
        "./src/schemas/visit.ts",
    ],
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgres://postgres:postgres@db:5432/treecount",
    },
});
