---
title: "Exercise 05 - Task 03 — Create the Online Migration Job"
layout: default
nav_order: 3
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 03 — Create the Online Migration Job

With the target reset and the source still live, you will create the migration job that copies Contoso's catalog into the Azure DocumentDB cluster **and keeps it in sync**. You use the same **Azure DocumentDB Migration Extension** you ran the assessment with in Exercise 03 — this time in **Online** mode, which runs an initial bulk copy and then continuously replicates source changes from the change stream until you manually cut over. The extension runs the actual transfer on an **Azure Database Migration Service (DMS)** instance in the cloud, and DMS connects **directly to your local MongoDB container** — so once the job starts you can close VS Code, but the **VM and the container must stay running** for the whole migration (until cutover), since DMS reads from them the entire time.

## Open the migration wizard

The migration runs on a cloud DMS instance, so it connects to the source through the **source connection you registered in Exercise 01 Task 02** — the one addressed by the VM's **private IP** with `replicaSet=rs0`. Online migration tails the source **change stream**, which requires replica-set topology discovery; this connection provides it, and because the `rs0` member advertises the VM's private IP (Exercise 01 Task 02), both this VM and the cloud migration service resolve the member to a routable address.

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
- **Source connection string.** This field is labeled optional — left blank, it defaults to the connection you launched the wizard from — but **set it explicitly**: `mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin` (substitute your VM private IP). In this lab, a run that left it to default **failed during provisioning**, and the same job succeeded once the string was set explicitly — so provide it.

> **Online requires change streams.** The wizard enforces that **"ChangeStream must be enabled on the source MongoDB server"** — without it, any change made after the initial copy is silently lost. The source satisfies this because it was initialized as a replica set in Exercise 01 Task 02 (the replica set provides the oplog the change stream tails), and because its member advertises the VM private IP, the cloud migration service can reach it to tail that stream.

Select **Next**.

## Step 2 — Select target

Point the job at the cluster you provisioned in Exercise 02. The fields are briefly disabled while the wizard loads your subscription data, and each dropdown enables a moment after the previous selection — give them a second to populate.

1. Select your **subscription**, then the **`rg-documentdb-lab`** resource group.
2. **Verify the Account name** is your cluster (`contosobooks…`). It auto-populates; confirm it is the expected one.
3. **Choose the private endpoint** — select your cluster's private endpoint (`contosobooks…-pe`) as how the migration reaches the target. This keeps the target traffic on the virtual network; the **private DNS zone** you created in Exercise 02 is what resolves the cluster's name to that endpoint.
4. Provide the target **connection string**. Rather than retype it, right-click your **Azure cluster connection** in the **DocumentDB** extension (from Exercise 02 Task 03) and choose **Copy Connection String** — it includes the password — then paste it into the field.

> **Use native authentication.** Microsoft Entra ID is **not** supported in migration jobs — provide the username/password connection string, not an Entra-based connection.

> **Handle this string like a secret.** It contains your administrator password in clear text — never commit it or paste it into shared chat.

Select **Next**.

## Step 3 — Select the Database Migration Service (DMS)

The extension performs the transfer on an **Azure Database Migration Service** instance rather than on the client host. The `dms-documentdb-lab` instance you created for the offline migration in Exercise 04 is already provisioned — a single DMS per region serves every job. **Confirm it is the selected DMS** and the details are correct.

Select **Next**.

## Step 4 — Configure connectivity

Because you chose **Private**, this step wires the migration service into your lab virtual network so it can reach both the source VM and the cluster's private endpoint — the same configuration you set up for the offline job in Exercise 04.

