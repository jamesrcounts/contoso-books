---
title: "Exercise 03 - Task 05 — Choose the Migration Mode"
layout: default
nav_order: 5
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 05 — Choose the Migration Mode

The source is assessed and remediated. The last planning decision is *how* to move the data — **offline** (snapshot) or **online** (change stream). This task walks the trade-off and records the choice that drives Exercises 04 and 05.

## Recall the comparison

From the exercise overview:

| | Offline (Snapshot) | Online (Change Stream) |
|---|---|---|
| **How it works** | Point-in-time copy of the source | Initial copy + continuous sync via oplog |
| **Downtime required** | Yes — writes must stop before cutover | No — source stays live throughout |
| **Source requirement** | Standalone or replica set | Replica set only (needs oplog) |
| **Best for** | Scheduled maintenance windows, smaller datasets | Production workloads where downtime is unacceptable |
| **Cutover trigger** | Copy complete | Replication gap = 0 AND document counts match |

The migration extension exposes this choice directly: when you create a migration job, **Migration Mode** is a wizard field with **Offline** and **Online** options.

## How to decide

Ask three questions about the workload:

1. **Can you tolerate downtime?** Offline requires you to stop writes before cutover, because anything written to the source after the snapshot starts is not copied. If a maintenance window is acceptable, offline is simpler and more predictable. If not, you need online.
2. **Is the source a replica set?** Online migration replicates post-snapshot changes from the **oplog** via change streams, which exist only in replica-set mode. A standalone source can only do offline.
3. **How large and how busy is the dataset?** Larger or write-heavy datasets take longer to copy, which lengthens the offline downtime window — pushing the decision toward online.

## The Contoso decision

The Contoso Books catalog is a **read-heavy, customer-facing** app where an extended write outage is undesirable, and Exercise 01 deliberately configured the container as a **single-node replica set** — so the oplog and change streams that online migration needs are already in place. That makes **online** the production-appropriate choice.

This lab demonstrates **both** paths so you can see the mechanics of each:

- **Exercise 04 — Offline migration.** Take a point-in-time snapshot and bulk-copy it to the cluster. Cutover happens once the copy is complete.
- **Exercise 05 — Online migration.** Run the same initial copy, but keep replicating source changes from the change stream. You cut over only when the **replication gap reaches zero** and the **source and target document counts match** — never before, because cutting over early loses the un-replicated writes.

> **Why the replica set paid off.** Offline migration would have worked against any MongoDB instance. Online migration would not — it needs the oplog that only replica-set mode provides. By initializing the container as a single-node replica set back in Exercise 01, you kept *both* options open without ever reconfiguring the source.

## Success criteria

You can justify a migration mode for the Contoso workload (online, enabled by the replica-set source and a low downtime tolerance) and you understand the cutover trigger for each mode. You are ready to execute the migration.

This completes Exercise 03. The source is assessed, the one Critical finding is remediated, and the migration mode is chosen. In **Exercise 04** you perform the offline migration; in **Exercise 05**, the online migration.
