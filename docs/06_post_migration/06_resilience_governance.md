---
title: "Exercise 06 - Task 06 — Resilience and Governance"
layout: default
nav_order: 6
parent: "Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI"
---

# Task 06 — Resilience and Governance

**Azure DocumentDB security — backup and restore, and governance. SFI: secure operations and secure by design.**

Hardening isn't done until the cluster can survive a bad day and the posture you just set can't silently drift. This task reviews backup/restore, high availability, cross-region disaster recovery, and the guardrails around the configuration.

## Backup and recovery

Azure DocumentDB creates backups **automatically** — there is nothing to enable. Confirm the recovery story:

- **Retention depends on the cluster tier and state.** Backups for active regular-tier clusters, such as M40, are retained for **35 days**. Backups for active burstable M10, M20, and M25 clusters are retained for **7 days**. After a cluster is deleted, its backups are retained for **7 days**.
- **Snapshot redundancy is regional.** In regions that support availability zones, backup snapshots are stored across three availability zones. This provides in-region zonal durability; it is not geo-redundant storage in a paired region.
- **Point-in-time restore (PITR)** recovers to any moment in the window via the cluster's **Restore** action, which provisions a *new* cluster from the backup — making it one of the routes to move data onto a **customer-managed key** (Task 04): choose CMK while the restored cluster is created.
- **Test it.** A backup you've never restored is a hope, not a plan. Periodically restore to a throwaway cluster and validate the data and app connectivity.

## High availability

For production resilience, revisit **high availability** — Contoso's POC deploys `highAvailability.targetMode: 'Disabled'`; production would choose `SameZone` or `ZoneRedundantPreferred` for a hot standby. Note that a **restored cluster always comes up with HA disabled**, so re-enable it on the new cluster after a PITR. High availability protects against failures within a region; it is not a cross-region disaster-recovery strategy.

## Cross-region disaster recovery

Backups and point-in-time restore protect against accidental changes and support cluster recovery, but they are not a complete disaster-recovery solution. For a regional outage, plan for **cross-region replication** and application reconnection or failover.

Define and validate the recovery objectives for the workload:

- **Recovery point objective (RPO):** the maximum acceptable amount of data loss, measured in time.
- **Recovery time objective (RTO):** the maximum acceptable time to restore service.
- **Recovery exercise:** test replica promotion or failover, connection-string changes, application recovery, and data validation against the agreed RPO and RTO.

## Governance — enforce the posture

Manual hardening drifts. Use **Azure Policy** to keep it in place:

- A **built-in** policy enforces diagnostic logging for `mongoClusters` (Task 05).
- The service has **no built-in** policies for public access, disabling native authentication, or CMK — author **custom** `audit`/`deny` policies over the `Microsoft.DocumentDB/mongoClusters` properties (`publicNetworkAccess`, `authConfig`, `encryption`) to prevent a non-compliant cluster from being created.
- **Tag** the cluster with owner, environment, and data classification for inventory and compliance reporting.

## Secure by default — the hardened template

The cleanest control is to deploy hardened from the start. Contoso's POC cluster was provisioned for migration POC testing rather than with its final security posture; its **production** template would bake the hardened settings in — `publicNetworkAccess: 'Disabled'`, Entra-only `authConfig`, the CMK `encryption` block, a zone-redundant `highAvailability` mode, and a `Microsoft.Insights/diagnosticSettings` resource shipped alongside the cluster — so a cluster is never briefly unhardened during provisioning.

## External resources

- [Restore an Azure DocumentDB cluster](https://learn.microsoft.com/azure/documentdb/how-to-restore-cluster)
- [Create a cross-region or same-region replica](https://learn.microsoft.com/azure/documentdb/how-to-cluster-replica)
- [Security in Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/security)

## Success criteria

You can identify the retention window for each cluster tier and state, distinguish zonal snapshot storage from geo-redundancy, describe PITR and restore-testing, and explain how high availability, cross-region replication, RPO, and RTO fit into the recovery plan. You can also name the governance guardrails (built-in logging policy, custom policies for the controls without built-ins, tagging) and articulate the secure-by-default template that bakes Tasks 02–05 into infrastructure-as-code.

---

This completes Exercise 06. You hardened and reviewed the DocumentDB cluster across Azure DocumentDB's security areas — network isolation, identity, data protection, logging and detection, and resilience and governance — and aligned it to the Secure Future Initiative's secure-by-design, secure-by-default, and secure-operations principles. In **Exercise 07** you bring the development loop full circle, moving local development onto a DocumentDB container so the team's local stack matches production.
