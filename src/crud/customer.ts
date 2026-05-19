import { eq } from "drizzle-orm";
import { db } from "@db/index.js";
import { customers } from "@schemas/customer.js";

export async function getCustomer(id: string) {
    const rows = await db.select().from(customers).where(eq(customers.id, id));
    return rows[0];
}

export async function getAllCustomers() {
    return db.select().from(customers);
}

export async function createCustomer(id: string) {
    const rows = await db
        .insert(customers)
        .values({ id })
        .returning();
    return rows[0];
}
