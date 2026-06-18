---
title: "Exercise 07 - Task 01 — Point the App Back at the Local MongoDB Container"
layout: default
nav_order: 1
parent: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
---

# Task 01 — Point the App Back at the Local MongoDB Container

The migration is complete, and after the Exercise 05 cutover the app's `src/server/.env` points at Azure DocumentDB. But Contoso's developers do most of their day-to-day work against a **local** MongoDB container — fast, offline, and disposable. In this task you will swap the connection string back to the local container and confirm the app behaves exactly as it did before the migration. Nothing about the code changes; only the value of one environment variable does.

## Confirm the local container is running

The MongoDB container you started in Exercise 01 has been running throughout the lab (the migration *copied* Contoso's catalog to Azure — it did not move it), so the local source data is still there. Confirm the container is up:

```powershell
docker ps
```

You should see the `mongodb` container listed with status `Up`. If it is not listed, it was stopped (for example, by a reboot) — start it again. Its replica set state and the `bookadmin` user are persisted on the container's volumes, so no re-initialization is needed:

```powershell
docker start mongodb
```

## Swap the connection string back to local

Open `src/server/.env` — the file you have been editing since Exercise 01 — and set the **value** of `BOOKSTORE_DB_CONNECTION_STRING` back to the local container string (it currently holds the Azure SRV string from the Exercise 05 cutover). Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin
PORT=8080
```

Save with `Ctrl+S`. That is the entire change — one line of configuration, no code.

## Run the app against the local container

From the `src/` directory, start both tiers together:

```bash
cd src
npm run develop
```

### Expected output

`concurrently` interleaves the server and client logs. The two lines that confirm the app is ready are the Vite local URL and the db-layer's connect message:

```
[1]   ➜  Local:   http://localhost:3000/
[0] Server is running on port 8080
[0] DocumentDB connected to 10.0.0.5:27017
```

The `DocumentDB connected to 10.0.0.5:27017` line is logged by the db layer once the driver connects — it names the host, so against the local container it reads `10.0.0.5:27017`, and against Azure (the next task) it names the cluster. Same code path; the host distinguishes them.

## Verify identical behavior

Open `http://localhost:3000` in a browser and exercise the app the same way you did in Exercise 01 Task 05:

1. **Browse** — scroll the home page; more books load as you reach the bottom (infinite scroll).
2. **View detail** — click into a book; the detail page renders with full fields.
3. **Write** — add a comment on a book detail page; reload to confirm it persists.

This is the same known-good behavior from before the migration, now served from the local container again.

## Success criteria

`src/server/.env` holds the local MongoDB connection string as the value of `BOOKSTORE_DB_CONNECTION_STRING`, the app logs `DocumentDB connected to` the local container, and reads and writes work end-to-end at `http://localhost:3000` against the local container.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App fails with `MongoNetworkError` or hangs on startup | The container is not running | Run `docker ps`; if `mongodb` is absent, `docker start mongodb`. |
| An **authentication error** on connect | The connection string was not fully swapped back to local | Confirm `BOOKSTORE_DB_CONNECTION_STRING` exactly matches `mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin`, including the credentials and `authSource=admin`. |
| A port is already in use | A previous `npm run develop` is still running | Stop the earlier run with `Ctrl+C` in its terminal, or change `PORT` in `.env` (and the matching proxy target in `src/client/vite.config.js`). |

Leave the app running for now. In **Task 02** you will swap the connection string the other way — back to Azure DocumentDB — and confirm the same application code behaves identically against the managed service.
