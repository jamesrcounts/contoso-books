---
title: "Exercise 06 - Task 03 — Identity Hardening"
layout: default
nav_order: 3
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 03 — Identity Hardening

**Benchmark: IM-1 (centralized identity), IM-3 (manage app identities), PA-7 (least privilege). SFI: protect identities and secrets.**

The cluster authenticates with a native `bookadmin` username and password, and that password sits in cleartext in `src/server/.env`. The SFI-aligned end state is **passwordless**, with two separated identities: **you** administer the cluster under your own Microsoft Entra ID account (via the DocumentDB VS Code extension or mongosh), and the **application** authenticates as the VM's **system-assigned managed identity**, scoped to just the data it needs. Native password auth is then turned off.

## Step 1 — Enable Entra ID and add yourself as administrator

1. On the cluster page, open **Settings → Authentication**.
2. Under **Authentication methods**, select **Native DocumentDB authentication** *and* **Microsoft Entra ID authentication**. Running both side by side is additive and nondisruptive — no restart, and existing native connections keep working.
3. Select **Add Microsoft Entra ID**, choose your signed-in user, and **Save**. Anything added here is granted **administrative** privileges, so this makes you an Entra admin on the cluster.

You now administer the cluster under your own identity instead of the shared `bookadmin` password — use the **DocumentDB VS Code extension** signed in with your Entra account. For an Entra-authenticated shell, use **mongosh** directly on the client machine; the extension's embedded playground shell doesn't support Entra OIDC.

## Step 2 — Move the application to its own managed identity

Don't let the app borrow your identity or the admin credentials. Give it a dedicated **system-assigned managed identity** with least-privilege, passwordless access.

### Enable the managed identity

1. Open the VM **`vm-docdb-lab`** → **Identity** → **System assigned**, set **Status** to **On**, and **Save**.
2. Record the identity's **Object (principal) ID** and **Client ID** — the object ID grants the data role, the client ID goes in the connection string.

### Grant least-privilege data access

The Authentication blade only adds *admins*, and Azure RBAC governs the cluster as a *resource* (firewall, private endpoint, metadata) — neither grants *data* access. Reading and writing documents is a separate **DocumentDB data role**. Register the managed identity as a data user with `readWrite` scoped to the **`bookstore`** database — narrower than the cluster-wide `readWriteAnyDatabase`/`clusterAdmin` roles, which can only be granted as a bundled pair. (A read-only consumer would get `readAnyDatabase` instead.)

```
az resource create \
  --resource-group "rg-documentdb-lab" \
  --name "contosobooks4jbkwyzo2quf2/users/<mi-object-id>" \
  --resource-type "Microsoft.DocumentDB/mongoClusters/users" \
  --location "westus3" \
  --properties '{"identityProvider":{"type":"MicrosoftEntraID","properties":{"principalType":"ManagedIdentity"}},"roles":[{"db":"bookstore","role":"readWrite"}]}' \
  --latest-include-preview
```

### Reconfigure the app to passwordless OIDC

Repoint `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env` to authenticate with the managed identity over `MONGODB-OIDC` — the string carries no secret:

```
mongodb+srv://<client-id>@contosobooks4jbkwyzo2quf2.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=MONGODB-OIDC&retrywrites=false&maxIdleTimeMS=120000&authMechanismProperties=ENVIRONMENT:azure,TOKEN_RESOURCE:https://ossrdbms-aad.database.windows.net
```

No application code changes and no new dependency: the `mongodb` v6 driver has built-in Azure OIDC support and acquires tokens from the VM's managed identity automatically (`ENVIRONMENT:azure`).

> **Remove the standing secret.** Delete the old native-password connection string from `src/server/.env`. Any secret that must persist (for example, a break-glass credential) belongs in **Azure Key Vault**, retrieved at runtime via the managed identity — never in source control.

### Verify

From `src/`, run `npm run develop`. The server logs `DocumentDB connected to …mongocluster.cosmos.azure.com`, and the bookstore lists and updates books in the browser — now authenticating as the managed identity with no password present.

## Step 3 — Disable native authentication

With both your admin access and the app's managed identity proven on Entra, turn native auth off.

1. On **Settings → Authentication**, clear **Native DocumentDB authentication**, leaving **Microsoft Entra ID** only, and **Save**.
2. Native passwords — including `bookadmin` — are now rejected; only Entra identities connect.

> **Sequence matters.** Disable native auth **only after** every client is on Entra — here, your admin access (Step 1) and the app's managed identity (Step 2). Doing it earlier locks out the app.

## External resources

- [Connect to Azure DocumentDB using role-based access control and Microsoft Entra ID](https://learn.microsoft.com/azure/documentdb/how-to-connect-role-based-access-control)
- [Azure Security Baseline for Azure Cosmos DB — IM-1, PA-7](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

Microsoft Entra ID authentication is enabled; you administer the cluster under your own Entra identity; the application authenticates as the VM's system-assigned managed identity with a least-privilege `readWrite` grant scoped to `bookstore`; the password is removed from `src/server/.env`; native authentication is disabled; and the bookstore still works end to end.

Continue to **Task 04** to review data protection.
