---
title: "Exercise 04 - Task 02 — Create an Offline Migration Job in the VS Code Extension"
layout: default
nav_order: 2
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 02 — Create an Offline Migration Job in the VS Code Extension

With writes frozen, you will create the migration job that copies Contoso's catalog from the local MongoDB source into the Azure DocumentDB cluster. You will use the same **Azure DocumentDB Migration Extension** you ran the assessment with in Exercise 03 — this time stepping through the job-creation wizard in **Offline** mode. The extension runs the actual data transfer on an **Azure Database Migration Service (DMS)** instance in the cloud, so once the job starts you do not need to keep VS Code connected.

## Create the migration source connection

The migration runs on a cloud DMS instance, not on your machine — so the source it connects to must be an address DMS can reach over the network, and it must **not** rely on replica-set discovery. The `localhost` connection you added in Exercise 01 Task 02 fails both tests: `localhost` is meaningless to a cloud service, and `rs0` advertises its member as `localhost:27017` (Exercise 01 Task 02), so any replica-set-aware client gets redirected back to `localhost`. You therefore create a **separate** source connection that points at the VM's **private IP** and uses `directConnection=true` to skip the replica-set redirect.

First, get your VM's private IP:

```powershell
az vm list-ip-addresses -g rg-documentdb-lab -n vm-docdb-lab --query "[0].virtualMachine.network.privateIpAddresses[0]" -o tsv
```

It is an address in your lab VNet's range (for example `10.0.0.5`). Then add the connection in the **DocumentDB** extension:

1. Open the **DocumentDB** extension from the Activity Bar and, in the **DocumentDB Connections** pane, select **+ New Connection…** → **Connection String**.
2. Paste the following, substituting your private IP:

   ```
   mongodb://bookadmin:bookpass123@<vm-private-ip>:27017/?directConnection=true&authSource=admin
   ```

3. The new node appears in **DocumentDB Connections**. Expand it to confirm it connects — from the VM, the private IP is reachable, so it lists the `bookstore` database.

> **Keep this connection distinct from the `localhost` one.** The `localhost` connection stays for the app and the Exercise 03 assessment; this private-IP/`directConnection` connection exists specifically so the cloud migration service can reach the source.

## Open the migration wizard

1. Right-click the **private-IP source connection** you just created and select **Data Migration…**.
2. From the command palette, select **Migration to Azure DocumentDB**.
3. Choose **Create a new migration job** (the **Pre-Migration Assessment** option in this same menu is the one you used in Exercise 03).

The job-creation wizard opens. Work through its steps below.

## Step 1 — Create job

Provide the job's basic details:

- **Job Name: `contoso-offline-migration`.** This names the job in the **View Existing Jobs** list and keeps it distinct from the online job you create in Exercise 05.
- **Migration mode: Offline.** Offline captures a snapshot at the start and bulk-copies it — simple and predictable, and the right fit for Contoso's maintenance window. (Online, covered in Exercise 05, additionally tracks the change stream to avoid downtime.)
- **Connectivity: Private.** The migration service reaches the source over the lab virtual network and the target through its private endpoint, so traffic never crosses the public internet. (Public connectivity does not work here: VS Code runs *on* the source VM, and a VM cannot reach its own public IP — so there is no single address the extension and the cloud service can both use. Private connectivity, where both sides are reached over the VNet, is the path that works.)

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

1. Select your **subscription**, then the **`rg-documentdb-lab`** resource group. The **Account name** dropdown then populates automatically with your cluster — it is the only one in the subscription.
2. The **connection string** is required and is not filled in for you. Paste the Azure SRV string you parked as a commented-out line in `src/server/.env` (in Exercise 02 Task 03):

   ```
   mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
   ```

The connection string is how the extension enumerates the target's databases. The migration itself reaches the cluster over its **private endpoint** (you will see that endpoint listed on the confirmation screen), so the public `lab-client` firewall rule is not what governs the data path here — the private endpoint from Exercise 02 is.

> **Handle this string like a secret.** It contains your administrator password in clear text. Keep it in `src/server/.env` (git-ignored) and the extension's secure store only — never commit it or paste it into shared chat.

Select **Next**.

## Step 3 — Select the Database Migration Service (DMS)

The extension performs the transfer on an **Azure Database Migration Service** instance rather than on your laptop. Select **Create DMS** and name it **`dms-documentdb-lab`** — a single DMS per region is enough to reuse across jobs, so you create one here and reuse it for the online migration in Exercise 05. It provisions in under a minute.

> **Register the resource provider first (one-time per subscription).** DMS requires the `Microsoft.DataMigration` provider to be registered, or the wizard cannot create or select a service. Register and confirm it from a terminal:
>
> ```powershell
> az provider register --namespace Microsoft.DataMigration
> az provider show -n Microsoft.DataMigration --query registrationState -o tsv
> ```
>
> Registration takes a minute or two; wait until the second command returns `Registered` before continuing.

