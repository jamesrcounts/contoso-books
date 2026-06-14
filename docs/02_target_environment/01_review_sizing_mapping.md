---
title: "Exercise 02 - Task 01 — Review the Sizing Mapping"
layout: default
nav_order: 1
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 01 — Review the Sizing Mapping

Before you provision anything, it helps to understand *why* the lab picks the cluster tier and storage size it does. Azure DocumentDB (vCore) sizes very differently from the older RU-based Cosmos DB for MongoDB API. This task is conceptual — there are no commands to run. The next task provisions the cluster with exactly the values reasoned through here.

## The vCore capacity model

Azure DocumentDB (vCore) is a **provisioned cluster**: you choose compute and storage, and you pay for them whether or not you use them. There are **no request units (RUs)** to budget, and throughput is not metered per-operation. Two dials are set independently:

- **Compute (the cluster tier)** — selects the number of vCores and the amount of RAM per shard. This governs query concurrency and how much of your working set can stay in memory.
- **Storage (size in GB)** — selects the disk per shard, scaled separately from compute. More storage also raises the IOPS ceiling.

Because the two scale independently, you size them against different parts of the workload: compute against concurrency and working-set-in-RAM, storage against data-plus-indexes-plus-growth.

## The tier ladder

| Tier range | Character | Typical use |
|------------|-----------|-------------|
| **M10 – M25** | Burstable vCores | Dev / test, small or intermittent workloads |
| **M30 and higher** | Dedicated (non-burstable) vCores | Production workloads needing steady performance |

Burstable tiers accumulate CPU credits and are economical when load is bursty, but they throttle under sustained pressure. The production line starts at **M30**: dedicated vCores, predictable latency.

## Mapping Contoso's workload

Contoso's catalog is the seed dataset you will migrate in Exercise 04:

- **~96,419 documents** in the `books` collection (plus a 1-document `genres` collection).
- **Indexes** beyond the default `_id`: the app filters on `rating`, `bookformat`, and `genre` and sorts on `rating`, so secondary indexes on those fields are added after the load. Index size counts toward both storage *and* the working set you want resident in RAM.
- **Working set vs RAM** — the list page is read-heavy with paged scans and sorts. Keeping the hot documents and their indexes in memory avoids disk reads on every page. The tier's RAM should comfortably hold that working set.
- **vCores for concurrency** — multiple learners (and the app's infinite-scroll paging) issue overlapping queries. Dedicated vCores keep latency stable under that concurrency rather than throttling.
- **Storage headroom** — the raw dataset is small, but you want room for indexes and future growth without resizing mid-lab.

## Why the lab uses M40 and 128 GB

- **Tier = M40.** The dataset itself would run on a much smaller tier, but Exercise 06 inspects **database-level request metrics** (request rate, latency, error codes via the Mongo request-duration metric). Those metrics are **available on M40 and higher** — so the lab standardizes on **M40** to guarantee they are present when you reach that exercise. M40 is a dedicated-vCore production tier, well clear of the burstable range.
- **Storage = 128 GB.** Far more than ~96k book documents and their indexes need today, but it provides generous headroom and keeps the IOPS ceiling high. Storage is the cheaper dial to be generous with, and it avoids a resize later.

> **Key takeaway:** compute and storage are chosen for *different* reasons — compute (M40) for the metrics and concurrency the lab needs, storage (128 GB) for headroom. You will set both explicitly in the Bicep parameters in the next task.

With the sizing reasoned through, continue to **Task 02** to provision the resource group and the cluster.
