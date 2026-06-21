---
title: "Exercise 08 - Task 02 — Confirm the Resource Group No Longer Exists"
layout: default
nav_order: 2
parent: "Exercise 08 - Cleanup"
---

# Task 02 — Confirm the Resource Group No Longer Exists

Task 01 deleted the resource group with `--no-wait`, so the command returned before deletion finished. Deletion takes several minutes to complete server-side. This task confirms it actually finished and that no billable lab resources remain.

## Confirm in the Azure portal

1. Sign in to the [Azure portal](https://portal.azure.com).
2. In the top search bar, search for and select **Resource groups**.
3. In the list of resource groups, confirm that **`rg-documentdb-lab`** is no longer listed.

If the group still appears, deletion is likely still in progress. Wait a few minutes, refresh the list, and check again.

## (Alternative) confirm via CLI

You can also confirm from **PowerShell**:

```powershell
az group exists --name rg-documentdb-lab
```

The command returns `false` once deletion has finished. While deletion is still in progress it may still return `true` — wait a few minutes and re-run.

## Success criteria

The resource group `rg-documentdb-lab` is absent from both the portal **Resource groups** list and the `az group exists` check (which returns `false`). No lab resources remain billable.

The lab environment is now fully torn down — the resource group and everything it held, including the DocumentDB cluster and the lab VM, is gone.
