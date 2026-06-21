---
title: "Exercise 08 - Task 01 — Delete the Resource Group"
layout: default
nav_order: 1
parent: "Exercise 08 - Cleanup"
---

# Task 01 — Delete the Resource Group

The entire lab provisioned its Azure resources into a single resource group, `rg-documentdb-lab` — the DocumentDB `mongoClusters` cluster, the lab VM `vm-docdb-lab` and its networking (VNet, NIC, disk, public IP, NSG), the cluster's private endpoint and private DNS, and the Log Analytics workspace (`<cluster>-logs`). Deleting the resource group removes all of them in one operation and stops every Azure charge associated with the lab.

Because the lab VM lives in this group, deleting it also removes the machine itself — and with it Docker and the local `mongodb` and `documentdb` containers and their volumes. That is why there is no separate local-cleanup step.

Run all commands in **PowerShell**.

## Sign in and select your subscription

```powershell
az login
```

If your account has more than one subscription, set the one the lab resources live in:

```powershell
az account set --subscription "<your-subscription-name-or-id>"
```

## Confirm what you are about to delete

Before deleting anything, list the resources in the group so you can see exactly what will be removed:

```powershell
az resource list --resource-group rg-documentdb-lab --output table
```

The list includes the `mongoClusters` cluster and the lab VM `vm-docdb-lab`, alongside the networking, private endpoint, and Log Analytics resources that support them. Confirm this is the lab resource group and contains nothing you want to keep.

> **Caution:** Deleting a resource group is irreversible and removes **every** resource it contains. Make sure `rg-documentdb-lab` holds only lab resources before continuing.

## Delete the resource group

```powershell
az group delete --name rg-documentdb-lab --yes --no-wait
```

- `--yes` skips the interactive "are you sure?" confirmation.
- `--no-wait` returns immediately instead of blocking. Deletion continues server-side and takes several minutes to fully complete — you will confirm it finished in Task 02.

## Success criteria

The command returns to the prompt with no error. The resource group and all its resources are now being deleted in the background. You verify completion in Task 02.

With the Azure resources scheduled for deletion, continue to **Task 02** to confirm the resource group is gone.
