---
title: "Exercise 06 - Task 01 — Review the Cluster's Security Posture"
layout: default
nav_order: 1
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 01 — Review the Cluster's Security Posture

Before changing anything, establish the baseline: what the cluster looks like today and which controls the rest of this exercise will close. This is a read-and-orient task — no changes yet.

## Open the cluster page

1. Sign in to the [Azure portal](https://portal.azure.com).
2. Open the **`rg-documentdb-lab`** resource group and select your **mongoClusters** resource.

The **Overview** shows the cluster as deployed: **Status** Ready, **server version** 7.0, **M40** tier, **128 GB** storage, a **single shard**, and **high availability Disabled**.

## The current posture — and the gaps

The cluster was provisioned to be reachable for the migration and the earlier exercises, which means several settings are at their permissive defaults. Each gap below maps to a Microsoft cloud security benchmark control and is closed in a later task:

| Area | Today | Benchmark control | Fixed in |
|------|-------|-------------------|----------|
| Network | `publicNetworkAccess` **Enabled**; one firewall rule (`lab-client` = your IP) | NS-2 | Task 02 |
| Identity | **Native** username/password (`bookadmin`) only; no Entra ID | IM-1 / IM-3 / PA-7 | Task 03 |
| Data protection | TLS enforced; **platform-managed** encryption at rest | DP-3 / DP-4 / DP-5 | Task 04 |
| Logging | **No diagnostic settings** configured | LT-1 / LT-3 / LT-4 | Task 05 |
| Resilience / governance | Automatic backups on; **HA Disabled**; no policy guardrails | BR-1/2 / PV-2 | Task 06 |

## Where the security controls live

Locate these blades — you return to them in the following tasks:

- **Settings → Networking** — firewall rules and the public-access toggle (Task 02).
- **Settings → Authentication** — Microsoft Entra ID and native-auth modes (Task 03).
- **Settings → Data encryption** — service-managed vs. customer-managed keys (Task 04).
- **Monitoring → Diagnostic settings** and **Metrics** (Task 05).

> **Posture tooling note.** Microsoft Defender for Cloud has a plan for Azure Cosmos DB, but it covers the **request-unit (NoSQL) accounts, not the vCore Mongo cluster** — so for this cluster, posture is assessed against the **[Azure Security Baseline for Azure Cosmos DB](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)** and SFI directly, and detection is built on diagnostic logs (Task 05) rather than a Defender plan.

## SFI framing

The Secure Future Initiative organizes this work into three principles you'll see throughout: **secure by design** (private connectivity, identity-first), **secure by default** (the hardened settings baked into the deployment, not bolted on later), and **secure operations** (logging, detection, backup/restore). Tasks 02–06 each advance one or more of these.

## Success criteria

You can open the cluster page, read its current posture from the Overview, locate the Networking / Authentication / Data encryption / Diagnostic settings blades, and name the five gaps the rest of the exercise closes.

Continue to **Task 02** to begin with network hardening.
