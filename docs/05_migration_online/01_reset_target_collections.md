---
title: "Exercise 05 - Task 01 — Reset the Target Environment"
layout: default
nav_order: 1
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 01 — Reset the Target Environment

Exercise 04 performed an offline (snapshot) migration that created the `bookstore` database and its `books` and `genres` collections on the Azure DocumentDB cluster. Before running the online migration you need a **clean target** — an online job expects to create the collections itself during its initial load, and leftover documents would corrupt the count-matching check at cutover (Task 06). In this task you drop the target `bookstore` database so the cluster is empty again.

> **If you skipped Exercise 04**, the cluster may already be empty — there is nothing to drop and this task is a no-op. Confirm the target is empty using either method below and continue to Task 02.

> **This is the *target* (Azure), not the source.** You are dropping data on the DocumentDB cluster only. The local MongoDB container — Contoso's live source — is never touched in this task. Double-check you are operating against the SRV (`mongodb+srv://...cosmos.azure.com`) connection before dropping anything.

## Option A — Drop with the DocumentDB VS Code extension

1. In VS Code, open the **DocumentDB** extension from the Activity Bar.
2. In **DocumentDB Connections**, expand the Azure cluster connection you registered in Exercise 02 Task 03 (the one whose connection string ends in `cosmos.azure.com`).
3. Expand it to reveal the **bookstore** database.
4. Right-click the **bookstore** database node and select **Delete Database** (confirm when prompted).

If you prefer to drop the collections individually, right-click each of **books** and **genres** under **bookstore** and select **Delete Collection** instead.

## Option B — Drop with `mongosh`

Connect to the **Azure cluster** using your completed SRV string (the value currently in `src/server/.env` from Exercise 02 Task 03), then drop the database:

```powershell
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

In the shell:

```javascript
use bookstore
db.dropDatabase()
```

You should see:

```javascript
{ ok: 1, dropped: 'bookstore' }
```

## Confirm the target is empty

Still in `mongosh` (or back in the extension), list the databases:

```javascript
show dbs
```

`bookstore` should **not** appear in the list (only the built-in `admin` / `config` system databases remain). Exit the shell:

```javascript
exit
```

## Success criteria

The Azure DocumentDB cluster no longer contains a `bookstore` database (or its `books` / `genres` collections). The target is reset and ready for a fresh online migration. The local source container is untouched.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `dropDatabase()` returns `{ ok: 1 }` but `bookstore` still shows briefly | Cached view in the extension | Right-click the connection and **Refresh**; the empty cluster repopulates the tree. |
| Connection times out before you can drop | Your client IP is not in the `lab-client` firewall rule | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` rule (Networking → Firewall rules in the portal), as you verified in Exercise 02. |
| You accidentally connected to `localhost` | Wrong connection string | Stop — the local container is the source. Reconnect with the SRV string ending in `cosmos.azure.com` and verify before dropping. |
