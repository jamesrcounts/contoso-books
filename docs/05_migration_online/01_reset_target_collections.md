---
title: "Exercise 05 - Task 01 — Reset the Target Environment"
layout: default
nav_order: 1
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 01 — Reset the Target Environment

Exercise 04's offline migration left two databases on the Azure DocumentDB cluster: **`bookstore`** (the migrated catalog — `books` and `genres`) and a separate **`migration_dlq`** database (a dead-letter database the migration service creates to capture any documents it couldn't apply; it may be empty, but it is a distinct database). Before running the online migration you need a **clean target** — an online job expects to create the collections itself during its initial load, and leftover documents would corrupt the count-matching check at cutover (Task 06). In this task you drop **both** databases so the cluster is empty again, then repoint the application back at the local source for the online run.

> **This is the *target* (Azure), not the source.** You are dropping data on the DocumentDB cluster only. The local MongoDB container — Contoso's live source — is never touched here. Double-check you are operating against the Azure cluster connection (the one whose connection string ends in `cosmos.azure.com`) before dropping anything.

## Drop the target databases

1. In VS Code, open the **DocumentDB** extension from the Activity Bar.
2. In **DocumentDB Connections**, expand the Azure cluster connection you registered in Exercise 02 Task 03 (the one whose connection string ends in `cosmos.azure.com`).
3. Right-click the **bookstore** database node and select **Delete Database** (confirm when prompted).
4. Right-click the **migration_dlq** database node and select **Delete Database** as well.

## Confirm the target is empty

Right-click the Azure cluster connection and select **Refresh**, then expand it. It should now list **no databases at all** — just a **`+ Create Database`** option (the extension hides the built-in `admin` / `config` system databases). If a database you just deleted still shows, the tree is a stale cached view; **Refresh** again and it clears.

## Repoint the application at the local source

Exercise 04's cutover left `src/server/.env` pointing at Azure. For the online run the application must write to the **local** source, so set `BOOKSTORE_DB_CONNECTION_STRING` back to the local string now (leave `PORT` unchanged):

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
PORT=8080
```

Save the file. You start the app against this local source and confirm it is live in Task 02.

## Success criteria

The Azure DocumentDB cluster no longer contains a `bookstore` or a `migration_dlq` database. The application's `src/server/.env` points at the local source again. The local source container is untouched, and the target is reset and ready for a fresh online migration.
