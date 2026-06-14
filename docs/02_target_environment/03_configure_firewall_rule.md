---
title: "Exercise 02 - Task 03 — Configure the Firewall Rule"
layout: default
nav_order: 3
parent: "Exercise 02 - Target Environment Setup — Azure DocumentDB"
---

# Task 03 — Configure the Firewall Rule

A newly provisioned Azure DocumentDB cluster **denies all connections by default** — there is no public access until you add a firewall rule. The Bicep template you deployed in Task 02 already added one (`lab-client`) for the `clientIpAddress` you passed. This task verifies that rule is in place and shows how to fix it if your public IP has changed.

## Why this matters

Public network access on a DocumentDB cluster is governed by an allow-list of IP ranges. With an empty list, every connection attempt — including `mongosh` in Task 05 and the app later — times out. Because you supplied `clientIpAddress` at deployment time, the `lab-client` rule should already allow the machine you deployed from.

## Confirm your public IP

Check the public IP your machine currently presents:

```powershell
(Invoke-RestMethod https://api.ipify.org)
```

This should match the `clientIpAddress` you passed in Task 02. Public IPs can change — for example if you reconnected to a VPN, your ISP reassigned your address, or you are now on a different network than when you deployed.

## Verify in the portal

1. In the Azure portal, open the `rg-documentdb-lab` resource group and select your **mongoClusters** resource.
2. In the left menu, under **Settings**, select **Networking**.
3. Under **Firewall rules**, confirm a rule named **lab-client** is listed and that its start and end address both equal your public IP.

When your client IP appears in the allowed list, this task is complete.

## If your IP has changed

If the IP from `api.ipify.org` no longer matches the `lab-client` rule, you have two options.

**Option A — re-run the deployment (recommended for consistency).** Re-running the Bicep with your current IP updates the `lab-client` rule in place; the deployment is idempotent and only the firewall rule changes:

```powershell
az deployment group create `
  --resource-group rg-documentdb-lab `
  --name main `
  --template-file src/deployment/main.bicep `
  --parameters adminUsername=bookadmin clientIpAddress=<your-new-ip>
```

(Enter the same admin password you chose in Task 02 when prompted.)

**Option B — add a rule directly with the Azure CLI.** This adds a separate rule without touching the template:

```powershell
az documentdb mongo-cluster firewall-rule create `
  --resource-group rg-documentdb-lab `
  --cluster-name <your-cluster-name> `
  --rule-name lab-client-current `
  --start-ip-address <your-new-ip> `
  --end-ip-address <your-new-ip>
```

Get `<your-cluster-name>` from the deployment output if you need it:

```powershell
az deployment group show `
  --resource-group rg-documentdb-lab --name main `
  --query properties.outputs.clusterName.value -o tsv
```

## Success criteria

Your current public IP is listed as an allowed firewall rule on the cluster (visible under **Networking → Firewall rules** in the portal). With access opened, continue to **Task 04** to retrieve the connection string.

> **Lab-only convenience:** allowing a single client IP is appropriate for this lab. A production cluster would typically use a tighter network design — private endpoints or a virtual-network integration — rather than a public IP allow-list.
