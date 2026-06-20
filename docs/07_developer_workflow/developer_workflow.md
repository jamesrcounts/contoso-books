---
title: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
layout: default
nav_order: 8
has_children: true
---

# Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop

## Scenario Overview

Contoso's catalog now runs on Azure DocumentDB, but the development team still writes and tests code against a local **MongoDB** container. That is a consistency gap: MongoDB supports features DocumentDB does not, so a developer can write code that passes locally and only fails once it reaches Azure. Exercise 03 hit exactly this — a server-side-JavaScript `$function` aggregation that DocumentDB rejects had to be rewritten before the migration could proceed.

In this exercise you close the gap by moving local development onto a **local DocumentDB container** — the same open-source engine that backs the Azure service, run in Docker. With both ends speaking DocumentDB, the only thing that differs between a developer's machine and production is the connection string, and an unsupported feature now fails fast — locally — instead of in Azure.

## Learning Objectives

- Run the open-source DocumentDB engine locally in a container
- Move Contoso's catalog from the MongoDB container into the DocumentDB container with native MongoDB tools
- Point the unchanged application at the local container and confirm identical behavior
- Validate that the moved data is identical to the source
- Switch the app between the local container and Azure DocumentDB with a single connection-string change

## Estimated Duration

20 minutes

## Tasks

- Task 01 — Run the local DocumentDB container and connect to it with `mongosh`
- Task 02 — Move the `bookstore` catalog from the MongoDB container into the DocumentDB container with `mongodump`/`mongorestore`
- Task 03 — Point the app at the local DocumentDB container and confirm identical behavior
- Task 04 — Switch between the local container and Azure DocumentDB by changing only the connection string
