---
title: "Exercise 04 - Task 06 — Perform the Cutover"
layout: default
nav_order: 6
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 06 — Perform the Cutover

The snapshot is copied and verified, and the application has been stopped since Task 01 — so the source is frozen and the target holds a faithful copy. All that remains is to point Contoso at DocumentDB and bring it back up. For an offline migration the cutover is short: there is no replication to finalize (the one-shot copy already completed in Task 03) and writes are already stopped, so you only repoint the connection string and restart.

## Step 1 — Repoint the application at DocumentDB

Open `src/server/.env` and replace the **value** of `BOOKSTORE_DB_CONNECTION_STRING` — currently the local source string — with your Azure SRV string (the one you assembled in Exercise 02 Task 03, with `bookadmin` and your password substituted). Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
PORT=8080
```

Save the file.

> **Only the connection string changes.** The application code is identical against the local container and against DocumentDB — this is the payoff of the wire-protocol compatibility demonstrated in Exercise 01. No code, drivers, or queries are touched at cutover.

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
[0] DocumentDB connected
```

This time `DocumentDB connected` means the server connected to **Azure DocumentDB**, not the local container — even though the log line is identical (the app uses "DocumentDB" on every code path). Contoso is now serving its catalog from the migrated data on Azure.

## Success criteria

`src/server/.env` now holds the Azure SRV string as `BOOKSTORE_DB_CONNECTION_STRING`, the app restarted cleanly with `DocumentDB connected`, and `http://localhost:3000` renders the catalog from DocumentDB. The offline migration is complete and Contoso is cut over.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App fails with a timeout on restart | Client IP not in the `lab-client` firewall rule | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` rule (Networking → Firewall rules), per Exercise 02. |
| `invalid key` / authentication error | Wrong username or password in the SRV string | Confirm `bookadmin` and the password you set in Exercise 02 Task 02; reset the password on the cluster if unsure. |
| App still shows old/local data | `.env` still points at `localhost`, or the app was not restarted | Confirm the value is the `cosmos.azure.com` SRV string and that you restarted `npm run develop`. |

---

This completes the offline (snapshot) migration: Contoso's catalog is copied into Azure DocumentDB, verified, and the application is cut over and serving from the target. In **Exercise 05** you'll run the **online (change-stream)** path that avoids the maintenance window; in **Exercise 06** you'll explore the migrated data and the cluster's operational surfaces.
