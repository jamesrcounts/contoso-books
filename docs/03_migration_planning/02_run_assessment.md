---
title: "Exercise 03 - Task 02 — Run the Pre-Migration Assessment and Review the Report"
layout: default
nav_order: 2
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 02 — Run the Pre-Migration Assessment and Review the Report

With the source connected, you can now run the assessment. The extension scans the source MongoDB instance and produces a structured report that categorizes every compatibility issue as **Critical**, **Warning**, or **Informational**, at the **account**, **database**, and **collection** levels. This is the planning gate: you do not move data until you understand what the report says.

## Before you run: make the legacy report visible

The assessment's **Features** check learns which MongoDB operators your workload uses from the source server's `serverStatus` metrics. Those metrics only reflect feature usage **since the last `mongod` restart** — so a feature the app never exercised in the current server session is invisible to the scan.

This is why **Exercise 01, Task 06** had you run the reading-insights report: that call recorded the `$function` usage that this assessment is about to detect. If you have restarted the container since then, run the report once more before assessing:

```powershell
Invoke-RestMethod http://localhost:8080/reading-insights | ConvertTo-Json
```

## Launch the assessment

1. In the **DocumentDB Connections** pane, right-click your connected (expanded) local connection and choose **Data Migration...**.
2. The command palette opens with the migration tools. Select **Migration to Azure DocumentDB**.
3. Then select **Pre-Migration Assessment for Azure DocumentDB**.

The assessment wizard opens and walks you through three steps.

### Step 1 — Start validation

Select **Run Validation**. The extension verifies credentials, prerequisites, and connectivity to the source before it does any work. Validation confirms, among other things, that the connected user has the `readAnyDatabase` and `clusterMonitor` roles (your `bookadmin` root user does).

### Step 2 — Fill in assessment details

Provide the inputs:

- **Assessment name** — a label for this run, e.g. `contoso-books-source`.
- **Offering** — select **vCore** (Azure DocumentDB is the vCore-based service this lab targets).
- **Log Folder Path** *(optional but recommended)* — the path to your MongoDB logs. Supplying logs lets the tool report findings down to the **collection** level. Without it, the tool falls back to `serverStatus`, which reflects only feature usage since the last restart and cannot attribute findings to specific collections.

> **`serverStatus` vs. logs — why it matters here.** With no log path, the assessment still detects that `$function` was used (that is what Task 06 recorded), but it reports it as an instance-level Features finding without naming a collection. Pointing at the MongoDB logs lets the tool tie the usage to the `books` collection. Either way, the Critical finding surfaces — the log path only sharpens the detail.

### Step 3 — Get your report

Select **Start Assessment** and wait for it to complete (duration scales with the size of the source). When it finishes, select **Download Report** to save the **HTML** report.

## Review the report structure

Open the downloaded report. It begins with an **environment overview** — the source MongoDB version, license, and instance type, plus the assessed databases and collections and their migration-readiness summaries. Findings are then grouped by severity and by category:

| Category | What it flags |
|----------|---------------|
| **Features** | Unsupported database commands, query syntax, and operators (including aggregation stages), with a usage-frequency column. |
| **Indexes** | Unsupported index types and properties. |
| **Collection Options** | Unsupported collection settings (e.g., time-series configs, collations). |
| **Limits and Quotas** | Azure DocumentDB quotas and platform limits your workload may hit. |
| **Shard Keys** | Unsupported shard-key configurations (for sharded sources). |

Because the Contoso app exercises the `$function` reading-insights report, this run does **not** come back clean — you will see at least one **Critical** finding under **Features**. You dig into it in Task 03.

## Success criteria

The pre-migration assessment completes and you have downloaded the HTML report. The report shows the source environment overview and at least one finding — it is not a clean pass.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Run Validation** fails | Cannot connect, or the user lacks required roles | Confirm the container is up and that you connected as `bookadmin`; the assessment needs `readAnyDatabase` + `clusterMonitor` (root has both). |
| The report shows **no** `$function` finding | The report was never run in this server session | Call `GET /reading-insights` again (above) so `serverStatus` records the usage, then re-run the assessment. |
| Findings have no collection names | No log path was supplied | Re-run and set **Log Folder Path** to your MongoDB log directory for collection-level detail. |
