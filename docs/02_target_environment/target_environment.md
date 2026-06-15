---
title: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
layout: default
nav_order: 3
has_children: true
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

- Task 01 — Review the sizing mapping for Contoso's workload
- Task 02 — Provision the resource group, cluster, and firewall rule via Bicep
- Task 03 — Retrieve the DocumentDB connection string and store it for later use
- Task 04 — Confirm connectivity from `mongosh`
