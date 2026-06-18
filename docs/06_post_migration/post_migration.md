---
title: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
layout: default
nav_order: 7
has_children: true
---

# Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal

## Scenario Overview

In this exercise you will explore the Microsoft-native experiences for working with DocumentDB day-to-day: the Azure DocumentDB VS Code extension for data exploration, and the Azure portal for operational settings and metrics. Everything runs against the data migrated in Exercise 05.

## Learning Objectives

- Browse migrated data and run ad-hoc queries with the Azure DocumentDB VS Code extension
- Navigate the DocumentDB cluster page in the Azure portal: overview, scale, connection strings, and metrics
- Understand how capacity works post-migration: compute (the M40 tier) and storage scale independently, with no request units to provision
- Manage indexes with standard MongoDB commands — secondary, multikey, and TTL indexes — with no indexing policy to maintain
- Locate the operational signals that matter post-migration: CPU, memory, storage, IOPS, and network — plus request latency and error codes via the Mongo request duration metric (available on M40 and higher, the lab tier)

## Estimated Duration

20 minutes

## Tasks

- Task 01 — Browse the migrated data and run a query with the DocumentDB VS Code extension
- Task 02 — Tour the cluster page in the Azure portal: Overview, operational blades, and the Scale page
- Task 03 — Inspect and manage indexes on the migrated collections, including a TTL index
- Task 04 — Review the Metrics page; split the Mongo request duration metric by operation and error code
