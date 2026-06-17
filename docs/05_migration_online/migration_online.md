---
title: "Exercise 05 - Migration Execution — Online (Change Stream)"
layout: default
nav_order: 6
has_children: true
---

# Exercise 05 - Migration Execution — Online (Change Stream)

## Scenario Overview

Contoso can no longer tolerate a maintenance window — the books catalog needs to stay live throughout the migration. In this exercise you will run an online (change stream) migration, which performs an initial copy and then tails the source oplog to keep the target in sync until cutover. The application continues accepting writes the entire time.

Throughout the sync, the application stays pointed at the **local** source (as it has been since Exercise 01). Only at **cutover** — once the replication gap reaches zero — do you repoint its `src/server/.env` to the Azure connection string you assembled in Exercise 02.

## Learning Objectives

- Reset the target environment to prepare for a fresh migration run
- Execute an online migration that tails the source oplog via change streams
- Monitor the initial load and online sync (replication lag) phases
- Perform the final cutover when the replication gap reaches zero
- Verify the application functions correctly against DocumentDB after cutover

## Estimated Duration

25 minutes

## Tasks

- Task 01 — [Reset the Target Environment](01_reset_target_collections.md) — drop the target DocumentDB collections created during Exercise 04
- Task 02 — [Confirm the Application Is Live and Writing](02_confirm_app_live.md) — confirm the Contoso application is running and accepting writes (leave it live)
- Task 03 — [Create the Online Migration Job](03_create_online_migration_job.md) — in the VS Code extension; source: local MongoDB (replica set), target: DocumentDB cluster
- Task 04 — [Monitor the Initial Load Phase](04_monitor_initial_load.md) — documents are copied while the app continues writing
- Task 05 — [Monitor the Online Sync Phase](05_monitor_online_sync.md) — watch the replication lag converge toward zero
- Task 06 — [Verify Cutover Conditions](06_verify_cutover_conditions.md) — replication gap = 0 AND document counts match on all collections
- Task 07 — [Perform the Cutover](07_perform_cutover.md) — update the `.env` connection string to DocumentDB, restart the app, confirm it comes up clean
- Task 08 — [Verify the Application Against DocumentDB](08_verify_application.md) — confirm the application functions correctly after cutover
- Task 09 — [Run the Slow Catalog-Statistics Query and Compare](09_run_slow_query_compare.md) — compare latency and behavior with the source; discuss runtime differences (long-running aggregations, cursor and transaction timeouts)
