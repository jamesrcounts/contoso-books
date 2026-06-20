---
title: "Exercise 07 - Task 04 — Switch Between the Local Container and Azure"
layout: default
nav_order: 4
parent: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
---

# Task 04 — Switch Between the Local Container and Azure

Every time you've changed which backend the app talks to — the Exercise 05 cutover, and pointing it at the container in Task 03 — you edited `BOOKSTORE_DB_CONNECTION_STRING` in the default `.env` by hand. That works, but the app has supported a cleaner way the whole time: a single variable, `APP_ENV`, selects which `.env` file the app loads. Nothing else differs between the two environments — not the code, the driver, the routes, or the queries.

## How the app selects its environment

Selecting a config file by environment isn't something Node or `dotenv` do for you — it's a small convention the bookstore app implements itself. You can copy this technique into your own apps, or use whatever your stack offers natively: ASP.NET Core's `ASPNETCORE_ENVIRONMENT` with `appsettings.{Environment}.json`, Rails' `RAILS_ENV`, Spring profiles, and so on.

Here it is in full, in [server.js](../../src/server/server.js):

```javascript
const envFile = process.env.APP_ENV ? `.env.${process.env.APP_ENV}` : ".env";
dotenv.config({ path: envFile });
```

- No `APP_ENV` → `.env` (the default).
- `APP_ENV=azure` → `.env.azure`.

## Provide the Azure environment file

Your `.env` already holds the local container string. Create a second file, `src/server/.env.azure`, holding the Azure connection string you have used since Exercise 06 — the passwordless one that authenticates with the VM's managed identity. `PORT` defaults to `8080` in code, so this file needs only the connection string:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb+srv://<cluster>.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=MONGODB-OIDC&retrywrites=false&maxIdleTimeMS=120000&authMechanismProperties=ENVIRONMENT:azure,TOKEN_RESOURCE:https://ossrdbms-aad.database.windows.net
```

| `APP_ENV` | File loaded | Backend |
|-----------|-------------|---------|
| *(unset)* | `src/server/.env` | DocumentDB container on the dev host |
| `azure` | `src/server/.env.azure` | Azure DocumentDB cluster |

> Both files are git-ignored (`src/server/.gitignore` ignores `.env*`), so connection strings never enter source control.

## Switch

Stop the app if it is running (`Ctrl+C`). To run against **Azure**, set `APP_ENV` for the session and start the app:

```powershell
$env:APP_ENV='azure'
npm run develop
```

The connect line names the cluster:

```
[0] DocumentDB connected to contosobooks....global.mongocluster.cosmos.azure.com
```

To go back to the **local container**, clear `APP_ENV` and restart:

```powershell
$env:APP_ENV=$null
npm run develop
```

```
[0] DocumentDB connected to 10.0.0.5:10260
```

The `DocumentDB connected to …` line proves which backend the selector chose — you never edited a connection string to switch.

## Same engine, different auth — both in the file

The two environments don't authenticate the same way, and that is a property of the seam, not a contradiction of it:

- **Local** uses native username and password. The DocumentDB container has no Microsoft Entra tenant behind it, so it supports native authentication only.
- **Azure** uses passwordless Microsoft Entra ID (OIDC) via the VM's managed identity, exactly as you configured it in Exercise 06.

Both differences live entirely in the connection string each `.env` file holds — `authMechanism` and credentials are configuration, not code. The application is identical against either backend, so promoting a release between environments is a configuration change, not a code change.

## Why this is the standard workflow now

- **Full-stack consistency.** Local development and production run the *same* DocumentDB engine. A feature DocumentDB doesn't support fails on the developer's machine, not in Azure — the server-side-JavaScript `$function` aggregation removed back in Exercise 03 would have surfaced the moment it ran locally.
- **Configuration, not code.** Each environment supplies its own git-ignored `.env` file; the same build artifact is promoted unchanged, and switching is a single variable.

## What you accomplished in this exercise

- Ran the open-source DocumentDB engine locally in a container (Task 01).
- Moved Contoso's catalog into it with `mongodump`/`mongorestore` (Task 02).
- Pointed the unchanged app at the container and confirmed identical behavior (Task 03).
- Switched the app between the local container and Azure with a single environment variable (this task).

This completes Exercise 07. Local development now runs on DocumentDB end-to-end, and moving between the local container and Azure is one variable — no code, driver, or query changes. In **Exercise 08** you will clean up the lab's Azure resources and local containers.
