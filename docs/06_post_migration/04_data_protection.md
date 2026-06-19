---
title: "Exercise 06 - Task 04 — Data Protection"
layout: default
nav_order: 4
parent: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
---

# Task 04 — Data Protection

**Benchmark: DP-3 (encrypt in transit), DP-4 (encrypt at rest by default), DP-5 (customer-managed keys). SFI: secure by default.**

DocumentDB encrypts data both in transit and at rest out of the box; this task confirms those defaults and explains the one knob you'd turn for stricter compliance.

## Encryption in transit (DP-3)

TLS is **always enforced** — every connection string carries `tls=true`, and the service rejects unencrypted connections. There is no toggle to weaken it, which is the secure-by-default behavior you want. Nothing to change; confirm the app and extension connect over TLS.

## Encryption at rest (DP-4)

All data and backups are encrypted at rest with **service-managed keys** (AES-256) by default — no configuration required. For most workloads this fully satisfies the encryption-at-rest control.

## Customer-managed keys (DP-5)

When a compliance regime requires that *you* control the key (bring-your-own-key, with the ability to rotate or revoke), use **customer-managed keys (CMK)**:

- CMK needs a **user-assigned managed identity** plus an **Azure Key Vault** key (with soft-delete and purge protection enabled), granting the identity the key wrap/unwrap permission.
- On vCore, **CMK is configured at cluster creation** — it cannot be added to an already-running cluster. For the lab's existing cluster this is therefore a **next-deployment / IaC** decision, not a portal toggle you apply now.

> **Bake it into IaC.** Add the `encryption.customerManagedKeyEncryption` block (the key-encryption-key identity and Key Vault key URL) to the `mongoClusters` resource so new clusters come up under your key from the first byte.

## External resources

- [Data encryption at rest — Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/database-encryption-at-rest)
- [Azure Security Baseline for Azure Cosmos DB — DP-3/4/5](https://learn.microsoft.com/security/benchmark/azure/baselines/azure-cosmos-db-security-baseline)

## Success criteria

You can confirm TLS-in-transit and service-managed encryption-at-rest are on by default, and you can explain what customer-managed keys require and why they must be set at cluster creation (an IaC decision for this lab's existing cluster).

Continue to **Task 05** to set up logging, detection, and monitoring.
