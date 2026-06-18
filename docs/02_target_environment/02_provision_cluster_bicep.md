---
title: "Exercise 02 - Task 02 — Provision the Cluster with Bicep"
layout: default
nav_order: 2
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 02 — Provision the Cluster with Bicep

In this task you will deploy the Azure DocumentDB cluster using the Bicep template at [src/deployment/main.bicep](../../src/deployment/main.bicep). In a single deployment, the template provisions the cluster, a firewall rule for your lab client, and a **private endpoint** that makes the cluster reachable over the lab virtual network — at the **M40** tier reasoned through in Task 01.

Run all commands in **PowerShell** from the root of the cloned repository.

## Sign in and select your subscription

```powershell
az login
```

If your account has more than one subscription, set the one you want to deploy into:

```powershell
az account set --subscription "<your-subscription-name-or-id>"
```

## Create the resource group

The whole lab uses a single resource group, `rg-documentdb-lab`. If you created it in Exercise 01 (Task 00, when provisioning the lab VM), this command is idempotent — it simply confirms the group exists and changes nothing. If you are running the app on your own machine and never created it, this creates it now.

```powershell
az group create --name rg-documentdb-lab --location westus3
```

## What the template deploys

Open [src/deployment/main.bicep](../../src/deployment/main.bicep) and review it before deploying. It provisions the cluster, its public firewall rule, and a private endpoint for the migration path:

- **Parameters** — `adminUsername` and the `@secure()` `adminPassword` for the cluster administrator; `clientIpAddress` for the firewall rule; the sizing knobs with defaults for this production-grade POC: `tier = 'M40'`, `storageSizeGb = 128`, `serverVersion = '7.0'`; and `vnetName` / `subnetName`, which default to the lab VNet and subnet created with your VM in Exercise 01, so you do not pass them. `clusterName` defaults to a globally-unique lowercase name derived from the resource group, and `location` defaults to the resource group's region.
- **`Microsoft.DocumentDB/mongoClusters`** — the cluster itself: the administrator credentials, server version 7.0, `compute.tier` from the `tier` parameter, `storage.sizeGb` from `storageSizeGb`, a single shard (`sharding.shardCount = 1`), high availability disabled (`highAvailability.targetMode = 'Disabled'` — this single-region POC skips the hot standby to keep cost down; a full production rollout would enable it), and `publicNetworkAccess: 'Enabled'` so the firewall rule below governs public connections.
- **`Microsoft.DocumentDB/mongoClusters/firewallRules`** — a child rule named `lab-client` that allows your `clientIpAddress` through the public endpoint (you verify this rule at the end of this task).
- **Private endpoint and DNS** — a `Microsoft.Network/privateEndpoints` (group ID `MongoCluster`) in your existing subnet, plus a `privatelink.mongocluster.cosmos.azure.com` private DNS zone, a link tying that zone to your VNet, and a DNS zone group that registers the cluster's records into it. Together these make the cluster resolve to a **private IP** from inside the lab VNet. The migration service in Exercise 04 runs in a peered virtual network and reaches the cluster this way; the public firewall rule above stays for your direct client access.
- **Outputs** — `clusterName` and a `connectionString` assembled from the cluster name, with a literal `<password>` placeholder where the admin password goes (the secret is never emitted by the deployment — you substitute it yourself in Task 03).

The private endpoint attaches to the VNet and subnet your lab VM created back in Exercise 01, so that network must already exist when you deploy (it does). The deployment stays idempotent — re-running it reconciles all of these resources without duplicating anything.

## Find your public IP

The firewall rule needs the public IP your machine presents to Azure:

```powershell
(Invoke-RestMethod https://api.ipify.org)
```

Note the value — you will pass it as `clientIpAddress` below.

## Deploy

```powershell
az deployment group create `
  --resource-group rg-documentdb-lab `
  --name main `
  --template-file src/deployment/main.bicep `
  --parameters adminUsername=bookadmin clientIpAddress=<your-ip>
```

Replace `<your-ip>` with the address from the previous step. You did **not** pass `adminPassword` on the command line — because it is a `@secure()` parameter with no default, the CLI prompts you for it interactively so the secret never lands in your shell history.

The password must satisfy the DocumentDB policy: **8–256 characters, and at least 3 of these 4 character types — lowercase, uppercase, numeric, and symbol.** A password that fails the policy makes the deployment fail with a `bad_request` schema error; just re-run with a compliant one. Record the password — you will need it in Tasks 03 and 04.

> **Naming the deployment `main`:** the `--name main` flag names the deployment (not the cluster) — it is what appears as `"name": "main"` in the output below and in the portal's **Deployments** list. Any name works; the lab uses `main` for consistency.

Provisioning a DocumentDB cluster takes **several minutes**. The command blocks until it finishes.

## Success criteria

The command returns a JSON object whose `properties.provisioningState` is `Succeeded`:

```json
{
  "name": "main",
  "properties": {
    "provisioningState": "Succeeded",
    "outputs": {
      "clusterName": { "type": "String", "value": "contosobooks4jbkwyzo2quf2" },
      "connectionString": { "type": "String", "value": "mongodb+srv://bookadmin:<password>@contosobooks4jbkwyzo2quf2.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000" }
    }
  }
}
```

You can also confirm in the Azure portal: open the `rg-documentdb-lab` resource group and you should see a **mongoClusters** resource in the **Succeeded** state, alongside the new **private endpoint** (a `…-pe` resource) and the **`privatelink.mongocluster.cosmos.azure.com`** private DNS zone.

> **If the deployment fails on the cluster name:** `clusterName` must be globally unique. The default derives a unique name from the resource group, so this is rare — but if you passed an explicit `clusterName` that is already taken, re-run with a different value.

## Verify the firewall rule

A new DocumentDB cluster **denies all connections by default** — public access is governed by an allow-list of IP ranges, and an empty list times out every connection (the DocumentDB extension in Task 03 and the app later included). Because you passed `clientIpAddress` at deployment time, the `lab-client` rule already allows the machine you deployed from. Confirm it in the portal:

1. Open the `rg-documentdb-lab` resource group and select your **mongoClusters** resource.
2. In the left menu, under **Settings**, select **Networking**.
3. Under **Firewall rules**, confirm a rule named **lab-client** is listed, with its start and end address both equal to the IP you passed.

> **Production note:** this deployment uses both network paths — a single-client-IP firewall rule for your direct access, and a private endpoint for the migration service to reach the cluster over the virtual network. A production cluster would typically lean on the private path and drop the public allow-list entirely; the POC keeps public access enabled so your VS Code client and the portal stay reachable while you work.

With the cluster deployed and reachable, continue to **Task 03** to configure the connection string and confirm connectivity.
