---
title: "Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI"
layout: default
nav_order: 7
has_children: true
---

# Exercise 06 - Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI

## Scenario Overview

The catalog is migrated and the application works against DocumentDB — but the cluster was provisioned wide open so the migration and earlier exercises could reach it: public network access on, native username/password authentication, platform defaults for logging and encryption. Before Contoso would put this in production, it needs a hardening pass.

In this exercise you harden the Azure DocumentDB cluster using **Azure DocumentDB's security guidance** and the **Secure Future Initiative (SFI)** principles — *secure by design, secure by default, secure operations*. You work area by area: network isolation, identity, data protection, logging and detection, and resilience and governance.

## Learning Objectives

- **Network:** tighten the firewall to least privilege and disable public network access, leaving the private endpoint as the only path
- **Identity:** enable Microsoft Entra ID authentication, move clients to passwordless sign-in with your signed-in Entra user identity (OIDC) and a least-privilege role, and disable native authentication
- **Data protection:** confirm TLS in transit and encryption at rest, and know when to reach for customer-managed keys
- **Logging & detection:** route diagnostic and audit logs to Log Analytics, and understand the threat-detection approach for Azure DocumentDB
- **Resilience & governance:** verify backups and restore, and enforce the hardened posture with Azure Policy and secure-by-default infrastructure-as-code

## Estimated Duration

45 minutes

## Tasks

- Task 01 — Review the cluster's security posture against Azure DocumentDB's security guidance and SFI
- Task 02 — Network hardening: least-privilege firewall and disable public network access
- Task 03 — Identity hardening: Microsoft Entra ID, least-privilege roles, and disabling native auth
- Task 04 — Data protection: encryption in transit and at rest, and customer-managed keys
- Task 05 — Logging, threat detection, and monitoring
- Task 06 — Resilience and governance: backup/restore, Azure Policy, and secure-by-default IaC
