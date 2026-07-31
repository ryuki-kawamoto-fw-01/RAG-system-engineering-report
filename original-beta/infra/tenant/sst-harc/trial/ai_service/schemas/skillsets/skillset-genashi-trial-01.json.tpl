{
  "name": "skillset-genashi-trial-01",
  "description": "",
  "skills": [
    {
      "@odata.type": "#Microsoft.Skills.Text.SplitSkill",
      "name": "#1",
      "context": "/document",
      "defaultLanguageCode": "ja",
      "textSplitMode": "pages",
      "maximumPageLength": 750,
      "pageOverlapLength": 180,
      "maximumPagesToTake": 0,
      "unit": "characters",
      "inputs": [
        {
          "name": "text",
          "source": "/document/content",
          "inputs": []
        }
      ],
      "outputs": [
        {
          "name": "textItems",
          "targetName": "splitData"
        }
      ]
    },
    {
      "@odata.type": "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill",
      "name": "#2",
      "context": "/document/splitData/*",
      "resourceUri": "https://oai-genashi-trial-${environment_prefix}-01.openai.azure.com",
      "deploymentId": "text-embedding-3-large-genashi-trial",
      "dimensions": 3072,
      "modelName": "text-embedding-3-large",
      "inputs": [
        {
          "name": "text",
          "source": "/document/splitData/*",
          "inputs": []
        }
      ],
      "outputs": [
        {
          "name": "embedding",
          "targetName": "vector"
        }
      ]
    }
  ],
  "cognitive_services_account": {
    "@odata.type": "#Microsoft.Azure.Search.DefaultCognitiveServices"
  },
  "index_projection": {
    "selectors": [
      {
        "targetIndexName": "index-genashi-trial-01",
        "parentKeyFieldName": "parent_key",
        "sourceContext": "/document/splitData/*",
        "mappings": [
          {
            "name": "title",
            "source": "/document/metadata_storage_name",
            "inputs": []
          },
          {
            "name": "chunk",
            "source": "/document/splitData/*",
            "inputs": []
          },
          {
            "name": "rawdata_name",
            "source": "/document/rawdata_name",
            "inputs": []
          },
          {
            "name": "rawdata_path",
            "source": "/document/rawdata_path",
            "inputs": []
          },
          {
            "name": "pagedata_path",
            "source": "/document/pagedata_path",
            "inputs": []
          },
          {
            "name": "vector",
            "source": "/document/splitData/*/vector",
            "inputs": []
          }
        ]
      }
    ],
    "parameters": {
      "projectionMode": "skipIndexingParentDocuments"
    }
  }
}