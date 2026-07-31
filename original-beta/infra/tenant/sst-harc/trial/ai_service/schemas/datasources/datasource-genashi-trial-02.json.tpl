{
  "@odata.context": "https://srch-genashi-trial-${environment_prefix}.search.windows.net/$metadata#datasources/$entity",
  "@odata.etag": "\"0x8DEB7891C847C2E\"",
  "name": "datasource-genashi-trial-02",
  "description": null,
  "type": "azureblob",
  "subtype": null,
  "indexerPermissionOptions": [],
  "credentials": {
    "connectionString": "ResourceId=/subscriptions/${subscription_id}/resourceGroups/rg-genashi-trial-${environment_prefix}/providers/Microsoft.Storage/storageAccounts/stgenashitrial${environment_prefix};"
  },
  "container": {
    "name": "genashi-trial-04",
    "query": "インデックス２"
  },
  "dataChangeDetectionPolicy": null,
  "dataDeletionDetectionPolicy": {
    "@odata.type": "#Microsoft.Azure.Search.NativeBlobSoftDeleteDeletionDetectionPolicy"
  },
  "encryptionKey": null,
  "identity": null
}
