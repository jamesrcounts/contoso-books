---
title: "Exercise 08 - Task 02 — Stop and Remove the Local MongoDB Container"
layout: default
nav_order: 2
parent: "Exercise 08 - Cleanup"
---

# Task 02 — Stop and Remove the Local MongoDB Container

The local MongoDB container `mongodb` and its `mongo-keyfile` named volume (both created in Exercise 01) were only needed as the migration **source**. Now that the migration is complete, remove them to reclaim local resources.

Run all commands in **PowerShell**.

## Stop and remove the container

```powershell
docker stop mongodb
docker rm mongodb
```

`docker stop` halts the running container; `docker rm` deletes it. If the container is already stopped, the `stop` command is harmless. You can also do both at once with `docker rm -f mongodb`.

## Remove the named volume

The replica-set keyfile lived in a Docker named volume. Remove it now:

```powershell
docker volume rm mongo-keyfile
```

> **Note:** A volume cannot be removed while a container is still using it. If `docker volume rm` reports the volume is in use, confirm the `mongodb` container was removed in the previous step, then try again.

## (Optional) reclaim the image

If you no longer need the MongoDB image locally, remove it to free disk space:

```powershell
docker rmi mongo:7.0
```

This is optional — leave the image in place if you expect to run MongoDB containers again soon.

## Success criteria

The local environment is clean:

```powershell
docker ps -a
docker volume ls
```

`docker ps -a` shows no `mongodb` container, and `docker volume ls` shows no `mongo-keyfile` volume.

With the local container removed, continue to **Task 03** to confirm the Azure resource group is gone.
