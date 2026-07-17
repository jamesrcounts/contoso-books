targetScope = 'resourceGroup'

@description('Azure region for the cluster.')
param location string = resourceGroup().location

@description('Globally-unique cluster name (lowercase, derived from the resource group).')
param clusterName string = toLower(format('contosobooks{0}', uniqueString(resourceGroup().id)))

@description('Cluster administrator username.')
param adminUsername string

@secure()
@description('Cluster administrator password.')
param adminPassword string

@description('Public IP address of the lab client, allowed through the firewall.')
param clientIpAddress string

@description('Name of the existing virtual network (created with the lab VM) that the private endpoint joins.')
param vnetName string = 'vm-docdb-labVNET'

@description('Name of the existing subnet that hosts the private endpoint.')
param subnetName string = 'vm-docdb-labSubnet'

@description('Compute tier. This production-grade POC uses M40 so the database-level request metrics Contoso relies on (used in Exercise 06) are emitted.')
param tier string = 'M40'

@description('Storage size per shard, in GB.')
param storageSizeGb int = 128

@description('MongoDB server version.')
param serverVersion string = '8.0'

resource cluster 'Microsoft.DocumentDB/mongoClusters@2024-07-01' = {
  name: clusterName
  location: location
  properties: {
    administrator: {
      userName: adminUsername
      password: adminPassword
    }
    serverVersion: serverVersion
    publicNetworkAccess: 'Enabled'
    compute: {
      tier: tier
    }
    storage: {
      sizeGb: storageSizeGb
    }
    sharding: {
      shardCount: 1
    }
    highAvailability: {
      targetMode: 'Disabled'
    }
  }
}

resource firewallRule 'Microsoft.DocumentDB/mongoClusters/firewallRules@2024-07-01' = {
  parent: cluster
  name: 'lab-client'
  properties: {
    startIpAddress: clientIpAddress
    endIpAddress: clientIpAddress
  }
}

// Private connectivity for the migration service (Exercise 04): the Azure Database
// Migration Service runs in an isolated, peered virtual network and reaches the cluster
// over a private endpoint. Private DNS is required, not optional — the mongodb+srv
// connection string is hostname-based and DocumentDB TLS validates the hostname, so the
// name must resolve to the private IP from inside the VNet.

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' existing = {
  name: vnetName
}

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' existing = {
  parent: vnet
  name: subnetName
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.mongocluster.cosmos.azure.com'
  location: 'global'
}

resource dnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${vnetName}-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: '${clusterName}-pe'
  location: location
  properties: {
    subnet: {
      id: subnet.id
    }
    privateLinkServiceConnections: [
      {
        name: '${clusterName}-plsc'
        properties: {
          privateLinkServiceId: cluster.id
          groupIds: [
            'MongoCluster'
          ]
        }
      }
    ]
  }
}

resource peDnsGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'mongocluster'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

// Log Analytics workspace for the cluster's diagnostic (audit) logs (Exercise 06 Task 05).
// The portal's "Add diagnostic setting" experience can't create a workspace inline — it only
// selects an existing one — so the workspace must exist before the learner configures logging.
// The diagnostic setting itself stays a hands-on Task 05 step (and Task 06's Azure Policy enforces it).
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${clusterName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

output clusterName string = cluster.name
output logAnalyticsWorkspaceName string = logAnalytics.name
output connectionString string = 'mongodb+srv://${adminUsername}:<password>@${clusterName}.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000'
