---
title: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
layout: default
nav_order: 7
---

# Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal

## Scenario Overview

In this exercise you will explore the Microsoft-native experiences for working with DocumentDB day-to-day: the Azure DocumentDB VS Code extension for data exploration, and the Azure portal for operational settings and metrics. Everything in this exercise runs against the data migrated in Exercise 05.

## Learning Objectives

- Browse migrated data using the Azure DocumentDB VS Code extension
- Run ad-hoc queries against DocumentDB from VS Code
- Navigate the DocumentDB cluster page in the Azure portal: overview, scale (compute and storage), connection strings, metrics
- Understand how capacity works post-migration: the cluster tier (vCores + RAM) and storage per shard scale independently — there are no request units to provision
- Review indexes on the migrated collections (standard MongoDB indexes, including TTL indexes) — there is no indexing policy to manage
- Locate the operational signals that matter post-migration: CPU, memory, storage, IOPS, and network — plus request latency and error codes via the Mongo request duration metric (available on M40 and higher, the lab tier)

## Estimated Duration

30 minutes

## Tasks

- Task 01 — Connect the Azure DocumentDB VS Code extension to the target cluster
- Task 02 — Browse migrated databases and collections; run a sample query against the `books` collection
- Task 03 — Open the Azure portal and tour the DocumentDB cluster page
- Task 04 — Review the Scale page — note the cluster tier (M40 for this lab) and storage per shard, and how compute and storage scale independently
- Task 05 — Inspect indexes on the migrated collections with the VS Code extension or `mongosh`, including TTL indexes
- Task 06 — Review the Metrics page — confirm CPU, memory, storage, and IOPS look healthy; split the Mongo request duration metric by operation and error code to check request latency and errors after the migration
