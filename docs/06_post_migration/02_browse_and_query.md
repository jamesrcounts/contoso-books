---
title: "Exercise 06 - Task 02 — Browse the Migrated Data and Run a Query"
layout: default
nav_order: 2
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 02 — Browse the Migrated Data and Run a Query

With the connection open, this task uses the DocumentDB extension to browse the migrated `bookstore` database, inspect a real `books` document, and run an ad-hoc query against the catalog. Everything here is standard MongoDB — the extension talks the MongoDB wire protocol to DocumentDB, so the experience is identical to working against the source.

## Browse the databases and collections

1. In the **DocumentDB Connections** pane, expand your cluster node, then expand the **`bookstore`** database.
2. You should see the two collections the migration brought over:
   - **`books`** — Contoso's catalog, roughly **96,419** documents.
   - **`genres`** — a single document holding the de-duped genre list.
3. Expand **`books`**. The extension opens a collection view that pages through the documents — it does not load all ~96k at once.

> **Confirming the counts:** the extension shows the document count for each collection. Compare them with the source counts you verified at cutover in Exercise 05 — `books` ≈ 96,419 and `genres` = 1. Matching counts are your first post-migration sanity check that the data arrived intact.

## Inspect a document

Open any document in the **`books`** collection (select a row, or use the extension's document view). A migrated book has this shape — useful field names to know before you query:

```json
{
  "_id": "…",
  "title": "Between Two Fires: American Indians in the Civil War",
  "author": "Laurence M. Hauptman",
  "img": "https://…",
  "desc": "…",
  "bookformat": "Paperback",
  "isbn": "…",
  "isbn13": "…",
  "genre": ["History", "Nonfiction", "War"],
  "rating": 3.52,
  "totalratings": 33,
  "pages": 304,
  "reviews": 5,
  "link": "https://…",
  "reviewcomments": [
    { "name": "…", "comment": "…" }
  ]
}
```

Note that **`genre`** is an **array** of strings and **`rating`** is a **number** — both matter for the query below.

## Run a sample query

Use the extension's **query editor** on the open `books` collection. Find the highest-rated **History** titles, returning only the fields you care about:

```javascript
db.books.find(
  { rating: { $gt: 4.0 }, genre: { $in: ["History"] } },
  { title: 1, author: 1, rating: 1 }
).sort({ rating: -1 }).limit(5)
```

This filters on a numeric `rating`, matches `History` inside the `genre` array with `$in`, projects three fields, sorts by rating descending, and caps the result at five documents. You should get back five real titles with their authors and ratings.

### mongosh alternative

The same query runs in `mongosh` if you prefer the shell. Connect with the Azure SRV connection string (the value of `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env`), then select the database and run the query:

```powershell
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

```javascript
use bookstore
db.books.find(
  { rating: { $gt: 4.0 }, genre: { $in: ["History"] } },
  { title: 1, author: 1, rating: 1 }
).sort({ rating: -1 }).limit(5)
```

> **It's just MongoDB.** Neither the query syntax nor the driver changes against DocumentDB. The connection string is the only thing that differs from querying the source container — exactly the point of migrating to a wire-protocol-compatible service.

## Success criteria

You can browse the `bookstore` database, the `books` and `genres` collections show the expected counts, and the sample query returns real History titles sorted by rating — confirming the migrated catalog is queryable from both the extension and `mongosh`.

Continue to **Task 03** to switch over to the Azure portal and tour the cluster's operational pages.
