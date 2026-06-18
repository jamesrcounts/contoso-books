---
title: "Exercise 05 - Task 08 — Verify the Application Against DocumentDB"
layout: default
nav_order: 8
parent: "Exercise 05 - Migration Execution — Online (Change Stream)"
---

# Task 08 — Verify the Application Against DocumentDB

The app is running against DocumentDB after cutover. Now confirm it behaves exactly as it did against the local container in Exercise 01 Task 05 — same reads, same writes, same UI. This is the functional acceptance check that proves the migration succeeded from the user's point of view, not just the data's.

## Verify reads

At `http://localhost:3000`:

1. **Browse** — the home page renders books from the migrated `books` collection. Scroll down and confirm more books load (infinite scroll, paged from DocumentDB).
2. **Filter** — apply a rating, format, or genre filter from the navbar and confirm the list updates. (The genre autocomplete exercises the aggregation against the `genres` collection.)
3. **View detail** — click into a book; the detail page renders with full fields and any existing comments.

## Verify writes

1. On a book detail page, **add a comment** and submit.
2. **Reload** the page — the comment persists. This write went to DocumentDB (`$push` onto the book's `reviewcomments` array).

## Confirm the write on the target with the query playground

Cross-check directly against DocumentDB using the **DocumentDB extension's query playground**. Open a playground on your **Azure cluster** connection's **`bookstore`** database, then run each block with **`Ctrl+Enter`**:

1. Confirm the catalog counts match what you migrated:

   ```javascript
   ({
     books:  db.getCollection('books').countDocuments(),
     genres: db.getCollection('genres').countDocuments()
   })
   ```

   This returns `{ books: 96419, genres: 1 }` (plus any books added during the lab).

2. Retrieve the book you just commented on and confirm the comment landed on the target:

   ```javascript
   db.getCollection('books').findOne({ "reviewcomments.0": { $exists: true } })
   ```

   The document comes back with your comment in its `reviewcomments` array (`{ name, comment }`) — proof the write you made through the app reached DocumentDB.

> **Same behavior, different backend.** Every check here mirrors the Exercise 01 baseline you ran against the local container. Matching results confirm the application is fully functional on DocumentDB and the cutover is complete.

## Success criteria

Reads (browse, filter, detail), writes (add comment, persists on reload), and a direct extension query against the Azure cluster all succeed — the Contoso app functions correctly against DocumentDB, matching the Exercise 01 baseline. The online migration is functionally complete.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Home page is empty | App connected to the empty/old endpoint, or counts not migrated | Confirm `.env` is the Azure SRV string; verify counts via Task 06; check `[0] DocumentDB connected`. |
| New comment doesn't persist after reload | Write failed against the target | Check the server log for write errors; confirm the SRV string includes `retrywrites=false` as provided. |
| Genre filter / autocomplete errors | `genres` collection missing on target | Confirm `genres` migrated (count = 1) in Task 06. |
