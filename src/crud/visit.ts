import { eq, sql } from "drizzle-orm";
import { db } from "@db/index.js";
import { customers } from "@schemas/customer.js";
import type { Customer } from "@schemas/customer.js";
import { visits } from "@schemas/visit.js";
import { calculateNewTrees } from "@/domain/trees.js";

type VisitRegistration = Customer & { treePlanted: boolean };

export async function recordVisit(
    customerId: string,
    visitsPerTree: number,
    idempotencyKey?: string,
): Promise<VisitRegistration> {
    return db.transaction(async (tx) => {
        // Upsert customer: create if not exists, no-op if exists
        await tx.insert(customers).values({ id: customerId }).onConflictDoNothing();

        // Insert visit with optional idempotency key
        const visitInsert = await tx.insert(visits)
            .values({
                customerId,
                ...(idempotencyKey ? { idempotencyKey } : {}),
            })
            .onConflictDoNothing()
            .returning();

        // Duplicate request — return current state without incrementing
        if (idempotencyKey && visitInsert.length === 0) {
            const [customer] = await tx.select().from(customers).where(eq(customers.id, customerId));
            return { ...customer, treePlanted: false };
        }

        // Atomic counter update SQL-level arithmetic prevents lost updates
        // PostgreSQL serializes concurrent UPDATEs on the same row:
        // second transaction waits for first to commit, then re-reads row
        const [updated] = await tx.update(customers)
            .set({
                visitCount: sql`visit_count + 1`,
                treesPlanted: sql`trees_planted + (floor((visit_count + 1)::numeric / ${visitsPerTree}) - floor(visit_count::numeric / ${visitsPerTree}))::int`,
                lastConnectionAt: new Date(),
            })
            .where(eq(customers.id, customerId))
            .returning();

        // Derive treePlanted flag from the post-update state only
        const treePlanted = calculateNewTrees(updated.visitCount - 1, visitsPerTree) > 0;

        return { ...updated, treePlanted };
    });
}

export async function getVisitsPerHour() {
    return db
        .select({
            hour: sql<string>`to_char(${visits.visitedAt}, 'YYYY-MM-DD HH24:00')`.as("hour"),
            count: sql<number>`count(*)::int`.as("count"),
        })
        .from(visits)
        .groupBy(sql`to_char(${visits.visitedAt}, 'YYYY-MM-DD HH24:00')`)
        .orderBy(sql`hour DESC`);
}
