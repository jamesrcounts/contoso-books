---
title: "Exercise 05 - Task 02 — Confirm the Application Is Live and Writing"
layout: default
nav_order: 2
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 02 — Confirm the Application Is Live and Writing

The whole point of an online migration is that Contoso never goes down — the catalog keeps serving reads and accepting writes while the data is copied and kept in sync. In this task you confirm the app is running against the **local source** and is actively writing, then you leave it running for the rest of the exercise. The writes you make here (and any made during the migration) are exactly what change-stream replication will carry across to DocumentDB.

## Start the application

From the `src/` directory, start both tiers:

```powershell
cd src
npm run develop
```

Wait for the readiness lines at the end of the output (the server `[0]` and client `[1]` logs are interleaved):

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
[1]   VITE v8.0.16  ready in 514 ms
[1]
[1]   ➜  Local:   http://localhost:3000/
[1]   ➜  Network: use --host to expose
[0] Server is running on port 8080
[0] DocumentDB connected to 10.0.0.5:27017
```

`DocumentDB connected to 10.0.0.5:27017` confirms the server reached the local replica set at the VM's private IP. The log names the host, so after cutover (Task 07) the same line will name the Azure cluster instead — the same code on every path, with the host telling you which backend.

## Prove writes are flowing

1. Open `http://localhost:3000` in a browser and confirm the Contoso Books home page renders with books (more load as you scroll).
2. Click into any book to open its detail page.
3. Add a comment and submit it. Reload the page — the comment persists.

That write landed in the source `books` collection, appended to the book's `reviewcomments` array (each entry is `{ name, comment }`). Because the source is a replica set, that operation is recorded in the oplog — which is precisely what the online migration's change stream tails.

> **Leave the app running.** Do **not** stop it. The application stays live through the initial load (Task 04) and the online sync (Task 05); you only stop writes at cutover (Task 07). Keeping it running — and occasionally adding a comment — gives you live changes to watch replicate in Task 05.

## Success criteria

The Contoso app is running against the local source replica set (`DocumentDB connected to 10.0.0.5:27017`), the home page serves reads at `http://localhost:3000`, and a comment you added persisted — proving the source is live and accepting writes. The app is left running for the remainder of the exercise.
