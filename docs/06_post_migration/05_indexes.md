---
title: "Exercise 06 - Task 05 — Inspect and Create Indexes (Including a TTL Index)"
layout: default
nav_order: 5
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 05 — Inspect and Create Indexes (Including a TTL Index)

Indexing on DocumentDB is **plain MongoDB**: you create indexes with `createIndex`, TTL works through `expireAfterSeconds`, and there is **no indexing policy to manage** the way RU-based Cosmos DB for MongoDB requires. This task proves that hands-on. You will inspect the indexes that survived the migration, add the secondary indexes Contoso's read-heavy catalog needs (the ones Exercise 02 Task 01 said would be "added after the load"), and create a TTL index as a demonstration — then confirm them all.

The commands below are shown for the extension's query editor; each runs unchanged in `mongosh` (connect as in Task 02, then `use bookstore`).

## Step 1 — Inspect the baseline

A migration copies **data** and the default **`_id`** index; it does not invent secondary indexes the source never had — and Contoso's source defined none. Confirm that starting point:

```javascript
db.books.getIndexes()
```

You should see exactly one index — the default:

```json
[ { "v": 2, "key": { "_id": 1 }, "name": "_id_" } ]
```

In the extension you can also expand the **Indexes** node under the `books` collection to see the same `_id_` entry.

## Step 2 — Create the secondary indexes the catalog needs

The app filters the list page on `rating`, `bookformat`, and `genre`, and sorts on `rating`. Without secondary indexes, those queries collection-scan ~96k documents. Add an index for each access pattern:

```javascript
db.books.createIndex({ rating: -1 })
db.books.createIndex({ bookformat: 1 })
db.books.createIndex({ genre: 1 })
```

The `rating` index is **descending** (`-1`) to match the highest-rated-first sort. The `genre` index is a **multikey** index — MongoDB indexes each element of the `genre` array automatically, which is what makes the `$in: ["History"]` filter from Task 02 efficient. Each `createIndex` returns the new index's name (for example, `rating_-1`).

## Step 3 — Create a TTL index (demonstration)

A **TTL (time-to-live)** index automatically deletes documents once a date field passes a configured age — useful for ephemeral data like sessions, audit trails, or view events. The `books` documents have no date field, so rather than alter the catalog, create a small, clearly-labeled demo collection to show TTL working:

```javascript
db.book_view_events.insertOne({ bookId: "demo", viewedAt: new Date() })
db.book_view_events.createIndex({ viewedAt: 1 }, { expireAfterSeconds: 3600 })
```

This says: delete any `book_view_events` document one hour (`3600` seconds) after its `viewedAt` timestamp. DocumentDB runs the same background TTL reaper MongoDB does — there is nothing DocumentDB-specific to configure.

> **This is the whole point.** Secondary indexes, multikey indexes, and TTL are standard MongoDB index DDL, and they behave identically on DocumentDB. There is **no indexing policy** to author or maintain — a meaningful simplification compared with the RU-based Cosmos DB for MongoDB API.

## Step 4 — Re-inspect

Confirm the new indexes are in place:

```javascript
db.books.getIndexes()
db.book_view_events.getIndexes()
```

`books` now lists `_id_` plus `rating_-1`, `bookformat_1`, and `genre_1`. The `book_view_events` indexes include the TTL entry, recognizable by its `expireAfterSeconds`:

```json
[
  { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
  { "v": 2, "key": { "viewedAt": 1 }, "name": "viewedAt_1", "expireAfterSeconds": 3600 }
]
```

In the extension, refresh the **Indexes** node under each collection to see the same entries.

## Success criteria

`db.books.getIndexes()` returns the `_id_` index plus the three secondary indexes (`rating_-1`, `bookformat_1`, `genre_1`), and `db.book_view_events.getIndexes()` shows a TTL index with `expireAfterSeconds: 3600` — all created with standard MongoDB commands, no indexing policy involved.

Continue to **Task 06** to review the cluster's operational metrics after the migration.
