---
title: "Exercise 06 - Task 02 — Network Hardening"
layout: default
nav_order: 2
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 02 — Network Hardening

**Benchmark: NS-2 (secure cloud services with network controls). SFI: protect networks.**

The cluster currently accepts connections over its public endpoint, gated only by a firewall rule. Production should expose no public surface at all — reach the cluster exclusively over the private endpoint that is already deployed in the lab VNet.

## Tighten the firewall to least privilege

1. On the cluster page, open **Settings → Networking**.
2. Review the firewall rules. The lab has a single `lab-client` rule scoped to one IP — already least-privilege. Confirm there is **no broad rule** (a `0.0.0.0`–`255.255.255.255` "allow all" range) and that the **"Allow public access from Azure services"** option is **off**. A single host range beats an allow-all rule every time.

## Confirm the private path

The deployment already provisioned the production connectivity path: a **private endpoint** on the cluster (group `MongoCluster`) plus a **private DNS zone** (`privatelink.mongocluster.cosmos.azure.com`) linked to the lab VNet. Because the lab VM lives in that VNet, the cluster's `…mongocluster.cosmos.azure.com` hostname resolves to the **private IP** from the VM — so the VS Code extension and the app already reach the cluster privately, regardless of the public toggle.

## Disable public network access

1. On the **Networking** blade, set **Public network access** to **Disabled** and save. The private endpoint becomes the exclusive entry point.
2. Verify the in-VNet client still works: in the DocumentDB VS Code extension on the VM, refresh the cluster connection — it still expands and lists `bookstore`, proving the private path is intact.

> **Why this is safe here.** A client *outside* the VNet would now be cut off — that is the point. The lab's client is *inside* the VNet, so disabling public access closes the public door without affecting the lab's own connectivity.

> **Bake it into IaC (secure by default).** In the `mongoClusters` resource, set `publicNetworkAccess: 'Disabled'` and ship the private endpoint + private DNS zone in the same template (the lab template already includes the latter) so a cluster is never briefly public during provisioning.

## External resources

- [Configure Azure Private Link for an Azure Cosmos DB account](https://learn.microsoft.com/azure/cosmos-db/how-to-configure-private-endpoints)
- [Azure Security Baseline for Azure Cosmos DB — NS-2](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

The firewall holds only a least-privilege rule (no allow-all, no allow-Azure-services), **public network access is Disabled**, and the cluster is still reachable from the in-VNet client over the private endpoint.

Continue to **Task 03** to harden identity and access.
