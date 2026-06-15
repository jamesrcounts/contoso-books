---
title: "Exercise 02 - Task 03 — Retrieve the Connection String"
layout: default
nav_order: 3
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 03 — Retrieve the Connection String

With the cluster provisioned and reachable, you need its connection string. You will use it to confirm connectivity in Task 04, and later as the value of the app's `BOOKSTORE_DB_CONNECTION_STRING` (and the seed script's `BOOKSTORE_SEED_DB_CONNECTION_STRING`) when you point the application at Azure.

There are two ways to get it: the Bicep deployment output, or the portal.

## Option A — read the Bicep output (recommended)

The template emits a ready-formatted `connectionString` output. Read it with:

```powershell
az deployment group show `
  --resource-group rg-documentdb-lab --name main `
  --query properties.outputs.connectionString.value -o tsv
```

This returns the full SRV string with your cluster's name already filled in:

```
mongodb+srv://bookadmin:<password>@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
```

Notice the literal `<password>` placeholder — the deployment never emits your secret. You substitute it yourself in the next step.

## Option B — the portal

1. In the Azure portal, open the `rg-documentdb-lab` resource group and select your **mongoClusters** resource.
2. In the left menu, select **Connection strings**.
3. Copy the connection string shown. It uses the same SRV format, with a `<user>` / `<password>` placeholder you will replace.

## Substitute the admin password

Replace the literal `<password>` in the string with the admin password you chose when you deployed in Task 02. The username (`bookadmin`) is already present. The result is a complete, usable SRV connection string:

```
mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
```

> **Handle this string like a secret.** It now contains your administrator password in clear text. Do not commit it to source control or paste it into shared chat. Later exercises place it in a `.env` file (which is git-ignored), not in tracked code.

## Save it for later

Store the completed string somewhere you can retrieve it for the rest of the lab — you will need it:

- in **Task 04**, to connect with `mongosh` and confirm connectivity;
- later, as `BOOKSTORE_DB_CONNECTION_STRING` when the application is pointed at the Azure cluster, and as `BOOKSTORE_SEED_DB_CONNECTION_STRING` when seeding data into Azure.

## Success criteria

You have the full SRV connection string, with the real admin password substituted for `<password>`, saved for use in the next task. Continue to **Task 04** to confirm connectivity.
