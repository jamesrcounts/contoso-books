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

The replica set member must advertise an address that is reachable both from this VM and from the cloud migration service you will use in Exercise 05 — that is the VM's **private IP**, not `localhost`. Get it from the Azure Instance Metadata Service (no sign-in required); run this in a PowerShell terminal:

```powershell
Invoke-RestMethod -Headers @{Metadata="true"} `
  -Uri "http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/privateIpAddress?api-version=2021-02-01&format=text"
```

It returns an address in your lab VNet's range (for example `10.0.0.5`). In your `mongosh` session, run the initiation command with an explicit config so the replica set member is registered under that private IP (substitute yours):

```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "10.0.0.5:27017" }]
})
```

> **Why pass an explicit config?** Without arguments, `rs.initiate()` auto-detects the hostname — inside a Docker container that resolves to the container ID (e.g. `cc9d04ee609c:27017`), which nothing outside the container can reach. Clients connecting with `?replicaSet=rs0` perform topology discovery and dial the member by the name stored in the config, so that name must be routable from every client. The VM's **private IP** is reachable both ways: from this host, the app, `mongosh`, and the DocumentDB extension reach the member at the private IP — this VM's own address; and from the **cloud migration service** in Exercise 05, which tails the change stream over the virtual network and cannot reach `localhost`. `localhost` would satisfy only local tools, and the container ID neither.

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
- `members[0].name: '10.0.0.5:27017'` — the member is registered under the VM's private IP (a name reachable from both the host and the cloud migration service)

If `members[0].name` shows a container ID or `localhost:27017` instead of the private IP, you initialized without the explicit config above. Reconfigure with `rs.reconfig({ _id: "rs0", members: [{ _id: 0, host: "10.0.0.5:27017" }] }, { force: true })` (substitute your private IP), or remove and recreate the container and run the correct `rs.initiate(...)` command.

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

The container is now a running, authenticated replica set — a valid target for the **DocumentDB for VS Code** extension you installed in Task 00. Register it now as a single **source connection** that you reuse for the Exercise 03 assessment and the Exercise 04 / 05 migrations. Address it by the VM's **private IP** (the same one you registered the member under) — the cloud migration service later connects through this connection and cannot reach `localhost`. The connection details are:

| Setting | Value |
|---------|-------|
| Authentication method | **Username and Password** (not Microsoft Entra ID — that applies only to Azure DocumentDB clusters) |
| Host | `10.0.0.5` (your VM's private IP) |
| Port | `27017` |
| Username | `bookadmin` |
| Password | `bookpass123` |
| Authentication database (`authSource`) | `admin` |
| TLS / SSL | **Disabled** — the local container uses no TLS |

If you prefer to add the connection by connection string, use (substitute your private IP):

```
mongodb://bookadmin:bookpass123@10.0.0.5:27017/?replicaSet=rs0&authSource=admin
```

> **The application uses this same connection string.** The app's `src/server/.env` (set in Task 03) holds the same private-IP string, so the app, the Exercise 03 assessment, and the Exercise 04 / 05 migrations all reach the source at `10.0.0.5:27017`.

> **Why Username and Password (and not Entra ID)?** The DocumentDB extension supports two authentication methods: native username/password (SCRAM) and Microsoft Entra ID. Entra ID is only available for Azure DocumentDB clusters — it cannot authenticate against a local MongoDB container. Username and password is the mechanism that works locally, which is why Task 01 enables access control with the `bookadmin` credentials.
