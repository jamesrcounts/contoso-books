---
title: "Exercise 07 - Task 04 — Browse the Migrated Data with the DocumentDB Extension"
layout: default
nav_order: 4
parent: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
---

# Task 04 — Browse the Migrated Data with the DocumentDB Extension

Now that Contoso's catalog lives in Azure DocumentDB, explore it with the **Azure DocumentDB VS Code extension**. Everything here is standard MongoDB — the extension talks the MongoDB wire protocol to DocumentDB, so browsing and querying work exactly as they would against any MongoDB server.

## Open the connection and browse

1. In VS Code, open the **DocumentDB** view from the Activity Bar (the database-cylinder icon).
2. In the **DocumentDB Connections** pane, expand your cluster node (`contosobooks….global.mongocluster.cosmos.azure.com`). It now lists the **`bookstore`** database the migration created. You may also see a **`migration_dlq`** database the migration left behind for any records it dead-lettered during the copy — ignore it; the catalog lives in **`bookstore`**.
3. Expand **`bookstore`** to see the two collections the migration brought over:
   - **`books`** — Contoso's catalog, roughly **96,419** documents.
   - **`genres`** — a single document holding the de-duped genre list.
4. Expand **`books`**. The extension opens a collection view that pages through the documents — it does not load all ~96k at once.

> **Node won't expand?** Re-add the connection: **+ New Connection…** → **Connection String**, and paste the SRV string from the cluster's **Connection strings** page with `bookadmin` and your password substituted in — the same value as `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env`.

## Inspect a document

Open any document in the **`books`** collection. A book has this shape — useful field names to know before you query:

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

Open a **query playground** on the **`bookstore`** database and run a query for the highest-rated **History** titles, projecting only the fields you care about:

```javascript
db.getCollection('books').find(
  { rating: { $gt: 4.0 }, genre: { $in: ["History"] } },
  { title: 1, author: 1, rating: 1 }
).sort({ rating: -1 }).limit(5).toArray()
```

This filters on the numeric `rating`, matches `History` inside the `genre` array with `$in`, projects three fields, sorts by rating descending, and caps the result at five. It returns five History titles with their authors and ratings, highest first.

## Success criteria

You can browse the `bookstore` database, the `books` and `genres` collections show the expected document counts (~96,419 and 1), and the sample query returns History titles sorted by rating — the migrated catalog is present and queryable from the extension.

Continue to **Task 05** to inspect and manage the catalog's indexes.