1. **Source virtual network** and **target virtual network** — select the **same** network, `vm-documentdb-labVNET`, for both (just as in Exercise 04). After you pick the resource group, the network is selected automatically.
2. **DMS CIDR range** — select the **same** **`172.28.0.0/16`** you used for the offline job. Because you are reusing it, the **Network Contributor** grant you ran in Exercise 04 still applies, so there is nothing new to grant here. (The wizard may still display the `New-AzRoleAssignment` script; you already ran it in Exercise 04, so you can skip it.) Confirm the grant is in place if you want:

   ```powershell
   az role assignment list --scope (az network vnet show -g rg-documentdb-lab -n vm-documentdb-labVNET --query id -o tsv) --query "[?roleDefinitionName=='Network Contributor'].{role:roleDefinitionName, principalType:principalType, principalId:principalId}" -o table
   ```

   One `ServicePrincipal` row with **Network Contributor** means it's set.
3. **Verify the inbound firewall rule is still in place.** The migration service connects to your source on port **27017** from the DMS CIDR range; the `allow-dms-mongodb` rule you added in Exercise 04 allows it. Confirm it is present:

   ```powershell
   az network nsg rule show --resource-group rg-documentdb-lab --nsg-name vm-docdb-labNSG --name allow-dms-mongodb -o table
   ```

   If it isn't found, add it back as in [Exercise 04 Task 02](../04_migration_offline/02_create_offline_migration_job.md).

Select **Next**.

## Step 5 — Select collections

Choose exactly what to migrate:

- Expand the **`bookstore`** database.
- Select the **`books`** and **`genres`** collections.

These are the two collections that hold Contoso's catalog (96,419 books and the single genres document). Select **Next**.

## Step 6 — Confirm and start

Review the **Confirm and start migration** summary and check it matches what you configured:

- **Job name** `contoso-online-cutover` · **Migration mode** Online · **Connectivity** Private
- **Source connection string** `mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin`
- **Target account** — your subscription, `rg-documentdb-lab`, account name `contosobooks…`, the connection string, and the **Private endpoint** (`…/privateEndpoints/contosobooks…-pe`)
- **DMS** `dms-documentdb-lab`
- **Source** and **target virtual network** both `vm-documentdb-labVNET`
- **DMS CIDR range** `172.28.0.0/16`
- **Collections to migrate** — Count **2**: `books` and `genres`
- **Copy indexes from source: Yes — drop target first, then migrate** (the job recreates the source indexes on the target, dropping any existing target collection first)
- **Copy sharding from source**

If anything is wrong, step back and correct it; otherwise select **Start migration job**.

Once the job is created you are redirected to the **View Existing Jobs** page, where the new online job appears. The initial load begins immediately on DMS, and you track it in the next task.

## Success criteria

- A migration job exists in **Online** / **Private** mode, with the Exercise 01 Task 02 source connection (the VM private IP, replica set) and your Azure DocumentDB cluster (via its private endpoint) as target, scoped to the `books` and `genres` collections.
- The Exercise 04 private-connectivity setup — the Network Contributor grant on `vm-documentdb-labVNET` and the `allow-dms-mongodb` NSG rule — is confirmed still in place.
- The job has been started and now appears under **View Existing Jobs**, with the initial load running.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Online** mode is greyed out or warns that **ChangeStream must be enabled** | The source isn't a reachable replica set | Confirm `rs.status()` shows `PRIMARY` with member name **`10.0.0.5:27017`** (your VM private IP), per [Exercise 01 Task 02](../01_environment_setup/02_initialize_the_replica_set.md). If the member shows `localhost` or a container ID, the cloud migration service can't reach it — reconfigure it to the private IP. |
| The job's status goes to **Failed during resource provisioning** | A DMS-side provisioning issue (often transient — there is no Retry button) | Delete the failed job and **recreate** it, making sure the **source connection string** is set explicitly (Step 1). If it fails again with the grant, the NSG rule, and the private endpoint all verified, capture the **Operation ID** from the error and contact Azure support — a provisioning failure with valid infrastructure is a DMS-managed-side issue. |
| Target connection fails with an **`invalid key`** / authentication error | Wrong username or password in the connection string | Re-copy it with **Copy Connection String** from your Azure cluster connection; confirm the username is `bookadmin` and the password is the admin password you set in Exercise 02. |
