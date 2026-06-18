---
title: "Exercise 07 - Task 04 — Review the Connection-String-Per-Environment Pattern"
layout: default
nav_order: 4
parent: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
---

# Task 04 — Review the Connection-String-Per-Environment Pattern

You have now run the very same application against a local MongoDB container and against Azure DocumentDB, swapping nothing but one environment variable, and proven the data on both sides is identical. This final task steps back from the keyboard to name the pattern you exercised — because it is the recommended developer workflow for the whole team going forward, not just a one-time migration trick.

## One seam, two environments

Every backend choice in this application funnels through a single seam: the value of `BOOKSTORE_DB_CONNECTION_STRING`, read from `src/server/.env` at startup. The application code, the `mongodb` driver, the routes, and the queries never change. That single configuration value is the entire difference between "talking to a container on the database host" and "talking to Contoso's production cluster in Azure."

This is the classic *connection-string-per-environment* pattern: the same build artifact is promoted unchanged through every environment, and each environment supplies its own connection string as configuration.

| Environment | Connection string | Backend |
|-------------|-------------------|---------|
| **Local / development** | `mongodb://bookadmin:...@localhost:27017/?replicaSet=rs0&authSource=admin` | MongoDB container on the database host |
| **Upper environments (staging, production)** | `mongodb+srv://bookadmin:...@contosobooks....mongocluster.cosmos.azure.com/?tls=true&...` | Azure DocumentDB cluster |

Developers keep their fast, offline, disposable local loop — the MongoDB container, `mongosh`, and the DocumentDB VS Code extension they already know — while staging and production point at DocumentDB. Nobody has to choose between "familiar tools" and "the managed service": the same code serves both.

## Why this works — and why it is safe to standardize on

- **Driver compatibility.** Azure DocumentDB is MongoDB wire-protocol compatible, so the standard `mongodb` driver the team already uses connects to it without modification. You proved this directly in Task 02.
- **Configuration, not code.** The connection string lives in `.env`, which is **git-ignored** — secrets never enter source control, and each environment is configured independently of the build. Promoting a release between environments is a config change, not a code change.
- **Verifiable parity.** The comparison script from Task 03 gives the team a repeatable, scriptable integrity check (counts **and** content checksums) to confirm two environments hold the same data — useful well beyond the initial migration.

## What you accomplished in this exercise

- Pointed the unchanged app at the local MongoDB container and confirmed identical behavior (Task 01).
- Pointed the unchanged app at Azure DocumentDB and confirmed identical behavior — the driver-compatibility demo (Task 02).
- Validated, by document counts and content checksums, that the local source and Azure target hold exactly the same data (Task 03).
- Named the connection-string-per-environment pattern as Contoso's standard developer workflow (this task).

This completes Exercise 07. The migration is done, the team's local workflow is unchanged, and the path from the local host to production is a single connection string. In **Exercise 08** you will clean up the Azure resources provisioned during the lab.
