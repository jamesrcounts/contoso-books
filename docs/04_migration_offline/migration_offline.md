---
title: "Exercise 04 - Migration Execution — Offline (Snapshot)"
layout: default
nav_order: 5
---

# Exercise 04 - Migration Execution — Offline (Snapshot)

## Scenario Overview

Contoso schedules a maintenance window and stops writes to the source. In this exercise you will run an offline (snapshot) migration — a point-in-time copy of the source database into DocumentDB. This is the simplest migration path and the baseline for understanding the migration tooling.

## Learning Objectives

- Execute an offline snapshot migration using the Azure DocumentDB Migration Extension for VS Code
- Observe the downtime requirement implicit in the offline approach
- Monitor the snapshot copy phase to completion
- Verify document counts and spot-check data fidelity after the migration

## Estimated Duration

20 minutes

## Tasks

- Task 01 — Stop the Contoso application (simulate write freeze)
- Task 02 — Create an offline migration job in the VS Code extension — source: local MongoDB, target: DocumentDB cluster
- Task 03 — Monitor the snapshot copy phase and confirm completion
- Task 04 — Verify document counts match between source and target
- Task 05 — Spot-check migrated data using `mongosh` against the DocumentDB endpoint
