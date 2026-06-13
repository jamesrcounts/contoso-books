---
title: "Exercise 01 - Task 05 — Run the App and Verify End-to-End"
layout: default
nav_order: 6
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 05 — Run the App and Verify End-to-End

You have a running MongoDB container with seeded data and a configured client app. In this final task of Exercise 01 you will start the app, open it in a browser, and confirm reads and writes work end-to-end. This is the **known-good baseline** you will compare against after migrating to Azure DocumentDB.

## Start the application

In the VS Code integrated terminal (Git Bash), ensure you are in the `src/` directory (as in Task 03), then run:

```bash
npm start
```

The `start` script runs `node server/server.js`. The server reads `BOOKSTORE_DB_CONNECTION_STRING` from `.env`, connects to MongoDB, and listens on the port from `PORT` (default `8080`).

### Expected output

```
Server is running on port 8080
```

Leave the terminal running — the server stays in the foreground.

## Open the app in a browser

Open a browser and navigate to:

```
http://localhost:8080
```

You should see the Contoso Books home page with a paginated list of books rendered from the `books` collection in MongoDB.

> Depending on the build state of the React client, you may need to also run `npm run build` once before starting the server in production mode (`NODE_ENV=production npm start`). For the lab walkthrough, running the server alone against the prebuilt client is sufficient.

## Exercise the app

Confirm reads and writes work against the MongoDB container:

1. **Browse** — paginate through the catalog; confirm books load
2. **Search** — search for a book title (e.g. "Harry Potter"); confirm matching books appear
3. **View detail** — click into a book; confirm the detail page renders with full fields
4. **Write** — perform a write operation supported by the UI (e.g. add a review or update an attribute); confirm it persists by reloading the page

You can also spot-check writes from `mongosh` in a separate VS Code terminal (`` Ctrl+Shift+` ``):

```javascript
use bookstore
db.books.findOne({ title: /harry potter/i })
```

## Stop the application

When you have verified the app is working end-to-end, click into the VS Code terminal running `npm start` and press `Ctrl+C` to stop the server. The MongoDB container keeps running — you will leave it up for Exercise 02 and beyond.

## What you just demonstrated

- A standard Node.js + MongoDB driver application connects to a containerized MongoDB instance using only a connection string
- The application is **completely unaware** of whether it is talking to a local container, a managed MongoDB service, or — as you will prove in Exercise 05 — Azure DocumentDB. Only the connection string changes.
- The seeded `books` and `genres` collections are now the **source data** that will be migrated to DocumentDB in Exercises 04 and 05.

You now have the known-good baseline needed for the rest of the lab. In Exercise 02 you will provision the Azure DocumentDB target.

> **Troubleshooting — app fails with `MongoNetworkError`:** Confirm the container is running (`docker ps`) and the connection string in `.env` matches `mongodb://localhost:27017/?replicaSet=rs0`. If the container was restarted, the replica set state is persisted; you do not need to re-initialize.
>
> **Troubleshooting — port 8080 is already in use:** Change `PORT=8080` in `.env` to another value (e.g. `PORT=8081`) and re-run `npm start`.
