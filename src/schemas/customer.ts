import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
    id: text("id").primaryKey(),
    visitCount: integer("visit_count").notNull().default(0),
    treesPlanted: integer("trees_planted").notNull().default(0),
    lastConnectionAt: timestamp("last_connection_at").notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
