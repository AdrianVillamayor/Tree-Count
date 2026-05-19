# Tree-Count: X Visits = 1 Tree

## Context

Tree Count is a small web service where **shop visits lead to planting trees for customers**. The physical device is out of scope; this repository implements the service that receives its visit events.

## Included

- Backend API to register visit events.
- Customer visit and tree counters persisted in PostgreSQL.
- Idempotent visit registration to handle device retries safely.
- Concurrent-safe writes via transactional atomic counters.
- Request validation with Zod schemas.
- Dashboard with visits per hour, totals, customers, and trees planted.
- Swagger/OpenAPI documentation.
- Unit tests for domain logic and end-to-end tests against the running Docker service.

---

## Architecture

```
  ┌───────────────┐               ┌─────────────────────┐
  │    Device     │               │      Browser        │
  │ (out of scope)│               │ Dashboard · Docs    │
  └──────┬────────┘               └──────────┬──────────┘
         │                                   │
         │  POST /api/visits {customerId}    │  GET / · GET /docs · GET /api/*
         ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Hono Server (:3030)                        │
│                                                                 │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐   │
│   │  routes/    │  │   crud/      │  │ schemas/ │  │  db/   │   │
│   │             │  │              │  │          │  │        │   │
│   │ visit.ts    │─▶│ customer.ts  │─▶│ customer │─▶│index.ts│   │
│   │ customer.ts │  │ visit.ts     │  │ visit    │  │        │   │
│   │ docs.ts     │  └──────────────┘  └──────────┘  └───┬────┘   │
│   │ index.ts    │                                      │        │
│   └─────────────┘  ┌──────────────┐  ┌──────────┐     │        │
│                    │  domain/     │  │validation│     │        │
│                    │  trees.ts    │  │ visit.ts │     │        │
│                    └──────────────┘  └──────────┘     │        │
│                    ┌──────────────┐                    │        │
│                    │   config/    │                    │        │
│                    │ settings.ts  │                    │        │
│                    └──────────────┘                    │        │
└───────────────────────────────────────────────────────┼────────┘
                                                        │
                                                        ▼
                                                 ┌────────────┐
                                                 │ PostgreSQL │
                                                 └────────────┘

Request flow: routes/ -> validation/ -> crud/ -> domain/ -> schemas/ -> db/ -> PostgreSQL
```

### Visit Flow

```
  Device            routes/visit.ts        crud/visit.ts              PostgreSQL
    │                     │                      │                       │
    │─ POST {customerId} ▶│                      │                       │
    │                     │─ validate (Zod) ────▶│                       │
    │                     │─ recordVisit() ─────▶│                       │
    │                     │                      │── BEGIN TRANSACTION ──▶│
    │                     │                      │── UPSERT customer ───▶│
    │                     │                      │── INSERT visit ──────▶│
    │                     │                      │── UPDATE counters ───▶│  (atomic SQL)
    │                     │                      │── COMMIT ────────────▶│
    │◀ {customer, tree} ──│                      │                       │
```

---

## Technical Decisions

- **Hono** for the API server: lightweight, Web Standards-based routing.
- **Drizzle ORM** for database access: typed queries close to SQL.
- **PostgreSQL** for persistence: durable state via Docker with no local setup.
- **Zod** for request validation: single schema drives both route validation and OpenAPI constraints.
- **Domain logic extraction**: tree-threshold calculation lives in a pure function (`domain/trees.ts`) with unit tests independent of the database.
- **Auto-created tables on startup**: the service creates tables and indices when it boots.
- **Vanilla TypeScript dashboard**: the frontend is only a dashboard, so a small browser script is enough.

### Reliability

| Concern | Solution |
|---------|----------|
| **Concurrent writes** | `recordVisit` runs inside a transaction with SQL-level arithmetic (`visit_count + 1`). PostgreSQL serializes concurrent UPDATEs on the same row, so no lost updates. |
| **Device retries** | Optional `idempotencyKey` with a unique index on `(customer_id, idempotency_key)`. Duplicate key → `ON CONFLICT DO NOTHING` → returns current state without incrementing. |
| **Query performance** | Indices on `visits.customer_id` (FK lookups) and `visits.visited_at` (hourly aggregation). |

---

## How to Run

### Prerequisites

- Docker

### Run

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL and the app. Tables and indices are created automatically on boot.

Open `http://localhost:3030` for the dashboard and `http://localhost:3030/docs` for the API docs.

### Environment

All config lives in `.env`, loaded by `docker-compose` via `env_file`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3030` | Server port |
| `DATABASE_URL` | `postgres://...@db:5432/treecount` | PostgreSQL connection string (Docker internal hostname) |
| `VISITS_PER_TREE` | `5` | Number of visits required to plant one tree |

### Running tests

**Unit tests** (no Docker needed):

```bash
pnpm run test:unit
```

**E2E tests** (requires Docker running):

```bash
docker compose exec app pnpm run test:e2e
```

`test:e2e` waits until the API is accepting connections, then runs the full test suite.

---

## How to use the API

The device sends one visit event per request. The main endpoint is:

`POST /api/visits`

Request body:

```json
{
  "customerId": "user-1",
  "idempotencyKey": "evt-abc-123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerId` | string (4-32 chars) | Yes | Customer identifier provided by the device |
| `idempotencyKey` | string (1-64 chars) | No | Deduplication key. If a visit with this key already exists, the request is a no-op |

Example request:

```bash
curl -X POST http://localhost:3030/api/visits \
  -H "Content-Type: application/json" \
  -d '{"customerId": "user-1", "idempotencyKey": "evt-abc-123"}'
```

Example response:

```json
{
  "customer": {
    "id": "user-1",
    "visitCount": 5,
    "treesPlanted": 1,
    "lastConnectionAt": "2026-05-11T17:54:29.858Z"
  },
  "treePlanted": true
}
```

The complete API reference is available at `http://localhost:3030/docs`.

---

## Assumptions

- **Customer ID is provided by the device**: the service does not handle authentication or customer registration. The device sends a `customerId` string and the service creates the customer on first visit.
- **One visit per request**: each POST to `/api/visits` counts as exactly one visit.
- **Idempotency is opt-in and scoped per customer**: devices that send an `idempotencyKey` get deduplication within the same `customerId`; those that don't will always increment counters.
- **Visits are timestamped server-side**: the `visitedAt` timestamp is generated by the server, not sent by the device.
- **Tree threshold is global**: `VISITS_PER_TREE` applies equally to all customers.
- **Hourly aggregation is global**: the dashboard shows total visits per hour across all customers.

---

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3030` | Dashboard |
| `http://localhost:3030/docs` | Swagger UI |
| `http://localhost:3030/docs/openapi.json` | OpenAPI spec |

---

## Tech Stack

| Component | Version |
|-----------|---------|
| Node.js | 22 LTS |
| Hono | 4.12 |
| Drizzle ORM | 0.45 |
| Zod | 4 |
| PostgreSQL | 16 |
| TypeScript | 6 |
