---
title: "Exercise 06 - Task 05 — Logging, Threat Detection, and Monitoring"
layout: default
nav_order: 5
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 05 — Logging, Threat Detection, and Monitoring

**Benchmark: LT-1 (threat detection), LT-3 (network traffic logging), LT-4 (security logging). SFI: monitor and detect.**

A hardened cluster you can't observe is only half-secured. This task turns on audit logging, sets the realistic detection approach for vCore, and confirms the operational health signals.

## Route diagnostic and audit logs to Log Analytics (LT-3/4)

1. On the cluster page, open **Monitoring → Diagnostic settings → Add diagnostic setting**.
2. Select the cluster's log categories (for example **`MongoRequests`**) and send them to a **Log Analytics workspace** (Event Hub or Storage are also valid destinations for SIEM or long-term archival).
3. Save. Operations now have a queryable record of requests and access.

> **Enforce it.** There is a built-in Azure Policy, *"Enable logging by category group for microsoft.documentdb/mongoclusters to Log Analytics"*, that deploys this setting automatically on any cluster that lacks it — assign it so logging is never silently missing (see Task 06).

## Threat detection on vCore (LT-1)

Microsoft Defender for Cloud's Cosmos DB plan does **not** cover vCore Mongo clusters, so detection here is **log-based**: build alert rules over the diagnostic logs in Log Analytics — or forward them to **Microsoft Sentinel** — for signals such as repeated authentication failures, access from unexpected locations, or anomalous query volume. This is the vCore-appropriate substitute for native anomaly alerts; don't assume a Defender plan is watching.

## Confirm the operational health signals

Open **Monitoring → Metrics** and glance over the core resource metrics — post-migration, at idle, they should all read calm:

- **CPU**, **Memory**, **Storage**, **IOPS**, **Network** — none pinned near 100%; M40 is comfortably ahead of this workload.

Then add the **Mongo request duration** metric (available because the cluster is **M40 or higher**) and use **Apply splitting** to split by:

- **Operation** — latency per operation type (find, insert, aggregate, …), so a slow access pattern stands out.
- **Error code** — whether requests are failing, grouped by code. Post-hardening this should be empty or near-zero; a cluster of errors here — especially auth errors after the Task 03 changes — is the first place you'd see a client that hasn't moved to Entra yet.

## External resources

- [Monitor diagnostics logs — Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/how-to-monitor-diagnostics-logs)
- [Azure Security Baseline for Azure Cosmos DB — LT-1/3/4](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

A diagnostic setting ships the cluster's logs to Log Analytics, you can describe the log-based detection approach for vCore (and why a Defender plan isn't the answer here), and the Metrics page reads healthy with the Mongo request duration metric split by operation and error code.

Continue to **Task 06** to cover resilience and governance.
