---
title: "Exercise 06 - Task 01 — Connect the DocumentDB Extension to the Target Cluster"
layout: default
nav_order: 1
parent: "Exercise 06 - Post-Migration — DocumentDB VS Code Extension & Azure Portal"
---

# Task 01 — Connect the DocumentDB Extension to the Target Cluster

Now that Contoso's catalog lives in Azure DocumentDB, the rest of this exercise explores it with the **Azure DocumentDB VS Code extension** and the **Azure portal**. You connected the extension to this cluster back in Exercise 02 Task 03 — but the cluster was empty then. This task picks that connection back up and confirms it now sees the migrated data, so the next tasks have something to browse.

## Open the connection from Exercise 02

You already added a connection node for this cluster in Exercise 02. Reuse it:

1. In VS Code, open the **DocumentDB** view from the Activity Bar (the database-cylinder icon surrounded by four curly brackets).
2. In the **DocumentDB Connections** pane, find the node for your cluster (`contosobooks….global.mongocluster.cosmos.azure.com`) and expand it.

When the cluster was empty in Exercise 02, expanding it showed **no databases** — only a **`+ Create Database`** option. After the Exercise 05 migration it is different: the node now lists the **`bookstore`** database that the migration created during its initial load.

> **Don't see the cluster node?** The connection is stored in VS Code, so it should still be there from Exercise 02. If it is missing (for example, you are on a fresh machine), add it again: select **+ New Connection…**, choose **Connection String**, and paste the full SRV string with `bookadmin` and your password substituted in — the same value in `src/server/.env` as `BOOKSTORE_DB_CONNECTION_STRING`.

## Success criteria

The cluster node expands without an authentication or timeout error and now lists the **`bookstore`** database — proof that the extension reaches the cluster and that the migrated data is present. (The built-in `admin` / `config` system databases stay hidden, as before.)

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The node hangs, then fails with a **timeout** | Your client IP is no longer allowed by the firewall (for example, your public IP changed) | Confirm `(Invoke-RestMethod https://api.ipify.org)` matches the `lab-client` firewall rule on the cluster's **Networking** blade in the portal, and update the rule if it changed. |
| An **`invalid key`** / authentication error | Wrong username or password in the stored connection | Re-add the connection with username `bookadmin` and the admin password you set in Exercise 02 Task 02. If unsure of the password, reset it on the cluster's **Overview** page in the portal, then reconnect. |
| The node expands but shows **no `bookstore` database** | You are pointed at a different cluster, or the migration was not completed | Confirm the connection's host matches the cluster you migrated into in Exercise 05, and that the migration reached cutover. |

With the extension connected and the migrated data visible, continue to **Task 02** to browse the collections and run a query.
