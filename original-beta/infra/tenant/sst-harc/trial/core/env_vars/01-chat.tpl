{
  "AZURE_OPENAI_VERSION": "2025-04-01-preview",
  "BUILD_FLAGS": "UseExpressBuild",
  "ENABLE_ORYX_BUILD": "true",
  "FUNCTIONS_EXTENSION_VERSION": "~4",
  "FUNCTIONS_WORKER_RUNTIME": "python",
  "LOAD_BALANCER_ENDPOINT": "${loadbalancer_url}",
  "MODEL_IDENTIFIER": "genashi-trial",
  "SCM_DO_BUILD_DURING_DEPLOYMENT": "1",
  "TEMPERATURE": "0",
  "TEMPFILE_CONNECTION_STRING": "https://stgenashitrial${environment_prefix}.blob.core.windows.net/",
  "TEMPFILE_CONTAINER_NAME": "genashi-trial-05",
  "WEBSITE_RUN_FROM_PACKAGE": "1",
  "XDG_CACHE_HOME": "/tmp/.cache"
}
