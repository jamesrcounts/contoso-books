---
title: "Exercise 05 - Task 03 — Create the Online Migration Job"
layout: default
nav_order: 3
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 03 — Create the Online Migration Job

With the target reset and the source still live, you will create the migration job that copies Contoso's catalog into the Azure DocumentDB cluster **and keeps it in sync**. You use the same **Azure DocumentDB Migration Extension** you ran the assessment with in Exercise 03 — this time in **Online** mode, which runs an initial bulk copy and then continuously replicates source changes from the change stream until you manually cut over. The extension runs the actual transfer on an **Azure Database Migration Service (DMS)** instance in the cloud, so once the job starts you do not need to keep VS Code connected.

## Open the migration wizard

The migration runs on a cloud DMS instance, so it connects to the source through the **source connection you registered in Exercise 01 Task 02** — the one addressed by the VM's **private IP** with `replicaSet=rs0`. Online migration tails the source **change stream**, which requires replica-set topology discovery; this connection provides it, and because the `rs0` member advertises the VM's private IP (Exercise 01 Task 02), both this VM and the cloud migration service resolve the member to a routable address. No separate connection and no `directConnection` flag are involved.

> The Migration Extension needs a source login with `readAnyDatabase` and `clusterMonitor` permissions to read data and monitor the oplog. The `bookadmin` user is a MongoDB **root** user, so it already has both — no extra account is required.

1. In the **DocumentDB** extension, expand that source connection so it is connected, then right-click it and select **Data Migration…**.
2. From the command palette, select **Migration to Azure DocumentDB**.
3. Choose **Create a new migration job**.

The job-creation wizard opens. Work through its steps below.

## Step 1 — Create job

Provide the job's basic details:

- **Job Name: `contoso-online-cutover`.** This names the job in the **View Existing Jobs** list and keeps it distinct from the offline job in Exercise 04.
- **Migration mode: Online.** Online copies the existing data and then replicates post-snapshot changes from the source **change stream**, so the application stays live and no writes are lost between the copy and cutover. (Offline, in Exercise 04, takes a one-shot snapshot and requires a write freeze.)
- **Connectivity: Private.** The migration service reaches the source over the lab virtual network and the target through its private endpoint, so traffic stays on the VNet and never crosses the public internet.

> **Online requires change streams.** The wizard enforces that **"ChangeStream must be enabled on the source MongoDB server"** — without it, any change made after the initial copy is silently lost. The source satisfies this because it was initialized as a replica set in Exercise 01 Task 02 (the replica set provides the oplog the change stream tails), and because its member advertises the VM private IP, the cloud migration service can reach it to tail that stream.

Select **Next**.

## Sign in to Azure

The first time you advance the wizard, the extension prompts you to sign in to Azure so it can read your subscriptions and resources. Work through the prompts:

1. A dialog asks to sign in — select **Allow**.
2. Enter your **username**, then your **password**.
3. At **Sign in to all apps on this device**, choose **Yes** (this is not a shared device).
4. At **Allow my organization to manage my device**, choose **Yes** to ensure full access to Azure.

Once sign-in completes, the wizard can populate the Azure dropdowns in the next step.

> **If the sign-in prompt never appears,** it likely opened **behind** the VS Code window — **Alt+Tab** to find it.

## Step 2 — Select target

Point the job at the cluster you provisioned in Exercise 02. The fields are briefly disabled while the wizard loads your subscription data, and each dropdown enables a moment after you make the previous selection — give them a second to populate.

1. Select your **subscription**, then the **`rg-documentdb-lab`** resource group, then your cluster from the **Account name** dropdown (if it is the only cluster in the subscription, it may already be selected).
2. The **connection string** is required and is not filled in for you. Rather than retype it, get it from the connection you already created: in the **DocumentDB** extension, right-click your **Azure cluster connection** (the one from Exercise 02 Task 03) and choose **Copy Connection String** — it includes the password — then paste it into the field.

The connection string only gives the extension the cluster's **server name**. The **private DNS zone** you created in Exercise 02 resolves that name to the cluster's **private endpoint**, which is how the migration reaches the target privately.

> **Use native authentication.** Microsoft Entra ID is **not** supported in migration jobs — provide the username/password connection string, not an Entra-based connection.

> **Handle this string like a secret.** It contains your administrator password in clear text — never commit it or paste it into shared chat.

Select **Next**.

## Step 3 — Select the Database Migration Service (DMS)

The extension performs the transfer on an **Azure Database Migration Service** instance rather than on the client host. **Reuse the `dms-documentdb-lab`** instance you created for the offline migration in Exercise 04 — a single DMS per region serves every job. If it isn't there (for example, you skipped Exercise 04), select **Create DMS**, name it **`dms-documentdb-lab`**, and let it provision (under a minute).

Select **Next**.

## Step 4 — Configure connectivity

Because you chose **Private**, this step wires the migration service into your lab virtual network so it can reach both the source VM and the cluster's private endpoint.

