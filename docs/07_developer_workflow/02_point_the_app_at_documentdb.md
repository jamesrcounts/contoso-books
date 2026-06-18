---
title: "Exercise 07 - Task 02 — Point the App at DocumentDB (Driver Compatibility)"
layout: default
nav_order: 2
parent: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
---

# Task 02 — Point the App at DocumentDB (Driver Compatibility)

This is the compatibility payoff. You will take the **same** running application and point it at Azure DocumentDB by changing nothing but the connection string — no driver swap, no code edit, no rebuild. Because DocumentDB speaks the MongoDB wire protocol, the standard `mongodb` npm driver the app already uses connects to it exactly as it connects to the local container.

## Stop the app

In the VS Code terminal running `npm run develop`, press `Ctrl+C`. `concurrently` shuts down both the server and the Vite dev server. You change the connection string while the app is stopped, then start it again so the server reads the new value.

## Swap the connection string to Azure

Open `src/server/.env` and set the **value** of `BOOKSTORE_DB_CONNECTION_STRING` to your Azure DocumentDB SRV string — the one you assembled in **Exercise 02 Task 03** (retrieved from the cluster's **Connection strings** blade in the portal, with `bookadmin` and your admin password substituted in). Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
PORT=8080
```

Save with `Ctrl+S`.

> **Handle this string like a secret.** It contains your administrator password in clear text. It belongs only in `src/server/.env`, which is git-ignored — never commit it or paste it into shared chat.

## Run the app against DocumentDB

From the `src/` directory, start both tiers again:

```bash
cd src
npm run develop
```

### Expected output

The startup is identical to the local run except for the host named in the connect line — now the managed cluster instead of the container:

```
[1]   ➜  Local:   http://localhost:3000/
[0] Server is running on port 8080
[0] DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com
```

## Verify identical behavior

Open `http://localhost:3000` and exercise the app exactly as in Task 01 — browse the catalog with infinite scroll, open a book detail page, and add a comment. The data now comes from Azure DocumentDB (Contoso's migrated catalog), and the experience is indistinguishable from the local run.

> **What this proves:** the application code, the MongoDB driver, the routes, and the queries are all unchanged between Task 01 and Task 02. The *only* difference is the value of one environment variable. That is the entire compatibility story — your MongoDB-based application runs against DocumentDB in production without modification.

## Success criteria

`src/server/.env` holds the Azure DocumentDB connection string as the value of `BOOKSTORE_DB_CONNECTION_STRING`, the app logs `DocumentDB connected to` the cluster host, and reads and writes work end-to-end at `http://localhost:3000` against the managed cluster — with no code change from the local run.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The connection hangs, then fails with a **timeout** | Your client IP is not allowed by the cluster firewall | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` firewall rule (Networking → Firewall rules in the portal), as you verified in **Exercise 02**. |
| An **`invalid key`** / authentication error | Wrong username or password in the connection string | Confirm the username is `bookadmin` and the password matches the admin password you set in **Exercise 02 Task 02**. If unsure, reset it on the cluster's **Overview** page in the portal, then reconnect. |
| The book list is **empty** | The connection string points at a cluster that was never migrated into | Confirm you pasted the full SRV string for the cluster you migrated to in Exercises 04/05; the `bookstore` database and its collections are created during that migration. |

With the app proven against both backends, continue to **Task 03** to validate — by document counts and content checksums — that the local source and the Azure target hold exactly the same data.
