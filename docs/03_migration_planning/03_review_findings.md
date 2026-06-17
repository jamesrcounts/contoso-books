---
title: "Exercise 03 - Task 03 — Review Critical and Warning Findings"
layout: default
nav_order: 3
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 03 — Review Critical and Warning Findings

A report is only useful if you can read it. In this task you interpret the assessment output from the re-run in Task 02, locate the **Critical** finding that blocks migration, and understand *why* it is unsupported — which is what tells you how to fix it in Task 04.

## How to read the severities

The report sorts findings into three buckets so you can prioritize:

- **Critical** — the workload will not run correctly on Azure DocumentDB as-is. These must be remediated before (or as part of) migration.
- **Warning** — supported, but with caveats or behavioral differences worth reviewing.
- **Informational** — context and inventory (the environment overview, collection stats, readiness summaries). No action required.

Work top-down: clear every **Critical** finding first, then decide what to do about **Warnings**.

## The Critical finding: server-side JavaScript (`$function`)

Under the **Features** category you will find a **Critical** finding for an unsupported aggregation operator: **`$function`**. The finding includes the operator name, an actionable recommendation, and a **usage-frequency** value — the count comes from the reading-insights report you exercised in Task 02.

`$function` lets an aggregation pipeline run arbitrary **server-side JavaScript** inside the database engine. In the Contoso app it powers the effort-tier classification in [readingInsights.js](src/server/src/db/readingInsights.js):

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

### Why Azure DocumentDB rejects it

Azure DocumentDB is a fully managed, multi-tenant PaaS. Executing arbitrary, user-supplied JavaScript inside the database engine is incompatible with the isolation, security, and resource-governance guarantees a managed service provides. So the entire **server-side-JavaScript family is unsupported**:

| Operator / command | Purpose |
|--------------------|---------|
| **`$function`** | Run a JS function as an aggregation expression (used here). |
| **`$accumulator`** | Custom JS accumulator in `$group`. |
| **`$where`** | JS predicate in a query filter. |
| **`mapReduce`** | JS-based map/reduce command. |

The good news: server-side JS is almost always a convenience, not a necessity. Anything `$function` computes with `if`/`else` and arithmetic can be expressed with standard aggregation operators that **do** run on DocumentDB — which is exactly the remediation in Task 04.

## What about Warnings and Informational findings?

Skim the rest of the report so nothing surprises you later:

- **Informational** entries are mostly inventory — source version, instance type, per-collection document counts, and readiness summaries. Use them to sanity-check that the assessment saw the whole `bookstore` database (both `books` and `genres`).
- **Warning** entries, if any, flag supported-but-different behavior. Note them, but they do not block this migration.

For this lab, the single blocker is the `$function` Critical finding. Everything else is context.

## Success criteria

You can locate the **Critical** `$function` finding in the report, explain that it represents unsupported server-side JavaScript, and state the remediation direction: replace the `$function` stage with standard aggregation operators.

In Task 04 you make that change, confirm the report behaves identically, and re-run the assessment to prove the finding is gone.
