---
title: "Exercise 05 - Migration Execution — Online (Change Stream)"
layout: default
nav_order: 6
---

# Exercise 05 - Migration Execution — Online (Change Stream)

## Scenario Overview

Contoso can no longer tolerate a maintenance window — the books catalog needs to stay live throughout the migration. In this exercise you will run an online (change stream) migration, which performs an initial copy and then tails the source oplog to keep the target in sync until cutover. The application continues accepting writes the entire time.

## Learning Objectives

- Reset the target environment to prepare for a fresh migration run
- Execute an online migration that tails the source oplog via change streams
- Monitor the initial load and online sync (replication lag) phases
- Perform the final cutover when the replication gap reaches zero
- Verify the application functions correctly against DocumentDB after cutover

## Estimated Duration

25 minutes

## Tasks

- Task 01 — Reset: drop the target DocumentDB collections created during Exercise 04
- Task 02 — Confirm the Contoso application is running and accepting writes (leave it live)
- Task 03 — Create an online migration job in the VS Code extension — source: local MongoDB (replica set), target: DocumentDB cluster
- Task 04 — Monitor the initial load phase — documents are copied while the app continues writing
- Task 05 — Monitor the online sync phase — watch the replication lag converge toward zero
- Task 06 — Verify cutover conditions: replication gap = 0 AND document counts match on all collections
- Task 07 — Perform cutover: update the `.env` connection string to DocumentDB, restart the app, confirm it comes up clean
- Task 08 — Verify the application functions correctly against DocumentDB
- Task 09 — Run the slow catalog-statistics query against DocumentDB and compare latency and behavior with the source — discuss runtime differences (long-running aggregations, cursor and transaction timeouts)
