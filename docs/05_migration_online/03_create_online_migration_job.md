---
title: "Exercise 05 - Task 03 — Create the Online Migration Job"
layout: default
nav_order: 3
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 03 — Create the Online Migration Job

With the target reset and the source live, you will now create an **online** migration job in the Azure DocumentDB Migration Extension for VS Code. An online job runs in two phases: an initial bulk copy of the existing data, followed by a continuous replication phase that tails the source change stream until you manually cut over. The job itself runs on **Azure Database Migration Service (DMS)** in the cloud — once it is created you do not need to keep VS Code connected for the copy to proceed.

> **Two extensions, one workflow.** The *DocumentDB for VS Code* extension manages connections and data; the *Azure DocumentDB Migration Extension* (installed in Exercise 01 Task 00, which pulls in the DocumentDB extension as a prerequisite) provides the migration commands. You launch the migration from a connected source connection in the DocumentDB Connections pane.

## Open the source connection

1. In the **DocumentDB** extension, expand the **local container** connection (`localhost`, registered in Exercise 01 Task 02) so it is connected. The Migration Extension can only be invoked from an expanded, connected source.

> The Migration Extension needs a source login with `readAnyDatabase` and `clusterMonitor` permissions to read data and monitor the oplog. The `bookadmin` user is a MongoDB **root** user, so it already has both — no extra account is required for the lab.

## Invoke the Migration Extension

1. Right-click the connected `localhost` connection and choose **Data Migration…** from the context menu.
2. In the command palette that opens, select **Migration to Azure DocumentDB**.
3. Then select **Migrate to Azure DocumentDB**.
4. The six-step migration wizard opens.

## Walk the wizard

### Step 1 — Create job

- **Job Name**: a friendly identifier, e.g. `contoso-online-cutover`.
- **Migration Mode**: select **Online**. This copies the existing data and then replicates changes via the change stream until cutover.
- **Connectivity**: select **Public** for this lab (source and target are reachable over public IPs).

> **Online requires change streams.** The wizard's Online mode only works because the source was initialized as a replica set in Exercise 01 Task 02 — that is what provides the oplog the change stream tails. Without it, changes made after the initial copy would be silently lost.

Select **Next**.

### Step 2 — Select target

- Choose the **subscription**, **resource group** (`rg-documentdb-lab`), and **Azure DocumentDB account** (your `contosobooks...` cluster) from the dropdowns.
- Provide the target **connection string** — the same Azure SRV string from Exercise 02 Task 03, with `bookadmin` and your password substituted in.
- Note the **IP shown on screen** and ensure it is allowed by the cluster's firewall. In this lab the `lab-client` rule already covers your machine; if the wizard shows a different egress IP, add it to the firewall (Networking → Firewall rules) before continuing.

> **Use native authentication.** Microsoft Entra ID is **not** supported in migration jobs — provide the username/password SRV connection string, not an Entra-based connection.

Select **Next**.

### Step 3 — Select Database Migration Service (DMS)

- Choose an existing **Azure Database Migration Service** instance, or select **Create DMS** to create one. One DMS per region is sufficient — reuse it for later jobs.

> **One-time setup:** the `Microsoft.DataMigration` resource provider must be registered in the subscription. If DMS creation fails, register the provider (Subscription → Resource providers → search `Microsoft.DataMigration` → Register) and retry. This is a once-per-subscription step.

Select **Next**.

### Step 4 — Select source

- Confirm the source is the local MongoDB connection. Provide source credentials if prompted (`bookadmin` / `bookpass123`). Select **Next**.

### Step 5 — Select collections

- Expand the **bookstore** database and select both collections: **books** and **genres**. Select **Next**.

### Step 6 — Confirm and start

- Review the job summary. Use **Edit Details** to correct anything.
- Select **Start Migration**.

Once the job is created you are redirected to the **View Existing Jobs** page, where the new online job appears. The initial load begins immediately on DMS.

## Success criteria

An online migration job (source: local MongoDB replica set; target: your DocumentDB cluster; collections: `books`, `genres`) has been created and is listed on the **View Existing Jobs** page in the migration extension. The initial load phase has started.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Online** mode is greyed out or warns about change streams | Source is not a replica set | Confirm `rs.status()` shows `PRIMARY` with member name `localhost:27017` (Exercise 01 Task 02). |
| DMS dropdown is empty / **Create DMS** fails | `Microsoft.DataMigration` not registered | Register the resource provider on the subscription and retry. |
| Target step rejects the connection / firewall warning | Wizard's IP not allowed on the cluster | Add the IP shown in the wizard to the cluster firewall (`lab-client` or a new rule). |
| Authentication fails against the target | Entra-based or wrong string | Use the native username/password SRV string with `bookadmin` and your password. |
