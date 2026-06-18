---
title: "Exercise 05 - Task 07 — Run the Slow Catalog-Statistics Query and Compare"
layout: default
nav_order: 7
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 07 — Run the Slow Catalog-Statistics Query and Compare

A migration is not finished when the data lands — it is finished when you understand how your workload *behaves* on the new platform. In this task you run a heavy catalog-statistics aggregation against **both** the local source and DocumentDB and compare latency and behavior. Running the same query on each platform side by side surfaces the operational differences that matter for long-running analytical queries: aggregation runtime, and the cursor and transaction timeouts that govern them.

> **This is a behavior comparison, not a compatibility issue.** The legacy server-side JavaScript (`$function`) reading-insights report was already remediated to standard pipeline operators in Exercise 03 Task 03, so it runs on DocumentDB. This task is about *how it performs* on each platform — runtime, not correctness.

## The query

The catalog-statistics aggregation scans the full `books` collection (~96,419 documents), grouping by format to produce counts and average ratings — a full-collection `$group` with no supporting index, which is exactly the kind of long-running analytical query that exposes runtime and timeout behavior.

Run it in a **query playground** on each connection — the same playground you used in Tasks 05 and 06, once on the local source connection and once on the Azure target. Wrap the work in a single returned object so one playground result carries **both** the elapsed time and the rows: the intermediate `const`s don't render, and the final object literal is the result the playground shows. (The playground also prints its own **Executed in N ms** line above the result.)

Run the identical block against each connection:

```javascript
const t0 = Date.now();
const rows = db.getCollection('books').aggregate([
  { $group: {
      _id: "$bookformat",
      count: { $sum: 1 },
      avgRating: { $avg: "$rating" }
  } },
  { $sort: { count: -1 } }
]).toArray();
({ elapsedMs: Date.now() - t0, rows })
```

Both return the same shape — `elapsedMs` plus one `rows` entry per `bookformat` with its count and average rating. Record the `elapsedMs` from each run.

**Source (local MongoDB) — example output:**

```javascript
// Executed in 2857ms
{
  "elapsedMs": 2697,
  "rows": [
    { "_id": "Paperback", "count": 53120, "avgRating": 3.8516692394578316 },
    { "_id": "Hardcover", "count": 27528, "avgRating": 3.8429355565242664 },
    { "_id": "Kindle Edition", "count": 3758, "avgRating": 3.821295902075572 },
    { "_id": "ebook", "count": 3590, "avgRating": 3.711434540389972 },
    { "_id": "", "count": 3183, "avgRating": 3.730977065661326 },
    { "_id": "Mass Market Paperback", "count": 2945, "avgRating": 3.792125636672326 }
    // … (~190 bookformat values; long tail of count-1 entries)
  ]
}
```

**Target (Azure DocumentDB) — example output:**

```javascript
// Executed in 271ms
{
  "elapsedMs": 234,
  "rows": [
    { "_id": "Paperback", "count": 53120, "avgRating": 3.8516692394578707 },
    { "_id": "Hardcover", "count": 27528, "avgRating": 3.842935556524294 },
    { "_id": "Kindle Edition", "count": 3758, "avgRating": 3.821295902075569 },
    { "_id": "ebook", "count": 3590, "avgRating": 3.711434540389966 },
    { "_id": "", "count": 3183, "avgRating": 3.7309770656613175 },
    { "_id": "Mass Market Paperback", "count": 2945, "avgRating": 3.7921256366723135 }
    // … (~190 bookformat values; long tail of count-1 entries)
  ]
}
```

Both sides return identical counts per format; `avgRating` agrees to roughly 12 significant figures (the difference in the final digits is float summation-order rounding, not a data discrepancy).

## Compare and discuss

| Dimension | What to observe |
|-----------|-----------------|
| **Latency** | In this run the managed cluster ran the unindexed `$group` markedly faster than the local container (~270 ms vs ~2.8 s). This is **not a benchmark** — a single-node container on a lab VM is not a fair baseline, and cluster numbers vary with tier, region, and load — but don't assume the managed, networked service is the slow side; here it was not. Focus on the *behavior*, not the absolute figures. |
| **Full-collection scan** | With no index on `bookformat`, both platforms scan all ~96,419 docs. The cost of an unindexed `$group` grows with collection size — the same query gets slower as the catalog grows. |
| **Cursor timeouts** | Aggregation results are streamed via a cursor. Long-running cursors can be closed by the server if idle too long; iterate/drain results promptly rather than holding an open cursor. |
| **Transaction / operation timeouts** | DocumentDB enforces server-side limits on long-running operations. A heavy aggregation that runs unbounded can hit an operation/transaction time limit and be terminated — something a local single-node instance may tolerate silently. |

