---
title: "Exercise 02 - Task 04 — Confirm Connectivity"
layout: default
nav_order: 4
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 04 — Confirm Connectivity

The final step of setting up the target environment is to prove you can actually reach the cluster and authenticate against it. You will connect with `mongosh` using the connection string from Task 03 and run a couple of commands to confirm the session is healthy.

Run these from **PowerShell** on the same machine whose IP you allowed in Task 02.

## Connect with mongosh

Use the full SRV string you assembled in Task 03 (admin password substituted in). Quote it so PowerShell does not try to interpret the `&` characters:

```powershell
mongosh "mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
```

> **Expected warning — safe to ignore.** On connecting you will see a notice that the server is **not a genuine MongoDB deployment**. That is expected: Azure DocumentDB is wire-protocol compatible but not MongoDB itself. The shell still works normally against it.

## Verify the session

Once at the `mongosh` prompt, check the connection status:

```javascript
db.runCommand({ connectionStatus: 1 })
```

A healthy, authenticated session returns `ok: 1`, along with the authenticated user under `authInfo`:

```javascript
{
  authInfo: {
    authenticatedUsers: [ { user: 'bookadmin', db: 'admin' } ],
    authenticatedUserRoles: [ /* ... */ ]
  },
  ok: 1
}
```

The `ok: 1` is your success signal for this exercise.

## Confirm the cluster is empty

```javascript
show dbs
```

You will see only the built-in administrative databases (e.g. `admin`, `config`) — **no `bookstore` database yet**. This is expected: no application data exists until the migration. The `bookstore` database and its `books` / `genres` collections are created during the **initial load in Exercise 04** (offline) — or Exercise 05 (online) — not here.

Exit the shell:

```javascript
exit
```

## Success criteria

`db.runCommand({ connectionStatus: 1 })` returns `ok: 1` from a `mongosh` session connected to the Azure DocumentDB cluster. The target environment is ready.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Connection hangs, then a **timeout** error | Your client IP is not allowed by the firewall | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` firewall rule you verified in **Task 02** (Networking → Firewall rules in the portal). |
| **Authentication failed** | Wrong username or password in the connection string | Confirm the username is `bookadmin` and that you substituted the exact admin password you set in **Task 02**. |
| `mongosh: command not found` | `mongosh` is not installed / not on PATH | Install it (Exercise 01 Task 00 lists the prereqs) and reopen PowerShell. |

This completes Exercise 02. The cluster is provisioned, reachable, and ready to receive Contoso's catalog in the migration exercises that follow.
