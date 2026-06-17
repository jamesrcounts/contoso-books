---
title: "Exercise 04 - Task 03 — Monitor the Snapshot Copy Phase and Confirm Completion"
layout: default
nav_order: 3
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 03 — Monitor the Snapshot Copy Phase and Confirm Completion

The job is running on the Azure Database Migration Service in the cloud, not on your machine — so you can watch its progress without staying connected to the source or target. In this task you monitor the snapshot copy from the extension's dashboard and confirm it reaches completion for both collections.

## Open View Existing Jobs

In the extension, open the **View Existing Jobs** tab (you were redirected here after starting the job). The job is listed under the DMS instance you selected; use **Change DMS** if you don't see it. The dashboard shows each job's overall status and refreshes automatically at frequent intervals.

Select the job's row to drill into the **collection-wise status** — a per-collection breakdown showing the copy progress of `books` and `genres` individually.

## What "complete" means for an offline job

This is the key behavioral difference from online migration:

- **Offline jobs complete automatically** once the selected collection snapshots have finished copying to the target. There is no manual step.
- **Online jobs do not** — they keep replicating until you manually select **Cutover** (you'll see this in Exercise 05).

You can **Pause** an offline job at a logical point and **Resume** it later, but for this lab let it run straight through.

### Example output

As the copy proceeds, the collection-wise view advances both collections to a completed state:

```
Job: bookstore-offline           Mode: Offline      Status: Completed

  Collection          Copied / Total      Status
  books               96419 / 96419       Completed
  genres              1 / 1               Completed
```

`genres` (a single document) completes almost instantly; `books` takes longer as all 96,419 documents are bulk-copied. The job's overall status flips to **Completed** once both collections are done.

## Success criteria

- The job's overall status reads **Completed**.
- The collection-wise view shows both `books` and `genres` as copied/Completed, with `books` reporting 96,419 documents.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Job sits at 0% / never starts copying | DMS cannot reach the source | Confirm the source MongoDB container is still `Up` (`docker ps`) and that you chose **Public** connectivity in Task 02 — DMS connects to the source over its public endpoint. |
| Job fails partway with a target error | Target firewall or credentials changed | Re-check the `lab-client` firewall rule and the target connection string (see Task 02 troubleshooting), then recreate the job. |
| `books` appears slow | Expected — it is the large collection | Bulk-copying ~96k documents takes longer than the single-document `genres`. Let it run; the dashboard updates on its own. |
