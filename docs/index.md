---
title: MongoDB to Azure DocumentDB Migration Lab
layout: home
nav_order: 1
---

# MongoDB to Azure DocumentDB Migration Lab

A hands-on lab for Microsoft Solution Engineers and partners. You will migrate a running MongoDB workload to Azure DocumentDB — from local development setup through discovery, migration execution, and validation — while preserving the MongoDB developer experience throughout.

## Scenario

Contoso Retail runs a product catalog service backed by MongoDB. The application team uses MongoDB locally and in their hosted dev environment. Leadership has asked the platform team to migrate the production workload to Azure DocumentDB to reduce operational overhead and take advantage of Azure-native scaling, security, and compliance features.

Your job is to plan and execute that migration without disrupting the development team's workflow. By the end of this lab you will have:

- Run the Contoso app locally against a MongoDB container and confirmed it works end-to-end
- Stood up the target Azure DocumentDB environment using Azure CLI and Bicep/scripts
- Used the Azure DocumentDB Migration Extension for VS Code to assess the source MongoDB workload
- Executed a live migration from MongoDB to Azure DocumentDB
- Validated that the application connects and functions correctly against DocumentDB
- Moved local development onto a local DocumentDB container, so developers run the same engine locally as in production

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Azure subscription | Contributor access — provided for this lab |
| Azure CLI | v2.60 or later — [install guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) |
| Docker Desktop | Required for the local MongoDB and DocumentDB containers |
| VS Code | With MongoDB extension and Azure extensions |
| Node.js | v20.19 or later — required by the application and seed tooling |
| Git | Any recent version |
| MongoDB Shell (`mongosh`) | v2.x — [install guide](https://www.mongodb.com/docs/mongodb-shell/install/) |
| MongoDB Database Tools | `mongodump` / `mongorestore` — installed in Exercise 01 setup |

> **Azure costs:** All Azure resources in this lab are provisioned in the provided subscription. No personal Azure charges will be incurred. Clean up resources using the instructions at the end of the lab.

## Lab Exercises

| # | Exercise | Duration |
|---|----------|----------|
| 01 | [Environment Setup — Containerized MongoDB & Client App](01_environment_setup/environment_setup.md) | ~45 min |
| 02 | [Target Environment Setup — Azure DocumentDB](02_target_environment/target_environment.md) | ~25 min |
| 03 | [Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code](03_migration_planning/migration_planning.md) | ~35 min |
| 04 | [Migration Execution — Offline (Snapshot)](04_migration_offline/migration_offline.md) | ~45 min |
| 05 | [Migration Execution — Online (Change Stream)](05_migration_online/migration_online.md) | ~50 min |
| 06 | [Post-Migration Hardening — Azure DocumentDB Security Guidance & SFI](06_post_migration/post_migration.md) | ~45 min |
| 07 | [Developer Workflow — A Local DocumentDB Development Loop](07_developer_workflow/developer_workflow.md) | ~20 min |
| 08 | [Cleanup](08_cleanup/cleanup.md) | ~5 min |
