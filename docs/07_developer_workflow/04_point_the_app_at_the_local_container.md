---
title: "Exercise 07 - Task 04 — Point the App at the Local DocumentDB Container"
layout: default
nav_order: 4
parent: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
---

# Task 04 — Point the App at the Local DocumentDB Container

The container holds a verified copy of the catalog. Now point the application at it — the payoff of the whole exercise. You change **one** line of configuration; the application code, the `mongodb` driver, the routes, and the queries are all untouched. From here on, local development runs against the same engine as production.

## Swap the connection string

Open `src/server/.env` and set `BOOKSTORE_DB_CONNECTION_STRING` to the local DocumentDB container string (it currently holds the Azure SRV string from the Exercise 05 cutover). Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@10.0.0.5:10260/?tls=true&tlsAllowInvalidCertificates=true
PORT=8080
```

Save with `Ctrl+S`.

## Run the app

From the `src/` directory, start both tiers:

```powershell
cd src
npm run develop
```

### Expected output

`concurrently` interleaves the server and Vite client logs. The two lines that confirm the app is ready are the Vite URL and the db-layer's connect message, now naming the container:

```
[1]   ➜  Local:   http://localhost:3000/
[0] Server is running on port 8080
[0] DocumentDB connected to 10.0.0.5:10260
```

The `DocumentDB connected to 10.0.0.5:10260` line is logged by the db layer once the driver connects — the same code path that named the MongoDB container earlier in the lab and the Azure cluster after the cutover. Only the host differs.

## Verify identical behavior

Open `http://localhost:3000` and exercise the app:

1. **Browse** — scroll the home page; more books load as you reach the bottom (infinite scroll).
2. **View detail** — open a book; the detail page renders with full fields.
3. **Write** — add a comment on a book and reload to confirm it persists.

This is the same known-good behavior from earlier in the lab, now served from the local DocumentDB container — and because the engine matches production, anything that works here works in Azure.

## Success criteria

The app logs `DocumentDB connected to 10.0.0.5:10260`, and reads and writes work end-to-end at `http://localhost:3000` against the container.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App hangs on startup or fails to connect | The container is stopped | `docker ps`; if `documentdb` is absent, `docker start documentdb`. |
| A **TLS / certificate** error in the server log | The connection string is missing the TLS options | The value must end with `?tls=true&tlsAllowInvalidCertificates=true`. |
| A port is already in use | A previous `npm run develop` is still running | Stop it with `Ctrl+C` in its terminal. |

Leave the app running. In **Task 05** you will switch it between this local container and Azure DocumentDB by changing only the connection string.
