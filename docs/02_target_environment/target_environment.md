---
title: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
layout: default
nav_order: 3
---

# Exercise 02 - Target Environment Setup — Azure DocumentDB

## Scenario Overview

In this exercise you will provision the Azure DocumentDB cluster that will become Contoso's production database. Because Azure DocumentDB is natively MongoDB wire-protocol compatible, no application code changes are required — only the connection string changes. The migration extension creates the database and collections during the initial load phase in Exercise 04, so this exercise focuses on the cluster itself: sizing, provisioning, network access, and connectivity.

## Learning Objectives

- Provision an Azure DocumentDB cluster using Bicep, selecting a cluster tier, storage size, and MongoDB version
- Understand the vCore capacity model — compute (cluster tier: vCores + RAM) and storage are selected and scaled independently
- Map the source workload to a starting cluster tier and storage size: data plus indexes, working set vs RAM, vCores for concurrency, storage with growth headroom
- Retrieve the connection string and store it for later use
- Configure public network access (firewall rule for the lab client IP) and confirm connectivity — a new cluster blocks all connections by default

## Estimated Duration

25 minutes

## Tasks

- Task 01 — Review the sizing mapping for Contoso's workload: burstable tiers (M10–M25) fit the dataset for dev/test, M30+ is the production line — the lab provisions **M40** so the database-level request metrics used in Exercise 06 are available
- Task 02 — Provision the resource group and Azure DocumentDB cluster via Bicep
- Task 03 — Add a firewall rule for the lab client IP (deployed with the cluster in the Bicep template) — a new cluster blocks all connections by default
- Task 04 — Retrieve the DocumentDB connection string and store it for later use
- Task 05 — Confirm connectivity from `mongosh`

> **Note:** No database or collections are created in this exercise. The migration extension creates them during the initial load phase in Exercise 04 (offline) or Exercise 05 (online). Portal exploration of cluster tier, storage, indexes, and metrics is covered in Exercise 06 after data has been migrated.
