---
title: "Exercise 01 - Task 03 — Clone the Contoso Books App and Configure the Connection String"
layout: default
nav_order: 4
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 03 — Clone the Contoso Books App and Configure the Connection String

You will now clone the lab repository — it contains both these instructions and the **Contoso Books** application (a Node.js + Express + React books catalog that uses the MongoDB driver, under `src/`) — and configure the app to connect to your local MongoDB container. The connection string is supplied via an environment variable so the **same application binary** can target either the local MongoDB container or Azure DocumentDB later, with no code changes.

## Clone the repository

Open a PowerShell terminal in a working directory of your choice and run:

```powershell
git clone https://github.com/jamesrcounts/contoso-books.git
```

> This is the same repository the lab site is published from. The sample application lives under `src/`, organized as three workspaces: `src/server/` (Express + MongoDB driver), `src/client/` (React UI), and `src/deployment/seed/` (data seeding scripts used in Task 04).

## Open the project in VS Code

From the same PowerShell terminal, open the cloned repository in VS Code:

```powershell
code contoso-books
```

VS Code launches with the project loaded. You will use the **integrated terminal** for the rest of this exercise — open it with `` Ctrl+` `` (control + backtick) or **View → Terminal**. The integrated terminal opens at the repository root in **Git Bash** (configured as the default profile in Task 00) — this is the same shell the seed script in Task 04 requires, so you can use one terminal end-to-end.

> **Why VS Code from here on:** The rest of the lab — including the Azure DocumentDB Migration Extension (Exercise 03), the offline and online migration runs (Exercises 04–05), and the data exploration in Exercise 06 — all run inside VS Code. Establishing it as the working environment now keeps the developer experience consistent end-to-end.

## Install dependencies

The application lives under `src/`, so change into that directory first. In the VS Code integrated terminal (Git Bash), run:

```bash
cd src
npm install
```

The `src/package.json` has an `install` hook that cascades into `server/` and `client/` and installs both workspaces in one step. Expect roughly 2 minutes total.

### Expected output

You will see three install blocks (root, server, client). The middle block — the React client — produces a long stream of deprecation warnings and an audit note about moderate-severity vulnerabilities. **This is expected** — the upstream sample pins older versions of common Node packages and the warnings are inherited from those dependencies. The install itself succeeded if each block ends with an `added X packages` line and no `npm ERR!` lines.

Abbreviated output:

```
> bookstore@1.0.0 install
> cd server && npm i && cd ../client && npm i

added 39 packages, removed 130 packages, changed 82 packages, and audited 315 packages in 12s
found 0 vulnerabilities

npm warn deprecated rollup-plugin-terser@7.0.2: ...
npm warn deprecated @humanwhocodes/config-array@0.13.0: ...
... (many deprecation warnings) ...

added 447 packages, removed 1046 packages, changed 708 packages, and audited 1335 packages in 1m
4 moderate severity vulnerabilities

added 2 packages, removed 2 packages, changed 1 package, and audited 64 packages in 1m
found 0 vulnerabilities
```

> **Do not run `npm audit fix --force`.** The lab works with the dependency versions as-pinned by the upstream sample. Forcing breaking changes risks introducing app-level errors that have nothing to do with the migration story.

## Configure the connection string

In the VS Code Explorer (left sidebar), right-click on the `src` folder and select **New File**. Name it `.env` (so the file is `src/.env`, alongside the app's `package.json`). With the file open in the editor, paste:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://localhost:27017/?replicaSet=rs0
PORT=8080
```

Save with `Ctrl+S`.

> **About this connection string:** `mongodb://localhost:27017` points at the container started in Task 01. `?replicaSet=rs0` tells the MongoDB driver to discover the replica set topology — this is what enables change-stream support, which the online migration in Exercise 05 depends on. In Exercise 02 you will swap this value for the Azure DocumentDB connection string; the rest of the lab works without ever changing application code.

> **Troubleshooting:** If `code` is not recognized in PowerShell, your PATH did not pick up VS Code — close and reopen PowerShell, or launch VS Code from the Start Menu and use **File → Open Folder** to open the `contoso-books` directory.
