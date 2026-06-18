---
title: "Exercise 04 - Migration Execution — Offline (Snapshot)"
layout: default
nav_order: 5
has_children: true
---

# Exercise 04 - Migration Execution — Offline (Snapshot)

## Scenario Overview

In this exercise you will run an offline (snapshot) migration — a point-in-time copy of the source database into DocumentDB. Because the copy captures a single moment, the source must stop accepting writes while it runs, so Contoso performs it inside a scheduled maintenance window. It is the simplest migration path and the baseline for understanding the migration tooling.

The application is still pointed at the **local** source (it has been since Exercise 01). Repointing its `src/server/.env` to the Azure connection string you assembled in Exercise 02 is the **cutover** step you perform here, once the copy is complete and verified.

## Learning Objectives

- Execute an offline snapshot migration using the Azure DocumentDB Migration Extension for VS Code
- Configure private connectivity for the migration service — virtual-network integration for the source and the cluster's private endpoint for the target
- Observe the downtime requirement implicit in the offline approach
- Monitor the snapshot copy phase to completion
- Verify document counts and spot-check data fidelity after the migration
- Cut the application over to DocumentDB by repointing its connection string and restarting

## Estimated Duration

45 minutes (the private-connectivity setup in Task 02 — virtual-network integration and the firewall rule — accounts for much of this)

## Tasks

- Task 01 — Stop the Contoso application (simulate write freeze)
- Task 02 — Create an offline migration job in the VS Code extension over private connectivity — source: local MongoDB (private IP), target: DocumentDB cluster (private endpoint)
- Task 03 — Monitor the snapshot copy phase and confirm completion
- Task 04 — Verify document counts match between source and target
- Task 05 — Spot-check migrated data using `mongosh` against the DocumentDB endpoint
- Task 06 — Perform the cutover: repoint the app's `.env` to the Azure connection string and restart, confirming it serves from DocumentDB
