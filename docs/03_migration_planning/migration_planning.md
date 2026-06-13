---
title: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
layout: default
nav_order: 4
---

# Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code

## Scenario Overview

A successful migration starts with a complete picture of the source. In this exercise you will use the Azure DocumentDB Migration Extension for VS Code to assess the local MongoDB instance for compatibility with Azure DocumentDB. The extension generates a structured report categorizing findings as Critical, Warning, or Informational — this is the planning gate before any data moves. Because the Contoso app ships with legacy patterns (the server-side JavaScript reading-insights report exercised in Exercise 01), the assessment returns real findings — not a clean pass.

## Learning Objectives

- Run a compatibility assessment against the local MongoDB instance using the Azure DocumentDB Migration Extension for VS Code
- Interpret the multi-level report (source instance, database, and collection levels)
- Identify unsupported MongoDB features, commands, or indexes that require remediation before migration
- Remediate a Critical finding — rewrite the server-side JavaScript (`$function`) aggregation with standard pipeline operators and confirm the assessment clears
- Select the appropriate migration mode (online vs offline) based on downtime tolerance

## Estimated Duration

35 minutes

## Offline vs Online — Choosing the Right Mode

| | Offline (Snapshot) | Online (Change Stream) |
|---|---|---|
| **How it works** | Point-in-time copy of the source | Initial copy + continuous sync via oplog |
| **Downtime required** | Yes — writes must stop before cutover | No — source stays live throughout |
| **Source requirement** | Standalone or replica set | Replica set only (needs oplog) |
| **Best for** | Scheduled maintenance windows, smaller datasets | Production workloads where downtime is unacceptable |
| **Cutover trigger** | Copy complete | Replication gap = 0 AND document counts match |

> **Why we configured a replica set in Exercise 01:** Offline migration works with any MongoDB instance. Online migration requires change streams, which require an oplog, which requires replica set mode. By initializing the container as a single-node replica set from the start, we can demonstrate both paths without reconfiguring the source.

## Tasks

- Task 01 — Connect the extension to the local MongoDB instance
- Task 02 — Run the pre-migration assessment and review the report
- Task 03 — Review Critical and Warning findings — the legacy reading-insights aggregation (server-side JavaScript, `$function`) is flagged as Critical
- Task 04 — Remediate: rewrite the `$function` stage using standard aggregation operators, then re-run the assessment to confirm a clean report
- Task 05 — Choose migration mode using the comparison above
