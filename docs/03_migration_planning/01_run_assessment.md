---
title: "Exercise 03 - Task 01 — Run the Baseline Pre-Migration Assessment"
layout: default
nav_order: 1
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 01 — Run the Baseline Pre-Migration Assessment

Before you can assess anything, the tooling needs to see your source. The **Azure DocumentDB Migration extension** runs inside VS Code but does not manage its own connections — it rides on top of the **DocumentDB for VS Code** extension (installing the Migration extension pulls that one in automatically, so the two always travel together) and assesses whatever source you have connected there. Both were installed by the lab-machine setup script in **Exercise 01, Task 00**.

So you point the extension at your source, then run the scan. It produces a structured report that categorizes every compatibility issue as **Critical**, **Warning**, or **Informational**, at the **account**, **database**, and **collection** levels. This is the planning gate: you do not move data until you understand what the report says.

This first run establishes a **baseline**. As you will see, it comes back clean — and Task 02 then shows you why a clean baseline does *not* mean a clean source.

## Point the extension at your source

In the VS Code **Activity Bar**, open the **DocumentDB** icon to show the **DocumentDB Connections** pane, and select (or re-add) the local container connection you registered in **Exercise 01, Task 02** — the same source the Contoso app is still running against:

```
mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
```

Expand it and confirm the **bookstore** database with its **books** and **genres** collections. That connected, expanded node is what the assessment reads.

> **The assessment needs read and monitoring access.** It requires the connected user to hold the `readAnyDatabase` and `clusterMonitor` roles on the source. The lab's `bookadmin` is the container's **root** user, which already includes both — so no extra grant is needed.

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

> **`serverStatus` vs. logs — and why this run is clean.** The Features check learns which operators your workload uses from `serverStatus`, which reflects only feature usage **since the last `mongod` restart**. A feature the app has not exercised in the current session is invisible to the scan. That is exactly why this baseline comes back clean: the app's everyday read/write paths use only supported operators. In **Task 02** you exercise a legacy feature and watch the assessment pick it up. (Supplying a log path lets the tool attribute findings down to the collection level; without it, findings are reported at the instance level.)

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

This baseline run comes back **clean** — no **Critical** findings under **Features**. Do not mistake that for "nothing to fix": it only means no unsupported feature has been *exercised* in this server session yet. In Task 02 you run the app's legacy reading-insights report and re-assess, and a **Critical** finding appears.

## Success criteria

The pre-migration assessment completes and you have downloaded the HTML report. The report shows the source environment overview and **no Critical findings** — a clean baseline you will deliberately disturb in Task 02.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The connection fails with a network/timeout error | The MongoDB container is not running | Run `docker ps` and confirm the `mongodb` container is up; start it with `docker start mongodb` if needed. |
| An authentication error on expand | Wrong credentials or missing `authSource` | Confirm the string is exactly `mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin`, including `authSource=admin`. |
| You don't see the **Data Migration** option | The Migration extension is not installed | Confirm both extensions are present (Extensions view); re-run the **Exercise 01, Task 00** setup script if the Migration extension is missing. |
| **Run Validation** fails | Cannot connect, or the user lacks required roles | Confirm the container is up and that you connected as `bookadmin`; the assessment needs `readAnyDatabase` + `clusterMonitor` (root has both). |
| The baseline already shows a `$function` finding | The reading-insights report was run earlier in this server session | That is fine — the demonstration still works. To see a truly clean baseline, run `docker restart mongodb` to reset `serverStatus`, reconnect, and re-assess before doing Task 02. |
| Findings have no collection names | No log path was supplied | Re-run and set **Log Folder Path** to your MongoDB log directory for collection-level detail. |
