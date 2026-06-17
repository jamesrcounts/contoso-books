---
title: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
layout: default
nav_order: 4
has_children: true
---

# Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code

## Scenario Overview

A successful migration starts with a complete picture of the source. In this exercise you will use the Azure DocumentDB Migration Extension for VS Code to assess the local MongoDB instance for compatibility with Azure DocumentDB. The extension generates a structured report categorizing findings as Critical, Warning, or Informational — this is the planning gate before any data moves. You will run a **clean baseline** assessment first, then exercise the app's legacy server-side JavaScript (`$function`) reading-insights report and re-assess — watching a real **Critical** finding appear — before remediating it. That contrast shows how the assessment detects feature usage and what a clean report does (and does not) prove.

## Learning Objectives

- Run a compatibility assessment against the local MongoDB instance using the Azure DocumentDB Migration Extension for VS Code
- Understand how the assessment detects operator usage from the source's runtime metrics — by exercising a legacy feature and watching a finding surface on re-assessment
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

- Task 01 — [Run the Baseline Pre-Migration Assessment](01_run_assessment.md) — connect the extension to the local source and run a clean first pass
- Task 02 — [Exercise the Legacy "Reading Insights" Report](02_exercise_legacy_report.md) — run the server-side JavaScript (`$function`) report, then re-assess and watch the Critical finding appear
- Task 03 — [Review Critical and Warning Findings](03_review_findings.md) — the legacy reading-insights aggregation (server-side JavaScript, `$function`) is flagged as Critical
- Task 04 — [Remediate and Re-Assess](04_remediate_and_reassess.md) — rewrite the `$function` stage using standard aggregation operators, then re-run the assessment to confirm a clean report
- Task 05 — [Choose the Migration Mode](05_choose_migration_mode.md) using the comparison above
