---
title: "Exercise 03 - Task 01 — Connect the Extension to the Local MongoDB Instance"
layout: default
nav_order: 1
parent: "Exercise 03 - Migration Planning — Assessment with the DocumentDB Migration Extension for VS Code"
---

# Task 01 — Connect the Extension to the Local MongoDB Instance

Before you can assess anything, the assessment tooling needs to see your source. The **Azure DocumentDB Migration extension** runs entirely inside VS Code, but it does not manage its own connections — it rides on top of the **DocumentDB for VS Code** extension and assesses whatever source you have connected there. In this task you point that extension at the containerized MongoDB instance from Exercise 01, the same source you will migrate.

## About the two extensions

Both were installed by the lab-machine setup script in **Exercise 01, Task 00**:

- **DocumentDB for VS Code** (`ms-azuretools.vscode-documentdb`) — the connection and data-browsing surface you already used in Exercise 01 (Task 02 / Task 05) and Exercise 02 (Task 03).
- **Azure DocumentDB Migration extension** — adds the assessment and migration commands. Installing it automatically pulls in the DocumentDB for VS Code extension as a prerequisite, so the two always travel together.

You do not launch the migration extension directly. You connect to a source in the DocumentDB pane, then invoke its migration commands from that connection (Task 02).

## Connect to the local container

1. In the VS Code **Activity Bar** (the far-left icon strip), select the **DocumentDB** icon (a database cylinder surrounded by four curly brackets) to open the **DocumentDB Connections** pane.
2. If you still have the local container connection (`localhost`) you registered in **Exercise 01, Task 02**, you can reuse it — skip to step 5. Otherwise, select **+ New Connection...**.
3. In the connection-type dialog, choose **Connection String**.
4. Paste the local MongoDB connection string from Exercise 01:

   ```
   mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin
   ```

5. The connection node appears in **DocumentDB Connections**. Expand it to open the connection, then expand the **bookstore** database.

If the node expands and you can see the **books** and **genres** collections, the extension is connected to your source and you are ready to assess.

> **The assessment needs read and monitoring access.** The pre-migration assessment requires the connected user to hold the `readAnyDatabase` and `clusterMonitor` roles on the source. The lab's `bookadmin` is the container's **root** user, which already includes both — so no extra grant is needed. (If you had connected as a narrowly scoped application user, you would grant these with `db.grantRolesToUser()` before assessing.)

## Success criteria

The DocumentDB for VS Code extension is connected to the local container, and expanding the connection shows the **bookstore** database with its **books** and **genres** collections. The source is ready to assess.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The connection fails with a network/timeout error | The MongoDB container is not running | Run `docker ps` and confirm the `mongodb` container is up; start it with `docker start mongodb` if needed. |
| An authentication error on expand | Wrong credentials or missing `authSource` | Confirm the string is exactly `mongodb://bookadmin:bookpass123@localhost:27017/?replicaSet=rs0&authSource=admin`, including `authSource=admin`. |
| You don't see the **Data Migration** option later | The Migration extension is not installed | Confirm both extensions are present (Extensions view); re-run the **Task 00** setup script if the Migration extension is missing. |

With the source connected, you are ready to run the pre-migration assessment in Task 02.
