---
title: "Exercise 01 - Task 01 — Start the MongoDB Container"
layout: default
nav_order: 2
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 01 — Start the MongoDB Container

You will start MongoDB 8.0 with **access control (authentication) enabled**. The Azure DocumentDB VS Code extension you installed in Task 00 connects with a username and password, so the container must require credentials — an unauthenticated instance is not a valid connection target for the extension.

Enabling authentication on a **replica set** has one extra requirement: MongoDB then also demands an internal-authentication **keyfile** shared by the replica set members (even for a single-node set). You generate that keyfile first, store it in a Docker named volume, then start the container.

> **Why a named volume instead of mounting a file from Windows?** MongoDB rejects a keyfile that is group- or world-readable, and it must be owned by the `mongodb` user (`uid 999`) inside the container. A keyfile bind-mounted from the Windows filesystem fails those checks. Generating it inside a Docker-managed volume keeps Linux ownership and permissions correct.

## Generate the keyfile

Open a PowerShell terminal and run:

```powershell
# 1. Create a named volume to hold the replica-set keyfile
docker volume create mongo-keyfile

# 2. Generate the keyfile inside the volume, owned by the mongodb user (uid 999)
docker run --rm -v mongo-keyfile:/keyfile --entrypoint bash mongo:8.0 -c "openssl rand -base64 756 > /keyfile/keyfile && chmod 400 /keyfile/keyfile && chown 999:999 /keyfile/keyfile"
```

The second command pulls the `mongo:8.0` image on first run — this may take a minute — then exits after writing the keyfile. There is no lasting container; only the `mongo-keyfile` volume remains.

## Start the container

```powershell
docker run -d --name mongodb -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=bookadmin `
  -e MONGO_INITDB_ROOT_PASSWORD=bookpass123 `
  -v mongo-keyfile:/keyfile `
  mongo:8.0 --replSet rs0 --keyFile /keyfile/keyfile --bind_ip_all
```

Once the container starts, Windows Firewall will prompt for network access. Allow access to both **private** and **public** networks.

This starts MongoDB 8.0 as a background container, maps port 27017 to localhost, enables replica set mode with the name `rs0`, and turns on access control. The `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` variables tell the container to create a root user **`bookadmin`** (password `bookpass123`) in the `admin` database on first boot; `--keyFile` enables the internal authentication the replica set requires. The replica set is not yet active — you will initialize it in Task 02.

Verify the container started:

```powershell
docker ps
```

You should see a row for `mongodb` with status `Up`.

### Example output

```
PS C:\Users\labuser> docker run -d --name mongodb -p 27017:27017 `
>>   -e MONGO_INITDB_ROOT_USERNAME=bookadmin `
>>   -e MONGO_INITDB_ROOT_PASSWORD=bookpass123 `
>>   -v mongo-keyfile:/keyfile `
>>   mongo:8.0 --replSet rs0 --keyFile /keyfile/keyfile --bind_ip_all
cc9d04ee609c39904412608892ab0925696ed001143f732c99ce12cf9643e217
PS C:\Users\labuser> docker ps
CONTAINER ID   IMAGE       COMMAND                  CREATED         STATUS         PORTS                                             NAMES
cc9d04ee609c   mongo:8.0   "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp   mongodb
```

## Connect with mongosh

Because access control is now enabled, you must authenticate. Connect as the `bookadmin` root user against the `admin` authentication database:

```powershell
mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin
```

`mongosh` connects to `localhost:27017` by default. You will see a startup warning — it is expected and can be ignored:

- **XFS filesystem** — irrelevant on Windows/Docker

(The "Access control is not enabled" warning no longer appears — you just authenticated.)

You should land at a `test>` prompt. Leave `mongosh` open — you will use it in Task 02.

### Example output

```
PS C:\Users\labuser> mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin
Current Mongosh Log ID: 6a19970073ce645383abc113
Connecting to:          mongodb://<credentials>@127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin&appName=mongosh+2.8.3
Using MongoDB:          8.0.12
Using Mongosh:          2.8.3

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

------
   The server generated these startup warnings when booting
   2026-05-29T13:34:19.586+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
------

test>
```

> **Troubleshooting:** On first boot the container creates the `bookadmin` user before it accepts connections — this adds a few seconds to startup. If `mongosh` cannot connect or reports an authentication error, wait 5–10 seconds and try again. If the container is not listed in `docker ps`, run `docker logs mongodb` to see the startup output (look for the keyfile being accepted and the user being created).
