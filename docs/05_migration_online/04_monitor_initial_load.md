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

> **Provisioning comes first — and for online it takes a while.** Because this is a Private job, the migration service spends its first **10–15 minutes (sometimes longer)** in a **Provisioning** phase — standing up its own temporary virtual network, worker, and peering — before any documents move. During that whole window the overall status reads **Provisioning** and the collection counts stay at `0`; that is expected, not a stall. The dashboard also notes that "status updates may be slightly delayed compared to actual data movement," so give the view a moment to refresh before reacting to a brief `0` or a stale row.

## What to watch

The dashboard shows the job's overall details and a per-collection table. Once provisioning finishes and the bulk copy runs, it looks like this:

```
Job name:       contoso-online-cutover        Source server: 10.0.0.5
Migration mode: Online                        Target server: contosobooks....global.mongocluster.cosmos.azure.com
Status:         Bulk copy in progress         Duration:      18m 18s

  Database    Collection   Status                     Documents   %      Duration   Time Since Last Change   Replication Changes Played
  bookstore   books        Initial Load in progress   93624       100%   50s        --                       --
  bookstore   genres       Initial Load in progress   1           100%   44s        --                       --
```

`books` (93,624 documents) is the bulk of the work but still copies in well under a minute; `genres` (one document) finishes almost instantly. Watch the **Documents** count climb to the source totals and **%** reach 100%. Notice that **Source server** is the VM's private IP (`10.0.0.5`) — DMS reached the container over the private path. The last two columns, **Time Since Last Change** and **Replication Changes Played**, stay `--` during the initial load; they come alive in the replication phase (Task 05).

## Keep the application working during the load

While the load runs, exercise the live app to confirm it is unaffected and to seed changes for the next phase:

1. At `http://localhost:3000`, browse and scroll the catalog — reads continue normally.
2. Add a comment to a book or two. These writes land in the source `reviewcomments` arrays and are recorded in the oplog. They may **not** appear on the target yet — depending on timing they are picked up during initial load or queued for the online sync phase. You will confirm they arrive in Task 05.

## Initial load complete

The initial load is finished when both collections reach 100%. The overall status moves to **Ready for cutover**, and each collection's state changes from "Initial Load in progress" to **Replicating**:

- The job is now in the **replication (online sync)** phase, tailing the source change stream.
- The **Cutover** button becomes **enabled** — the signal that the bulk copy is done and the job is keeping the target in sync.

Do **not** click Cutover yet. The replication gap still needs to converge and counts must be validated (Task 05).

## Success criteria

The initial load has completed for both `books` and `genres` (both at 100%), the job's overall status is **Ready for cutover** with both collections **Replicating**, and the **Cutover** button is now enabled. The application stayed live throughout.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The job's status goes to **Failed during resource provisioning** | A DMS-side provisioning issue (often transient — there is no Retry button) | Delete the failed job and **recreate** it as in Task 03, making sure the **source connection string** is set explicitly on the wizard's first page. If it fails again with the Network Contributor grant, the `allow-dms-mongodb` NSG rule, and the private endpoint all verified, capture the **Operation ID** from the error and contact Azure support — a provisioning failure with valid infrastructure is a DMS-managed-side issue. |
