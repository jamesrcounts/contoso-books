---
title: "Exercise 05 - Task 06 — Verify Cutover Conditions"
layout: default
nav_order: 6
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 06 — Verify Cutover Conditions

Cutover is the irreversible moment when you move the application from the source to the target. Before you trigger it (Task 07) you must confirm two conditions hold together: the **replication gap is zero** (no pending changes) and the **document counts match** on every collection. Skipping this validation is the single most common way to lose data in an online migration. In this task you verify both conditions.

> **Cutting over without validating that source and target are in sync can result in data loss.** Treat this task as a hard gate — do not click **Cutover** until both checks below pass.

## Condition 1 — Replication gap = 0

From Task 05, confirm on the job dashboard (**View Existing Jobs** → expand the job):

- **Replication Changes Played** is **stable** — not climbing — for both `books` and `genres`.
- **Time Since Last Change** is small and steady.

To make the check deterministic, briefly stop adding writes in the app so any in-flight changes drain, then confirm the metrics hold steady. A stable metric with no growing time gap means the target has applied everything the source has produced.

## Condition 2 — Document counts match

Compare counts directly on both endpoints. Open two `mongosh` sessions (or run sequentially).

**Source (local container):**

```powershell
mongosh "mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin"
```

```javascript
use bookstore
db.books.countDocuments()
db.genres.countDocuments()
```

**Target (Azure DocumentDB):**

```powershell
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

```javascript
use bookstore
db.books.countDocuments()
db.genres.countDocuments()
```

The counts must be equal on both sides:

| Collection | Expected |
|------------|----------|
| `books` | ~96,419 (plus any new books added during the lab — must match source) |
| `genres` | 1 |

> **Use `countDocuments()`, not `count()` or the cached `estimatedDocumentCount()`.** `countDocuments()` performs an actual count and reflects the true current state on each side, which is what a cutover decision requires.

If the counts differ, the replication gap is not actually closed — return to Task 05, let replication catch up, and re-check. Do not proceed until they match.

## Optional spot-check

Pick the book you commented on during Task 05 and confirm the comment exists on **both** source and target (e.g. query `{ "reviewcomments.0": { "$exists": true } }` on each). Matching content alongside matching counts gives high confidence the target is a faithful copy.

Exit both shells:

```javascript
exit
```

## Success criteria

Both cutover conditions are satisfied: the replication gap is zero (Replication Changes Played stable, Time Since Last Change small) **and** `countDocuments()` for `books` and `genres` is equal on the source and the target. You are clear to cut over.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Target count is lower than source | Replication still draining | Wait, let the metric stabilize (Task 05), re-run `countDocuments()`. |
| Target count is higher than source | Leftover data from Exercise 04 not fully dropped | The target wasn't clean — this is why Task 01 drops `bookstore`. Investigate before cutover; do not proceed. |
| Counts match but a recent comment is missing on target | You checked before the change replicated | Re-run the spot-check after Time Since Last Change settles. |
