---
title: "Exercise 05 - Task 05 — Monitor Replication and Verify Cutover Conditions"
layout: default
nav_order: 5
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 05 — Monitor Replication and Verify Cutover Conditions

After the initial load, the job enters the **online sync** (replication) phase: it tails the source change stream and continuously applies every new insert, update, and delete to the target. The overall job status reads **Ready for cutover**, and each collection's Status column reads **Replicating**. In this task you watch replication work, then verify the two conditions that must hold before you cut over: the **replication gap is zero** and the **document counts match**. Cutover is irreversible — this is the gate that protects against data loss.

> **Cutting over without confirming the source and target are in sync can result in data loss.** Treat the conditions below as a hard gate — do not click **Cutover** (Task 06) until both pass.

## The replication metrics

On the expanded job row (**View Existing Jobs** → select the job), the replication phase surfaces two per-collection signals:

| Metric | What it means | How to read it |
|--------|---------------|----------------|
| **Replication Changes Played** | Count of source change-stream events applied to the target | Climbs as changes are applied, then **stabilizes** once the backlog is drained. **This is your convergence signal.** |
| **Time Since Last Change** | Time since the **last source change to that collection** | **Grows whenever that collection isn't being written to** — it is *not* a lag figure. A small value just means a change happened recently; a large, growing value during a quiet interval is expected. |

The signal that the replication gap is effectively zero is **Replication Changes Played holding steady** once you pause adding manual test comments — every captured change has been applied, with no pending backlog. Keep the application online; you are only pausing your test activity long enough to observe convergence. Because only `books` receives writes in this lab (comments), only `books` shows Replication Changes Played climbing; `genres` is never written to, so its count stays at `0` (shown as `--`) and its **Time Since Last Change** simply keeps growing — both are healthy.

## Watch a live write replicate

Prove the change stream is working end-to-end — this doubles as your content-fidelity check:

1. With the app still running, open a book at `http://localhost:3000` and add a comment (e.g. "I love this book").
2. Watch the job dashboard — **Replication Changes Played** for `books` ticks up shortly after as that write is applied to the target.
3. Confirm on the target directly with the DocumentDB extension. The migration created the `bookstore` database on the cluster, so **right-click the Azure cluster connection and Refresh** if you don't see it yet, then open a **query playground** on its `bookstore` database and run:

   ```javascript
   db.getCollection('books').find(
     { "reviewcomments.0": { $exists: true } },
     { title: 1, reviewcomments: 1 }
   ).toArray()
   ```

   Every commented book comes back — including the one you just added — with your comment in its `reviewcomments` array, on DocumentDB, replicated live from the source.

> **This is the zero-downtime property in action.** Contoso's catalog is serving reads and accepting writes against the source, and every one of those writes is landing on DocumentDB within seconds — without any maintenance window.

## Verify the cutover conditions

Both conditions must hold together before you cut over.

### Condition 1 — Replication gap = 0

Leave the app running, but pause adding manual test comments for a moment so any in-flight changes drain, then confirm on the dashboard:

- **Replication Changes Played** has **stabilized** (no longer climbing) for `books` — every captured change has been applied.
- While no new test comment is being added, **Time Since Last Change** simply keeps growing; that's the expected idle state, not lag.

A stable Replication Changes Played between manual test comments means the target has applied everything the source has produced — the gap is ~0.

### Condition 2 — Document counts match

Compare counts directly on both endpoints using the **DocumentDB extension's query playground**, with no shell. Open a playground on each side — your **local source connection** (Exercise 01 Task 02) and your **Azure cluster connection** (Exercise 02 Task 03), each on the **`bookstore`** database. In each, run this with **`Ctrl+Enter`** (the playground shows only the last result, so it returns both counts at once):

```javascript
({
  books:  db.getCollection('books').countDocuments(),
  genres: db.getCollection('genres').countDocuments()
})
```

Both sides must return the same numbers:

| Collection | Expected |
|------------|----------|
| `books` | 93,624 — comment writes update existing documents and do not change the count |
| `genres` | 1 |

> **Use `countDocuments()`, not `count()` or the cached `estimatedDocumentCount()`.** `countDocuments()` performs an actual count and reflects the true current state on each side, which is what a cutover decision requires.

If the counts differ, the replication gap isn't actually closed — let replication catch up (Condition 1) and re-check. Content fidelity you already confirmed above, when your live write came back from the target.

## Success criteria

Both cutover conditions hold: the replication gap is zero (**Replication Changes Played** stable while no new test comment is being added) **and** `countDocuments()` for `books` and `genres` is equal on the source and the target (93,624 / 1) — and you've seen your live writes land on the target. Keep the app online and continue to **Task 06**, where you update its connection, briefly restart it onto Azure, and click **Cutover** last.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Replication Changes Played** keeps climbing and never stabilizes | App is under continuous write load | Briefly pause new writes (don't add comments) and let the backlog drain to confirm convergence. |
| Target count is **lower** than source | Replication still draining | Wait, let **Replication Changes Played** stabilize, then re-run the counts block. |
| Target count is **higher** than source | Leftover data from Exercise 04 not fully dropped | The target wasn't clean — this is why Task 01 drops `bookstore` and `migration_dlq`. Investigate before cutover; do not proceed. |
| A live comment never appears on the target | Looking at the source, or a stale view | Verify you queried the **Azure DocumentDB cluster connection** and **Refresh** it — the migration creates `bookstore`, so the tree won't show it until you refresh. |
