{
  "name": "index-genashi-trial-knowledge-agent",
  "description": "index-genashi-trial用のエージェント",
  "retrievalInstructions": "あなたはプロンプト内の引用情報を活用して質問に答えるチャットボットです。引用情報セクションを元に回答してください。",
  "answerInstructions": null,
  "outputMode": "answerSynthesis",
  "knowledgeSources": [
    {
      "name": "index-genashi-trial-knowledge-source"
    }
  ],
  "models": [
    {
      "kind": "azureOpenAI",
      "azureOpenAIParameters": {
        "resourceUri": "https://oai-genashi-trial-${environment_prefix}-01.openai.azure.com",
        "deploymentId": "gpt-4.1-genashi-trial",
        "apiKey": null,
        "modelName": "gpt-4.1",
        "authIdentity": null
      }
    }
  ],
  "encryptionKey": null,
  "retrievalReasoningEffort": null
}
