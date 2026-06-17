---
title: "Exercise 03 - Task 03 — Review the Assessment Findings"
layout: default
nav_order: 3
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 03 — Review the Assessment Findings

A report is only useful if you can read it. In this task you interpret the assessment output from the re-run in Task 02, locate the finding that matters for Contoso — the unsupported **`$function`** operator — and understand *why* it is unsupported, which is what tells you how to fix it in Task 04.

## How to read the findings

The report sorts findings into three severities:

- **Critical** — would block the migration outright. This workload has **none**.
- **Warning** — a feature that is unsupported, or only *partially* supported, on Azure DocumentDB. The migration still runs, but the feature won't behave the same way (or at all), so each Warning is a judgment call: **does your app rely on it?**
- **Informational** — context, inventory, and managed-platform conveniences (replication and RBAC commands the platform handles for you). No action required.

The key habit is to **read the message, not just the badge.** A finding's severity tells you whether the platform will *let* you migrate; the message tells you whether *your app* will still work the way you need it to afterward.

## The finding that matters: server-side JavaScript (`$function`)

Under **Features Compatibility** you will find a **Warning**: `$function is not supported in Azure DocumentDB.` — recorded because you exercised the reading-insights report in Task 02. Its severity is only *Warning*, so it does **not** block the migration: Contoso could move to DocumentDB and everything except this one report would work. But `$function` will not run on DocumentDB, so the reading-insights endpoint would start failing the moment the catalog lands there. Because Contoso wants to keep that report, the team treats fixing it as a **product requirement** for the bookstore and remediates it — not because DocumentDB forces the change, but to preserve the app's behavior.

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

### Why Azure DocumentDB doesn't support it

Azure DocumentDB is a fully managed, multi-tenant PaaS. Executing arbitrary, user-supplied JavaScript inside the database engine is incompatible with the isolation, security, and resource-governance guarantees a managed service provides. So the entire **server-side-JavaScript family is unsupported**:

| Operator / command | Purpose |
|--------------------|---------|
| **`$function`** | Run a JS function as an aggregation expression (used here). |
| **`$accumulator`** | Custom JS accumulator in `$group`. |
| **`$where`** | JS predicate in a query filter. |
| **`mapReduce`** | JS-based map/reduce command. |

The good news: server-side JS is almost always a convenience, not a necessity. Anything `$function` computes with `if`/`else` and arithmetic can be expressed with standard aggregation operators that **do** run on DocumentDB — which is exactly the remediation in Task 04.

## The other findings

Skim the rest of the report so nothing surprises you later:

- **Informational** entries are inventory and managed-platform conveniences — source version, instance type, per-collection document counts, and notes that DocumentDB handles replication and the `rolesInfo` / `usersInfo` RBAC commands for you. Use the inventory to confirm the assessment saw the whole `bookstore` database (both `books` and `genres`). No action.
- The other **Warning** — `$changeStream` is only *partially* supported — matters during the migration itself (Exercise 05 uses change streams), not to the running app. No action for Contoso here.

The one finding that drives action is `$function` — not because it is the most severe (it is only a Warning), but because the app depends on it.

## Success criteria

You can locate the `$function` **Warning** in the report, explain that it represents unsupported server-side JavaScript that the reading-insights report depends on, and state the remediation direction: replace the `$function` stage with standard aggregation operators to keep the report working on DocumentDB.

In Task 04 you make that change, confirm the report behaves identically, and re-run the assessment to prove the finding is gone.
