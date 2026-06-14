---
title: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
layout: default
nav_order: 2
has_children: true
---

# Exercise 01 - Environment Setup — Containerized MongoDB & Client App

## Scenario Overview

Before you can migrate anything, you need a working source. In this exercise you will stand up the Contoso Books catalog application running against a MongoDB container. This gives you a known-good baseline to compare against after migration.

## Learning Objectives

- Run MongoDB as a Docker container configured as a single-node replica set
- Understand why replica set mode is required to support online (zero-downtime) migration
- Enable access control (SCRAM username/password authentication) on the container so it is a valid connection target for the DocumentDB VS Code extension
- Connect the Contoso client application to the containerized MongoDB
- Seed sample data into the database
- Verify end-to-end application functionality against the MongoDB container

## Estimated Duration

45 minutes

## Why a Replica Set?

> **Key concept:** You will start MongoDB with replica set mode enabled, even though there is only one node.
>
> Azure DocumentDB's online migration uses **change streams** to track every write that happens on the source database while data is being copied to the target. Change streams are a MongoDB feature — but they require the source to be running as a replica set, because change streams are built on top of the MongoDB **oplog** (operations log), which only exists in replica set mode.
>
> A single-node replica set gives you the oplog and change stream support with no added complexity. It is the standard pattern for local development and single-server deployments that need to be migration-ready.
>
> **Offline migration** (Exercise 05 — Part A) takes a point-in-time snapshot and does not need change streams, so it would work with a standalone MongoDB instance. But because we want to demonstrate both migration modes in this lab, we configure the replica set from the start.

## Tasks

- Task 00 — [Lab Machine Setup](00_lab_machine_setup.md) — provision the lab VM and install prerequisites
- Task 01 — [Start the MongoDB Container](01_start_the_mongodb_container.md)
- Task 02 — [Initialize the Replica Set](02_initialize_the_replica_set.md)
- Task 03 — [Clone the Contoso Books App and Configure the Connection String](03_clone_and_configure_the_app.md)
- Task 04 — [Seed the Books Database](04_seed_the_books_database.md)
- Task 05 — [Run the App and Verify End-to-End](05_run_the_app.md)
- Task 06 — Exercise the app's legacy "reading insights" report — an aggregation built with server-side JavaScript (`$function`) — and the slow catalog-statistics query; both work against MongoDB and resurface later (assessment finding in Exercise 03, runtime comparison in Exercise 05)

> **Production note:** This lab enables username/password (SCRAM) authentication and keeps the connection string — credentials included — in `.env` for simplicity. Production deployments should use strong, unique credentials, source the connection string from Azure Key Vault, and prefer Microsoft Entra ID authentication where the target supports it (Azure DocumentDB does; a local MongoDB container does not).
