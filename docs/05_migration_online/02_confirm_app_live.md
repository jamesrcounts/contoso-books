---
title: "Exercise 05 - Task 02 — Confirm the Application Is Live and Writing"
layout: default
nav_order: 2
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 02 — Confirm the Application Is Live and Writing

The whole point of an online migration is that Contoso never goes down — the catalog keeps serving reads and accepting writes while the data is copied and kept in sync. In this task you confirm the app is running against the **local source** and is actively writing, then you leave it running for the rest of the exercise. The writes you make here (and any made during the migration) are exactly what change-stream replication will carry across to DocumentDB.

## Confirm the app still points at the source

Open `src/server/.env`. For the online migration the app must target the **local MongoDB container** (the source), not Azure — you will switch it to Azure only at cutover in Task 07. The value should be the local string:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
PORT=8080
```

> **If you completed Exercise 02 Task 03**, this value was changed to the Azure SRV string. Change it back to the local string above for now. Online migration reads from the source and writes to the target on your behalf — the *app* stays pointed at the source until cutover. (If you ran Exercise 04 offline, you likely already reverted this; just confirm.)

Save the file.

## Start the application

From the `src/` directory, start both tiers:

```powershell
cd src
npm run develop
```

Wait for the two readiness lines (logs from the server `[0]` and client `[1]` are interleaved):

```
[1]   ➜  Local:   http://localhost:3000/
[0] DocumentDB connected
```

`DocumentDB connected` confirms the server reached the local replica set. (The app logs "DocumentDB" on every code path — the same code connects to Azure DocumentDB after cutover.) The app connects through its `localhost` seed and the driver follows the replica set to the member at the VM's private IP (Exercise 01 Task 02) — reachable because the app runs on that same VM.

## Prove writes are flowing

1. Open `http://localhost:3000` in a browser and confirm the Contoso Books home page renders with books (more load as you scroll).
2. Click into any book to open its detail page.
3. Add a comment and submit it. Reload the page — the comment persists.

That write landed in the source `books` collection, appended to the book's `reviewcomments` array (each entry is `{ name, comment }`). Because the source is a replica set, that operation is recorded in the oplog — which is precisely what the online migration's change stream tails.

> **Leave the app running.** Do **not** stop it. The application stays live through the initial load (Task 04) and the online sync (Task 05); you only stop writes at cutover (Task 07). Keeping it running — and occasionally adding a comment — gives you live changes to watch replicate in Task 05.

## Success criteria

The Contoso app is running against the local source replica set (`DocumentDB connected`), the home page serves reads at `http://localhost:3000`, and a comment you added persisted — proving the source is live and accepting writes. The app is left running for the remainder of the exercise.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `MongoNetworkError` on startup | The source container is not running | Run `docker ps`; start the container if needed (Exercise 01 Task 01). |
| Authentication error on startup | `.env` has the Azure string, or wrong credentials | Confirm `BOOKSTORE_DB_CONNECTION_STRING` is the local string above, including `authSource=admin`. |
| `Cannot GET /` in the browser | You opened the API port (8080) | Browse to `http://localhost:3000`, and start with `npm run develop` (not `npm start`). |
