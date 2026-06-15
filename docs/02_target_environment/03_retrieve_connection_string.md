---
title: "Exercise 02 - Task 03 — Retrieve the Connection String"
layout: default
nav_order: 3
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 03 — Retrieve the Connection String

With the cluster provisioned and reachable, you need its connection string. In this task you will copy it from the portal, fill in your credentials, and set it as the app's `BOOKSTORE_DB_CONNECTION_STRING` so the application targets Azure. You will reuse the same string to confirm connectivity in Task 04 and, later, to seed data into Azure.

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

## Point the app at Azure

Open `src/server/.env` — the file you created in Exercise 01 Task 03 — and replace the **value** of `BOOKSTORE_DB_CONNECTION_STRING` (currently the local MongoDB string) with your completed Azure connection string. Leave `PORT` unchanged:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
PORT=8080
```

Save the file. The app now targets Azure DocumentDB instead of the local container — though the cluster is **empty** until you migrate Contoso's catalog in Exercise 04 (offline) or Exercise 05 (online), so the book list stays empty until then. You will reuse this same string later as `BOOKSTORE_SEED_DB_CONNECTION_STRING` when seeding data into Azure.

## Success criteria

`src/server/.env` now holds your complete Azure DocumentDB connection string as the value of `BOOKSTORE_DB_CONNECTION_STRING`, with the real admin credentials substituted in. Continue to **Task 04** to confirm connectivity with `mongosh`.
