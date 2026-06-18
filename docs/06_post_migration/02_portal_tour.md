---
title: "Exercise 06 - Task 02 — Tour the Cluster Page in the Azure Portal"
layout: default
nav_order: 2
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 02 — Tour the Cluster Page in the Azure Portal

The extension is where you work with *data*; the Azure portal is where you manage the *cluster*. This is a read-and-observe tour — no changes — covering the Overview, the operational blades, and the Scale page's capacity dials.

## Open the cluster page

1. Sign in to the [Azure portal](https://portal.azure.com).
2. Open the **`rg-documentdb-lab`** resource group and select your **mongoClusters** resource.

This lands you on the cluster's **Overview** page.

## Read the Overview

The **Overview** is the cluster's at-a-glance status:

- **Status** — **Ready** (a healthy, running cluster).
- **Server version** — **7.0**.
- **Tier and storage** — the **M40** tier and **128 GB** storage (the Scale page below has the dials).
- **Shard count** — a **single shard**.
- **Reset password** — the admin-password reset control lives here on **Overview**, not on the Connection strings page.

## Orient to the left-menu blades

Locate the blades an operator uses day-to-day — no need to open them all:

- **Connection strings** — the SRV connection string with `<user>` / `<password>` placeholders.
- **Settings → Scale** — the cluster tier and storage size (below).
- **Settings → Networking** — the firewall allow-list controlling which client IPs can reach the cluster.
- **Monitoring → Metrics** — CPU, memory, storage, IOPS, network, and the Mongo request-duration metric. **Task 04.**

## Review the Scale page

Under **Settings**, select **Scale**. The page shows two capacity dials that scale **independently**:

- **Cluster tier** — **M40** (compute: vCores + RAM). The tier sets query concurrency, CPU, and how much of the working set stays resident in RAM. **M40 is also the floor for database-level request metrics** — the latency and error-code signals you use in Task 04.
- **Storage** — **128 GB** per shard, sized for data, indexes, and growth headroom. There are **no request units to provision**, and storage can be **increased but never decreased** — so Contoso started well above what ~96k books need today.

> **Do not apply changes.** This is observation only. Changing the tier or storage triggers a real scaling operation on the cluster and is unnecessary for the lab.

## External resources

- [Compute and storage configurations for Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/compute-storage) — the full vCore/RAM tier table and a worked future-growth sizing example.

## Success criteria

You can find the cluster's Overview, the Connection strings / Networking / Metrics blades, and the Scale page — and you can read the M40 tier and 128 GB storage as two independently-scaled dials with no request units.

Continue to **Task 03** to inspect and manage indexes on the migrated collections.
