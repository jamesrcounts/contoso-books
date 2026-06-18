---
title: "Exercise 05 - Task 06 — Perform the Cutover and Verify the Application"
layout: default
nav_order: 6
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 06 — Perform the Cutover and Verify the Application

Both cutover conditions are met, so it is time to switch Contoso onto DocumentDB and confirm it works. Cutover is a short, coordinated sequence: stop writes to the source, finalize the migration job, repoint the application at the target, and bring it back up. Done in this order, the only "downtime" is the brief application restart — the data is already in sync. You then verify the app functions correctly against DocumentDB.

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

## Verify the application against DocumentDB

Now confirm Contoso behaves exactly as it did against the local container in Exercise 01 Task 05 — same reads, same writes, same UI — proving the migration succeeded from the user's point of view, not just the data's.

### Verify reads

At `http://localhost:3000`:

1. **Browse** — the home page renders books from the migrated `books` collection. Scroll down and confirm more books load (infinite scroll, paged from DocumentDB).
2. **Filter** — apply a rating, format, or genre filter from the navbar and confirm the list updates. (The genre autocomplete exercises the aggregation against the `genres` collection.)
3. **View detail** — click into a book; the detail page renders with full fields and any existing comments.

### Verify writes

1. On a book detail page, **add a comment** and submit.
2. **Reload** the page — the comment persists. This write went to DocumentDB (`$push` onto the book's `reviewcomments` array).

### Confirm the write on the target with the query playground

Cross-check directly against DocumentDB using the **DocumentDB extension's query playground**. Open a playground on your **Azure cluster** connection's **`bookstore`** database, then run each block with **`Ctrl+Enter`**:

1. Confirm the catalog counts match what you migrated:

   ```javascript
   ({
     books:  db.getCollection('books').countDocuments(),
     genres: db.getCollection('genres').countDocuments()
   })
   ```

   This returns `{ books: 93624, genres: 1 }` (plus any books added during the lab).

2. Retrieve every commented book and confirm your comment landed on the target:

   ```javascript
   db.getCollection('books').find(
     { "reviewcomments.0": { $exists: true } },
     { title: 1, reviewcomments: 1 }
   ).toArray()
   ```

   Each commented book comes back with its `reviewcomments` array (`{ name, comment }`) — including the one you just added through the app — proof the writes reached DocumentDB.

> **Same behavior, different backend.** Every check here mirrors the Exercise 01 baseline you ran against the local container. Matching results confirm the application is fully functional on DocumentDB and the cutover is complete.

## Success criteria

Writes to the source were stopped, the migration job was finalized with **Cutover**, `src/server/.env` now holds the Azure SRV string as `BOOKSTORE_DB_CONNECTION_STRING`, and the app restarted cleanly (logging `DocumentDB connected to` the Azure cluster). Reads (browse, filter, detail), writes (add comment, persists on reload), and a direct extension query against the Azure cluster all succeed — the Contoso app functions correctly against DocumentDB, matching the Exercise 01 baseline. The online migration is functionally complete.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App still shows old data, or the home page is empty | `.env` not repointed, or the app wasn't restarted | Confirm the value is the `cosmos.azure.com` SRV string and that you restarted `npm run develop` — the connect log should read `DocumentDB connected to` the cluster host. |
| A new comment doesn't persist after reload | Write failed against the target | Check the server log for write errors; confirm the SRV string includes `retrywrites=false` as provided. |
