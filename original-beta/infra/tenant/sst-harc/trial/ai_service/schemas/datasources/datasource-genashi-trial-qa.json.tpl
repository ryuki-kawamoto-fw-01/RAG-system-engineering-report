{
  "@odata.context": "https://srch-genashi-trial-${environment_prefix}.search.windows.net/$metadata#datasources/$entity",
  "@odata.etag": "\"0x8DEB78968A09F1E\"",
  "name": "datasource-genashi-trial-qa",
  "description": null,
  "type": "cosmosdb",
  "subtype": null,
  "indexerPermissionOptions": [],
  "credentials": {
    "connectionString": "ResourceId=/subscriptions/${subscription_id}/resourceGroups/rg-genashi-trial-${environment_prefix}/providers/Microsoft.DocumentDB/databaseAccounts/cosno-genashi-trial-${environment_prefix};Database=cosmos-genashi-trial-01;IdentityAuthType=AccessToken"
  },
  "container": {
    "name": "past-qa",
    "query": null
  },
  "dataChangeDetectionPolicy": {
    "@odata.type": "#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy",
    "highWaterMarkColumnName": "_ts"
  },
  "dataDeletionDetectionPolicy": {
    "@odata.type": "#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy",
    "softDeleteColumnName": "isDeleted",
    "softDeleteMarkerValue": "true"
  },
  "encryptionKey": null,
  "identity": null
}
