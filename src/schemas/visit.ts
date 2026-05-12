import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { customers } from "@schemas/customer.js";

export const visits = pgTable("visits", {
    id: serial("id").primaryKey(),
    customerId: text("customer_id")
        .notNull()
        .references(() => customers.id),
    visitedAt: timestamp("visited_at").notNull().defaultNow(),
});

export type Visit = typeof visits.$inferSelect;
