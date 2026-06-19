---
title: "Exercise 07 - Task 02 — Move the Catalog into the DocumentDB Container"
layout: default
nav_order: 2
parent: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
---

# Task 02 — Move the Catalog into the DocumentDB Container

The container is running but empty — `show dbs` listed only the built-in `sampledb`. In this task you move Contoso's catalog out of the MongoDB container and into the DocumentDB container with the standard MongoDB tools `mongodump` and `mongorestore`, which Microsoft recommends for moving a full database into DocumentDB. The MongoDB container keeps its copy — you are snapshotting it, not emptying it.

## Install the MongoDB Database Tools

`mongodump` and `mongorestore` ship as the **MongoDB Database Tools**, a separate package from `mongosh`. Install them with `winget`, then open a **new** PowerShell window so the updated `PATH` takes effect:

```powershell
winget install --id MongoDB.DatabaseTools
```

Confirm the tools resolve in the new window:

```powershell
mongodump --version
```

You should see `mongodump version: 100.x.x`.

## Dump the catalog from the MongoDB container

Dump the `bookstore` database to a temporary folder. The source is the same MongoDB connection string you have used since Exercise 01:

```powershell
mongodump --uri "mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin" `
  --db bookstore --out "$env:TEMP\bookstore-dump"
```

```
writing bookstore.books to ...\bookstore-dump\bookstore\books.bson
writing bookstore.genres to ...\bookstore-dump\bookstore\genres.bson
done dumping bookstore.genres (1 document)
done dumping bookstore.books (96419 documents)
```

`mongodump` writes one BSON file per collection — a `books.bson` of roughly 130 MB and a small `genres.bson` — under `bookstore-dump\bookstore\`.

## Restore into the DocumentDB container

Restore that dump into the container. The target is the **local DocumentDB** string from Task 01, with one difference worth knowing: the MongoDB Database Tools do **not** read `tlsAllowInvalidCertificates` from the connection string — they print `ignoring unsupported URI parameter` and then fail certificate validation. Pass the **`--tlsInsecure`** flag instead to accept the container's self-signed certificate:

```powershell
mongorestore --uri "mongodb://bookadmin:bookpass123@10.0.0.5:10260/?tls=true" --tlsInsecure `
  "$env:TEMP\bookstore-dump"
```

```
restoring bookstore.genres from ...\bookstore-dump\bookstore\genres.bson
restoring bookstore.books from ...\bookstore-dump\bookstore\books.bson
finished restoring bookstore.genres (1 document, 0 failures)
finished restoring bookstore.books (96419 documents, 0 failures)
no indexes to restore for collection bookstore.books
96420 document(s) restored successfully. 0 document(s) failed to restore.
```

`mongorestore` recreates the `bookstore` database and both collections. "No indexes to restore" is expected — Contoso's source defined no secondary indexes beyond the default `_id`.

## Confirm the data landed

Count both collections on the container with `mongosh`:

```powershell
mongosh "mongodb://bookadmin:bookpass123@10.0.0.5:10260/?tls=true&tlsAllowInvalidCertificates=true" --quiet `
  --eval "const d = db.getSiblingDB('bookstore'); print('books=' + d.books.countDocuments()); print('genres=' + d.genres.countDocuments())"
```

```
books=96419
genres=1
```

`show dbs` now lists `bookstore` alongside `sampledb`.

## Success criteria

`mongorestore` reports `96420 document(s) restored successfully` with `0` failures, and the container holds `bookstore` with **96,419** books and **1** genres document.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `mongodump` / `mongorestore` is **not recognized** | The Database Tools aren't on `PATH` in this shell | Open a **new** PowerShell window after `winget install`, or call the tools by full path from `C:\Program Files\MongoDB\Tools\100\bin`. |
| `mongorestore` fails with **`certificate signed by unknown authority`** | `--tlsInsecure` was omitted (the URI's `tlsAllowInvalidCertificates` is ignored by the tools) | Add `--tlsInsecure` to the `mongorestore` command. |
| `mongodump` connection error | The MongoDB container is stopped | `docker ps`; if `mongodb` is absent, `docker start mongodb`. |

The catalog is now in the container. Continue to **Task 03** to confirm — by count and content checksum — that the move was faithful.
