---
title: "Exercise 06 - Task 05 — Logging, Threat Detection, and Monitoring"
layout: default
nav_order: 5
parent: "Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI"
---

# Task 05 — Logging, Threat Detection, and Monitoring

**Azure DocumentDB security — monitoring and response. SFI: monitor and detect.**

A hardened cluster you can't observe is only half-secured. This task turns on audit logging, establishes the detection approach for Azure DocumentDB, and confirms the operational health signals.

## Route diagnostic and audit logs to Log Analytics

1. On the cluster page, open **Monitoring → Diagnostic settings → Add diagnostic setting**.
2. Name the setting — for example `cluster-audit-logs`.
3. Tick the **audit** category group (it selects the cluster's **`VCoreMongoRequests`** log), choose **Send to Log Analytics workspace**, and pick **`<cluster>-logs`**. (Event Hub or Storage are also valid destinations for SIEM or long-term archival.)
4. Save. Operations now have a queryable record of requests and access — confirm with `VCoreMongoRequests | take 10` in the workspace once logs begin flowing (a few minutes).

> **Enforce it.** There is a built-in Azure Policy, *"Enable logging by category group for microsoft.documentdb/mongoclusters to Log Analytics"*, that deploys this setting automatically on any cluster that lacks it — assign it so logging is never silently missing (see Task 06).

## Threat detection for Azure DocumentDB

Azure DocumentDB currently has no dedicated Microsoft Defender for Databases workload-protection offering. Detection for this cluster is therefore **log-based**: build alert rules over the diagnostic logs in Log Analytics — or forward them to **Microsoft Sentinel** — for signals such as repeated authentication failures, access from unexpected locations, or anomalous query volume.

## Confirm the operational health signals

Open **Monitoring → Metrics** and glance over the core resource metrics — post-migration, at idle, they should all read calm:

- **CPU**, **Memory**, **Storage**, **IOPS**, **Network** — none pinned near 100%; M40 is comfortably ahead of this workload.

Then add the **Mongo request duration** metric (available because the cluster is **M40 or higher**) and use **Apply splitting** to split by:

- **Operation** — latency per operation type (find, insert, aggregate, …), so a slow access pattern stands out.
- **Error code** — whether requests are failing, grouped by code. Post-hardening this should be empty or near-zero; a cluster of errors here — especially auth errors after the Task 03 changes — is the first place you'd see a client that hasn't moved to Entra yet.

## External resources

- [Monitor Azure DocumentDB diagnostics logs](https://learn.microsoft.com/azure/documentdb/how-to-monitor-diagnostics-logs)
- [Security in Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/security)
- [Microsoft Defender for Databases overview](https://learn.microsoft.com/azure/defender-for-cloud/defender-for-databases-overview)

## Success criteria

A diagnostic setting ships the cluster's **`VCoreMongoRequests`** (audit) logs to the pre-provisioned Log Analytics workspace, you can describe the log-based detection approach for Azure DocumentDB using Log Analytics or Microsoft Sentinel, and the Metrics page reads healthy with the Mongo request duration metric split by operation and error code.

Continue to **Task 06** to cover resilience and governance.
