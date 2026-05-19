import { pgTable, text, serial, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { customers } from "@schemas/customer.js";

export const visits = pgTable("visits", {
    id: serial("id").primaryKey(),
    customerId: text("customer_id")
        .notNull()
        .references(() => customers.id),
    visitedAt: timestamp("visited_at").notNull().defaultNow(),
    idempotencyKey: text("idempotency_key"),
}, (table) => ({
    idxCustomerId: index("idx_visits_customer_id").on(table.customerId),
    idxVisitedAt: index("idx_visits_visited_at").on(table.visitedAt),
    idxIdempotencyKey: uniqueIndex("idx_visits_idempotency_key").on(table.idempotencyKey),
}));

export type Visit = typeof visits.$inferSelect;
