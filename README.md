# Tree-Count: X Visits = 1 Tree

## Context

Tree Count is a small web service where **shop visits lead to planting trees for customers**. The physical device is out of scope; this repository implements the service that receives its visit events.

## Included

- Backend API to register visit events.
- Customer visit and tree counters persisted in PostgreSQL.
- Dashboard with visits per hour, totals, customers, and trees planted.
- Swagger/OpenAPI documentation.
- End-to-end tests against the running Docker service.

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
│   └─────────────┘   ┌──────────────┐                   │        │
│                     │   config/    │                   │        │
│                     │ settings.ts  │                   │        │
│                     └──────────────┘                   │        │
└────────────────────────────────────────────────────────┼────────┘
                                                         │
                                                         ▼
                                                  ┌────────────┐
                                                  │ PostgreSQL │
                                                  └────────────┘

Request flow: routes/ -> crud/ -> schemas/ -> db/ -> PostgreSQL
```

### Visit Flow

```
  Device            routes/visit.ts        crud/visit.ts        crud/customer.ts       PostgreSQL
    │                     │                      │                    │                  │
    │─ POST {customerId} ▶│                      │                    │                  │
    │                     │─ recordVisit() ─────▶│                    │                  │
    │                     │                      │─ get/create ─────▶│── SELECT/INSERT ▶│
    │                     │                      │── insert visit ────────────────────▶│
    │                     │                      │─ update customer ▶│── UPDATE ───────▶│
    │◀ {customer, tree} ──│                      │                    │                  │
```

---

## Technical Decisions

- **Hono for the API server**: Hono was mentioned as part of the team's stack, so I used this project to try it in a small service. It keeps the routing code compact and straightforward.
- **Drizzle for database access**: The data layer stays close to SQL while still getting typed queries from the schema definitions.
- **PostgreSQL for persistence**: The assessment allowed simpler persistence, but PostgreSQL makes the visit and customer state durable without adding local setup thanks to Docker.
- **Vanilla TypeScript for the dashboard**: The frontend is only a dashboard, so a small browser script is enough.
- **Auto-created tables on startup**: The service creates the required tables when it boots, keeping the run instructions short.
- **End-to-end tests**: The tests call the API over HTTP against the running service, covering the main flow without mocks.
- **Swagger/OpenAPI docs**: `/docs` is the detailed API reference, while the README only shows the main device request.

---

## How to Run

### Prerequisites

- Docker

### Run

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL and the app. Tables are created automatically on boot.

Open `http://localhost:3030` for the dashboard and `http://localhost:3030/docs` for the API docs.

### Environment

All config lives in `.env`, loaded by `docker-compose` via `env_file`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3030` | Server port |
| `DATABASE_URL` | `postgres://...@db:5432/treecount` | PostgreSQL connection string (Docker internal hostname) |
| `VISITS_PER_TREE` | `5` | Number of visits required to plant one tree |

### Running tests

Tests run against the live service. Keep Docker running, then execute:

```bash
docker compose exec app pnpm run test:e2e
```

`test:e2e` waits until the API is accepting connections, then runs the test suite.

---

## Assumptions

- **Customer ID is provided by the device**: the service does not handle authentication or customer registration. The device sends a `customerId` string and the service creates the customer on first visit.
- **One visit per request**: each POST to `/api/visits` counts as exactly one visit. There is no batch or deduplication logic.
- **Visits are timestamped server-side**: the `visitedAt` timestamp is generated by the server, not sent by the device.
- **Tree threshold is global**: `VISITS_PER_TREE` applies equally to all customers.
- **Hourly aggregation is global**: the dashboard shows total visits per hour across all customers.

---

## How to use the API

The device sends one visit event per request. The main endpoint is:

`POST /api/visits`

Request body:

```json
{
  "customerId": "user-1"
}
```

Example request:

```bash
curl -X POST http://localhost:3030/api/visits \
  -H "Content-Type: application/json" \
  -d '{"customerId": "user-1"}'
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

The dashboard also uses the API to load hourly visit totals. The complete API reference is available at `http://localhost:3030/docs`.

---

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3030` | Dashboard |
| `http://localhost:3030/docs` | Swagger UI |
| `http://localhost:3030/docs/openapi.json` | OpenAPI spec |
