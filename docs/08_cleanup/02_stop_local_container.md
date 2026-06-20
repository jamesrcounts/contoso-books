---
title: "Exercise 08 - Task 02 — Stop and Remove the Local Containers"
layout: default
nav_order: 2
parent: "Exercise 08 - Cleanup"
---

# Task 02 — Stop and Remove the Local Containers

Two local containers remain: the MongoDB container `mongodb` (with its `mongo-keyfile` volume) from Exercise 01, and the DocumentDB container `documentdb` from Exercise 07. Neither is needed once you are done developing — remove them to reclaim local resources.

Run all commands in **PowerShell**.

## Stop and remove the containers

```powershell
docker stop mongodb documentdb
docker rm mongodb documentdb
```

`docker stop` halts the running containers; `docker rm` deletes them. If a container is already stopped, the `stop` command is harmless. You can also force-remove a running container with `docker rm -f <name>`.

## Remove the named volumes

The MongoDB replica-set keyfile and the DocumentDB catalog each lived in a Docker named volume. Remove both now:

```powershell
docker volume rm mongo-keyfile documentdb-data
```

> **Note:** A volume cannot be removed while a container is still using it. If `docker volume rm` reports a volume is in use, confirm the containers were removed in the previous step, then try again.

## (Optional) reclaim the images

If you no longer need the images locally, remove them to free disk space:

```powershell
docker rmi mongo:7.0
docker rmi ghcr.io/documentdb/documentdb/documentdb-local:latest
```

This is optional — leave the images in place if you expect to run the containers again soon.

## Success criteria

The local environment is clean:

```powershell
docker ps -a
docker volume ls
```

`docker ps -a` shows neither the `mongodb` nor the `documentdb` container, and `docker volume ls` shows neither the `mongo-keyfile` nor the `documentdb-data` volume.

With the local container removed, continue to **Task 03** to confirm the Azure resource group is gone.
