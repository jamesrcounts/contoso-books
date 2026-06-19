---
title: "Exercise 07 - Task 03 — Validate the Move with the Comparison Script"
layout: default
nav_order: 3
parent: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
---

# Task 03 — Validate the Move with the Comparison Script

Matching document counts are necessary but not sufficient — two collections can hold the same number of documents yet differ in content. Before you point the app at the container, confirm the move was faithful with a small comparison script that checks both a **document count** and a **content checksum** for each collection, comparing the MongoDB container (source) against the DocumentDB container (target).

The script ships in the repository at `src/deployment/validate/`. It is a standalone Node.js tool run via `npm run validate`.

## Install the script's dependencies

```powershell
cd src/deployment/validate
npm install
```

## Configure the two connection strings

The script reads its own git-ignored `.env` inside `src/deployment/validate/` and needs **two** connection strings — the MongoDB container as the **source** and the DocumentDB container as the **target**. Create `src/deployment/validate/.env` with both:

```
BOOKSTORE_SOURCE_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin
BOOKSTORE_TARGET_DB_CONNECTION_STRING=mongodb://bookadmin:bookpass123@10.0.0.5:10260/?tls=true&tlsAllowInvalidCertificates=true
```

Unlike the Database Tools in Task 02, the `mongodb` Node.js driver the script uses **does** honor `tlsAllowInvalidCertificates` in the connection string, so the target needs no extra flag here.

> `src/deployment/validate/.env` is git-ignored for the same reason the app's is — never commit it.

## Run the validation

```powershell
npm run validate
```

The script connects to both endpoints, walks every document in `books` and `genres` on each side, and reports counts and checksums.

### Expected output

```
$$$ Validation started 6/19/2026, 5:06:32 PM

Collection   Source count   Target count   Count   Source cksum     Target cksum     Cksum
----------   ------------   ------------   -----   --------------   --------------   -----
books               96419          96419      OK   9656b631b0c7...   9656b631b0c7...      OK
genres                  1              1      OK   d71c38d02702...   d71c38d02702...      OK

RESULT: PASS - source and target hold identical data.
```

The checksum values are specific to your data; what matters is that source and target match (the `Cksum` column reads `OK`). A `PASS` exits `0`; any mismatch prints `DIFF` on the affected row, reports `FAIL`, and exits non-zero — so the script doubles as a gate in a pipeline.

> **What the checksum is.** For each collection the script hashes every document's content (fields canonicalized so field order never matters) and folds the per-document hashes together order-independently. A matching checksum means the two collections hold the same documents with the same field values — far stronger evidence than a matching count alone.

## Success criteria

`npm run validate` reports matching counts (`books` 96,419 and `genres` 1) and matching checksums for both collections, ending in `RESULT: PASS`. The DocumentDB container holds a faithful copy of the MongoDB source.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Error: no connection string ...` | `.env` is missing or a variable is unset | Create `src/deployment/validate/.env` with **both** variables, then re-run. |
| A connection error or timeout | A container is stopped | Confirm `docker ps` lists both `mongodb` and `documentdb` as `Up`. |
| Counts match but a checksum reads **`DIFF`** | The two sides diverged — for example a comment written to only one of them | Run the comparison before exercising the app (Task 04). A difference after you have written through the app is real drift, not a script error. |

With the move verified, continue to **Task 04** to point the application at the container.
