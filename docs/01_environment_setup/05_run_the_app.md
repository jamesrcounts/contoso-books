---
title: "Exercise 01 - Task 05 — Run the App and Verify End-to-End"
layout: default
nav_order: 6
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 05 — Run the App and Verify End-to-End

You have a running MongoDB container with seeded data and a configured client app. In this final task of Exercise 01 you will start the app, open it in a browser, and confirm reads and writes work end-to-end. This is the **known-good baseline** you will compare against after migrating to Azure DocumentDB.

## Start the application

In the VS Code integrated terminal (Git Bash), ensure you are in the `src/` directory (as in Task 03), then start both tiers together:

```bash
npm run develop
```

The `develop` script uses `concurrently` to run two processes: the Express API server (via `nodemon`) on port `8080`, which reads `BOOKSTORE_DB_CONNECTION_STRING` from `.env` and connects to MongoDB; and the Vite dev server on port `3000`, which serves the React UI and proxies API calls (`/books`, `/genres`, `/comment`) to the server on 8080. You browse the app on port 3000.

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
[0] DocumentDB connected
```

The two lines that confirm the app is ready: `[1] ➜ Local: http://localhost:3000/` (the URL you open) and `[0] DocumentDB connected`. That last line is logged by the db layer once the MongoDB driver finishes connecting. (The app uses "DocumentDB" in its log even against the local container — the same code path connects to Azure DocumentDB later in the lab.)

Leave the terminal running — both servers stay in the foreground.

## Open the app in a browser

Open a browser and navigate to:

```
http://localhost:3000
```

You should see the Contoso Books home page with a paginated list of books rendered from the `books` collection in MongoDB. The page's API requests are proxied to the server on port 8080.

## Exercise the app

Confirm reads and writes work against the MongoDB container:

1. **Browse** — scroll down the home page; confirm more books load as you reach the bottom (the catalog uses infinite scroll, not paged navigation)
2. **View detail** — click into a book; confirm the detail page renders with full fields
3. **Write** — on a book detail page, add a comment; confirm it persists by reloading the page

You can also confirm the write directly against the data from `mongosh` in a separate VS Code terminal (`` Ctrl+Shift+` ``), authenticating as the `bookadmin` user:

```bash
mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin
```

Switch to the `bookstore` database:

```javascript
use bookstore
```

Then run the query on its own (don't paste it together with the `use` line, or `mongosh` treats it as a continuation):

```javascript
db.books.findOne({ "reviewcomments.0": { $exists: true } })
```

The returned book includes your comment in its `reviewcomments` array (each entry is `{ name, comment }`).

> The Azure DocumentDB VS Code extension is the richer tool for browsing data, but it expects connection credentials, and the local container runs without authentication — so `mongosh` is the simpler choice here. You will use the extension against the authenticated Azure cluster in Exercise 06.

## Stop the application

When you have verified the app is working end-to-end, click into the VS Code terminal running `npm run develop` and press `Ctrl+C`. `concurrently` shuts down both the server and the Vite dev server. The MongoDB container keeps running — you will leave it up for Exercise 02 and beyond.

## What you just demonstrated

- A standard Node.js + MongoDB driver application connects to a containerized MongoDB instance using only a connection string
- The application is **completely unaware** of whether it is talking to a local container, a managed MongoDB service, or — as you will prove in Exercise 05 — Azure DocumentDB. Only the connection string changes.
- The seeded `books` and `genres` collections are now the **source data** that will be migrated to DocumentDB in Exercises 04 and 05.

You now have the known-good baseline needed for the rest of the lab. In Exercise 02 you will provision the Azure DocumentDB target.

> **Troubleshooting — app fails with `MongoNetworkError` or an authentication error:** Confirm the container is running (`docker ps`) and the connection string in `.env` matches `mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin` — including the credentials and `authSource=admin`. If the container was restarted, both the replica set state and the `bookadmin` user are persisted; you do not need to re-initialize or recreate them.
>
> **Troubleshooting — `Cannot GET /` in the browser:** You opened the API server (port 8080) instead of the UI. Browse to `http://localhost:3000`, and make sure you started the app with `npm run develop` (not `npm start`).
>
> **Troubleshooting — a port is already in use:** The server uses `8080` and the Vite dev server uses `3000`. For 8080, change `PORT=8080` in `src/server/.env` to another value (e.g. `PORT=8081`) — but then also update the proxy targets in `src/client/vite.config.js` to match. For 3000, change `server.port` in `src/client/vite.config.js`.
