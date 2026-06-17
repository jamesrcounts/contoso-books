---
title: "Exercise 06 - Task 03 — Tour the DocumentDB Cluster Page in the Portal"
layout: default
nav_order: 3
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 03 — Tour the DocumentDB Cluster Page in the Portal

The extension is where you work with *data*; the Azure portal is where you manage the *cluster*. This task is a guided tour — no commands — to get oriented on the cluster page and the few blades you will use in Tasks 04–06.

## Open the cluster page

1. Sign in to the [Azure portal](https://portal.azure.com).
2. Open the **`rg-documentdb-lab`** resource group and select your **mongoClusters** resource (the one you provisioned in Exercise 02 and migrated into in Exercise 05).

This lands you on the cluster's **Overview** page.

## Read the Overview

The **Overview** is the cluster's at-a-glance status. Note these, which connect back to what you provisioned in Exercise 02:

- **Status** — should read **Ready** (a healthy, running cluster).
- **MongoDB / server version** — **7.0**, the `serverVersion` from the Bicep template.
- **Tier and storage** — the **M40** tier and **128 GB** storage summarized here (you will open the dedicated **Scale** page for these in Task 04).
- **Node / shard count** — a **single shard**, as deployed (`sharding.shardCount = 1`).
- **Reset password** — the admin-password reset control lives here on **Overview**, not on the Connection strings page. (This is the same control Exercise 02 Task 03 points you to if you lose the `bookadmin` password.)

## Orient to the left-menu blades

Under the left menu, locate the blades the rest of this exercise uses. You do not need to open them yet — just know where they are:

- **Connection strings** — the SRV connection string with `<user>` / `<password>` placeholders (the page you used in Exercise 02 Task 03 to point the app at the cluster).
- **Settings → Scale** — the cluster tier (compute: vCores + RAM) and storage size. **Task 04.**
- **Settings → Networking** — the firewall allow-list, including the `lab-client` rule from Exercise 02.
- **Monitoring → Metrics** — CPU, memory, storage, IOPS, network, and the Mongo request-duration metric. **Task 06.**

> **Why this matters post-migration:** day-to-day, an operator splits attention between these two surfaces — the extension (and `mongosh`) for data and queries, the portal for capacity, networking, and health. Knowing where each lever lives is the point of this tour.

With the cluster page mapped out, continue to **Task 04** to look at the Scale page in detail.
