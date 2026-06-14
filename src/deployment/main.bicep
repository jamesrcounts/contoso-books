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

@description('Compute tier. This production-grade POC uses M40 so the database-level request metrics Contoso relies on (used in Exercise 06) are emitted.')
param tier string = 'M40'

@description('Storage size per shard, in GB.')
param storageSizeGb int = 128

@description('MongoDB server version.')
param serverVersion string = '7.0'

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

output clusterName string = cluster.name
output connectionString string = 'mongodb+srv://${adminUsername}:<password>@${clusterName}.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000'
