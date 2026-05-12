import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@schemas/index.js";
import { env } from "@/config/settings.js";

export const client = postgres(env.databaseUrl);

export const db = drizzle(client, { schema });

export async function initDb() {
    await client`
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            visit_count INTEGER NOT NULL DEFAULT 0,
            trees_planted INTEGER NOT NULL DEFAULT 0,
            last_connection_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `;
    await client`
        CREATE TABLE IF NOT EXISTS visits (
            id SERIAL PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES customers(id),
            visited_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `;
}
