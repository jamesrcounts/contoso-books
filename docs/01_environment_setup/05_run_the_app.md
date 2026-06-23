---
title: "Exercise 01 - Task 05 — Run the App and Verify End-to-End"
layout: default
nav_order: 6
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 05 — Run the App and Verify End-to-End

You have a running MongoDB container with seeded data and a configured client app. In this final task of Exercise 01 you will start the app, open it in a browser, and confirm reads and writes work end-to-end. This is the **known-good baseline** you will compare against after migrating to Azure DocumentDB.

## Start the application

In the VS Code integrated terminal, return to the `src/` directory — Task 04 left you in `src/deployment/seed`, so go up two levels — then start both tiers together:

```
cd ../..
npm run develop
```

The `develop` script uses `concurrently` to run two processes: the Express API server (via `nodemon`) on port `8080`, which reads `BOOKSTORE_DB_CONNECTION_STRING` from `.env` and connects to MongoDB; and the Vite dev server on port `3000`, which serves the React UI and proxies `/books` — including comment routes under `/books/:id/comments` — and `/genres` to the server on 8080. You browse the app on port 3000.

### Expected output

`concurrently` interleaves both processes' logs, prefixing each line with `[0]` (server) or `[1]` (client). The exact ordering varies from run to run:

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
[1]   VITE v8.0.16  ready in 633 ms
[1]
[1]   ➜  Local:   http://localhost:3000/
[1]   ➜  Network: use --host to expose
[0] Server is running on port 8080
[0] DocumentDB connected to 10.0.0.5:27017
```

The two lines that confirm the app is ready: `[1] ➜ Local: http://localhost:3000/` (the URL you open) and `[0] DocumentDB connected to 10.0.0.5:27017`. That last line is logged by the db layer once the MongoDB driver finishes connecting, and it names the host it reached. The same code path connects to Azure DocumentDB later in the lab; the host in the log line is what tells the two apart.

Leave the terminal running — both servers stay in the foreground.

## Open the app in a browser

Open a browser and navigate to:

```
http://localhost:3000
```

You should see the Contoso Books home page with a list of books rendered from the `books` collection in MongoDB (more load as you scroll). The page's API requests are proxied to the server on port 8080.

## Exercise the app

Confirm reads and writes work against the MongoDB container:

1. **Browse** — scroll down the home page; confirm more books load as you reach the bottom (the catalog uses infinite scroll, not paged navigation)
2. **View detail** — click into a book; confirm the detail page renders with full fields
3. **Write** — on a book detail page, add a comment; confirm it persists by reloading the page

You can also confirm the write directly against the data using the **Azure DocumentDB VS Code extension**, reusing the local container connection you registered in Task 02:

1. In the Activity Bar (the far-left icon strip), select the **DocumentDB** icon to open the **DocumentDB Connections** pane.
2. Expand the local container connection (`10.0.0.5`) you added in Task 02 → the **bookstore** database.
3. Right-click the **books** collection and select **Open Collection** to open its **Collection View** (the query/results tab).
4. In the find (query) editor at the top of the Collection View, enter the following filter and run it with the **Find Query** button (or `Ctrl+Enter`):

   ```json
   { "reviewcomments.0": { "$exists": true } }
   ```

   The books that have a comment appear in the results grid — switch between **Table**, **Tree**, and **JSON** layouts to inspect them. The book you just commented on includes your comment in its `reviewcomments` array (each entry is `{ name, comment }`).

> If you prefer a scripting surface, the extension also provides a **Query Playground** (a `.documentdb.js` file with per-block **Run** / **Run All**) and an **Interactive Shell**. You will use this same extension against the authenticated Azure DocumentDB cluster in Exercise 06.

## Stop the application

When you have verified the app is working end-to-end, click into the VS Code terminal running `npm run develop` and press `Ctrl+C`. `concurrently` shuts down both the server and the Vite dev server. The MongoDB container keeps running — you will leave it up for Exercise 02 and beyond.

## What you just demonstrated

- A standard Node.js + MongoDB driver application connects to a containerized MongoDB instance using only a connection string
- The application uses the same MongoDB driver and connection seam for the local container and Azure DocumentDB. After Exercise 03 identifies and remediates any incompatible workload features, cutover changes only the connection string.
- The seeded `books` and `genres` collections are now the **source data** that will be migrated to DocumentDB in Exercises 04 and 05.

You now have the known-good baseline needed for the rest of the lab. In Exercise 02 you will provision the Azure DocumentDB target.

> **Troubleshooting — app fails with `MongoNetworkError` or an authentication error:** Confirm the container is running (`docker ps`) and the connection string in `.env` matches `mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin` — including the credentials and `authSource=admin`. If the container was restarted, both the replica set state and the `bookadmin` user are persisted; you do not need to re-initialize or recreate them.
>
> **Troubleshooting — `Cannot GET /` in the browser:** You opened the API server (port 8080) instead of the UI. Browse to `http://localhost:3000`, and make sure you started the app with `npm run develop` (not `npm start`).
>
> **Troubleshooting — a port is already in use:** The server uses `8080` and the Vite dev server uses `3000`. For 8080, change `PORT=8080` in `src/server/.env` to another value (e.g. `PORT=8081`) — but then also update the proxy targets in `src/client/vite.config.js` to match. For 3000, change `server.port` in `src/client/vite.config.js`.
