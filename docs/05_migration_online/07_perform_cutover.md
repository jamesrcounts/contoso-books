---
title: "Exercise 05 - Task 07 — Perform the Cutover"
layout: default
nav_order: 7
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 07 — Perform the Cutover

Both cutover conditions are met, so it is time to switch Contoso onto DocumentDB. Cutover is a short, coordinated sequence: stop writes to the source, finalize the migration job, repoint the application at the target, and bring it back up. Done in this order, the only "downtime" is the brief application restart — the data is already in sync. In this task you complete the cutover and confirm the app starts clean against DocumentDB.

## Step 1 — Stop writes to the source

Stop the application so no new writes hit the source while you finalize. Click into the VS Code terminal running `npm run develop` and press **Ctrl+C**. `concurrently` shuts down both the API server and the Vite dev server.

> **Why stop writes first?** Cutover assumes the target has caught up to the source. If the app kept writing to the source after you cut over the job, those last writes would be stranded on the old source and never reach DocumentDB. Stopping writes freezes the source so the final state is exactly what replication has already delivered.

## Step 2 — Finalize the migration job (Cutover)

1. In the migration extension, open **View Existing Jobs** and select your `contoso-online-cutover` job.
2. Confirm one last time that **Replication Changes Played** is stable and **Time Since Last Change** is small (Task 06).
3. Click **Cutover**.

The job finalizes replication and completes. The target now holds the full, consistent dataset.

## Step 3 — Repoint the application at DocumentDB

In the **DocumentDB** extension, right-click your **Azure cluster connection** and choose **Copy Connection String** — it includes the password. Then open `src/server/.env` and replace the **value** of `BOOKSTORE_DB_CONNECTION_STRING` — currently the local source string — with the string you copied. Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
PORT=8080
```

Save the file.

> **Only the connection string changes.** The application code is identical against the local container and against DocumentDB. No code, drivers, or queries are touched at cutover.

> **Handle this string like a secret** — it contains your admin password in clear text. It belongs only in the git-ignored `.env` file.

## Step 4 — Restart the application

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

This time `DocumentDB connected` means the server connected to **Azure DocumentDB**, not the local container — even though the log line is identical (the app uses "DocumentDB" on every code path).

## Step 5 — Verify in the browser

Open `http://localhost:3000` and confirm the app behaves exactly as it did before cutover, now served from DocumentDB:

- The catalog loads and book covers render.
- Scrolling pages through more books works.
- The navbar's **genre** filter populates and filtering returns results.

Contoso is now reading all of this from Azure DocumentDB. You run the full functional acceptance check in Task 08.

## Success criteria

Writes to the source were stopped, the migration job was finalized with **Cutover**, `src/server/.env` now holds the Azure SRV string as `BOOKSTORE_DB_CONNECTION_STRING`, and the app restarted cleanly with `DocumentDB connected` — now serving from DocumentDB. You verify end-to-end behavior in Task 08.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App fails with a timeout on restart | Client IP not in the `lab-client` firewall rule | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` rule (Networking → Firewall rules), per Exercise 02. |
| `invalid key` / authentication error | Wrong username or password in the SRV string | Confirm `bookadmin` and the password you set in Exercise 02 Task 02; reset the password on the cluster if unsure. |
| App still shows old/local data | `.env` still points at `localhost`, or app not restarted | Confirm the value is the `cosmos.azure.com` SRV string and that you restarted `npm run develop`. |
