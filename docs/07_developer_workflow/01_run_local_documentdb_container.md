---
title: "Exercise 07 - Task 01 — Run the Local DocumentDB Container"
layout: default
nav_order: 1
parent: "Exercise 07 - Developer Workflow — A Local DocumentDB Development Loop"
---

# Task 01 — Run the Local DocumentDB Container

Contoso's developers are moving their local database off MongoDB and onto the open-source **DocumentDB** engine — the same engine that backs Azure DocumentDB — so their local stack matches production. The engine ships as a container image. In this task you pull it, run it on the same host as the MongoDB container, and confirm you can reach it with `mongosh`.

Unlike the MongoDB container from Exercise 01, there is no replica set to initiate and no keyfile to mount: the container takes a username and password on startup and exposes a TLS gateway on port **10260**.

## Pull the image

The image is published to the GitHub Container Registry. Pull it in **PowerShell**:

```powershell
docker pull ghcr.io/documentdb/documentdb/documentdb-local:latest
```

The download is several layers; when it finishes you'll see:

```
Status: Downloaded newer image for ghcr.io/documentdb/documentdb/documentdb-local:latest
```

## Start the container

Run the container detached, publishing port 10260 and setting the admin credentials. Reuse the same `bookadmin` / `bookpass123` you used for the MongoDB container, so the only thing that differs between the two local connection strings is the port and the TLS options:

```powershell
docker run --detach --publish 10260:10260 --name documentdb `
  ghcr.io/documentdb/documentdb/documentdb-local:latest `
  --username bookadmin --password bookpass123
```

`docker run` prints the new container's ID. Confirm it is running:

```powershell
docker ps --filter "name=documentdb"
```

```
CONTAINER ID   IMAGE                                                   STATUS        PORTS                                             NAMES
85cbf981a45a   ghcr.io/documentdb/documentdb/documentdb-local:latest   Up 1 second   0.0.0.0:10260->10260/tcp, [::]:10260->10260/tcp   documentdb
```

The container runs the engine on an embedded PostgreSQL core; on first start it spends a few seconds building its internal indexes before the gateway accepts connections. If the next step reports a connection error, wait a moment and retry — `docker logs documentdb` shows the startup progress.

## Connect with mongosh

The gateway enforces TLS with a self-signed certificate, so the connection string sets `tls=true` and accepts the dev certificate with `tlsAllowInvalidCertificates=true`. Address the container by the host's private IP — the same `10.0.0.5` the MongoDB connection string uses — on port `10260`:

```powershell
mongosh "mongodb://bookadmin:bookpass123@10.0.0.5:10260/?tls=true&tlsAllowInvalidCertificates=true"
```

```
Connecting to:  mongodb://<credentials>@10.0.0.5:10260/?tls=true&tlsAllowInvalidCertificates=true&directConnection=true&appName=mongosh+2.8.3
Using MongoDB:  7.0.0
Using Mongosh:  2.8.3
```

`mongosh` redacts the credentials in its echo, reports the wire-compatible server version (`7.0.0`), and adds `directConnection=true` itself. At the prompt, ping the server and list the databases:

```javascript
db.runCommand({ ping: 1 })
show dbs
```

```
{ ok: 1 }

sampledb  ...
```

`ping` returns `{ ok: 1 }`, and the only database present is the engine's built-in `sampledb` — there is no `bookstore` yet. You move Contoso's catalog in the next task. Leave the shell with `exit`.

## Success criteria

`docker ps` shows the `documentdb` container `Up` with `10260` published, and `mongosh` connects over `10.0.0.5:10260` and returns `{ ok: 1 }` from a `ping`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `docker run` fails with **`name "documentdb" is already in use`** | A `documentdb` container already exists from an earlier attempt | `docker rm -f documentdb`, then re-run — or `docker start documentdb` if you just need the existing one up. |
| `mongosh` reports a connection error right after `docker run` | The engine is still initializing | Wait a few seconds and retry; `docker logs documentdb` shows when the gateway is ready. |
| A **TLS / certificate** error on connect | The connection string is missing the TLS options | Include both `tls=true` **and** `tlsAllowInvalidCertificates=true` — the container's certificate is self-signed. |

The container's data lives inside the container; it survives `docker stop` / `docker start` but is discarded by `docker rm` (no volume is mounted). With the container running, continue to **Task 02** to move Contoso's catalog into it.
