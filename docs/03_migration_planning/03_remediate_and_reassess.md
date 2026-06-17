---
title: "Exercise 03 - Task 03 — Remediate and Re-Assess"
layout: default
nav_order: 3
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 03 — Remediate and Re-Assess

Now you remediate the `$function` finding to keep the reading-insights report working on DocumentDB. You will rewrite the `$function` stage using standard aggregation operators that Azure DocumentDB supports, confirm the report returns identical results, and re-run the assessment to prove the finding is gone. This is remediation done right: the unsupported feature disappears from the report **without changing what the report does**.

## The remediation: `$function` → `$switch`

The `$function` body is a plain `if`/`else` ladder over the `pages` field. The aggregation framework has a native operator for exactly that — **`$switch`**, which evaluates a list of `case`/`then` branches and falls back to a `default`. It runs inside the supported expression engine, with no server-side JavaScript.

Open [readingInsights.js](src/server/src/db/readingInsights.js) and replace the `$addFields` stage.

**Before** — server-side JavaScript (unsupported on DocumentDB):

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
}},
```

**After** — standard operators (supported):

```js
{$addFields: {
    effortTier: {
        $switch: {
            branches: [
                {case: {$eq: ["$pages", null]}, then: "Unknown"},
                {case: {$lt: ["$pages", 250]}, then: "Quick Read"},
                {case: {$lt: ["$pages", 500]}, then: "Standard"}
            ],
            default: "Epic"
        }
    }
}},
```

Leave the `$group` and `$sort` stages unchanged. The branches are evaluated in order, so the same boundaries (`null` → `Unknown`, `< 250` → `Quick Read`, `< 500` → `Standard`, else `Epic`) produce the same tier for every book.

> **Operator mapping.** Server-side `if`/`else` maps cleanly to aggregation expressions: a multi-way ladder → **`$switch`**; a single two-way choice → **`$cond`**. For pure numeric range bucketing you could also use the **`$bucket`** stage. `$switch` is the closest one-to-one translation of this ladder and keeps the `Unknown` (null) case explicit.

## Confirm the report still works — and clear the old usage signal

The assessment learns feature usage from `serverStatus`, which accumulates **since the last `mongod` restart**. The `$function` calls you made in Task 02 are still counted in the current server session, so a re-assessment right now would still report them. Restart the container to reset those counters, then exercise only the **rewritten** report:

1. Restart the source so `serverStatus` starts fresh:

   ```powershell
   docker restart mongodb
   ```

2. With the app running (`npm run develop` from `src/`), call the rewritten report:

   ```powershell
   Invoke-RestMethod http://localhost:8080/reading-insights | ForEach-Object { $_ } | ConvertTo-Json
   ```

3. Compare the output to what you saw in Task 02. The tiers, counts, and average ratings should be **identical** — proof that the `$switch` rewrite preserves behavior. The only difference is that this run used no server-side JavaScript, so `serverStatus` now records no `$function` usage.

## Re-run the assessment

Run the pre-migration assessment again exactly as in **Task 01** (right-click the connection → **Data Migration...** → **Migration to Azure DocumentDB** → **Pre-Migration Assessment for Azure DocumentDB**). Give it a new **Assessment name** (e.g. `contoso-books-source-remediated`) so you can tell the runs apart — the **View Past Assessments** tab keeps both.

When the new report opens, confirm the **Features** category no longer lists the `$function` finding. The server-side JavaScript is gone, and the reading-insights report is now migration-ready.

## Success criteria

`readingInsights.js` uses `$switch` instead of `$function`; the endpoint returns the same per-tier results it did before the change; and a fresh assessment (after restarting the container and re-running the report) shows the `$function` finding cleared.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The rewritten report errors or changes results | A `$switch` branch boundary doesn't match the original | Confirm the branch order and operators match the **After** block: `null` first, then `< 250`, then `< 500`, with `Epic` as the default. |
| Re-assessment still shows `$function` | `serverStatus` still holds the old usage | Make sure you ran `docker restart mongodb` **before** re-running the report, and did not call the old code path afterward. |
| The endpoint 404s after editing | Syntax error in `readingInsights.js` | Check the server terminal — `nodemon` prints the parse error; fix it and save to reload. |

With a clean assessment in hand, the only decision left is *how* to migrate. You make that call in Task 04.
