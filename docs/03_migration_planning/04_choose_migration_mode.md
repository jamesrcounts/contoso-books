---
title: "Exercise 03 - Task 04 — Choose the Migration Mode"
layout: default
nav_order: 4
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 04 — Choose the Migration Mode

The source is assessed and remediated. The last planning decision is *how* to move the data — **offline** (snapshot) or **online** (change stream). This is a **conceptual** task: you weigh the trade-offs and decide which mode a production migration of Contoso would use. You don't run anything here — the hands-on migrations come next, in **Exercise 04** (offline) and **Exercise 05** (online), which walk through *both* modes so you see the mechanics of each.

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

The Contoso Books catalog is a **read-heavy, customer-facing** app where an extended write outage is undesirable, and its source already runs as a **replica set** — so the oplog and change streams that online migration needs are already in place. That makes **online** the production-appropriate choice.

Although **online** is the production-appropriate choice, the POC runs **both** paths so you see the mechanics of each:

- **Exercise 04 — Offline migration.** Take a point-in-time snapshot and bulk-copy it to the cluster. Cutover happens once the copy is complete.
- **Exercise 05 — Online migration.** Run the same initial copy, but keep replicating source changes from the change stream. You cut over only when the **replication gap reaches zero** and the **source and target document counts match** — never before, because cutting over early loses the un-replicated writes.

> **Why the source runs as a replica set.** Production MongoDB is normally deployed as a replica set for **high availability** — and that same replica set provides the **oplog** that online migration depends on, so no migration-specific setup is required. A **standalone** source would first have to be converted to a replica set, which means restarting `mongod` (a brief outage) before online migration is even possible. The lab's single-node replica set stands in for that production deployment.

## Success criteria

You can justify a migration mode for the Contoso workload (online, enabled by the replica-set source and a low downtime tolerance) and you understand the cutover trigger for each mode. You are ready to execute the migration in the exercises that follow.

This completes Exercise 03. The source is assessed, the `$function` finding is remediated, and the production migration mode is chosen. In **Exercise 04** you perform the offline migration; in **Exercise 05**, the online migration.
