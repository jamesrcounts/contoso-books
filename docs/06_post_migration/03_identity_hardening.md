---
title: "Exercise 06 - Task 03 — Identity Hardening"
layout: default
nav_order: 3
parent: "Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI"
---

# Task 03 — Identity Hardening

**Azure DocumentDB security — identity management. SFI: protect identities and secrets.**

The cluster authenticates with a native `bookadmin` username and password, and that password sits in cleartext in `src/server/.env`. The SFI-aligned end state is **passwordless**, with two separated identities: **you** administer the cluster under your own Microsoft Entra ID account (via the DocumentDB VS Code extension or mongosh), and the **application** authenticates as the VM's **system-assigned managed identity** — a dedicated, non-human identity separate from your admin account. Native password auth is then turned off.

## Step 1 — Enable Entra ID and add yourself as administrator

1. On the cluster page, open **Settings → Authentication**.
2. Under **Authentication methods**, choose the **Native + Microsoft Entra ID** option. The methods are radio buttons — *Native* or *Native + Microsoft Entra ID* — so this is the additive choice; it's nondisruptive (no restart) and existing native connections keep working.
3. Select **Add Microsoft Entra ID**, choose your signed-in user, and **Save**. Anything added here is granted **administrative** privileges, so this makes you an Entra admin on the cluster.

Now point your own tools at the cluster under this identity. In the **DocumentDB VS Code extension**, right-click the existing cluster connection → **Update credentials** → choose **Microsoft Entra ID** → enter your **tenant ID** (`az account show --query tenantId -o tsv`) → complete the modal sign-in (**Allow**, then select your user). The connection reconnects and lists `bookstore`, now authenticated as you rather than `bookadmin`. The connection string it produces is a bare `…&authMechanism=MONGODB-OIDC` — no client ID, no `authMechanismProperties` — because the interactive sign-in supplies your token.

For an Entra-authenticated **shell** (Step 2 needs one to run admin commands), use **mongosh** signed in with this identity; the extension's embedded playground shell doesn't support Entra OIDC.

## Step 2 — Move the application to its own managed identity

Don't let the app borrow your identity or the admin credentials. Give it a dedicated, passwordless **system-assigned managed identity**.

### Enable the managed identity

1. Open the VM **`vm-docdb-lab`** → **Identity** → **System assigned**, set **Status** to **On**, and **Save**.
2. Record the identity's **Object (principal) ID** — `az vm identity show -g rg-documentdb-lab -n vm-docdb-lab` returns it as `principalId`. A system-assigned identity exposes only this object ID (no client ID), and it's all you need.

### Grant the data role

Reading and writing documents is governed by a **DocumentDB data role**, separate from Azure RBAC (which controls the cluster *resource* — firewall, private endpoint, metadata) and from the Authentication blade (which only adds *admins*). Non-admin Entra users are created on the **data plane**: connect to the cluster as an administrator with **mongosh** (your Entra admin from Step 1, or `bookadmin` while native auth is still enabled) and register the managed identity with `createUser`, keyed by its object ID:

```javascript
db.runCommand({
  createUser: "<mi-object-id>",
  roles: [
    { role: "clusterAdmin",         db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ],
  customData: { "IdentityProvider": { "type": "MicrosoftEntraID", "properties": { "principalType": "servicePrincipal" } } }
})
```

A managed identity registers as `servicePrincipal`. To change a user's roles later, **drop and recreate** it — Entra users can't be updated in place.

