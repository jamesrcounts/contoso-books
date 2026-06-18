---
title: "Exercise 04 - Task 04 — Verify the Migrated Data"
layout: default
nav_order: 4
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 04 — Verify the Migrated Data

The dashboard says the job succeeded — now prove it independently, two ways. **Counts** confirm the migration was *complete* (the same number of documents arrived); a **spot-check** confirms it was *faithful* (each document arrived intact, with its nested arrays and field types preserved). You do both from the **DocumentDB extension's query playground** — a mongosh-flavored scratchpad — with no shell.

The collection node in the tree shows only a **rounded** count (for example `94.2k`), which isn't precise enough to prove an exact match. The playground gives the real numbers and lets you inspect documents field-for-field.

## Open a query playground on each side

You will compare the **local source** against the **Azure target**, so open a playground for each:

1. In the **DocumentDB Connections** pane, expand your **local source connection** (the one from Exercise 01 Task 02, addressed by the VM private IP), right-click the **`bookstore`** database, and open a **query playground**. Its header reads `bookadmin@10.0.0.5:27017 / bookstore`.
2. Do the same on your **Azure cluster connection** (from Exercise 02 Task 03 — it already stores your credentials and reaches the cluster over its private endpoint). The **`bookstore`** database appears on the target because the migration created it; if you don't see it, right-click the connection and **Refresh**. Its header reads `bookadmin@<your-cluster>.global.mongocluster.cosmos.azure.com / bookstore`.

Keep both playgrounds open — you run the same queries in each and compare the results.

## Verify the counts (quantity)

In each playground, paste this and run it with **`Ctrl+Enter`**. The playground shows only the last result, so this returns both counts at once:

```javascript
({
  books:  db.getCollection('books').countDocuments(),
  genres: db.getCollection('genres').countDocuments()
})
```

Both sides return **`{ books: 93624, genres: 1 }`**.

| Collection | Source (local) | Target (Azure) |
|------------|----------------|----------------|
| `books`    | 93,624         | 93,624         |
| `genres`   | 1              | 1              |

The counts must match exactly. They should, because the source was frozen before the snapshot (Task 01) — an offline copy has no opportunity to drift as long as no writes landed afterward.

## Spot-check a book (fidelity)

Matching counts prove quantity, not fidelity. Find the book you commented on during the Exercise 01 baseline — its comment was frozen into the source and should have migrated intact. Rather than hard-code a title, query for whichever book has a comment, and run it in **both** playgrounds:

```javascript
db.getCollection('books').findOne({ "reviewcomments.0": { $exists: true } })
```

### Example output (trimmed)

```javascript
{
  _id: ObjectId('...'),
  title: 'Competitive Advantage Through People: Unleashing the Power of the Work Force',
  author: 'Jeffrey Pfeffer',
  bookformat: 'Paperback',
  genre: [ 'Business', 'Leadership', 'Management', 'Romance', 'Historical Romance' ],
  rating: 3.65,
  totalratings: 20,
  pages: 304,
  reviewcomments: [ { name: 'Jim', comment: 'This book changed my life.' } ]
}
```

Your own commented book will differ — the point is that the same document, with the same comment, comes back on both sides. Confirm the field-level details survived the copy, not just the document itself:

- **`genre`** is still an **array** of strings, not a flattened string.
- **`rating`** is a **number** (e.g. `3.65`), not a string.
- **`pages`** / **`totalratings`** are numbers.
- **`reviewcomments`** holds the comment you added during the Exercise 01 baseline as a `{ name, comment }` entry — its presence here proves the *write* survived the migration, not just the seeded fields.

The target document should match the source document field-for-field, comment included.

## Check the genres document

The `genres` collection holds a single document with the de-duplicated, sorted genre list. In both playgrounds, confirm it copied with its array intact:

```javascript
db.getCollection('genres').findOne()
```

### Example output (trimmed)

```javascript
{
  _id: ObjectId('...'),
  genresList: [ 'Adventure', 'Art', 'Biography', 'Classics', 'Fantasy', /* ... */ ]
}
```

`genresList` should be a populated array — the navbar's genre filter reads from it, so an empty or missing array would break filtering later.

## Success criteria

- `books` reports **93,624** documents and `genres` reports **1** on both the local source and the Azure target.
- A known book retrieved from the target matches the source field-for-field, with nested arrays (`genre`, `reviewcomments`) and numeric types (`rating`, `pages`) preserved.
- `db.getCollection('genres').findOne()` returns the single document with a populated `genresList` array.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Target count is **lower** than source | The job hasn't actually finished | Return to Task 03 and confirm the job status is **Succeeded** (both collections `Completed`) before re-counting. |
| `bookstore` or its collections don't appear under the target connection | The tree was expanded before the copy finished, or you're looking at the wrong connection | Right-click the **Azure cluster connection** and **Refresh**, then expand **`bookstore`** — the migration creates that database, so it appears only after the copy completes. |
| `findOne(...)` returns `null` | Wrong title, or the migration didn't finish | Run `db.getCollection('books').findOne()` with no filter to confirm documents exist, and re-check the job is **Succeeded** (Task 03). |
| `genresList` is empty | The `genres` snapshot didn't complete | Re-check the collection-wise status in Task 03; re-run the migration for `genres` if it shows incomplete. |

---

Contoso's catalog is now copied into Azure DocumentDB, the counts reconcile, and the data is verified faithful. One step remains: cut the application over to DocumentDB, which you do in **Task 05**.
