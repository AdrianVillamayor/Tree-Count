import { sql } from "drizzle-orm";
import { db } from "@db/index.js";
import { createCustomer, getCustomer, updateCustomerVisit } from "@crud/customer.js";
import type { Customer } from "@schemas/customer.js";
import { visits } from "@schemas/visit.js";

type VisitRegistration = Customer & { treePlanted: boolean };

export async function createVisit(customerId: string) {
    const rows = await db
        .insert(visits)
        .values({ customerId })
        .returning();
    return rows[0];
}

export async function recordVisit(customerId: string, visitsPerTree: number): Promise<VisitRegistration> {
    let customer = await getCustomer(customerId);
    if (!customer) {
        customer = await createCustomer(customerId);
    }

    await createVisit(customerId);

    const visitCount = customer.visitCount + 1;
    const treesToAdd = Math.floor(visitCount / visitsPerTree) - Math.floor(customer.visitCount / visitsPerTree);
    const treesPlanted = customer.treesPlanted + treesToAdd;
    const updatedCustomer = await updateCustomerVisit(customerId, visitCount, treesPlanted);

    return {
        ...updatedCustomer,
        treePlanted: treesToAdd > 0,
    };
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
