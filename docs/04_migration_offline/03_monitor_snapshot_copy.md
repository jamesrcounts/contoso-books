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

## Watch the status progress

The overall status moves through three states:

1. **Provisioning** — the migration service builds its own temporary virtual network and peers it to yours (this is the private connectivity you configured in Task 02). Expect this to take **a few minutes**, during which no documents move and the collection counts stay at `0`. That is normal — it is not stuck.
2. **Bulk copy in progress** — the snapshot is being copied. Once it reaches this state the actual copy is fast: `genres` (one document) finishes almost instantly and `books` (96,419 documents) completes in well under a minute.
3. **Succeeded** — both collection snapshots are on the target and the job is done.

> **The dashboard lags slightly.** As the page itself notes, "status updates may be slightly delayed compared to actual data movement." A collection can briefly show `0` documents (or, if you resumed the job, a stale row from the previous attempt) while the copy is in fact progressing. Give it a moment and let the view refresh before reacting.

## What "complete" means for an offline job

This is the key behavioral difference from online migration:

- **Offline jobs complete automatically** once the selected collection snapshots have finished copying to the target. There is no manual step.
- **Online jobs do not** — they keep replicating until you manually select **Cutover** (you'll see this in Exercise 05).

You can **Pause** an offline job at a logical point and **Resume** it later, but for this lab let it run straight through.

### Example output

When the copy finishes, the overall status reads **Succeeded** and the collection-wise view shows both collections `Completed`:

```
Job name: contoso-offline-migration     Mode: Offline     Status: Succeeded

  Database    Collection    Status       Documents    %       Duration
  bookstore   books         Completed    96419        100%    26s
  bookstore   genres        Completed    1            100%    22s
```

The per-collection **Duration** reflects only the copy itself (tens of seconds) — most of the wall-clock time you waited was the **Provisioning** phase before it. The overall status reads **Succeeded** once both collections are `Completed`.

## Success criteria

- The job's overall status reads **Succeeded**.
- The collection-wise view shows both `books` and `genres` as `Completed`, with `books` reporting 96,419 documents.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The job reaches **Bulk copy** but the collections **Fail at 0% / 0s** | The migration service cannot reach the source on 27017 | Confirm the source container is still `Up` (`docker ps`) and that the DMS-CIDR inbound NSG rule from [Task 02](02_create_offline_migration_job.md) Step 4 exists, then **Resume** the job — offline jobs are resumable and pick up where they stopped. |
| Job fails partway with a target error | Target credentials are wrong, or the private endpoint isn't resolving | Re-check the target connection string (the admin password) and that the cluster's private endpoint and private DNS zone from Exercise 02 are in place (see [Task 02](02_create_offline_migration_job.md) troubleshooting), then **Resume**. |
| The job seems to sit for several minutes with no progress | Expected — it is in the **Provisioning** phase | The migration service is building its temporary virtual network and peering before any data moves. Counts stay at `0` until it reaches **Bulk copy**; let it run and the dashboard updates on its own. |
