---
title: "Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI"
layout: default
nav_order: 7
has_children: true
---

# Exercise 06 - Post-Migration Hardening — Azure Security Baseline & SFI

## Scenario Overview

The catalog is migrated and the application works against DocumentDB — but the cluster was provisioned wide open so the migration and earlier exercises could reach it: public network access on, native username/password authentication, platform defaults for logging and encryption. Before Contoso would put this in production, it needs a hardening pass.

In this exercise you harden the DocumentDB (vCore) cluster against the **Microsoft cloud security benchmark (Azure Security Baseline for Azure Cosmos DB)** and the **Secure Future Initiative (SFI)** principles — *secure by design, secure by default, secure operations*. You work control family by control family: network isolation, identity, data protection, logging and detection, and resilience and governance.

## Learning Objectives

- **Network (NS-2):** tighten the firewall to least privilege and disable public network access, leaving the private endpoint as the only path
- **Identity (IM-1, IM-3, PA-7):** enable Microsoft Entra ID authentication, move clients to passwordless sign-in with your signed-in Entra user identity (OIDC) and a least-privilege role, and disable native authentication
- **Data protection (DP-3/4/5):** confirm TLS in transit and encryption at rest, and know when to reach for customer-managed keys
- **Logging & detection (LT-1/3/4):** route diagnostic and audit logs to Log Analytics, and understand the threat-detection options for vCore
- **Resilience & governance (BR-1/2, PV-2):** verify backups and restore, and enforce the hardened posture with Azure Policy and secure-by-default infrastructure-as-code

## Estimated Duration

45 minutes

## Tasks

- Task 01 — Review the cluster's security posture against the Azure Security Baseline and SFI
- Task 02 — Network hardening: least-privilege firewall and disable public network access
- Task 03 — Identity hardening: Microsoft Entra ID, least-privilege roles, and disabling native auth
- Task 04 — Data protection: encryption in transit and at rest, and customer-managed keys
- Task 05 — Logging, threat detection, and monitoring
- Task 06 — Resilience and governance: backup/restore, Azure Policy, and secure-by-default IaC
