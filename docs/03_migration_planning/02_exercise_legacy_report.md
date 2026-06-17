---
title: "Exercise 03 - Task 02 — Exercise the Legacy \"Reading Insights\" Report"
layout: default
nav_order: 2
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 02 — Exercise the Legacy "Reading Insights" Report

The baseline assessment in Task 01 came back clean — not because the Contoso app is free of
migration blockers, but because the assessment's **Features** check only sees the operators
your workload has actually *used* since the source started. The everyday read/write paths the
app exercised in Exercise 01 use only supported operators, so nothing surfaced.

The app does ship one incompatible pattern, though: a legacy analytics endpoint — the
**reading-insights report** — that groups the catalog into page-count "effort tiers" and
reports how many books fall in each tier along with their average rating. It is built on a
`$function` aggregation stage, which runs **server-side JavaScript** inside MongoDB — exactly
the kind of thing Azure DocumentDB does not support. In this task you will run that report
against the local source, then re-run the assessment and watch the Critical finding appear.

## Make sure the app is running — against the local source

The report is served by the Express API on port `8080`, and that API must be pointed at the
**local container** for this to register on the source you are assessing. You have not
repointed it yet — the switch to Azure is deferred to cutover (Exercise 04 / 05) — so it is
still targeting local. If you stopped the app, start it again from the `src/` directory:

```
npm run develop
```

Wait for the two ready lines — `[1] ➜ Local: http://localhost:3000/` and
`[0] DocumentDB connected` — then leave it running. You will call the API directly rather than
through the React UI.

## Call the reading-insights endpoint

The report is exposed at `GET /reading-insights` on the API server. Open a **second** terminal
(leave the app running in the first) and call it with PowerShell:

```powershell
Invoke-RestMethod http://localhost:8080/reading-insights | Select-Object _id, count, avgRating | ConvertTo-Json
```

### Example output

The endpoint returns one entry per effort tier — the tier name (`_id`), the number of books in
it (`count`), and the tier's average rating (`avgRating`), sorted by count:

```json
[
  {
    "_id": "Quick Read",
    "count": 52834,
    "avgRating": 3.784002536245599
  },
  {
    "_id": "Standard",
    "count": 40272,
    "avgRating": 3.8667734406038936
  },
  {
    "_id": "Epic",
    "count": 6894,
    "avgRating": 4.012014795474326
  }
]
```

Your exact counts and averages depend on the seeded dataset, but you should see the tiers —
`Quick Read` (under 250 pages), `Standard` (250–499), and `Epic` (500+) — with the tier totals
adding up to the full catalog. A fourth tier, `Unknown`, appears only if some books have no
page count; in the standard seed dataset every book has one, so it does not show.

## How the report is built

The endpoint is a thin route over an aggregation pipeline in
[readingInsights.js](src/server/src/db/readingInsights.js). The first stage classifies each
book into a tier with a `$function` operator that executes a JavaScript function **inside the
database engine**:

```js
{$addFields: {
    effortTier: {
        $function: {
            body: `function (pages) {
                if (pages == null) return 'Unknown';
                if (pages < 250) return 'Quick Read';
                if (pages < 500) return 'Standard';
                return 'Epic';
            }`,
            args: ["$pages"],
            lang: "js"
        }
    }
}}
```

The `body` is JavaScript **source, passed as a string** — MongoDB ships it to the database
engine and runs it once per document. It works here, which is exactly the trap: nothing flags
it during development. Running the report just now recorded its `$function` usage in the
source's `serverStatus` metrics — and that is the signal the assessment reads.

## Re-run the assessment

Run the pre-migration assessment again, exactly as in **Task 01** (right-click the connected
local connection → **Data Migration...** → **Migration to Azure DocumentDB** → **Pre-Migration
Assessment for Azure DocumentDB**). Give it a distinct **Assessment name** (e.g.
`contoso-books-source-with-function`) so you can tell it apart from the clean baseline — the
**View Past Assessments** tab keeps both.

This time the report is **not** clean. Under the **Features** category you will see a
**Critical** finding for the unsupported `$function` operator, with a usage-frequency count
that comes from the call you just made. The only thing that changed between the two runs is
that you exercised the legacy report — which is precisely how the assessment surfaces
feature usage. You dig into that finding in Task 03.

## Success criteria

The `GET /reading-insights` endpoint returns the per-tier book counts and average ratings, and
a fresh assessment now shows a **Critical** `$function` finding under **Features** that the
baseline run did not.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Invoke-RestMethod` fails to connect | The app (API server on 8080) is not running | Confirm `npm run develop` is running in the first terminal and you saw `Server is running on port 8080`. |
| Empty array, or the re-assessment still shows no `$function` | The app is pointed at the wrong database (e.g. the empty Azure cluster) instead of the seeded local source | Confirm `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env` is still the **local** string (`mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin`); restart `npm run develop` if you changed it, then call the endpoint again. |
| Empty array even against local | The `books` collection is not seeded | Re-run the seed step from **Exercise 01, Task 04** and confirm the catalog loads in the app. |
| The browser shows nothing at `http://localhost:3000/reading-insights` | The Vite dev server only proxies `/books`, `/genres`, and `/comment` to the API | Call the API server directly on port `8080` as shown above, not the UI on `3000`. |

With the `$function` usage now recorded and flagged, you are ready to read the finding in
Task 03.
