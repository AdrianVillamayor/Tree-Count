import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = "http://localhost:3030";

async function post(path: string, body: object) {
    return fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

async function get(path: string) {
    return fetch(`${BASE}${path}`);
}

describe("API E2E", () => {
    const testCustomerId = `test-${Date.now()}`;

    it("GET /api/health returns 200", async () => {
        const res = await get("/api/health");
        assert.equal(res.status, 200);
        assert.equal(await res.text(), "OK");
    });

    it("GET /api/customers returns 200", async () => {
        const res = await get("/api/customers");
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.ok(Array.isArray(data));
    });

    it("POST /api/visits without customerId returns 400", async () => {
        const res = await post("/api/visits", {});
        assert.equal(res.status, 400);
    });

    it("POST /api/visits creates visit and customer", async () => {
        const res = await post("/api/visits", { customerId: testCustomerId });
        assert.equal(res.status, 201);

        const data = await res.json();
        assert.equal(data.customer.id, testCustomerId);
        assert.equal(data.customer.visitCount, 1);
        assert.equal(data.treePlanted, false);
    });

    it("GET /api/customers/:id returns created customer", async () => {
        const res = await get(`/api/customers/${testCustomerId}`);
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.equal(data.id, testCustomerId);
        assert.equal(data.visitCount, 1);
    });

    it("GET /api/customers/:id returns 404 for unknown", async () => {
        const res = await get("/api/customers/does-not-exist");
        assert.equal(res.status, 404);
    });

    it("POST /api/visits increments visit count", async () => {
        const res = await post("/api/visits", { customerId: testCustomerId });
        const data = await res.json();
        assert.equal(data.customer.visitCount, 2);
    });

    it("POST /api/visits plants tree after X visits", async () => {
        // Already at 2, send 3 more to reach 5
        for (let i = 0; i < 2; i++) {
            await post("/api/visits", { customerId: testCustomerId });
        }

        const res = await post("/api/visits", { customerId: testCustomerId });
        const data = await res.json();

        assert.equal(data.customer.visitCount, 5);
        assert.equal(data.customer.treesPlanted, 1);
        assert.equal(data.treePlanted, true);
    });

    it("GET /api/visits/per-hour returns aggregated data", async () => {
        const res = await get("/api/visits/per-hour");
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.ok(Array.isArray(data));
        assert.ok(data.length > 0);
        assert.ok(data[0].hour);
        assert.ok(data[0].count > 0);
    });

    it("GET /api/config returns visitsPerTree", async () => {
        const res = await get("/api/config");
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.equal(data.visitsPerTree, 5);
    });

    it("GET /docs/openapi.json returns OpenAPI spec", async () => {
        const res = await get("/docs/openapi.json");
        assert.equal(res.status, 200);

        const data = await res.json();
        assert.equal(data.openapi, "3.0.3");
        assert.ok(data.paths["/api/visits"]);
        assert.ok(data.paths["/api/health"]);
    });
});