Select **Next**.

## Step 4 — Configure connectivity

Because you chose **Private**, this step wires the migration service into your lab virtual network so it can reach both the source VM and the cluster's private endpoint.

1. **Source virtual network** and **target virtual network** — select the **same** network, `vm-documentdb-labVNET`, for both. Your source VM and the cluster's private endpoint both live in it, so a single VNet covers both sides. After you pick the resource group, the network is selected automatically.
2. **DMS CIDR range** — enter **`172.28.0.0/16`**. The migration service builds its own temporary virtual network on this range and peers it to yours, so it **must not overlap** your VNet's `10.0.0.0/16`.
3. **Run the generated script.** The wizard displays a PowerShell script and asks you to run it. It grants the migration service's identity the **Network Contributor** role on your VNet so it can create the peering. Copy it and run it **as shown** in a terminal:
   - It is an **Az PowerShell** script (`New-AzRoleAssignment`), which is why you installed the Az module in Exercise 01 Task 00. The first time, run `Connect-AzAccount` and sign in (the sign-in window may open **behind** VS Code — Alt+Tab).

> **You also need one firewall rule the wizard does not create.** The migration service connects to your source on port **27017** from the DMS CIDR range, but your VM's network security group does not allow that range by default — the built-in "allow virtual network" rule does **not** cover the peered DMS range. Add an explicit inbound rule (substitute your DMS CIDR if you changed it):
>
> ```powershell
> az network nsg rule create --resource-group rg-documentdb-lab --nsg-name vm-docdb-labNSG `
>   --name allow-dms-mongodb --priority 1010 --direction Inbound --access Allow --protocol Tcp `
>   --source-address-prefixes 172.28.0.0/16 --source-port-ranges '*' `
>   --destination-port-ranges 27017 --destination-address-prefixes '*'
> ```
>
> Without this rule the job provisions and then fails the data copy at 0% (see **Troubleshooting**). `vm-docdb-labNSG` is your VM's network security group.

Once the role assignment and the firewall rule are in place, select **Next**.

## Step 5 — Select collections

Choose exactly what to migrate:

- Expand the **`bookstore`** database.
- Select the **`books`** and **`genres`** collections.

These are the two collections that hold Contoso's catalog (96,419 books and the single genres document). Select **Next**.

## Step 6 — Confirm and start

Review the job summary. Confirm it reflects the private setup — **Connectivity: Private**, both the source and target virtual network are `vm-documentdb-labVNET`, the **DMS CIDR** is the range you entered, and the target shows your cluster's **private endpoint**. If anything is wrong, use **Edit Details** to step back; otherwise select **Start Migration**.

Once the job is created you are automatically redirected to the **View Existing Jobs** page, where you will track progress in the next task.

## Success criteria

- A migration job exists in **Offline** / **Private** mode, with the private-IP `directConnection` source and your Azure DocumentDB cluster (via its private endpoint) as target, scoped to the `books` and `genres` collections.
- The migration service has Network Contributor on `vm-documentdb-labVNET`, and your VM's NSG allows the DMS CIDR inbound on 27017.
- The job has been started and now appears under **View Existing Jobs**.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Step 3 won't let you create or select a DMS; a provider error appears | `Microsoft.DataMigration` is not registered in the subscription | Run `az provider register --namespace Microsoft.DataMigration`, wait until `az provider show -n Microsoft.DataMigration --query registrationState -o tsv` returns `Registered`, then retry. |
| The Step 4 script fails with **`New-AzRoleAssignment` is not recognized** | The Az PowerShell module is not installed | Install it as in [Exercise 01 Task 00](../01_environment_setup/00_lab_machine_setup.md) (`Install-Module -Name Az.Resources -Scope CurrentUser -Force`), run `Connect-AzAccount`, then re-run the wizard's script unchanged. |
| The job reaches **Bulk copy** but the collections **Fail at 0% / 0s** ("Migration job … failed during data copy") | The migration service cannot reach the source on 27017 — the DMS-CIDR inbound NSG rule is missing | Add the `allow-dms-mongodb` rule (Step 4) for your DMS CIDR on port 27017 to `vm-docdb-labNSG`, then **Resume** the job (offline jobs are resumable). |
| An Azure sign-in seems to hang and no prompt is visible | The sign-in window opened behind VS Code | **Alt+Tab** to bring the sign-in window forward and complete it. |
| Target connection fails with an **`invalid key`** / authentication error | Wrong username or password in the connection string | Confirm the username is `bookadmin` and the password is exactly the admin password you set in Exercise 02. If unsure, reset it on the cluster's **Overview** page in the portal and re-enter the new value. |
