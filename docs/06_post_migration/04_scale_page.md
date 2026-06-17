---
title: "Exercise 06 - Task 04 — Review the Scale Page"
layout: default
nav_order: 4
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 04 — Review the Scale Page

The **Scale** page is where DocumentDB's vCore capacity model becomes concrete. In Exercise 02 Task 01 you *reasoned through* why Contoso picks M40 and 128 GB; here you *see* those two dials as the portal presents them, and confirm how they move independently. This is a read-and-observe task — you will not apply any changes.

## Open the Scale page

1. On the cluster page in the portal, under **Settings**, select **Scale**.

The page shows the two capacity dials set in the Bicep template.

## The cluster tier (compute)

The **Cluster tier** selector shows **M40** — the tier you deployed. The tier bundles two things together:

- **vCores** — query concurrency and CPU. Dedicated (non-burstable) at M40, so latency stays steady under the catalog's read-heavy, concurrent traffic.
- **RAM** — how much of the working set (hot documents plus their indexes) stays resident in memory instead of being read from disk.

Higher tiers step both up together. **M40 is also the floor for database-level request metrics** — the request rate, latency, and error-code signals you will use in Task 06 — which is the production-observability reason Contoso chose it over a smaller tier the raw dataset would otherwise fit on.

## The storage (capacity)

The **Storage** dial shows **128 GB** per shard, scaled **independently** of the tier. Storage is sized for capacity — data, indexes, and growth headroom — not for concurrency. Two things worth remembering:

- There are **no request units to provision**. Throughput is not metered per operation the way RU-based Cosmos DB for MongoDB is; you pay for the compute and storage you select, full stop.
- DocumentDB storage can be **increased but never decreased**. Contoso started at 128 GB — far more than ~96k books and their indexes need today — precisely so the catalog can grow without a disruptive resize.

> **Compute and storage are chosen for different reasons.** Compute (M40) for production observability, concurrency, and IOPS; storage (128 GB) for capacity headroom. The Scale page makes that independence visible — you could raise the tier without touching storage, or grow storage without changing the tier.

> **Do not apply changes.** This task is observation only. Leave the tier at M40 and storage at 128 GB — changing them triggers a real scaling operation on the cluster and is unnecessary for the lab.

## External resources

- [Compute and storage configurations for Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/compute-storage) — the full vCore/RAM tier table, the considerations behind choosing compute vs. storage, and a worked future-growth sizing example.

With the capacity model confirmed, continue to **Task 05** to inspect and create indexes on the migrated collections.
