---
title: "Exercise 03 - Task 01 — Run the Baseline Pre-Migration Assessment"
layout: default
nav_order: 1
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 01 — Run the Baseline Pre-Migration Assessment

Before you can assess anything, the tooling needs to see your source. The **Azure DocumentDB Migration extension** runs inside VS Code but does not manage its own connections — it rides on top of the **DocumentDB for VS Code** extension (installing the Migration extension pulls that one in automatically, so the two always travel together) and assesses whatever source you have connected there. Both were installed by the lab-machine setup script in **Exercise 01, Task 00**.

So you point the extension at your source, then run the scan. It produces a structured report that categorizes every compatibility issue as **Critical**, **Warning**, or **Informational**, at the **account**, **database**, and **collection** levels. This is the planning gate: you do not move data until you understand what the report says.

This first run establishes a **baseline** of the source as it stands today.

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

The wizard asks for four inputs. Enter them exactly as follows:

- **Assessment name** — `contoso-books-source`.
- **Offering** — select **vCore** (Azure DocumentDB is the vCore-based service being targeted).
- **MongoDB Log Folder Path** — **leave this empty.** The MongoDB instance runs in a container that writes its log to the container's stdout (viewable with `docker logs mongodb`), not to a host folder you could point at. With no path supplied, the assessment reads feature usage from the source's `serverStatus` and reports Features findings at the **instance level**, which is all that is necessary at this point.
- **Data Assessment Logs** — **leave this empty.** This field ingests JSON produced by the separate Data Assessment CLI, which is not used here.

### Step 3 — Get your report

Select **Start Assessment**. Against this dataset it finishes in **a few seconds**. When it completes, select **Download Report** and save the **HTML** file (the save dialog defaults to your `Documents` folder).

## Review the report

Open the downloaded HTML report. It opens with several summary sections describing the source:

- **General Information** — the assessment name, host, ID, start/end time, and the **Log Folder Path** (shows `NA` because you left it empty).
- **Instance Summary** — source version (MongoDB `7.0.x`), license (`community`), and instance type (`mongod`).
- **RBAC Summary** — the source users and roles (your `bookadmin` / `root`).
- **Database** and **Collection Summary** — the `bookstore` database with its two collections (`books` ≈ 96,419 docs, `genres` = 1).

The findings are in the **Assessment Summary** table at the end, with columns **Database · Collection · Category · Severity · Message**. For this baseline run there are **no Critical findings** — but the table is not empty. You will see a **Warning** that `$changeStream` is only partially supported, plus several **Informational** notes about things a managed platform handles for you (the replication commands, and the `rolesInfo` / `usersInfo` RBAC commands, that you no longer need to run). None of these block migration. The Database and Collection columns are blank because, with no log path supplied, findings are reported at the instance level rather than per collection.

There is a catch, though: this report only reflects the features your workload has actually *exercised* so far — and you may not have exercised them all yet, so a clean-looking baseline isn't the whole story. You explore exactly that in the next task.

## Success criteria

The pre-migration assessment completes and you have downloaded the HTML report. It shows the source summary sections and a findings table with **no Critical findings** — a Warning and a couple of Informational entries are expected and do not block migration.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The connection fails with a network/timeout error | The MongoDB container is not running | Run `docker ps` and confirm the `mongodb` container is up; start it with `docker start mongodb` if needed. |
| An authentication error on expand | Wrong credentials or missing `authSource` | Confirm the string is exactly `mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin`, including `authSource=admin`. |
| You don't see the **Data Migration** option | The Migration extension is not installed | Confirm both extensions are present (Extensions view); re-run the **Exercise 01, Task 00** setup script if the Migration extension is missing. |
| **Run Validation** fails | Cannot connect, or the user lacks required roles | Confirm the container is up and that you connected as `bookadmin`; the assessment needs `readAnyDatabase` + `clusterMonitor` (root has both). |
