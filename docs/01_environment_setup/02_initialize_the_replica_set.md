---
title: "Exercise 01 - Task 02 — Initialize the Replica Set"
layout: default
nav_order: 3
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 02 — Initialize the Replica Set

The container is running with `--replSet rs0` but the replica set has not been activated yet. In this task you will initialize it and confirm that change streams are available.

## Initialize

Use the authenticated `mongosh` session you opened in Task 01. If you closed it, reconnect as the root user:

```powershell
mongosh -u bookadmin -p bookpass123 --authenticationDatabase admin
```

> **Why authentication works before the replica set is initialized:** the container's entrypoint created the `bookadmin` root user (in the `admin` database) on first boot, before `rs.initiate()` runs. The built-in `root` role includes `clusterAdmin`, so this user is allowed to configure the replica set.

In your `mongosh` session, run the initiation command with an explicit config so the replica set member is registered as `localhost:27017`:

```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

> **Why pass an explicit config?** Without arguments, `rs.initiate()` auto-detects the hostname — inside a Docker container that resolves to the container ID (e.g. `cc9d04ee609c:27017`), not `localhost`. Clients connecting from the host with `?replicaSet=rs0` perform topology discovery and try to dial the member by the name stored in the config; the container ID won't resolve from outside the container, so change-stream tailing (used by the online migration in Exercise 05) breaks. Passing `host: "localhost:27017"` registers the member under a name the host can reach.

You should see:

```
{ ok: 1 }
```

The prompt will change from `test>` to reflect the replica set name and role. It typically transitions through `[direct: other]` for a few seconds while the election runs, then settles on `[direct: primary]`:

```
rs0 [direct: other] test>
... a few seconds later ...
rs0 [direct: primary] test>
```

The `primary` label confirms the replica set is active and this node is the primary — change streams are now available.

## Verify replica set status

```javascript
rs.status()
```

The output is long. Look for these two things:

- `members[0].stateStr: 'PRIMARY'` — the node has been elected primary
- `members[0].name: 'localhost:27017'` — the member is registered under a host-reachable name

If `members[0].name` shows a container ID instead of `localhost:27017`, you initialized without the explicit config above. Reconfigure with `rs.reconfig({...same config as rs.initiate above...}, {force: true})`, or remove and recreate the container and run the correct `rs.initiate(...)` command.

## Confirm change stream support

Open a change stream on the test database:

```javascript
db.watch()
```

You should see a cursor reference and return to the prompt:

```
ChangeStreamCursor on test
```

If the call returns a `ChangeStreamCursor` without throwing an error, change streams are available. `db.watch()` without iteration does not block — it just returns the cursor handle.

Exit `mongosh`:

```javascript
exit
```

## Connect the DocumentDB VS Code extension to the local container

The container is now a running, authenticated replica set — a valid target for the **DocumentDB for VS Code** extension you installed in Task 00. You will use the extension against this local instance in Exercise 03; the connection details are:

| Setting | Value |
|---------|-------|
| Authentication method | **Username and Password** (not Microsoft Entra ID — that applies only to Azure DocumentDB clusters) |
| Host | `localhost` |
| Port | `27017` |
| Username | `bookadmin` |
| Password | `bookpass123` |
| Authentication database (`authSource`) | `admin` |
| TLS / SSL | **Disabled** — the local container uses no TLS |

If you prefer to add the connection by connection string, use:

```
mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
```

> **Why Username and Password (and not Entra ID)?** The DocumentDB extension supports two authentication methods: native username/password (SCRAM) and Microsoft Entra ID. Entra ID is only available for Azure DocumentDB clusters — it cannot authenticate against a local MongoDB container. Username and password is the mechanism that works locally, which is why Task 01 enables access control with the `bookadmin` credentials.
