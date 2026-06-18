---
title: "Exercise 05 - Task 08 — Run the Slow Catalog-Statistics Query and Compare"
layout: default
nav_order: 8
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 08 — Run the Slow Catalog-Statistics Query and Compare

A migration is not finished when the data lands — it is finished when you understand how your workload *behaves* on the new platform. In this task you run a heavy catalog-statistics aggregation against **both** the local source and DocumentDB and compare latency and behavior. Running the same query on each platform side by side surfaces the operational differences that matter for long-running analytical queries: aggregation runtime, and the cursor and transaction timeouts that govern them.

> **This is a behavior comparison, not a compatibility issue.** The legacy server-side JavaScript (`$function`) reading-insights report was already remediated to standard pipeline operators in Exercise 03 Task 03, so it runs on DocumentDB. This task is about *how it performs* on each platform — runtime, not correctness.

## The query

The catalog-statistics aggregation scans the full `books` collection (~96,419 documents), grouping by format to produce counts and average ratings — a full-collection `$group` with no supporting index, which is exactly the kind of long-running analytical query that exposes runtime and timeout behavior.

Run it against **both** endpoints and note the elapsed time printed by the timing wrapper. This task uses `mongosh` rather than the extension's query playground: the timing wrapper prints an `elapsed ms` line after the results, and the playground surfaces only a single (last) result.

**Source (local MongoDB):**

```powershell
mongosh "mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin"
```

```javascript
use bookstore
const t0 = Date.now();
db.books.aggregate([
  { $group: {
      _id: "$bookformat",
      count: { $sum: 1 },
      avgRating: { $avg: "$rating" }
  } },
  { $sort: { count: -1 } }
]).toArray();
print("elapsed ms: " + (Date.now() - t0));
```

**Target (Azure DocumentDB):**

```powershell
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

```javascript
use bookstore
const t0 = Date.now();
db.books.aggregate([
  { $group: {
      _id: "$bookformat",
      count: { $sum: 1 },
      avgRating: { $avg: "$rating" }
  } },
  { $sort: { count: -1 } }
]).toArray();
print("elapsed ms: " + (Date.now() - t0));
```

Both return the same shape — one row per `bookformat` with its count and average rating. Record the `elapsed ms` from each.

## Compare and discuss

| Dimension | What to observe |
|-----------|-----------------|
| **Latency** | The DocumentDB run is a managed, networked service (TLS, SRV, possibly a different region) versus a local container on loopback. Absolute numbers differ — focus on the *behavior*, not a benchmark. |
| **Full-collection scan** | With no index on `bookformat`, both platforms scan all ~96,419 docs. The cost of an unindexed `$group` grows with collection size — the same query gets slower as the catalog grows. |
| **Cursor timeouts** | Aggregation results are streamed via a cursor. Long-running cursors can be closed by the server if idle too long; iterate/drain results promptly rather than holding an open cursor. |
| **Transaction / operation timeouts** | DocumentDB enforces server-side limits on long-running operations. A heavy aggregation that runs unbounded can hit an operation/transaction time limit and be terminated — something a local single-node instance may tolerate silently. |

### Mitigations for long-running aggregations on DocumentDB

- **Index to avoid full scans.** Add an index supporting the grouping/filtering fields (e.g. on `bookformat`) so the query reads far fewer documents. You will review indexes on the migrated collections in Exercise 06.
- **`allowDiskUse: true`** for aggregations whose grouping/sorting exceeds the in-memory limit, so stages can spill to disk instead of failing.
- **Bound and shape the work** — push `$match` filters early to shrink the working set, project only needed fields, and paginate large result sets rather than materializing everything at once.
- **Mind the timeouts** — keep individual operations within the platform's time limits; for genuinely heavy analytics, precompute/materialize results rather than running ad-hoc full scans against the operational store.

Exit both shells:

```javascript
exit
```

## Success criteria

The catalog-statistics aggregation runs successfully against DocumentDB and returns the same results as the source, you have recorded the elapsed time on each platform, and you can articulate the runtime differences — full-collection scan cost, cursor timeouts, and operation/transaction time limits — along with the mitigations (indexing, `allowDiskUse`, bounding the query).

---

This completes Exercise 05. Contoso's catalog was migrated **online**, with the application live and accepting writes throughout, and cut over to DocumentDB only after replication reached zero lag and counts matched. In Exercise 06 you explore the migrated data and operate the cluster day-to-day with the DocumentDB VS Code extension and the Azure portal.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Aggregation errors with a memory-limit message | Grouping/sorting exceeds the in-memory cap | Re-run with `db.books.aggregate([...], { allowDiskUse: true })`. |
| Query is terminated for exceeding a time limit on DocumentDB | Unindexed full scan hitting an operation timeout | Add a supporting index and/or narrow the query with an early `$match`; see the mitigations above. |
| `avgRating` is `null` for a format | `rating` missing/non-numeric on some docs | Expected for sparse data; add `{ $match: { rating: { $type: "number" } } }` before `$group` if you want to exclude them. |
