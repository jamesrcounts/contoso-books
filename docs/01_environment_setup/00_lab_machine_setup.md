---
title: "Exercise 01 - Task 00 — Lab Machine Setup"
layout: default
nav_order: 1
parent: "Exercise 01 - Environment Setup — Containerized MongoDB & Client App"
---

# Task 00 — Lab Machine Setup

Complete this task before starting Exercise 01. You need a Windows 11 machine with Docker Desktop and the required tools installed.

## Provision the Lab Machine

Provision a Windows 11 VM in Azure to use as your lab machine. The lab runs entirely on this VM — its private virtual network is what later lets the migration service reach the source over a private connection — so an Azure VM is required. Run these commands from your local terminal with the Azure CLI installed.

```bash
az login

az group create \
  --name rg-documentdb-lab \
  --location westus3

az vm create \
  --resource-group rg-documentdb-lab \
  --name vm-docdb-lab \
  --image MicrosoftWindowsDesktop:windows-11:win11-24h2-pro:latest \
  --size Standard_D4s_v3 \
  --admin-username labuser \
  --public-ip-sku Standard
```

Once the VM is provisioned, connect via RDP and continue to Install Prerequisites below.

---

## Install Prerequisites

If your machine does not already have the required tools installed, use the script below to install everything in one step.

### Option: Automated install via winget (Windows 11)

1. Open **Windows PowerShell ISE** as Administrator
   - Press `Win`, search for **PowerShell ISE**, right-click → **Run as administrator**
2. Paste the following script into the script pane and click **Run** (▶)

```powershell
# MongoDB to Azure DocumentDB Migration Lab — Prereqs Install
# Run as Administrator in PowerShell ISE

# Update WSL before installing Docker Desktop
wsl --update

# Core tooling
winget install --id Git.Git -e --silent --accept-source-agreements
winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements
winget install --id Microsoft.AzureCLI -e --silent --accept-source-agreements
winget install --id MongoDB.Shell -e --silent --accept-source-agreements
winget install --id MongoDB.DatabaseTools -e --silent --accept-source-agreements
winget install --id Docker.DockerDesktop -e --silent --accept-source-agreements
winget install --id Microsoft.VisualStudioCode -e --silent --accept-source-agreements

# The MongoDB Database Tools MSI installs to a versioned folder it does NOT add to PATH.
# Register that bin folder on the machine PATH so mongodump/mongorestore resolve in new shells.
$mongoToolsBin = Join-Path (Get-ChildItem "C:\Program Files\MongoDB\Tools" -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName "bin"
$machinePathCurrent = [System.Environment]::GetEnvironmentVariable("Path","Machine")
if (($machinePathCurrent -split ';') -notcontains $mongoToolsBin) {
    [System.Environment]::SetEnvironmentVariable("Path", $machinePathCurrent.TrimEnd(';') + ";" + $mongoToolsBin, "Machine")
}

# Reload PATH so `code` and the MongoDB tools are available in this session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# VS Code extensions
code --install-extension ms-azuretools.vscode-documentdb
code --install-extension ms-azurecosmosdbtools.vscode-mongo-migration

# Az PowerShell — the migration wizard's private-connectivity step (Exercise 04 Task 02)
# generates an Az PowerShell script (New-AzRoleAssignment); without the module it fails with
# "not recognized." Az.Resources pulls in Az.Accounts (which provides Connect-AzAccount).
Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force | Out-Null
Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
Install-Module -Name Az.Resources -Scope CurrentUser -Force -AllowClobber

# Configure VS Code: default the integrated terminal to Git Bash so the
# seed script in Exercise 01 Task 04 and all subsequent commands run from a
# single, consistent shell. Git Bash is auto-detected by VS Code from the
# Git installation above; this just promotes it to the default profile.
$vscodeUserDir = "$env:APPDATA\Code\User"
New-Item -ItemType Directory -Force -Path $vscodeUserDir | Out-Null
@'
{
  "terminal.integrated.defaultProfile.windows": "Git Bash"
}
'@ | Set-Content -Path "$vscodeUserDir\settings.json" -Encoding utf8
```

3. **Reboot** after the script completes — Docker Desktop requires a restart to finish setup

> **Docker Desktop first launch:** Docker Desktop will open automatically after reboot. On the "Welcome to Docker" screen, click **Skip**.

### Configure Docker Desktop to start automatically

Docker Desktop opens on the first post-install reboot, but will not start automatically on subsequent sign-ins unless you configure it. Do this now so it is ready whenever you return to the lab:

1. Click the **gear icon** (Settings) in the top-right corner of Docker Desktop
2. Check **Start Docker Desktop when you sign in to your computer**
3. Click **Apply**

### Verify the install

After rebooting, open PowerShell and run:

```powershell
git --version
node --version
az --version
mongosh --version
mongodump --version
docker --version
code --version
```

All commands should return a version number without errors. Expected versions (lab was validated against):

| Tool | Version |
|------|---------|
| Git | 2.54.0 |
| Node.js | v24.16.0 |
| Azure CLI | 2.86.0 |
| mongosh | 2.8.3 |
| MongoDB Database Tools | 100.17.0 |
| Docker | 29.4.3 |
| VS Code | 1.122.0 |

Confirm the Az PowerShell module installed as well:

```powershell
Get-Module Az.Resources -ListAvailable | Select-Object Name, Version
```

It should list a version. You do **not** sign in to Az PowerShell now — you run `Connect-AzAccount` later, at migration time (Exercise 04 Task 02), when the wizard's private-connectivity script needs it.

> **Heads-up for later:** Azure sign-in windows (both the VS Code extension's and `Connect-AzAccount`'s) can open **behind** the VS Code window. If a sign-in seems to hang, **Alt+Tab** to find the prompt.
