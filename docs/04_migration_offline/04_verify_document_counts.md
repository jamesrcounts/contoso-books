---
title: "Exercise 04 - Task 04 — Verify Document Counts Match Between Source and Target"
layout: default
nav_order: 4
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 04 — Verify Document Counts Match Between Source and Target

The dashboard says the job completed — now prove it independently. The first validation gate is the simplest: the document count of each collection on the target must equal the count on the source. Because writes were frozen before the snapshot (Task 01), an offline copy should match exactly, with no drift. In this task you count both collections on each side with `mongosh` and compare.

## Count on the source (local)

Open a terminal and connect `mongosh` to the local container, authenticating as `bookadmin` (the same connection you used in Exercise 01 Task 04):

```bash
mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin
```

Switch to the database and count each collection (run each line on its own — don't paste them together):

```javascript
use bookstore
```

```javascript
db.books.countDocuments()
```

```javascript
db.genres.countDocuments()
```

### Example output

```
bookstore> db.books.countDocuments()
96419
bookstore> db.genres.countDocuments()
1
```

Type `exit` to leave this shell.

## Count on the target (Azure)

Now connect `mongosh` to the **Azure DocumentDB** cluster using the SRV connection string — the same value in `BOOKSTORE_DB_CONNECTION_STRING`, with your real password substituted:

```bash
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

> **Handle this string like a secret.** It carries your administrator password in clear text. Quote the whole string, and don't leave it in shell history you intend to share.

Run the same commands against the target:

```javascript
use bookstore
```

```javascript
db.books.countDocuments()
```

```javascript
db.genres.countDocuments()
```

### Example output

```
bookstore> db.books.countDocuments()
96419
bookstore> db.genres.countDocuments()
1
```

## Compare

| Collection | Source (local) | Target (Azure) |
|------------|----------------|----------------|
| `books`    | 96,419         | 96,419         |
| `genres`   | 1              | 1              |

The counts must match exactly. They should, because the source was frozen before the snapshot — an offline copy has no opportunity to drift as long as no writes landed after Task 01.

## Success criteria

- `books` reports **96,419** documents on both the local source and the Azure target.
- `genres` reports **1** document on both sides.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Target count is **lower** than source | The job hasn't actually finished | Return to Task 03 and confirm the job status is **Completed** for both collections before re-counting. |
| Target count is **higher**, or off by a few | Writes hit the source after the snapshot started | The freeze in Task 01 was incomplete (something kept writing). Stop all writers, drop and recreate the target collections, and re-run the migration. |
| Counts are zero on the target | Connected to the wrong database | Run `use bookstore` explicitly — the migration creates the `bookstore` database; the default shell database is not it. |
