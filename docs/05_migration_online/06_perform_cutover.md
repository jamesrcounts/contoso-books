---
title: "Exercise 05 - Task 06 — Perform the Cutover"
layout: default
nav_order: 6
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 06 — Perform the Cutover

Both cutover conditions are met, so it is time to switch Contoso onto DocumentDB. Cutover is a short, coordinated sequence: stop writes to the source, finalize the migration job, repoint the application at the target, and bring it back up. Done in this order, the only "downtime" is the brief application restart — the data is already in sync. In this task you complete the cutover and confirm the app starts clean against DocumentDB.

## Step 1 — Stop writes to the source

Stop the application so no new writes hit the source while you finalize. Click into the VS Code terminal running `npm run develop` and press **Ctrl+C**. `concurrently` shuts down both the API server and the Vite dev server.

> **Why stop writes first?** Cutover assumes the target has caught up to the source. If the app kept writing to the source after you cut over the job, those last writes would be stranded on the old source and never reach DocumentDB. Stopping writes freezes the source so the final state is exactly what replication has already delivered.

## Step 2 — Finalize the migration job (Cutover)

1. In the migration extension, open **View Existing Jobs** and select your `contoso-online-cutover` job.
2. Confirm one last time that **Replication Changes Played** is stable (Task 05).
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

Wait for the readiness lines at the end of the output:

```
> bookstore@1.0.0 develop
> concurrently "cd server && npm run watch" "cd client && npm run dev"

[0]
[0] > server@1.0.0 watch
[0] > nodemon server.js
[0]
[1]
[1] > bookstore-front-end@0.1.0 dev
[1] > vite
[1]
[0] [nodemon] 3.1.14
[0] [nodemon] to restart at any time, enter `rs`
[0] [nodemon] watching path(s): *.*
[0] [nodemon] watching extensions: js,mjs,cjs,json
[0] [nodemon] starting `node server.js`
[1]
[1]   VITE v8.0.16  ready in 482 ms
[1]
[1]   ➜  Local:   http://localhost:3000/
[1]   ➜  Network: use --host to expose
[0] Server is running on port 8080
[0] DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com
```

This time the log line names the Azure cluster — `DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com` — confirming the server connected to **Azure DocumentDB**, not the local container. Same code on every path; only the host in the log changed.

## Step 5 — Verify in the browser

Open `http://localhost:3000` and confirm the app behaves exactly as it did before cutover, now served from DocumentDB:

- The catalog loads and book covers render.
- Scrolling pages through more books works.
- The navbar's **genre** filter populates and filtering returns results.

Contoso is now reading all of this from Azure DocumentDB. You run the full functional acceptance check in Task 07.

## Success criteria

Writes to the source were stopped, the migration job was finalized with **Cutover**, `src/server/.env` now holds the Azure SRV string as `BOOKSTORE_DB_CONNECTION_STRING`, and the app restarted cleanly (logging `DocumentDB connected to` the Azure cluster) — now serving from DocumentDB. You verify end-to-end behavior in Task 07.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App still shows old/local data | `.env` still points at the local source string, or app not restarted | Confirm the value is the `cosmos.azure.com` SRV string and that you restarted `npm run develop`. |
