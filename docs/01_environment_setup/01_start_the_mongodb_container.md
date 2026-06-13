---
title: "Exercise 01 - Task 01 — Start the MongoDB Container"
layout: default
nav_order: 2
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 01 — Start the MongoDB Container

Open a PowerShell terminal and run:

```powershell
docker run -d --name mongodb -p 27017:27017 mongo:7.0 --replSet rs0
```

Docker will pull the `mongo:7.0` image on first run — this may take a minute. Once the image is downloaded, Docker will start the container and Windows Firewall will prompt for network access. Allow access to both **private** and **public** networks.

This starts MongoDB 7.0 as a background container, maps port 27017 to localhost, and enables replica set mode with the name `rs0`. The replica set is not yet active — you will initialize it in Task 02.

Verify the container started:

```powershell
docker ps
```

You should see a row for `mongodb` with status `Up`.

### Example output

```
PS C:\Users\labuser> docker run -d --name mongodb -p 27017:27017 mongo:7.0 --replSet rs0
Unable to find image 'mongo:7.0' locally
7.0: Pulling from library/mongo
40d16f30db40: Pull complete
a436614bf543: Pull complete
4b7622fbaff5: Pull complete
e2b4fd11adff: Pull complete
ddd645855787: Pull complete
61088f7fdc9e: Pull complete
3611ecf4f0d7: Pull complete
8d3abee49210: Pull complete
2c116168fb02: Download complete
1a20dc3841cd: Download complete
Digest: sha256:4b5bf3c2bb7516164f6dcb44acce4fdcb428abfe5771a1128304a0f34ab9ff7c
Status: Downloaded newer image for mongo:7.0
cc9d04ee609c39904412608892ab0925696ed001143f732c99ce12cf9643e217
PS C:\Users\labuser> docker ps
CONTAINER ID   IMAGE       COMMAND                  CREATED         STATUS         PORTS                                             NAMES
cc9d04ee609c   mongo:7.0   "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp   mongodb
```

## Connect with mongosh

```powershell
mongosh
```

`mongosh` connects to `localhost:27017` by default. You will see some startup warnings — these are expected and can be ignored:

- **XFS filesystem** — irrelevant on Windows/Docker
- **Access control not enabled** — expected for a local dev instance; not exposed publicly

You should land at a `test>` prompt. Leave `mongosh` open — you will use it in Task 02.

### Example output

```
PS C:\Users\labuser> mongosh
Current Mongosh Log ID: 6a19970073ce645383abc113
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.3
Using MongoDB:          7.0.34
Using Mongosh:          2.8.3

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/


To help improve our products, anonymous usage data is collected and sent to MongoDB periodically (https://www.mongodb.com/legal/privacy-policy).
You can opt-out by running the disableTelemetry() command.

------
   The server generated these startup warnings when booting
   2026-05-29T13:34:19.586+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
   2026-05-29T13:34:20.843+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
------

test>
```

> **Troubleshooting:** If `mongosh` cannot connect, wait 5–10 seconds for the container to finish starting and try again. If the container is not listed in `docker ps`, run `docker logs mongodb` to see the startup output.
