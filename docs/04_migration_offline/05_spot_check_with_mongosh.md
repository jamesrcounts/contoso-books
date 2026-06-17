---
title: "Exercise 04 - Task 05 — Spot-Check Migrated Data with mongosh"
layout: default
nav_order: 5
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 05 — Spot-Check Migrated Data with `mongosh`

Matching counts prove **quantity**, not **fidelity** — they don't tell you whether each document arrived intact, with its nested arrays and field types preserved. In this final task you sample documents on the target and compare them field-for-field against the source, confirming the migration copied data faithfully and not just completely.

## Connect with mongosh

Connect `mongosh` to the **Azure DocumentDB** cluster (the same SRV string from Task 04), then switch to the catalog database:

```bash
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

```javascript
use bookstore
```

> **Handle this string like a secret.** It contains your administrator password — quote it and keep it out of shared history.

## Spot-check a known document

Pull a single, recognizable book by title and inspect its shape:

```javascript
db.books.findOne({ title: "The Hobbit" })
```

### Example output (trimmed)

```javascript
{
  _id: ObjectId('...'),
  title: 'The Hobbit',
  author: 'J.R.R. Tolkien',
  isbn: '0618260307',
  isbn13: '9780618260300',
  pages: 366,
  genre: [ 'Fantasy', 'Classics', 'Fiction' ],
  rating: 4.28,
  totalratings: 2530894,
  bookformat: 'Paperback',
  reviewcomments: []
}
```

Confirm the field-level details survived the copy, not just the document itself:

- **`genre`** is still an **array** of strings, not a flattened string.
- **`rating`** is a **number** (e.g. `4.28`), not a string.
- **`pages`** / **`totalratings`** are numbers.
- **`reviewcomments`** is present as an array (this is where the app stores comments, as `{ name, comment }` entries — see Exercise 01 Task 05). If you added a comment to a book during the Exercise 01 baseline and that book froze with the comment in place, it should appear here too.

Run the identical query against the **local source** in a second shell (`mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin`, then `use bookstore`) and confirm the documents match.

## Check the genres document

The `genres` collection holds a single document with the de-duplicated, sorted genre list. Confirm it copied with its array intact:

```javascript
db.genres.findOne()
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

- A known book retrieved from the target matches the source field-for-field, with nested arrays (`genre`, `reviewcomments`) and numeric types (`rating`, `pages`) preserved.
- `db.genres.findOne()` returns the single document with a populated `genresList` array.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `findOne(...)` returns `null` | Wrong title, wrong database, or the migration didn't finish | Confirm you ran `use bookstore`, try a title you know exists (or `db.books.findOne()` with no filter), and re-check the job is Completed (Task 03). |
| Connection fails with a **TLS/auth** error | Connection string typo or wrong password | Quote the full SRV string, confirm the username is `bookadmin` and the password matches Exercise 02 Task 02. Reset the password on the cluster's portal page if unsure. |
| `genresList` is empty | The `genres` snapshot didn't complete | Re-check the collection-wise status in Task 03; re-run the migration for `genres` if it shows incomplete. |

---

Contoso's catalog is now copied into Azure DocumentDB, the counts reconcile, and the data is verified faithful. One step remains: cut the application over to DocumentDB, which you do in **Task 06**. Offline traded a maintenance window for simplicity; in **Exercise 05** you'll run the **online (change-stream)** path that avoids that downtime.
