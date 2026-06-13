---
title: "Exercise 01 - Task 02 — Initialize the Replica Set"
layout: default
nav_order: 3
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 02 — Initialize the Replica Set

The container is running with `--replSet rs0` but the replica set has not been activated yet. In this task you will initialize it and confirm that change streams are available.

## Initialize

In your open `mongosh` session, run the initiation command with an explicit config so the replica set member is registered as `localhost:27017`:

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
