---
title: "Exercise 04 - Task 02 — Create an Offline Migration Job in the VS Code Extension"
layout: default
nav_order: 2
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 02 — Create an Offline Migration Job in the VS Code Extension

With writes frozen, you will create the migration job that copies Contoso's catalog from the local MongoDB source into the Azure DocumentDB cluster. You will use the same **Azure DocumentDB Migration Extension** you ran the assessment with in Exercise 03 — this time stepping through the job-creation wizard in **Offline** mode. The extension runs the actual data transfer on an **Azure Database Migration Service (DMS)** instance in the cloud, so once the job starts you do not need to keep VS Code connected.

## Open the migration wizard

The job wizard launches from the same place as the pre-migration assessment:

1. In VS Code, open the **DocumentDB** extension from the Activity Bar and find the **DocumentDB Connections** pane.
2. Right-click the **local MongoDB** connection (the `localhost` source you added in Exercise 01 Task 02) and select **Data Migration…**.
3. From the command palette, select **Migration to Azure DocumentDB**.
4. Choose **Create a new migration job** (the **Pre-Migration Assessment** option in this same menu is the one you used in Exercise 03).

The job-creation wizard opens. Work through its steps below.

## Step 1 — Create job

Choose the mode and connectivity for the job:

- **Migration mode: Offline.** Offline captures a snapshot at the start and bulk-copies it — simple and predictable, and the right fit for Contoso's maintenance window. (Online, covered in Exercise 05, additionally tracks the change stream to avoid downtime.)
- **Connectivity: Public.** Both the source and the target are reachable over public IPs in this lab, so Public connectivity applies. (Private is for sources or targets exposed only inside a virtual network.)

Select **Next**.

## Step 2 — Select target

Point the job at the cluster you provisioned in Exercise 02:

1. Select your **subscription**, the **`rg-documentdb-lab`** resource group, and the **Azure DocumentDB** account from the dropdowns.
2. Provide the **connection string** to the cluster — the same SRV value you stored as `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env`:

   ```
   mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
   ```

3. Confirm the **IP address shown on this screen is allowed** on the cluster's firewall — it should match the `lab-client` rule you verified in Exercise 02 Task 02.

> **Handle this string like a secret.** It contains your administrator password in clear text. Keep it in `src/server/.env` (git-ignored) and the extension's secure store only — never commit it or paste it into shared chat.

Select **Next**.

## Step 3 — Select the Database Migration Service (DMS)

The extension performs the transfer on an **Azure Database Migration Service** instance rather than on your laptop. Choose an existing DMS from the dropdown, or select **Create DMS** to provision a new one — a single DMS per region is enough to reuse across jobs.

> **Register the resource provider first (one-time per subscription).** DMS requires the `Microsoft.DataMigration` provider to be registered, or the wizard cannot create or select a service. Register and confirm it from a terminal:
>
> ```powershell
> az provider register --namespace Microsoft.DataMigration
> az provider show -n Microsoft.DataMigration --query registrationState -o tsv
> ```
>
> Registration takes a minute or two; wait until the second command returns `Registered` before continuing.

Select **Next**.

## Step 4 — Select source

Confirm the source is the local MongoDB connection you launched the wizard from, and provide its credentials if prompted.

> **Note:** DMS reads from the source using an account that has the `readAnyDatabase` and `clusterMonitor` roles. The `bookadmin` administrator you created in Exercise 01 satisfies both, so no extra user is needed.

Select **Next**.

## Step 5 — Select databases and collections

Choose exactly what to migrate:

- Expand the **`bookstore`** database.
- Select the **`books`** and **`genres`** collections.

These are the two collections that hold Contoso's catalog (96,419 books and the single genres document). Select **Next**.

## Step 6 — Confirm and start

Review the job summary — source, target, DMS, and the selected collections. If anything is wrong, use **Edit Details** to step back; otherwise select **Start Migration**.

Once the job is created you are automatically redirected to the **View Existing Jobs** page, where you will track progress in the next task.

## Success criteria

- A migration job exists in **Offline** mode, with the local `bookstore` source and your Azure DocumentDB cluster as target, scoped to the `books` and `genres` collections.
- The job has been started and now appears under **View Existing Jobs**.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Step 3 won't let you create or select a DMS; a provider error appears | `Microsoft.DataMigration` is not registered in the subscription | Run `az provider register --namespace Microsoft.DataMigration`, wait until `az provider show -n Microsoft.DataMigration --query registrationState -o tsv` returns `Registered`, then retry. |
| The target validates but warns the **IP is not allowed** | Your client IP is not in the cluster firewall | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` firewall rule (Networking → Firewall rules in the portal), as set in Exercise 02 Task 02. |
| Target connection fails with an **`invalid key`** / authentication error | Wrong username or password in the connection string | Confirm the username is `bookadmin` and the password is exactly the admin password you set in Exercise 02 Task 02. If unsure, reset it on the cluster's **Connection strings** page in the portal and re-enter the new value. |
