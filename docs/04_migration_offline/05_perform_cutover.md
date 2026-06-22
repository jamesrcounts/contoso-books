---
title: "Exercise 04 - Task 05 — Perform the Cutover"
layout: default
nav_order: 5
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 05 — Perform the Cutover

The snapshot is copied and verified, and the application has been stopped since Task 01 — so the source is frozen and the target holds a faithful copy. All that remains is to point Contoso at DocumentDB and bring it back up. For an offline migration the cutover is short: there is no replication to finalize (the one-shot copy already completed in Task 03) and writes are already stopped, so you only repoint the connection string and restart.

## Step 1 — Repoint the application at DocumentDB

In the **DocumentDB** extension, right-click your **Azure cluster connection** and choose **Copy Connection String** — it includes the password. Then open `src/server/.env` and replace the **value** of `BOOKSTORE_DB_CONNECTION_STRING` — currently the local source string — with the string you copied. Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
PORT=8080
```

Save the file.

> **Only the connection string changes.** The application code is identical against the local container and against DocumentDB. No code, drivers, or queries are touched at cutover.

> **Handle this string like a secret** — it contains your admin password in clear text. It belongs only in the git-ignored `.env` file.

## Step 2 — Restart the application

From `src/`, start the app again:

```powershell
cd src
npm run develop
```

Wait for the readiness lines:

```
[1]   ➜  Local:   http://localhost:3000/
[0] DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com
```

This time the log line names the Azure cluster — `DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com` — confirming the server connected to **Azure DocumentDB**, not the local container. Same code on every path; only the host in the log changed. Contoso is now serving its catalog from the migrated data on Azure.

## Step 3 — Verify in the browser

Open `http://localhost:3000` and confirm the app behaves exactly as it did before the migration:

- The catalog loads and book covers render.
- Scrolling pages through more books works.
- The navbar's **genre** filter populates and filtering returns results.

The app is now reading all of this from Azure DocumentDB, not the local container — proof that the migration is complete from the user's point of view, not just the data's.

## Success criteria

`src/server/.env` now holds the Azure SRV string as `BOOKSTORE_DB_CONNECTION_STRING`, the app restarted cleanly (logging `DocumentDB connected to` the Azure cluster), and `http://localhost:3000` renders the catalog from DocumentDB. The offline migration is complete and Contoso is cut over.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `invalid key` / authentication error | Wrong username or password in the SRV string | Confirm `bookadmin` and the password you set in Exercise 02 Task 02; reset the password on the cluster if unsure. |
| App still shows old/local data | `.env` still points at the local source string, or the app was not restarted | Confirm the value is the Azure DocumentDB SRV connection string from Exercise 02 Task 03 and that you restarted `npm run develop`. |

---

This completes the offline (snapshot) migration: Contoso's catalog is copied into Azure DocumentDB, verified, and the application is cut over and serving from the target. In **Exercise 05** you'll run the **online (change-stream)** path that avoids the maintenance window; in **Exercise 06** you'll explore the migrated data and the cluster's operational surfaces.
