{
  "name": "skillset-genashi-trial-standard",
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
    },
    {
      "@odata.type": "#Microsoft.Skills.Custom.WebApiSkill",
      "name": "#3",
      "description": "Decode storage_file_path_name using Azure Function",
      "context": "/document",
      "uri": "https://func-genashi-trial-${environment_prefix}-14-indexer.azurewebsites.net/api/decode_split_file_path",
      "httpMethod": "POST",
      "timeout": "PT30S",
      "batchSize": 1000,
      "inputs": [
        {
          "name": "storage_file_path_name",
          "source": "/document/storage_file_path_name",
          "inputs": []
        }
      ],
      "outputs": [
        {
          "name": "split_file_path",
          "targetName": "split_file_path"
        }
      ],
      "httpHeaders": {}
    },
    {
      "@odata.type": "#Microsoft.Skills.Custom.WebApiSkill",
      "name": "#4",
      "description": "Decode storage_source_full_path using Azure Function",
      "context": "/document",
      "uri": "https://func-genashi-trial-${environment_prefix}-14-indexer.azurewebsites.net/api/decode_source_file_path",
      "httpMethod": "POST",
      "timeout": "PT30S",
      "batchSize": 1000,
      "inputs": [
        {
          "name": "storage_file_path_name",
          "source": "/document/storage_file_path_name",
          "inputs": []
        }
      ],
      "outputs": [
        {
          "name": "source_file_path",
          "targetName": "source_file_path"
        }
      ],
      "httpHeaders": {}
    },
    {
      "@odata.type": "#Microsoft.Skills.Custom.WebApiSkill",
      "name": "#5",
      "description": "Decode description using Azure Function",
      "context": "/document",
      "uri": "https://func-genashi-trial-${environment_prefix}-14-indexer.azurewebsites.net/api/decode_description",
      "httpMethod": "POST",
      "timeout": "PT30S",
      "batchSize": 1000,
      "inputs": [
        {
          "name": "description",
          "source": "/document/description",
          "inputs": []
        }
      ],
      "outputs": [
        {
          "name": "description",
          "targetName": "description_decoded"
        }
      ],
      "httpHeaders": {}
    }
  ],
  "cognitive_services_account": {
    "@odata.type": "#Microsoft.Azure.Search.DefaultCognitiveServices"
  },
  "index_projection": {
    "selectors": [
      {
        "targetIndexName": "index-genashi-trial-standard",
        "parentKeyFieldName": "parent_key",
        "sourceContext": "/document/splitData/*",
        "mappings": [
          {
            "name": "chunk",
            "source": "/document/splitData/*",
            "inputs": []
          },
          {
            "name": "vector",
            "source": "/document/splitData/*/vector",
            "inputs": []
          },
          {
            "name": "storage_blob_name",
            "source": "/document/storage_blob_name",
            "inputs": []
          },
          {
            "name": "storage_file_path_name",
            "source": "/document/storage_file_path_name",
            "inputs": []
          },
          {
            "name": "split_file_path",
            "source": "/document/split_file_path",
            "inputs": []
          },
          {
            "name": "source_file_path",
            "source": "/document/source_file_path",
            "inputs": []
          },
          {
            "name": "description",
            "source": "/document/description_decoded",
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