1. **Source virtual network** and **target virtual network** — select the **same** network, `vm-documentdb-labVNET`, for both. Your source VM and the cluster's private endpoint both live in it, so a single VNet covers both sides. After you pick the resource group, the network is selected automatically.
2. **DMS CIDR range** — select **`172.28.0.0/16`** from the dropdown, the same range you used for the offline job, so the inbound firewall rule you already added still applies. The migration service builds its own temporary virtual network on this range and peers it to yours, so the range must **not** overlap your VNet's `10.0.0.0/16`.
3. **Run the generated script.** The wizard displays an **Az PowerShell** script (`New-AzRoleAssignment`) that grants the migration service's identity the **Network Contributor** role on your VNet so it can create the peering. Copy it and run it **as shown** in a terminal. The first time, run `Connect-AzAccount` and sign in (the sign-in window may open **behind** VS Code — Alt+Tab).
4. **Confirm the inbound firewall rule.** The migration service connects to your source on port **27017** from the DMS CIDR range, so an explicit inbound rule must allow it. If you ran Exercise 04 with the same CIDR, the `allow-dms-mongodb` rule is already in place; otherwise add it (substitute your DMS CIDR and your VM's NSG name if they differ):

   ```powershell
   az network nsg rule create --resource-group rg-documentdb-lab --nsg-name vm-docdb-labNSG `
     --name allow-dms-mongodb --priority 1010 --direction Inbound --access Allow --protocol Tcp `
     --source-address-prefixes 172.28.0.0/16 --source-port-ranges '*' `
     --destination-port-ranges 27017 --destination-address-prefixes '*'
   ```

Once the role assignment and the firewall rule are in place, select **Next**.

## Step 5 — Select collections

Choose exactly what to migrate:

- Expand the **`bookstore`** database.
- Select the **`books`** and **`genres`** collections.

These are the two collections that hold Contoso's catalog (96,419 books and the single genres document). Select **Next**.

## Step 6 — Confirm and start

Review the job summary. Confirm it reflects the online, private setup — **Migration mode: Online**, **Connectivity: Private**, both the source and target virtual network are `vm-documentdb-labVNET`, the **DMS CIDR** is the range you entered, and the target shows your cluster's **private endpoint**. If anything is wrong, use **Edit Details** to step back; otherwise select **Start Migration**.

Once the job is created you are automatically redirected to the **View Existing Jobs** page, where the new online job appears. The initial load begins immediately on DMS, and you track it in the next task.

## Success criteria

- A migration job exists in **Online** / **Private** mode, with the Exercise 01 Task 02 source connection (the VM private IP, replica set) and your Azure DocumentDB cluster (via its private endpoint) as target, scoped to the `books` and `genres` collections.
- The migration service has Network Contributor on `vm-documentdb-labVNET`, and your VM's NSG allows the DMS CIDR inbound on 27017.
- The job has been started and now appears under **View Existing Jobs**, with the initial load running.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Online** mode is greyed out or warns that **ChangeStream must be enabled** | The source isn't a reachable replica set | Confirm `rs.status()` shows `PRIMARY` with member name **`10.0.0.5:27017`** (your VM private IP), per [Exercise 01 Task 02](../01_environment_setup/02_initialize_the_replica_set.md). If the member shows `localhost` or a container ID, the cloud migration service can't reach it — reconfigure it to the private IP. |
| Step 3 won't let you create or select a DMS; a provider error appears | `Microsoft.DataMigration` is not registered in the subscription | Run `az provider register --namespace Microsoft.DataMigration`, wait until `az provider show -n Microsoft.DataMigration --query registrationState -o tsv` returns `Registered`, then retry. |
| The Step 4 script fails with **`New-AzRoleAssignment` is not recognized** | The Az PowerShell module is not installed | Install it as in [Exercise 01 Task 00](../01_environment_setup/00_lab_machine_setup.md) (`Install-Module -Name Az.Resources -Scope CurrentUser -Force`), run `Connect-AzAccount`, then re-run the wizard's script unchanged. |
| The job reaches **Bulk copy** but the collections **Fail at 0% / 0s** | The migration service cannot reach the source on 27017 — the DMS-CIDR inbound NSG rule is missing | Add the `allow-dms-mongodb` rule (Step 4) for your DMS CIDR on port 27017 to `vm-docdb-labNSG`, then **Resume** the job (online jobs are resumable). |
| The initial load completes but the **replication phase never begins** | The change stream can't be tailed — the member isn't advertising a routable address | Confirm `rs.status()` member name is the VM private IP (Exercise 01 Task 02), not `localhost`; reconfigure it if needed and recreate the job. |
| An Azure sign-in seems to hang and no prompt is visible | The sign-in window opened behind VS Code | **Alt+Tab** to bring the sign-in window forward and complete it. |
| Target connection fails with an **`invalid key`** / authentication error | Wrong username or password in the connection string | Confirm the username is `bookadmin` and the password is exactly the admin password you set in Exercise 02. If unsure, reset it on the cluster's **Overview** page in the portal and re-enter the new value. |
