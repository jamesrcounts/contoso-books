---
title: "Exercise 07 - Task 05 — Inspect and Manage Indexes (Including a TTL Index)"
layout: default
nav_order: 5
parent: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
---

# Task 05 — Inspect and Manage Indexes (Including a TTL Index)

Indexing on DocumentDB is **plain MongoDB**: you create indexes with `createIndex`, TTL works through `expireAfterSeconds`, and there is **no indexing policy to manage** the way RU-based Cosmos DB for MongoDB requires. You will inspect the current indexes, add the secondary indexes Contoso's read-heavy catalog needs, and create a TTL index as a demonstration.

Run the commands below in a **query playground** on the **`bookstore`** database.

## Step 1 — Inspect the baseline

A migration copies **data** and the default **`_id`** index; Contoso's source defined no secondary indexes. Check the current state:

```javascript
db.getCollection('books').getIndexes()
```

At minimum you see the default `_id_` index. If you created the `bookformat_1_rating_1` covering index while comparing the slow query earlier, it appears here too — leave it; the secondary indexes below complement it. In the extension you can also expand the **Indexes** node under the `books` collection to see the same entries.

## Step 2 — Create the secondary indexes the catalog needs

The app filters the list page on `rating`, `bookformat`, and `genre`, and sorts on `rating`. Without secondary indexes, those queries collection-scan ~96k documents. Add an index for each access pattern:

```javascript
db.getCollection('books').createIndex({ rating: -1 })
db.getCollection('books').createIndex({ bookformat: 1 })
db.getCollection('books').createIndex({ genre: 1 })
```

The `rating` index is **descending** (`-1`) to match the highest-rated-first sort. The `genre` index is a **multikey** index — MongoDB indexes each element of the `genre` array automatically, which is what makes the `$in: ["History"]` genre filter from Task 04 efficient. Each `createIndex` returns the new index's name (for example, `rating_-1`).

## Step 3 — Create a TTL index (demonstration)

A **TTL (time-to-live)** index automatically deletes documents once a date field passes a configured age — useful for ephemeral data like sessions, audit trails, or view events. The `books` documents have no date field, so create a small, clearly-labeled demo collection instead:

```javascript
db.getCollection('book_view_events').insertOne({ bookId: "demo", viewedAt: new Date() })
db.getCollection('book_view_events').createIndex({ viewedAt: 1 }, { expireAfterSeconds: 3600 })
```

This deletes any `book_view_events` document one hour (`3600` seconds) after its `viewedAt` timestamp. DocumentDB runs the same background TTL reaper MongoDB does — there is nothing DocumentDB-specific to configure.

> **This is the whole point.** Secondary indexes, multikey indexes, and TTL are standard MongoDB index DDL, and they behave identically on DocumentDB. There is **no indexing policy** to author or maintain — a meaningful simplification compared with the RU-based Cosmos DB for MongoDB API.

## Step 4 — Re-inspect

Confirm the new indexes are in place:

```javascript
db.getCollection('books').getIndexes()
db.getCollection('book_view_events').getIndexes()
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

`db.getCollection('books').getIndexes()` returns the `_id_` index plus the three secondary indexes (`rating_-1`, `bookformat_1`, `genre_1`), and `db.getCollection('book_view_events').getIndexes()` shows a TTL index with `expireAfterSeconds: 3600` — all created with standard MongoDB commands, no indexing policy involved.

Continue to **Task 06** to review the connection-string-per-environment pattern.
