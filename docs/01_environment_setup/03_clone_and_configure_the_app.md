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

The `src/package.json` has an `install` hook (`npm i --ignore-scripts && cd server && npm i && cd ../client && npm i`) that installs the root workspace plus the `server/` and `client/` workspaces in one step. Expect roughly 2 minutes total on a fresh clone.

### Expected output

You will see install blocks for the **root**, **server**, and **client** workspaces — the root workspace is audited twice (once by the outer `npm install`, once by the `--ignore-scripts` step in the hook), so there are four blocks in total. Each ends cleanly with `found 0 vulnerabilities`; the only other notes are informational "looking for funding" lines. The install succeeded if every block ends with an `added N packages` / `audited N packages` line and there are no `npm ERR!` lines.

Exact package counts and timings vary, and re-running on an already-installed tree reports `up to date, audited N packages` instead of `added N packages`. Abbreviated first-run output:

```
> bookstore@1.0.0 install
> npm i --ignore-scripts && cd server && npm i && cd ../client && npm i

added 20 packages, and audited 21 packages in 1s

10 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

added 382 packages, and audited 383 packages in 6s

60 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

added 64 packages, and audited 65 packages in 2s

17 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## Configure the connection string

In the VS Code Explorer (left sidebar), right-click on the `src/server` folder and select **New File**. Name it `.env` (so the file is `src/server/.env`, alongside the server's `package.json`). With the file open in the editor, paste:

```
BOOKSTORE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
PORT=8080
```

Save with `Ctrl+S`.

> **About this connection string:** `mongodb://bookadmin:bookpass123@localhost:27017` points at the container started in Task 01 and supplies the `bookadmin` credentials, since access control is now enabled. `authSource=admin` tells the driver the user lives in the `admin` database (where the container created it). `?replicaSet=rs0` tells the MongoDB driver to discover the replica set topology — this is what enables change-stream support, which the online migration in Exercise 05 depends on. In Exercise 02 you will swap this value for the Azure DocumentDB connection string; the rest of the lab works without ever changing application code.

> **Troubleshooting:** If `code` is not recognized in PowerShell, your PATH did not pick up VS Code — close and reopen PowerShell, or launch VS Code from the Start Menu and use **File → Open Folder** to open the `contoso-books` directory.
