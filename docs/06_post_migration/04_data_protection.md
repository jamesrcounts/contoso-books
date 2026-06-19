---
title: "Exercise 06 - Task 04 — Data Protection"
layout: default
nav_order: 4
parent: "Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI"
---

# Task 04 — Data Protection

**Azure DocumentDB security — transport security and data encryption. SFI: secure by default.**

DocumentDB encrypts data both in transit and at rest out of the box. This task confirms those defaults hands-on, and shows why customer-managed keys are a cluster-creation decision rather than a switch you flip later.

## Encryption in transit

TLS is **always enforced** — the service rejects any connection without it, and there's no setting to weaken it. Confirm it directly: open `src/server/.env`, find `BOOKSTORE_DB_CONNECTION_STRING`, and check that the value carries **`tls=true`**:

```
mongodb+srv://…mongocluster.cosmos.azure.com/?tls=true&authMechanism=MONGODB-OIDC&…
```

That's the passwordless OIDC string from Task 03 — TLS rides along on every connection, app and extension alike. Nothing to change; it's secure by default.

## Encryption at rest

All data and backups are encrypted at rest with **service-managed keys** (AES-256) by default — no configuration required. See it in the portal: open **Settings → Data encryption**, where the mode shows **Service-managed key** (the Overview's **Storage encryption** field says the same). For most workloads this fully satisfies the encryption-at-rest control.

## Customer-managed keys

Stay on the **Data encryption** blade and look at the mode selector. It's a pair of radio buttons — **Service-managed key** (selected) and **Customer-managed key** — but the **whole group is greyed out**. You can't switch this cluster to CMK, and it isn't a missing permission: the SMK-vs-CMK mode is chosen **at cluster creation and is immutable for the cluster's lifetime**. The disabled radios are the control telling you exactly that.

When a compliance regime requires that *you* control the key (bring-your-own-key, with the ability to rotate or revoke), **CMK** is the answer — but only on a cluster that's *born* with it. CMK needs a **user-assigned managed identity** plus an **Azure Key Vault** key (with soft-delete and purge protection enabled), with the identity granted the key's wrap/unwrap permission.

To put *this* data under CMK, you create a new cluster with CMK selected at creation and move the data in — there's no in-place flip:

- **Point-in-time restore** or a **replica cluster** — the in-product routes; choose **Customer-managed key** while the new cluster is being created, then cut over.
- **Migrate** into a fresh CMK cluster with the **DocumentDB migration extension** you already used earlier in this lab.

In IaC, that "born with CMK" choice is the `encryption.customerManagedKeyEncryption` block (the key-encryption-key identity and Key Vault key URL) on the `mongoClusters` resource — set once, at create time.

## External resources

- [Data encryption in Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/database-encryption-at-rest)
- [Configure customer-managed keys for Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/how-to-data-encryption)
- [Security in Azure DocumentDB](https://learn.microsoft.com/azure/documentdb/security)

## Success criteria

You confirmed `tls=true` in `src/server/.env`, saw service-managed encryption-at-rest on the **Data encryption** blade, and can explain why the CMK radios are disabled (the mode is fixed at creation and immutable for the cluster's lifetime) and the routes to CMK for this data — a restore, a replica, or a migration into a new cluster created with the key.

Continue to **Task 05** to set up logging, detection, and monitoring.