> **Platform limitation — read this before calling it "least privilege."** On DocumentDB vCore, data-plane RBAC for Entra ID identities is **cluster-scoped only**. Microsoft documents this directly: *"Assigning roles to specific databases or collections isn't supported, only cluster level is supported"* ([service limits](https://learn.microsoft.com/azure/documentdb/limitations#authentication-and-access-control-role-based-access-control)). The roles available are `readAnyDatabase` (read-only), the `readWriteAnyDatabase` + `clusterAdmin` pair (read-write — they must be granted **together**; `readWriteAnyDatabase` alone authenticates but then fails at runtime with `User is not authorized`), and `root` (full admin). There is **no per-database role** — `readWrite` on a single database is rejected — and **no custom roles** (`rolesInfo` isn't supported either; use `usersInfo`). So an application that writes must hold the cluster-wide pair, i.e. read-write across *every* database.
>
> The genuine least-privilege wins here are therefore on the **identity** axis, not the data axis: the app runs as a **dedicated, passwordless, non-human identity**, separate from any human admin, that **cannot manage users or grant access**, and is independently auditable and revocable. For true *per-database* isolation you would use a native database user scoped to `bookstore` (which reintroduces a password — store it in **Azure Key Vault**) or provision a dedicated single-database cluster. Both are out of scope for this lab.

### Reconfigure the app to passwordless OIDC

Repoint `BOOKSTORE_DB_CONNECTION_STRING` in `src/server/.env` to authenticate with the managed identity over `MONGODB-OIDC` — the string carries no secret:

```
mongodb+srv://contosobooks4jbkwyzo2quf2.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=MONGODB-OIDC&retrywrites=false&maxIdleTimeMS=120000&authMechanismProperties=ENVIRONMENT:azure,TOKEN_RESOURCE:https://ossrdbms-aad.database.windows.net
```

No client ID is needed — `ENVIRONMENT:azure` resolves the VM's single system-assigned identity from its instance metadata. No application code changes and no new dependency either: the `mongodb` v6 driver has built-in Azure OIDC support and acquires the token from the managed identity automatically.

> **Remove the standing secret.** Delete the old native-password connection string from `src/server/.env`. Any secret that must persist (for example, a break-glass credential) belongs in **Azure Key Vault**, retrieved at runtime via the managed identity — never in source control.

### Verify

From `src/`, run `npm run develop`. The server logs `DocumentDB connected to …mongocluster.cosmos.azure.com`, and the bookstore lists books and saves a comment in the browser — now authenticating as the managed identity with no password present.

If the server connects but the first query throws `MongoServerError: User is not authorized … code 13`, the managed identity is missing `clusterAdmin` — both roles of the pair are required; drop and recreate the user with both.

## Step 3 — Disable native authentication

With both your admin access and the app's managed identity proven on Entra, turn native auth off — leaving **Microsoft Entra ID only**.

The portal can't do this: its **Authentication methods** are radio buttons offering only *Native* or *Native + Microsoft Entra ID* — there's no Entra-only choice. Switch the cluster's `authConfig.allowedModes` over REST instead (on the VM, in PowerShell):

```powershell
az rest --method patch `
  --url "https://management.azure.com/subscriptions/<subscription-id>/resourceGroups/rg-documentdb-lab/providers/Microsoft.DocumentDB/mongoClusters/<cluster-name>?api-version=2026-02-01-preview" `
  --body '{\"properties\": {\"authConfig\": {\"allowedModes\": [\"MicrosoftEntraID\"]}}}'
```

The cluster goes to **Updating** for 5–10 minutes. When it returns to **Ready**, native passwords — including `bookadmin` — are rejected; only Entra identities connect.

> **Sequence matters.** Disable native auth **only after** every client is on Entra — here, your admin access (Step 1) and the app's managed identity (Step 2). Doing it earlier locks out the app.

> **One-way in practice.** Re-enabling native isn't a toggle back — it requires supplying the admin username and a **new** password ([documented here](https://learn.microsoft.com/azure/cosmos-db/mongodb/how-to-migrate-documentdb#post-migration-actions)). Treat Entra-only as the point of no return for this lab.

## External resources

- [Connect to Azure DocumentDB using role-based access control and Microsoft Entra ID](https://learn.microsoft.com/azure/documentdb/how-to-connect-role-based-access-control)
- [Azure DocumentDB service limits — RBAC limitations](https://learn.microsoft.com/azure/documentdb/limitations#authentication-and-access-control-role-based-access-control)
- [Security in Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/security)

## Success criteria

Microsoft Entra ID authentication is enabled; you administer the cluster under your own Entra identity; the application authenticates as the VM's system-assigned managed identity over OIDC with no stored password; its data grant is the cluster-wide `readWriteAnyDatabase` + `clusterAdmin` pair (the tightest read-write this platform offers an Entra identity — per-database scoping isn't available); the password is removed from `src/server/.env`; native authentication is disabled; and the bookstore still reads and writes end to end.

Continue to **Task 04** to review data protection.
