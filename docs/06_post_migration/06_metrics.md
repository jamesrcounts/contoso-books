---
title: "Exercise 06 - Task 06 — Review the Metrics Page"
layout: default
nav_order: 6
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 06 — Review the Metrics Page

The last stop is the cluster's **Metrics** page — where an operator confirms the migration landed cleanly and watches the signals that matter going forward. You will check the resource health metrics, then split the **Mongo request duration** metric to read request latency and surface any errors after cutover.

## Open the Metrics page

1. On the cluster page in the portal, under **Monitoring**, select **Metrics**.

The metrics explorer opens with the cluster pre-selected as the scope. You add one chart per metric (or split a metric by a dimension, below).

## Confirm the resource health signals

Add and glance over the core resource metrics. Post-migration, with only light query traffic, these should all look calm:

- **CPU percent** — should sit low at idle; the migration's bulk-load spike is behind you.
- **Memory percent** — steady; the working set fits comfortably in the M40 tier's RAM.
- **Storage percent** — a small fraction of the 128 GB you provisioned (the catalog plus the indexes you just built).
- **IOPS** — quiet at idle, rising only when queries run.
- **Network** (bytes in/out) — low at idle.

> **What "healthy" looks like here:** none of these should be pinned near 100%. If CPU or memory were saturated at idle, that would point to an undersized tier — but M40 is comfortably ahead of this workload, which is exactly why it was chosen.

## Split the Mongo request duration metric

The signal Contoso most cares about post-migration is **request latency and errors**. DocumentDB exposes this through the **Mongo request duration** metric — and it is available because the cluster is **M40 or higher** (database-level request metrics are not emitted on the smaller, burstable tiers).

1. Add a new chart and select the **Mongo request duration** metric.
2. Use **Apply splitting** (the **Add filter / Apply splitting** controls on the chart) to split the metric by:
   - **Operation** — see latency broken out by operation type (find, insert, update, aggregate, …), so a slow access pattern stands out.
   - **Error code** — see whether any operations are returning errors, grouped by code. Post-migration this should be empty or near-zero; a cluster of errors here is the first place you would notice a problem the application is hitting.

> **Reading it together:** latency by **operation** tells you *where* time goes; the split by **error code** tells you *whether requests are failing*. Together they are the post-migration health check an operator returns to — and the capacity-planning input for whether the M40 tier still fits as Contoso's catalog and traffic grow.

## Optional — watch the metrics move

To see the charts respond, generate a little traffic and refresh:

1. Run the Contoso app against DocumentDB (it is already pointed at the cluster from the Exercise 05 cutover) and browse the book list, or re-run the Task 02 query a few times in the extension.
2. Back on **Metrics**, you should see **Mongo request duration** register the `find` operations and **IOPS** / **CPU** tick up briefly before settling.

## Success criteria

The resource metrics (CPU, memory, storage, IOPS, network) read healthy at idle, and the **Mongo request duration** metric is charted and split by **operation** and **error code**, showing low latency and no meaningful error volume after the migration.

This completes Exercise 06. You have explored the migrated catalog with the DocumentDB VS Code extension, toured the cluster's Overview, Scale, and Metrics pages in the portal, established the secondary and TTL indexes the workload needs with standard MongoDB commands, and confirmed the cluster is healthy post-migration — the Microsoft-native toolset for running DocumentDB day to day.
