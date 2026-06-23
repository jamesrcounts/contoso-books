---
title: "Exercise 03 - Task 02 — Exercise the Legacy \"Reading Insights\" Report"
layout: default
nav_order: 2
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 02 — Exercise the Legacy "Reading Insights" Report

The baseline assessment in Task 01 came back clean — not because the Contoso app uses only
supported features, but because the assessment's **Features** check only sees the operators
your workload has actually *used* since the source started. The everyday read/write paths the
app exercised in Exercise 01 use only supported operators, so nothing surfaced.

The app does ship one incompatible pattern, though: a legacy analytics endpoint — the
**reading-insights report** — that groups the catalog into page-count "effort tiers" and
reports how many books fall in each tier along with their average rating. It is built on a
`$function` aggregation stage, which runs **server-side JavaScript** inside MongoDB — exactly
the kind of thing Azure DocumentDB does not support. In this task you will run that report
against the local source, then re-run the assessment and watch that unsupported feature surface.

## Make sure the app is running

The report is served by the Express API on port `8080`, running against the local container —
the same source you just assessed. If you stopped the app, start it again from the `src/`
directory:

```
npm run develop
```

Wait for the two ready lines — `[1] ➜ Local: http://localhost:3000/` and
`[0] DocumentDB connected to 10.0.0.5:27017` — then leave it running. You will call the API directly rather than
through the React UI.

## Call the reading-insights endpoint

The report is exposed at `GET /reading-insights` on the API server. Open a **second** terminal
(leave the app running in the first) and call it with PowerShell:

```powershell
Invoke-RestMethod http://localhost:8080/reading-insights | ForEach-Object { $_ } | ConvertTo-Json
```

### Example output

The endpoint returns one entry per effort tier — the tier name (`_id`), the number of books in
it (`count`), and the tier's average rating (`avgRating`), sorted by count:

```json
[
  {
    "_id": "Quick Read",
    "count": 50356,
    "avgRating": 3.7871248709190564
  },
  {
    "_id": "Standard",
    "count": 39247,
    "avgRating": 3.86547685173389
  },
  {
    "_id": "Epic",
    "count": 6816,
    "avgRating": 4.010899354460094
  }
]
```

Your exact counts and averages depend on the seeded dataset, but you should see the tiers —
`Quick Read` (under 250 pages), `Standard` (250–499), and `Epic` (500+) — with the tier totals
adding up to the full catalog. A fourth tier, `Unknown`, appears only if some books have no
page count; in the standard seed dataset every book has one, so it does not show.

## How the report is built

The endpoint is a thin route over an aggregation pipeline in
[readingInsights.js](../../src/server/src/db/readingInsights.js). The first stage classifies each
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
it during development.

Azure DocumentDB is a fully managed, multi-tenant PaaS, and executing arbitrary, user-supplied
JavaScript inside the database engine is incompatible with the isolation, security, and
resource-governance guarantees a managed service provides. So the entire **server-side-JavaScript
family is unsupported**:

| Operator / command | Purpose |
|--------------------|---------|
| **`$function`** | Run a JS function as an aggregation expression (used here). |
| **`$accumulator`** | Custom JS accumulator in `$group`. |
| **`$where`** | JS predicate in a query filter. |
| **`mapReduce`** | JS-based map/reduce command. |

The good news: server-side JS is almost always a convenience, not a necessity. Anything
`$function` computes with `if`/`else` and arithmetic can be expressed with standard aggregation
operators that **do** run on DocumentDB — which is exactly the remediation in **Task 03**.

Running the report just now recorded its `$function` usage in the source's `serverStatus`
metrics — and that is the signal the assessment reads.

## Re-run the assessment

Run the pre-migration assessment again, exactly as in **Task 01** (right-click the connected
local connection → **Data Migration...** → **Migration to Azure DocumentDB** → **Pre-Migration
Assessment for Azure DocumentDB**). Give it a distinct **Assessment name** (e.g.
`contoso-books-source-with-function`) so you can tell it apart from the clean baseline — the
**View Past Assessments** tab keeps both.

This time the **Assessment Summary** has a new row the baseline did not: a **Warning** —
`$function is not supported in Azure DocumentDB.` Don't be misled by the "Warning" label — read
the **message**, not just the badge. The severity tells you whether the platform will *let* you
migrate; the message tells you whether *your app* will still work afterward. This one does **not**
block the migration — Contoso could move to DocumentDB as-is — but `$function` will not run there,
so the reading-insights report would break the moment the catalog lands on DocumentDB. That report is a feature Contoso wants to keep, so the migration team treats
fixing it as a **product requirement** for the bookstore and remediates it — not because
DocumentDB demands the change, but to preserve the app's behavior. That is the opportunity this
finding represents: update the app, and still move forward onto DocumentDB.

Contrast it with the `$changeStream` **Warning** from the baseline — that one is only
*partially* supported and matters only during the migration itself, so it needs no action — and
with the **Informational** notes about replication and RBAC commands the platform handles for
you. The only thing that changed between the two assessment runs is that you exercised the
legacy report; that is precisely how the assessment surfaces feature usage — it reports only the
features your workload has actually run. The practical lesson: an assessment is only as complete
as the source is **exercised**. Run it against a well-exercised source — one where the app's full
range of features has executed — or a clean-looking report may simply be hiding incompatibilities,
like this one, that were never triggered. You remediate the `$function` finding in Task 03.

## Success criteria

The `GET /reading-insights` endpoint returns the per-tier book counts and average ratings, and
a fresh assessment now lists `$function` as an **unsupported-feature Warning** that the baseline
run did not — a feature Contoso chooses to remediate to preserve the report, not a migration
blocker.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Invoke-RestMethod` fails to connect | The app (API server on 8080) is not running | Confirm `npm run develop` is running in the first terminal and you saw `Server is running on port 8080`. |
| Empty array (`[]`) | The `books` collection is not seeded | Re-run the seed step from **Exercise 01, Task 04** and confirm the catalog loads in the app. |

With the `$function` usage now recorded and flagged, you are ready to remediate it in Task 03.
