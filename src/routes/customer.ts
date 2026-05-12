import { Hono } from "hono";
import { getCustomer, getAllCustomers } from "@crud/customer.js";

const customerRoutes = new Hono();

customerRoutes.get("/", async (c) => {
    const customers = await getAllCustomers();
    return c.json(customers);
});

customerRoutes.get("/:id", async (c) => {
    const customer = await getCustomer(c.req.param("id"));
    if (!customer) {
        return c.json({ error: "Customer not found" }, 404);
    }
    return c.json(customer);
});

export { customerRoutes };
