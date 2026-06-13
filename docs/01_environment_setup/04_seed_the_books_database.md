---
title: "Exercise 01 - Task 04 — Seed the Books Database"
layout: default
nav_order: 5
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 04 — Seed the Books Database

The app needs data to be useful. The repository ships with a seed script that downloads the GoodReads books dataset (~85k books and a small genres collection) and loads it into your local MongoDB container. The script is a shell script, so on Windows you will run it from **Git Bash** (installed in Task 00 as part of the Git install).

## Navigate to the seed directory

The integrated terminal in VS Code is already running Git Bash (configured as the default in Task 00), so the seed script will run directly without switching shells.

From the `src/` directory (where you ran `npm install` in Task 03), in the integrated terminal:

```bash
cd deployment/seed
```

## Configure the seed connection string

The seed script reads its own `.env` file inside `src/deployment/seed/`. In the VS Code Explorer, open `src/deployment/seed/.env` (it already exists with an empty connection string). Replace its contents with:

```
BOOKSTORE_SEED_DB_CONNECTION_STRING=mongodb://localhost:27017/?replicaSet=rs0
```

Save with `Ctrl+S`.

> The seed script uses a different variable name (`BOOKSTORE_SEED_DB_CONNECTION_STRING`) than the app server (`BOOKSTORE_DB_CONNECTION_STRING`). Both point at the same MongoDB container — they are independent scripts that happen to use different names internally.

## Run the seed

In the Git Bash terminal:

```bash
./seed_data.sh
```

The script installs its own Node dependencies (1–2 minutes), then fetches `books.json` and `genres.json` from a public Azure blob storage URL and bulk-inserts them into the `bookstore` database in your local MongoDB container.

### Expected output

```
Preparing to import data...
Installing Node modules...

added 47 packages in 6s
Populating database...
$$$ Seeding data started 6/10/2026, 8:30:05 PM
Fetching books
Fetching genres
Seeding completed on genres Collection 6/10/2026, 8:30:10 PM
Seeding completed on books Collection 6/10/2026, 8:40:40 PM
Finished! Seeding, , is now ready to play around!
```

Total time is roughly 10 minutes — the books collection is large.

## Verify the data

In VS Code, open a new integrated terminal (`` Ctrl+Shift+` ``) and connect with `mongosh`:

```bash
mongosh
```

Switch to the `bookstore` database and check the document counts:

```javascript
use bookstore
db.books.countDocuments()
db.genres.countDocuments()
```

Expected counts:

| Collection | Documents |
|------------|-----------|
| `books`    | ~85,000   |
| `genres`   | 1         |

Take a quick look at a sample book to confirm the data shape:

```javascript
db.books.findOne()
```

You should see a document with fields like `title`, `author`, `isbn`, `isbn13`, `pages`, `genre`, etc.

Exit `mongosh`:

```javascript
exit
```

> **Troubleshooting — script reports a connection error:** Confirm the MongoDB container is still running (`docker ps` should list `mongodb` with status `Up`). If not, `docker start mongodb`. The replica set state is persisted, so you do not need to re-run `rs.initiate()`.
>
> **Troubleshooting — `seed_data.sh: Permission denied`:** Mark the script as executable: `chmod +x seed_data.sh`, then re-run.
