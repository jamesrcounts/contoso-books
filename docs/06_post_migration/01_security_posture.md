---
title: "Exercise 06 - Task 01 — Review the Cluster's Security Posture"
layout: default
nav_order: 1
parent: "Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI"
---

# Task 01 — Review the Cluster's Security Posture

Before changing anything, establish the baseline: what the cluster looks like today and which controls the rest of this exercise will close. This is a read-and-orient task — no changes yet.

## Open the cluster page

1. Sign in to the [Azure portal](https://portal.azure.com).
2. Open the **`rg-documentdb-lab`** resource group and select your **Azure DocumentDB** cluster (resource type `Microsoft.DocumentDB/mongoClusters`).

The **Overview** shows the cluster as deployed: **Status** Ready, **MongoDB version** 7.0, **M40** tier, **128 GiB** disk, a **single shard**, and **High availability** No.

## The current posture — and the gaps

The cluster was provisioned to be reachable for the migration and the earlier exercises, which means several settings are at their permissive defaults. Each gap below maps to a security area and is closed in a later task:

| Area | Today | Fixed in |
|------|-------|----------|
| Network | `publicNetworkAccess` **Enabled**; one firewall rule (`lab-client` = your IP) | Task 02 |
| Identity | **Native** username/password (`bookadmin`) only; no Entra ID | Task 03 |
| Data protection | TLS enforced; **service-managed** encryption at rest | Task 04 |
| Logging | **No diagnostic settings** configured | Task 05 |
| Resilience / governance | Automatic backups on; **HA Disabled**; no policy guardrails | Task 06 |

## Where the security controls live

Locate these blades — you return to them in the following tasks:

- **Settings → Networking** — firewall rules and the public-access toggle (Task 02).
- **Settings → Authentication** — Microsoft Entra ID and native-auth modes (Task 03).
- **Settings → Data encryption** — service-managed vs. customer-managed keys (Task 04).
- **Monitoring → Diagnostic settings** and **Metrics** (Task 05).

## SFI framing

The Secure Future Initiative organizes this work into three principles you'll see throughout: **secure by design** (private connectivity, identity-first), **secure by default** (the hardened settings baked into the deployment, not bolted on later), and **secure operations** (logging, detection, backup/restore). Tasks 02–06 each advance one or more of these.

## Success criteria

You can open the cluster page, read its current posture from the Overview, locate the Networking / Authentication / Data encryption / Diagnostic settings blades, and name the five gaps the rest of the exercise closes.

Continue to **Task 02** to begin with network hardening.
