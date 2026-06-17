---
title: "Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting"
layout: default
nav_order: 8
has_children: true
---

# Exercise 07 - Developer Workflow — Local Container, Driver Compatibility, Environment Targeting

## Scenario Overview

The migration is done, but Contoso's developers still need to be productive. In this exercise you will demonstrate that the local MongoDB container workflow is unchanged — developers keep using familiar tools and drivers, and only the connection string differs between local and Azure environments.

## Learning Objectives

- Confirm that the same application code runs unchanged against either MongoDB or DocumentDB by switching the connection string
- Validate data integrity between source and target
- Understand the compatibility story: MongoDB drivers work against DocumentDB in production
- Apply the environment-targeting pattern (local → MongoDB container, upper environments → DocumentDB) as the standard developer workflow

## Estimated Duration

25 minutes

## Tasks

- Task 01 — Point the app back at the local MongoDB container by swapping the `.env` value — confirm identical behavior
- Task 02 — Point it again at DocumentDB — confirm identical behavior (driver compatibility demo)
- Task 03 — Execute the validation script to compare document counts and checksums across collections
- Task 04 — Review the connection-string-per-environment pattern as the recommended developer workflow
