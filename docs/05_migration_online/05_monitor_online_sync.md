---
title: "Exercise 05 - Task 05 — Monitor the Online Sync Phase"
layout: default
nav_order: 5
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 05 — Monitor the Online Sync Phase

After the initial load, the job enters the **online sync** (replication) phase: it tails the source change stream and continuously applies every new insert, update, and delete to the target. Your job is to watch the **replication lag** converge toward zero — the gap between what has happened on the source and what has been applied on the target — so you know when it is safe to cut over. In this task you interpret the replication metrics and confirm live writes are flowing to DocumentDB.

## The metrics that matter

On the expanded job row (**View Existing Jobs** → select the job), the online sync phase surfaces two key signals per collection:

| Metric | What it means | What you want |
|--------|---------------|---------------|
| **Replication Changes Played** | Count of source change-stream events applied to the target | Climbs as changes are applied, then **stabilizes** — no more pending backlog |
| **Time Since Last Change** | Gap between the most recent source change and now | Small and steady — indicates the target is caught up to the source |

A stable **Replication Changes Played** metric means all source changes captured so far have been successfully applied to the target. Combined with a small **Time Since Last Change**, this tells you the replication gap is effectively zero.

## Watch a live write replicate

Prove the change stream is working end-to-end:

1. With the app still running, open a book at `http://localhost:3000` and add a distinctive comment (e.g. your name plus a timestamp).
2. Watch the job dashboard — **Replication Changes Played** ticks up shortly after as that write is applied to the target.
3. Optionally confirm on the target directly with the DocumentDB extension: open the Azure cluster's `bookstore` → `books` collection and run the find query:

   ```json
   { "reviewcomments.0": { "$exists": true } }
   ```

   The book you just commented on appears with your comment in its `reviewcomments` array — on DocumentDB, replicated live from the source.

> **This is the zero-downtime property in action.** Contoso's catalog is serving reads and accepting writes against the source, and every one of those writes is landing on DocumentDB within seconds — without any maintenance window.

## Let it converge

If you make a burst of writes, **Replication Changes Played** rises and then settles once the backlog drains. Before moving on, stop generating writes for a moment and confirm:

- **Replication Changes Played** has **stabilized** (no longer climbing) for all collections.
- **Time Since Last Change** is small and not growing.

This indicates the replication gap has reached ~0. Keep the job in this phase — you formally validate the gap and document counts in Task 06 before cutting over.

## Success criteria

The online sync phase is running, live writes from the app are visibly replicating to DocumentDB, and the replication metrics have converged: **Replication Changes Played** is stable and **Time Since Last Change** is small for both collections. The replication gap is effectively zero.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Replication Changes Played** keeps climbing and never stabilizes | App is under continuous write load | Briefly pause new writes (don't add comments) and let the backlog drain to confirm convergence. |
| **Time Since Last Change** grows steadily | Replication is falling behind or stalled | Check the job for errors; **Pause**/**Resume** if needed. Confirm the source oplog hasn't rolled over (not a concern at lab scale/duration). |
| Live comment never appears on the target | Looking at the source, or a stale view | Verify you queried the **Azure** (`cosmos.azure.com`) connection and **Refresh** the collection view. |
