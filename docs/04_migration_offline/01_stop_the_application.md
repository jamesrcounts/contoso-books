---
title: "Exercise 04 - Task 01 — Stop the Contoso Application (Simulate Write Freeze)"
layout: default
nav_order: 1
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 01 — Stop the Contoso Application (Simulate Write Freeze)

An offline migration takes a **point-in-time snapshot** of the source and bulk-copies it to the target. Anything written to the source *after* that snapshot begins is **not** carried across. In production this is the defining trade-off of the offline path: to avoid losing data, you schedule a maintenance window and stop writes to the source before the copy runs. In this task you simulate that maintenance window by stopping the Contoso application, leaving the source data frozen for a clean snapshot.

## Why writes must stop

The offline path has no continuous synchronization — it is a one-shot copy, not a replicating stream. Review the comparison in [Exercise 03 — Migration Planning](../03_migration_planning/migration_planning.md): the offline mode requires downtime because the cutover trigger is simply "copy complete," with no mechanism to reconcile changes that land mid-copy. Online migration (Exercise 05) solves this with a change stream, but at the cost of more setup. For Contoso's scheduled window, offline is the simpler, predictable choice.

> **The source of truth is still the local container.** Although you repointed the app's `BOOKSTORE_DB_CONNECTION_STRING` to Azure in Exercise 02 Task 03 (to verify connectivity), Contoso's catalog still lives in the **local MongoDB container** — that is what you will migrate. Stopping the app here represents freezing writes against that source.

## Stop the app

Click into the VS Code integrated terminal that is running `npm run develop` (started in [Exercise 01 Task 05](../01_environment_setup/05_run_the_app.md)) and press `Ctrl+C`. `concurrently` shuts down both tiers — the Express API server on port 8080 and the Vite dev server on port 3000.

### Example output

```
[0] Server is running on port 8080
[1] ➜  Local:   http://localhost:3000/
^C
[0] cd server && npm run watch exited with code SIGINT
[1] cd client && npm run dev exited with code SIGINT
```

Once you are returned to the shell prompt, no client is writing to the catalog. The maintenance window has begun.

## Verify the source is still running

Stopping the app stops the *writers* — it must **not** stop the source database. The migration job reads from the local MongoDB container, so confirm it is still up:

```powershell
docker ps
```

### Example output

```
CONTAINER ID   IMAGE       COMMAND                  STATUS         PORTS                      NAMES
cc9d04ee609c   mongo:7.0   "docker-entrypoint.s…"   Up 2 hours     0.0.0.0:27017->27017/tcp   mongodb
```

The `mongodb` container shows `Up`, and `http://localhost:3000` / `http://localhost:8080` no longer respond. Source data is intact and frozen; nothing is mutating it.

## Success criteria

- The `npm run develop` process is stopped — neither port 3000 nor 8080 is serving.
- The `mongodb` container (`mongo:7.0`) is still `Up` in `docker ps`.
- No application or client is writing to the `bookstore` database — the snapshot you take next will be a clean, consistent point in time.

> **Note:** You are *not* repointing `.env` or cutting traffic over to Azure in this exercise. The real cutover — updating the app to use the Azure connection string and resuming writes there — happens in **Exercise 06 (Post-Migration)**. Here you only freeze the source so the snapshot is consistent.
