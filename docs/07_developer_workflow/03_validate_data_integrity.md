---
title: "Exercise 07 - Task 03 — Validate Data Integrity with the Comparison Script"
layout: default
nav_order: 3
parent: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
---

# Task 03 — Validate Data Integrity with the Comparison Script

The app runs identically against both backends — but does the Azure target hold *exactly* the same data as the local source? Matching document counts are necessary but not sufficient: two collections can have the same count yet differ in content. In this task you run a small comparison script that checks both. For each collection it compares the **document count** and a **content checksum** between the local MongoDB container (source) and Azure DocumentDB (target), so a pass means the two are identical down to the field values — not just the same number of documents.

The script ships in the repository at `src/deployment/validate/`, alongside the seed script. It is a standalone Node.js tool, run via `npm run validate`.

## Install the script's dependencies

In the VS Code integrated terminal, change into the validate directory and install its dependencies (the `mongodb` driver and `dotenv`):

```bash
cd src/deployment/validate
npm install
```

## Configure the two connection strings

The script reads its own git-ignored `.env` file inside `src/deployment/validate/` — and unlike the app or the seed script, it needs **two** connection strings, one per side of the comparison. In the VS Code Explorer, right-click the `src/deployment/validate` folder, select **New File**, name it `.env`, and paste both — the local container as the **source** and your Azure DocumentDB cluster as the **target**:

```
BOOKSTORE_SOURCE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
BOOKSTORE_TARGET_DB_CONNECTION_STRING=mongodb+srv://bookadmin:YOUR_ACTUAL_PASSWORD@contosobooks....global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
```

Save with `Ctrl+S`. Use the same Azure SRV string (with your real password) that you assembled in Exercise 02 Task 03.

> **Both strings are secrets.** `src/deployment/validate/.env` is git-ignored for the same reason the others are — never commit it.

## Run the validation

In the integrated terminal:

```bash
npm run validate
```

The script connects to both clusters, walks every document in the `books` and `genres` collections on each side, and reports counts and checksums.

### Expected output

```
$$$ Validation started 6/16/2026, 9:14:02 PM

Collection   Source count   Target count   Count   Source cksum     Target cksum     Cksum
----------   ------------   ------------   -----   --------------   --------------   -----
books               96419          96419      OK   a1b2c3d4e5f6...   a1b2c3d4e5f6...      OK
genres                  1              1      OK   0f1e2d3c4b5a...   0f1e2d3c4b5a...      OK

RESULT: PASS - source and target hold identical data.
```

The actual checksum values are hex strings unique to your data; what matters is that the source and target values match (the `Cksum` column reads `OK`). A `PASS` exits `0`; any mismatch prints `DIFF` on the affected row, reports `FAIL`, and exits non-zero — which makes the script usable as a gate in a script or pipeline.

> **What the checksum is.** For each collection the script hashes every document's content (with its fields canonicalized so field order never matters) and folds those per-document hashes together order-independently. Because it never relies on documents coming back in a particular order, it needs no server-side sort over the 96,419-document `books` collection. Two collections produce the same checksum only when they contain the same documents with the same field values — so a matching checksum is far stronger evidence of integrity than a matching count alone.

## Success criteria

`npm run validate` reports matching counts (`books` 96,419 and `genres` 1) and matching checksums for both collections, ending in `RESULT: PASS`. The migrated Azure data is a faithful copy of the local source.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Error: no connection string. Set BOOKSTORE_SOURCE_DB_CONNECTION_STRING ...` | `src/deployment/validate/.env` is missing or a variable is unset | Create the file (or set the value) with **both** variables, then re-run. |
| A connection error or timeout | The local container is stopped, or your IP is not in the Azure firewall rule | Confirm `docker ps` lists `mongodb` as `Up`, and that your public IP matches the `lab-client` firewall rule (Exercise 02). |
| Counts match but a checksum reads **`DIFF`** | One environment has a write the other does not — most often a comment you added on only one backend while testing in Tasks 01–02 | Decide which side is authoritative; the difference is real data drift, not a script error. For this lab, re-running after the data settles should pass. |

With integrity confirmed, continue to **Task 04** to step back and review the connection-string-per-environment pattern that made all of this work.
