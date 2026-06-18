---
title: "Exercise 04 - Task 04 — Verify Document Counts Match Between Source and Target"
layout: default
nav_order: 4
parent: "Exercise 04 - Migration Execution — Offline (Snapshot)"
---

# Task 04 — Verify Document Counts Match Between Source and Target

The dashboard says the job completed — now prove it independently. The first validation gate is the simplest: the document count of each collection on the target must equal the count on the source. Because writes were frozen before the snapshot (Task 01), an offline copy should match exactly, with no drift. In this task you read both collections' counts on each side directly from the **DocumentDB extension** and compare — no shell required.

The collection node in the tree shows only a **rounded** count (for example `94.2k`), which isn't precise enough to prove an exact match. For the real number, run a count in a **query playground** — the extension's mongosh-flavored scratchpad.

## Count on the source (local)

In VS Code, open the **DocumentDB** extension from the Activity Bar. In the **DocumentDB Connections** pane:

1. Expand your **local source connection** (the `localhost` connection from Exercise 01 Task 02).
2. Right-click the **`bookstore`** database and open a **query playground** for it. The playground header confirms the context — `bookadmin@localhost:27017 / bookstore`.
3. Paste this and run it with **`Ctrl+Enter`**. The playground shows only the last result, so this returns both counts at once:

   ```javascript
   ({
     books:  db.getCollection('books').countDocuments(),
     genres: db.getCollection('genres').countDocuments()
   })
   ```

The source returns **`{ books: 96419, genres: 1 }`**. Note both numbers.

## Count on the target (Azure)

Now do the same against the **Azure DocumentDB** cluster, using the connection you created in Exercise 02 Task 03 (it already stores your credentials, and it reaches the cluster over its private endpoint):

1. In the **DocumentDB Connections** pane, expand your **Azure cluster connection**. The **`bookstore`** database now exists on the target because the migration created it during the copy.
2. Right-click **`bookstore`** and open a **query playground** for it. The header reads `bookadmin@<your-cluster>.global.mongocluster.cosmos.azure.com / bookstore`.
3. Run the identical query with **`Ctrl+Enter`**:

   ```javascript
   ({
     books:  db.getCollection('books').countDocuments(),
     genres: db.getCollection('genres').countDocuments()
   })
   ```

The target returns the same **`{ books: 96419, genres: 1 }`**.

## Compare

| Collection | Source (local) | Target (Azure) |
|------------|----------------|----------------|
| `books`    | 96,419         | 96,419         |
| `genres`   | 1              | 1              |

The counts must match exactly. They should, because the source was frozen before the snapshot — an offline copy has no opportunity to drift as long as no writes landed after Task 01.

## Success criteria

- `books` reports **96,419** documents on both the local source and the Azure target.
- `genres` reports **1** document on both sides.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Target count is **lower** than source | The job hasn't actually finished | Return to Task 03 and confirm the job status is **Succeeded** (both collections `Completed`) before re-counting. |
| `bookstore` or its collections don't appear under the target connection | The tree was expanded before the copy finished, or you're looking at the wrong connection | Right-click the **Azure cluster connection** and **Refresh**, then expand **`bookstore`** — the migration creates that database, so it appears only after the copy completes. |
