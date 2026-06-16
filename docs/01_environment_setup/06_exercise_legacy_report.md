---
title: "Exercise 01 - Task 06 — Exercise the Legacy \"Reading Insights\" Report"
layout: default
nav_order: 7
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 06 — Exercise the Legacy "Reading Insights" Report

The Contoso Books app ships with a legacy analytics endpoint — the **reading-insights report** — that groups the catalog into page-count "effort tiers" and reports how many books fall in each tier along with their average rating. It is built on a `$function` aggregation stage, which runs **server-side JavaScript** inside MongoDB. In this task you will run that report against the container and confirm it works. This matters beyond Exercise 01: `$function` is one of the patterns Azure DocumentDB does **not** support, and running the report now is what makes it visible to the migration assessment in Exercise 03.

## Make sure the app is running

If you stopped the app at the end of Task 05, start it again. From the `src/` directory:

```
npm run develop
```

Wait for the two ready lines — `[1] ➜ Local: http://localhost:3000/` and `[0] DocumentDB connected` — then leave the terminal running. The report is served by the Express API on port `8080`; you will call it directly rather than through the React UI.

## Call the reading-insights endpoint

The report is exposed at `GET /reading-insights` on the API server. Open a **second** terminal (leave the app running in the first) and call it with PowerShell:

```powershell
Invoke-RestMethod http://localhost:8080/reading-insights | ConvertTo-Json
```

### Example output

The endpoint returns one entry per effort tier — the tier name (`_id`), the number of books in it (`count`), and the tier's average rating (`avgRating`), sorted by count:

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

Your exact counts and averages depend on the seeded dataset, but you should see the tiers — `Quick Read` (under 250 pages), `Standard` (250–499), and `Epic` (500+) — with the tier totals adding up to the full catalog. A fourth tier, `Unknown`, appears only if some books have no page count; in the standard seed dataset every book has one, so it does not show.

## How the report is built

The endpoint is a thin route over an aggregation pipeline in [readingInsights.js](src/server/src/db/readingInsights.js). The first stage classifies each book into a tier, and it does so with a `$function` operator that executes a JavaScript function **inside the database engine**:

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

The `body` is JavaScript **source, passed as a string** — MongoDB ships it to the database engine and runs it once per document, returning the tier label that the next `$group` stage aggregates on. This is a perfectly valid MongoDB pattern — and that is exactly the trap. It works here, so nothing flags it during development.

> **Why this matters later:** Azure DocumentDB is a managed service and does not execute arbitrary server-side JavaScript — `$function` (along with `$accumulator`, `$where`, and `mapReduce`) is unsupported. Running the report now records its `$function` usage in MongoDB's `serverStatus` metrics, which is the signal the **Exercise 03 pre-migration assessment** reads to flag this as a **Critical** finding. You will remediate it in **Exercise 03, Task 04** by rewriting the `$function` stage with standard aggregation operators — no behavior change, but a clean assessment.

## Success criteria

The `GET /reading-insights` endpoint returns the per-tier book counts and average ratings, and you understand that the report depends on a server-side-JavaScript `$function` stage that will resurface as a migration finding in Exercise 03.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Invoke-RestMethod` fails to connect | The app (API server on 8080) is not running | Confirm `npm run develop` is running in the first terminal and you saw `Server is running on port 8080`. |
| The browser shows nothing at `http://localhost:3000/reading-insights` | The Vite dev server only proxies `/books`, `/genres`, and `/comment` to the API | Call the API server directly on port `8080` as shown above, not the UI on `3000`. |
| Empty array or all-`Unknown` results | The `books` collection is not seeded | Re-run the seed step from **Task 04** and confirm the catalog loads in the app. |

This completes Exercise 01. You now have a known-good source — a running, seeded MongoDB instance exercising every pattern the app uses, including the legacy `$function` report. In Exercise 02 you provision the Azure DocumentDB target; in Exercise 03 you assess this source for migration.
