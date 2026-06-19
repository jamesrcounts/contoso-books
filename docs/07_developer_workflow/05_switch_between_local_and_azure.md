---
title: "Exercise 07 - Task 05 — Switch Between the Local Container and Azure"
layout: default
nav_order: 5
parent: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
---

# Task 05 — Switch Between the Local Container and Azure

You have run the app against the local DocumentDB container. Switching it to Azure DocumentDB — and back — is a one-line change, because every backend choice in this application funnels through a single seam: the value of `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env`. This is the connection-string-per-environment pattern, and it is the team's standard developer workflow.

## One seam, two environments

| Environment | Connection string | Backend |
|-------------|-------------------|---------|
| **Local / development** | `mongodb://bookadmin:bookpass123@10.0.0.5:10260/?tls=true&tlsAllowInvalidCertificates=true` | DocumentDB container on the dev host |
| **Azure / production** | `mongodb+srv://<cluster>.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=MONGODB-OIDC&...` | Azure DocumentDB cluster |

To point the running app at Azure, set `BOOKSTORE_DB_CONNECTION_STRING` to the Azure string you have used since Exercise 06 — the passwordless one that authenticates with the VM's managed identity — and restart `npm run develop`. The connect line names the cluster instead of the container:

```
[0] DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com
```

Set it back to the container string and restart, and the app is local again:

```
[0] DocumentDB connected to 10.0.0.5:10260
```

Nothing else changes — not the code, not the driver, not the queries.

## Same engine, different auth — both in the string

The two environments don't authenticate the same way, and that is a property of the seam, not a contradiction of it:

- **Local** uses native username and password. The DocumentDB container has no Microsoft Entra tenant behind it, so it supports native authentication only.
- **Azure** uses passwordless Microsoft Entra ID (OIDC) via the VM's managed identity, exactly as you configured it in Exercise 06.

Both differences live entirely **in the connection string** — `authMechanism` and credentials are connection-string concerns, not code. The application is identical against either backend, so promoting a release between environments is a configuration change, not a code change.

## Why this is the standard workflow now

- **Full-stack consistency.** Local development and production run the *same* DocumentDB engine. A feature DocumentDB doesn't support fails on the developer's machine, not in Azure — the server-side-JavaScript `$function` aggregation removed back in Exercise 03 would have surfaced the moment it ran locally.
- **Configuration, not code.** The connection string lives in git-ignored `.env`; each environment supplies its own, and the build artifact is promoted unchanged.
- **Verifiable parity.** The comparison script from Task 03 gives the team a repeatable count-and-checksum check between any two environments — useful well beyond this migration.

## What you accomplished in this exercise

- Ran the open-source DocumentDB engine locally in a container (Task 01).
- Moved Contoso's catalog into it with `mongodump`/`mongorestore` (Task 02).
- Verified the move by document count and content checksum (Task 03).
- Pointed the unchanged app at the container and confirmed identical behavior (Task 04).
- Named the connection-string-per-environment pattern as the team's standard workflow (this task).

This completes Exercise 07. Local development now runs on DocumentDB end-to-end, and the path from a developer's machine to production is a single connection string. In **Exercise 08** you will clean up the lab's Azure resources and local containers.
