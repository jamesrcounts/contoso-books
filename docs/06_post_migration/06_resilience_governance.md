---
title: "Exercise 06 - Task 06 — Resilience and Governance"
layout: default
nav_order: 6
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 06 — Resilience and Governance

**Benchmark: BR-1/2 (backup and recovery), PV-2 (audit and enforce secure configuration). SFI: secure operations and secure by design.**

Hardening isn't done until the cluster can survive a bad day and the posture you just set can't silently drift. This task confirms backup/restore and puts guardrails around the configuration.

## Backup and recovery (BR-1/2)

vCore backs up **automatically** — there is nothing to enable. Confirm the recovery story:

- **Retention** is fixed at **35 days** for standard tiers (backups are geo-redundant); it is not customer-configurable, and longer retention needs a support request.
- **Point-in-time restore (PITR)** recovers to any moment in the window via the cluster's **Restore** action, which provisions a new cluster from the backup.
- **BR-2 — test it.** A backup you've never restored is a hope, not a plan. Periodically restore to a throwaway cluster and validate the data and app connectivity.

For production resilience, also revisit **high availability** — the lab deploys `highAvailability.targetMode: 'Disabled'`; production would choose `SameZone` or `ZoneRedundantPreferred` for a hot standby.

## Governance — enforce the posture (PV-2)

Manual hardening drifts. Use **Azure Policy** to keep it in place:

- A **built-in** policy enforces diagnostic logging for `mongoClusters` (Task 05).
- vCore has **no built-in** policies for public-access, disable-native-auth, or CMK — author **custom** `audit`/`deny` policies over the `Microsoft.DocumentDB/mongoClusters` properties (`publicNetworkAccess`, `authConfig`, `encryption`) to prevent a non-compliant cluster from being created.
- **Tag** the cluster with owner, environment, and data classification for inventory and compliance reporting.

## Secure by default — the hardened template

The cleanest control is to deploy hardened from the start. A production `mongoClusters` template would set `publicNetworkAccess: 'Disabled'`, Entra-only `authConfig`, the CMK `encryption` block, a zone-redundant `highAvailability` mode, and ship a `Microsoft.Insights/diagnosticSettings` resource alongside the cluster.

> **Why the lab template stays open.** `src/deployment/main.bicep` intentionally provisions the cluster with public access and native auth so Exercises 02–05 (provisioning, migration, cutover) can reach it from outside the VNet. The hardened settings above are what you'd promote into that template for a real deployment — the point of this exercise is to know the difference.

## External resources

- [Restore a cluster — Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/how-to-restore-cluster)
- [Azure Security Baseline for Azure Cosmos DB — BR / PV](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

You can confirm automatic backups and describe PITR and restore-testing, name the governance guardrails (built-in logging policy, custom policies for the controls without built-ins, tagging), and articulate the secure-by-default template that bakes Tasks 02–05 into infrastructure-as-code.

---

This completes Exercise 06. You hardened the DocumentDB cluster across the Azure Security Baseline's control families — network isolation, identity, data protection, logging and detection, and resilience and governance — and aligned it to the Secure Future Initiative's secure-by-design, secure-by-default, and secure-operations principles. In **Exercise 07** you return to the developer workflow against the cluster.
