---
title: "Exercise 05 - Task 04 — Monitor the Initial Load Phase"
layout: default
nav_order: 4
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 04 — Monitor the Initial Load Phase

The online job starts with an **initial load** — a bulk copy of the existing documents from the source into DocumentDB, identical in nature to an offline snapshot. The difference is that the application keeps running and writing the entire time; those concurrent writes are captured by the change stream and applied later in the online sync phase (Task 05). In this task you watch the initial load run to completion across both collections.

## Open the job dashboard

1. In the migration extension, open the **View Existing Jobs** tab. Your `contoso-online-cutover` job is listed.
2. The status refreshes automatically at frequent intervals.
3. Select the job row to expand the **collection-wise** view, showing per-collection progress for `books` and `genres`.

> **The copy runs on DMS, not your machine.** Because Azure Database Migration Service performs the data transfer in the cloud, you do not need to keep an active connection to the source or target for the load to continue. You can close and reopen the dashboard; status persists. (Keep the app running regardless — that is the live workload being migrated.)

> **Provisioning comes first.** Because this is a Private job, the migration service spends the first few minutes in a **Provisioning** phase — building its temporary virtual network and peering it to yours — before any documents move. During that window the collection counts stay at `0`; that is expected, not a stall. The dashboard also notes that "status updates may be slightly delayed compared to actual data movement," so give the view a moment to refresh before reacting to a brief `0` or a stale row.

## What to watch

| Collection | Approx. documents | What "done" looks like |
|------------|-------------------|------------------------|
| `books` | 96,419 | Copied count climbs to ~96,419; collection state becomes complete |
| `genres` | 1 | Completes almost immediately |

The `books` collection is the bulk of the work — `genres` (a single document) finishes nearly instantly. Watch the copied-document counts climb toward the source totals.

## Keep the application working during the load

While the load runs, exercise the live app to confirm it is unaffected and to seed changes for the next phase:

1. At `http://localhost:3000`, browse and scroll the catalog — reads continue normally.
2. Add a comment to a book or two. These writes land in the source `reviewcomments` arrays and are recorded in the oplog. They may **not** appear on the target yet — depending on timing they are picked up during initial load or queued for the online sync phase. You will confirm they arrive in Task 05/06.

## Initial load complete

The initial load is finished when **all** selected collections report complete. At that point:

- The job transitions into the **replication (online sync)** phase.
- The **Cutover** button becomes **enabled** — this is the signal that the bulk copy is done and the job is now tailing changes.

Do **not** click Cutover yet. The replication gap still needs to converge (Task 05) and counts must be validated (Task 06).

## Success criteria

The initial load has completed for both `books` and `genres`, the job has entered the replication phase, and the **Cutover** button is now enabled. The application stayed live throughout.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `books` count stalls well below ~96,419 | Transient DMS/network hiccup | Online jobs auto-resume after transient errors; give it time. If truly stuck, **Pause** then **Resume** the job. |
| **Cutover** button never enables | One collection not yet complete | Expand the job row and check the per-collection state — all must report complete. |
| Target shows more documents than source mid-load | Initial load plus already-replicated changes | Expected during an online job; the count-matching check in Task 06 is what you rely on, performed once the gap is zero. |
