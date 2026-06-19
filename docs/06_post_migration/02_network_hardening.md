---
title: "Exercise 06 - Task 02 — Network Hardening"
layout: default
nav_order: 2
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 02 — Network Hardening

**Benchmark: NS-2 (secure cloud services with network controls). SFI: protect networks.**

The cluster currently accepts connections over its public endpoint, gated only by a firewall rule. Production should expose no public surface at all — reach the cluster exclusively over the private endpoint that is already deployed in the lab VNet.

## Remove public access

For this cluster the production path is the private endpoint, so it needs **no firewall rule at all** — remove the rule and close the public surface in one pass.

1. On the cluster page, open **Settings → Networking**.
2. Delete the `lab-client` firewall rule.
3. Clear the **Allow public access** checkbox.
4. Select **Save**.

There is no standalone "Disabled" switch — removing every firewall rule and clearing the checkbox *is* how public access is turned off. The save runs a network-access update and then a firewall update; wait for both to finish. The private endpoint is now the exclusive entry point.

## Confirm the path is private

The deployment already provisioned the private path: a **private endpoint** on the cluster (group `MongoCluster`) plus a **private DNS zone** (`privatelink.mongocluster.cosmos.azure.com`) linked to the lab VNet. Prove it resolves to a private address from the VM rather than taking it on faith.

DocumentDB is an `mongodb+srv` service, so the cluster hostname carries no address record of its own — the node lives behind an SRV record. Resolve the chain on the VM, substituting your cluster's hostname:

1. The apex returns a name with **no address** — expected for an SRV service:

   ```
   nslookup <cluster>.mongocluster.cosmos.azure.com
   ```

2. Read the SRV record to find the node hostname and port:

   ```
   nslookup -type=SRV _mongodb._tcp.<cluster>.mongocluster.cosmos.azure.com
   ```

   ```
   svr hostname = fc-xxxxxxxxxxxx-000.mongocluster.cosmos.azure.com
   port         = 10260
   ```

3. Resolve that node — it is a CNAME into the `privatelink` zone and lands on a **private VNet IP**:

   ```
   nslookup fc-xxxxxxxxxxxx-000.mongocluster.cosmos.azure.com
   ```

   ```
   Name:    fc-xxxxxxxxxxxx-000.privatelink.mongocluster.cosmos.azure.com
   Address: 10.0.0.6
   ```

The node id (`fc-…-000`) and address vary by deployment; the evidence is the `privatelink` CNAME and the `10.x` private address.

## Confirm the app still works

The DNS chain shows the path is private; running the workload shows it still functions with public access off — together they prove the cluster is reachable only over the private endpoint.

- In the DocumentDB VS Code extension on the VM, run a playground query (e.g. `db.getCollection('books').findOne({})`) and confirm it returns a document.
- From `src/`, run `npm run develop` and confirm the server logs `DocumentDB connected to …mongocluster.cosmos.azure.com`, then load the bookstore in the browser and confirm it lists books.

> **Why this is safe here — and what production looks like.** A client *outside* the VNet is now cut off; that is the point. The lab's client runs *inside* the VNet, so closing public access changes nothing for it. In production you deploy in exactly this locked-down configuration from the start: the app/web tier sits on the VNet and reaches the cluster's private endpoint over private networking, never traversing the public internet.

## External resources

- [Configure Azure Private Link for an Azure Cosmos DB account](https://learn.microsoft.com/azure/cosmos-db/how-to-configure-private-endpoints)
- [Azure Security Baseline for Azure Cosmos DB — NS-2](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

No firewall rule remains, **public network access is disabled**, and the cluster is still reachable from the in-VNet client over the private endpoint — proven by `nslookup` resolving the node to a private `10.x` address and the app connecting from the VM.

Continue to **Task 03** to harden identity and access.
