---
title: "Exercise 06 - Task 03 — Identity Hardening"
layout: default
nav_order: 3
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 03 — Identity Hardening

**Benchmark: IM-1 (centralized identity), IM-3 (manage app identities), PA-7 (least privilege). SFI: protect identities and secrets.**

The cluster authenticates with a native `bookadmin` username and password, and that password sits in cleartext in `src/server/.env`. The SFI-aligned end state is **passwordless**: clients authenticate with Microsoft Entra ID, applications use a managed identity, and native password auth is turned off.

## Step 1 — Enable Microsoft Entra ID authentication

1. On the cluster page, open **Settings → Authentication**.
2. Enable **Microsoft Entra ID authentication**. vCore supports running Entra and native auth **side by side**, so this is additive — nothing breaks yet.
3. Add an Entra administrator (your signed-in user) so you can manage Entra-based access.

## Step 2 — Grant a least-privilege role

Don't reuse the cluster administrator for the application. vCore data-plane roles are cluster-scoped: assign the application identity **`readWriteAnyDatabase`** (read/write to application data) rather than `clusterAdmin`. Reserve `clusterAdmin` for administration, and use `readAnyDatabase` for read-only consumers.

## Step 3 — Move the application to a managed identity (passwordless)

Give the app's host (the lab VM / App Service) a **managed identity**, register it as a cluster user, and connect with the OIDC mechanism instead of a password. The connection string carries no secret:

```
mongodb+srv://<client-id>@<cluster>.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=MONGODB-OIDC&authMechanismProperties=ENVIRONMENT:azure,TOKEN_RESOURCE:https://ossrdbms-aad.database.windows.net&retrywrites=false
```

The app's `mongodb` driver (v6) supports `MONGODB-OIDC`; with `@azure/identity` the driver acquires Entra tokens from the managed identity automatically — no password to store, rotate, or leak. Wiring the app to OIDC is part of the developer-workflow exercise; here, demonstrate Entra access directly by signing in to the cluster connection in the **DocumentDB VS Code extension** with your Entra account and confirming you can browse `bookstore`.

> **Remove the standing secret.** Once the app authenticates with its managed identity, delete the password from `src/server/.env`. Any secret that must persist (for example, a break-glass credential) belongs in **Azure Key Vault**, retrieved at runtime via the managed identity — never in source control.

## Step 4 — Disable native authentication

With Entra access proven for every client, turn native auth off on the **Authentication** blade (Entra-only). Native passwords — including `bookadmin` — are now rejected; only Entra identities connect.

> **Sequence matters.** Disable native auth **only after** every client (the app included) is on Entra. The application's move to managed-identity/OIDC is covered in the developer-workflow exercise; until that lands, leave native auth enabled so the app keeps connecting.

> **Bake it into IaC.** Express this as `authConfig` with Entra-only allowed modes on the `mongoClusters` resource (this may require a newer `apiVersion` than the lab template's `2024-07-01`), so clusters deploy without a usable password in the first place.

## External resources

- [Microsoft Entra ID authentication — Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/entra-authentication)
- [Azure Security Baseline for Azure Cosmos DB — IM-1, PA-7](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

Entra ID authentication is enabled, a least-privilege role (`readWriteAnyDatabase`) is assigned to the application identity rather than admin, you have connected to the cluster with an Entra identity, and you can articulate the passwordless end state (managed identity + OIDC, secret removed from `.env`) and the safe sequence for disabling native auth.

Continue to **Task 04** to review data protection.
