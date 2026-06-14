---
title: "Exercise 01 - Task 04 — Seed the Books Database"
layout: default
nav_order: 5
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 04 — Seed the Books Database

The app needs data to be useful. The repository ships with a seed script **and** a vendored copy of the GoodReads books dataset (100,000 books and a small genres collection), so the script loads the data into your local MongoDB container straight from the cloned repo — no network download is required. The seed script is run via npm (`npm run seed`), so it works from any terminal.

## Navigate to the seed directory

The integrated terminal in VS Code is already running Git Bash (configured as the default in Task 00), so the seed script will run directly without switching shells.

From the `src/` directory (where you ran `npm install` in Task 03), in the integrated terminal:

```bash
cd deployment/seed
```

## Configure the seed connection string

The seed script reads its own `.env` file inside `src/deployment/seed/`. This file is git-ignored (so your connection string never gets committed), so you create it yourself. In the VS Code Explorer, right-click the `src/deployment/seed` folder, select **New File**, name it `.env`, and paste:

```
BOOKSTORE_SEED_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
```

Save with `Ctrl+S`.

> The seed script uses a different variable name (`BOOKSTORE_SEED_DB_CONNECTION_STRING`) than the app server (`BOOKSTORE_DB_CONNECTION_STRING`). Both point at the same MongoDB container — they are independent scripts that happen to use different names internally.

## Run the seed

In the integrated terminal:

```bash
npm install && npm run seed
```

`npm install` installs the seed script's Node dependencies (1–2 minutes), then `npm run seed` reads the vendored dataset (`data/seed-data.tar.gz`, which holds `books.json` and `genres.json`) and bulk-inserts the documents into the `bookstore` database in your local MongoDB container.

### Expected output

```
$$$ Seeding data started 6/10/2026, 8:30:05 PM
Loading books from .../src/deployment/seed/data/seed-data.tar.gz
Loading genres from .../src/deployment/seed/data/seed-data.tar.gz
Seeding completed on books Collection 6/10/2026, 8:30:13 PM
Seeding completed on genres Collection 6/10/2026, 8:30:13 PM
```

The whole run finishes in a few seconds — the dataset loads from the local repo rather than over the network.

## Verify the data

In VS Code, open a new integrated terminal (`` Ctrl+Shift+` ``) and connect with `mongosh`, authenticating as the `bookadmin` user:

```bash
mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin
```

Switch to the `bookstore` database:

```javascript
use bookstore
```

Then check the document counts, running each command on its own (enter one, then the next — don't paste them together, or `mongosh` treats the later lines as a continuation of the first):

```javascript
db.books.countDocuments()
```

```javascript
db.genres.countDocuments()
```

Expected counts:

| Collection | Documents |
|------------|-----------|
| `books`    | 100,000   |
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

> **Troubleshooting — `Error: no connection string`:** You skipped the "Configure the seed connection string" step above — `src/deployment/seed/.env` is missing or its `BOOKSTORE_SEED_DB_CONNECTION_STRING` is unset. Create the file (or set the value) and re-run.
>
> **Troubleshooting — script reports a connection error:** Confirm the MongoDB container is still running (`docker ps` should list `mongodb` with status `Up`). If not, `docker start mongodb`. The replica set state is persisted, so you do not need to re-run `rs.initiate()`.
