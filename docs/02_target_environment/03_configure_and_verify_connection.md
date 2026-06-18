---
title: "Exercise 02 - Task 03 — Configure the Connection String and Confirm Connectivity"
layout: default
nav_order: 3
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 03 — Configure the Connection String and Confirm Connectivity

With the cluster provisioned and reachable, the goal of this task is to **assemble** the Azure DocumentDB connection string and prove you can connect to the cluster with it. You retrieve the string from the portal, substitute your credentials, and use it to connect the **DocumentDB VS Code extension**. You do **not** repoint the app yet — it keeps targeting the local source through the Exercise 03 assessment, and the switch to Azure is the cutover step in Exercise 04 / 05. You will reuse this same string then (and when seeding data into Azure).

## Retrieve it from the portal

1. In the Azure portal, open the `rg-documentdb-lab` resource group and select your **mongoClusters** resource.
2. In the left menu, select **Connection strings**.
3. Copy the connection string shown. It is an SRV-format string with `<user>` and `<password>` placeholders that you will replace:

```
mongodb+srv://<user>:<password>@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
```

The portal never reveals your password — it leaves the `<password>` placeholder for you to fill in next.

## Substitute the admin credentials

Replace the `<user>` and `<password>` placeholders with the administrator credentials you set when you deployed in Task 02 — username `bookadmin` and the password you chose. The result is a complete, usable SRV connection string:

```
mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
```

> **Handle this string like a secret.** It now contains your administrator password in clear text. Do not commit it to source control or paste it into shared chat. It belongs only in the `.env` file below, which is git-ignored.

## Leave the app pointed at local — for now

You will **not** repoint the application to Azure in this task. The active `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env` should keep the **local** value it has held since Exercise 01 Task 03. Add your completed Azure string just below it as a **commented-out line**, so it is parked and ready to paste into the migration job (Exercise 04 Task 02) and to activate at cutover:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
# Azure DocumentDB — activate at cutover (Exercise 04 offline / Exercise 05 online):
# BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
PORT=8080
```

This is deliberate. The whole point of Exercise 03 is to assess the **source** while the app is still running against it — and the assessment reads the local server's runtime metrics, so the app must keep exercising the local database, not the empty Azure cluster. The active line stays local; the commented-out Azure line is what you uncomment (and swap in for the local one) at **cutover**, in Exercise 04 (offline) or Exercise 05 (online). You also reuse the Azure string as `BOOKSTORE_SEED_DB_CONNECTION_STRING` when seeding data into Azure.

## Confirm connectivity with the DocumentDB extension

Before moving on, prove you can actually reach and authenticate against the cluster. You will connect the **Azure DocumentDB VS Code extension** (installed in Exercise 01 Task 00) using the same connection string you just assembled.

1. In VS Code, open the **DocumentDB** extension from the Activity Bar (the icon is a database cylinder surrounded by four curly brackets).
2. In the **DocumentDB Connections** pane, select **+ New Connection...**.
3. In the connection-type dialog, choose **Connection String**.
4. Paste your full SRV string — the one with `bookadmin` and your password substituted in (the full Azure string you just assembled).
5. A new node for your cluster appears in **DocumentDB Connections**. Expand it to open the connection.

If the node expands without an authentication or timeout error, you have proven two things at once: the `lab-client` firewall rule allows your machine, and your `bookadmin` credentials are valid. The expanded cluster lists **no databases at all** — just a **`+ Create Database`** option (the built-in `admin` / `config` system databases are hidden by default). That is expected: no application data exists until the migration creates the `bookstore` database and its `books` / `genres` collections during the **initial load in Exercise 04** (offline) or Exercise 05 (online).

## Success criteria

You have assembled your complete Azure DocumentDB connection string, and the DocumentDB extension connects to the cluster, authenticates, and shows no application data yet. The app's `src/server/.env` still points at the **local** source (you repoint it at cutover). The target environment is ready.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The connection hangs, then fails with a **timeout** | Your client IP is not allowed by the firewall | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` firewall rule you verified in **Task 02** (Networking → Firewall rules in the portal). |
| An **`invalid key`** error | Wrong username or password in the connection string | Confirm the username is `bookadmin` and that you pasted the exact admin password you set in **Task 02**. If you are unsure of the password, reset it on the cluster's **Overview** page in the Azure portal (the reset control is not on the Connection strings page), then reconnect with the new password. |

This completes Exercise 02. The cluster is provisioned, reachable, and ready to receive Contoso's catalog in the migration exercises that follow.