### Mitigations for long-running aggregations on DocumentDB

- **Index to avoid full scans.** Add an index that covers the fields the query touches so it reads from the index instead of every full document — you do this hands-on in the next section. You will review indexes on the migrated collections in Exercise 06.
- **`allowDiskUse: true`** for aggregations whose grouping/sorting exceeds the in-memory limit, so stages can spill to disk instead of failing.
- **Bound and shape the work** — push `$match` filters early to shrink the working set, project only needed fields, and paginate large result sets rather than materializing everything at once.
- **Mind the timeouts** — keep individual operations within the platform's time limits; for genuinely heavy analytics, precompute/materialize results rather than running ad-hoc full scans against the operational store.

## Index it and re-run

This aggregation touches exactly two fields — `bookformat` (grouped on) and `rating` (averaged). A **compound index on both** lets the engine read the `$group` inputs straight from the index rather than fetching each full document — a *covering* index for this pipeline. An index on `bookformat` alone would not cover it, because `rating` would still require a document fetch.

Create the index on the **Azure target** connection's playground:

```javascript
db.getCollection('books').createIndex({ bookformat: 1, rating: 1 })
```

The build takes a couple of seconds and returns the new index's name:

```javascript
// Executed in 2110ms
bookformat_1_rating_1
```

Now re-run the same timed block against the target and compare `elapsedMs` to your earlier (pre-index) target run:

```javascript
const t0 = Date.now();
const rows = db.getCollection('books').aggregate([
  { $group: {
      _id: "$bookformat",
      count: { $sum: 1 },
      avgRating: { $avg: "$rating" }
  } },
  { $sort: { count: -1 } }
]).toArray();
({ elapsedMs: Date.now() - t0, rows })
```

The first run right after creating an index may include one-time warm-up, so run it twice and use the second:

```javascript
// Executed in 132ms
{
  "elapsedMs": 107,
  "rows": [
    { "_id": "Paperback", "count": 53120, "avgRating": 3.851669239457873 },
    { "_id": "Hardcover", "count": 27528, "avgRating": 3.8429355565243504 },
    { "_id": "Kindle Edition", "count": 3758, "avgRating": 3.8212959020755752 },
    { "_id": "ebook", "count": 3590, "avgRating": 3.7114345403899747 },
    { "_id": "", "count": 3183, "avgRating": 3.730977065661325 },
    { "_id": "Mass Market Paperback", "count": 2945, "avgRating": 3.792125636672312 }
    // … (~190 bookformat values; long tail of count-1 entries)
  ]
}
```

The counts and averages are unchanged — only the time moved. On this cluster the covering index roughly **halved** the elapsed time (pre-index ~234 ms → post-index ~110 ms across two runs): with the index, the planner serves the `$group` directly from the smaller index entries instead of fetching all ~96,419 full documents. As with the source-vs-target comparison, this is **not a benchmark** — it's one cluster, one tier, a handful of runs — but it shows the mechanism: covering the fields a query touches lets it avoid the full-document scan.

The index persists on the collection. To restore the unindexed baseline, drop it:

```javascript
db.getCollection('books').dropIndex({ bookformat: 1, rating: 1 })
```

## Success criteria

The catalog-statistics aggregation runs successfully against DocumentDB and returns the same results as the source, you have recorded the elapsed time on each platform, and you can articulate the runtime differences — full-collection scan cost, cursor timeouts, and operation/transaction time limits — along with the mitigations (indexing, `allowDiskUse`, bounding the query).

---

This completes Exercise 05. Contoso's catalog was migrated **online**, with the application live and accepting writes throughout, and cut over to DocumentDB only after replication reached zero lag and counts matched. In Exercise 06 you explore the migrated data and operate the cluster day-to-day with the DocumentDB VS Code extension and the Azure portal.
