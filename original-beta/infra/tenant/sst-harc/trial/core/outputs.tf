############################################
# Core Outputs
# - 必須: 既存スクリプト / workflow が利用
# - 便利: 運用・検証・後続自動化で利用
############################################

# -----------------------------------------------------------------------------
# Common / Environment
# -----------------------------------------------------------------------------

output "environment_prefix" {
	description = "環境プレフィックス"
	value       = var.environment_prefix
}

output "resource_group_name" {
	description = "リソースグループ名"
	value       = module.common.resource_group_name
}

output "resource_group_id" {
	description = "リソースグループID"
	value       = module.common.resource_group_id
}

output "location" {
	description = "メインロケーション"
	value       = module.common.location
}

# -----------------------------------------------------------------------------
# Monitoring / Network
# -----------------------------------------------------------------------------

output "log_analytics_workspace_id" {
	description = "Log Analytics Workspace ID"
	value       = module.log_analytics.log_analytics_workspace_id
}

output "vnet_id" {
	description = "VNet ID"
	value       = module.vnet.vnet_id
}

output "vnet_name" {
	description = "VNet 名"
	value       = module.vnet.vnet_name
}

output "subnet_01_id" {
	description = "Subnet 01 ID (Private Endpoint用)"
	value       = module.vnet.subnet_01_id
}

output "subnet_02_id" {
	description = "Subnet 02 ID (App/Function統合用)"
	value       = module.vnet.subnet_02_id
}

output "subnet_03_id" {
	description = "Subnet 03 ID"
	value       = module.vnet.subnet_03_id
}

# -----------------------------------------------------------------------------
# Storage / Registry
# -----------------------------------------------------------------------------

output "storage_account_id" {
	description = "Storage Account ID"
	value       = module.storage_account.storage_account_id
}

output "storage_account_name" {
	description = "Storage Account 名"
	value       = module.storage_account.storage_account_name
}

output "storage_account_primary_blob_endpoint" {
	description = "Storage Blob Endpoint"
	value       = module.storage_account.storage_account_primary_blob_endpoint
}

output "storage_account_primary_queue_endpoint" {
	description = "Storage Queue Endpoint"
	value       = module.storage_account.storage_account_primary_queue_endpoint
}

output "storage_container_names" {
	description = "Storageコンテナ名一覧"
	value       = module.storage_account.container_names
}

output "storage_queue_names" {
	description = "Storageキュー名一覧"
	value       = module.storage_account.queue_names
}

output "container_registry_id" {
	description = "Container Registry ID"
	value       = module.container_registry.container_registry_id
}

output "container_registry_name" {
	description = "Container Registry 名"
	value       = module.container_registry.container_registry_name
}

output "container_registry_login_server" {
	description = "Container Registry Login Server"
	value       = module.container_registry.container_registry_login_server
}

# -----------------------------------------------------------------------------
# Data / Secrets
# -----------------------------------------------------------------------------

output "cosmosdb_account_id" {
	description = "Cosmos DB Account ID"
	value       = module.cosmos_db.cosmosdb_account_id
}

output "cosmosdb_account_name" {
	description = "Cosmos DB Account 名"
	value       = module.cosmos_db.name
}

output "cosmosdb_endpoint" {
	description = "Cosmos DB Endpoint"
	value       = module.cosmos_db.endpoint
}

output "key_vault_id" {
	description = "Key Vault ID"
	value       = module.key_vault.key_vault_id
}

output "key_vault_name" {
	description = "Key Vault 名"
	value       = module.key_vault.key_vault_name
}

output "key_vault_uri" {
	description = "Key Vault URI"
	value       = module.key_vault.key_vault_uri
}

# -----------------------------------------------------------------------------
# App Service
# -----------------------------------------------------------------------------

output "frontend_app_service_name" {
	description = "Frontend App Service 名"
	value       = module.app_service.frontend_app_service_name
}

output "frontend_app_service_id" {
	description = "Frontend App Service ID"
	value       = module.app_service.frontend_app_service_id
}

output "frontend_app_service_default_hostname" {
	description = "Frontend App Service ホスト名"
	value       = module.app_service.frontend_app_service_default_hostname
}

output "frontend_app_service_identity_principal_id" {
	description = "Frontend Managed Identity Principal ID"
	value       = module.app_service.frontend_app_service_identity_principal_id
}

output "loadbalancer_app_service_name" {
	description = "Load Balancer App Service 名"
	value       = module.app_service.loadbalancer_app_service_name
}

output "loadbalancer_app_service_id" {
	description = "Load Balancer App Service ID"
	value       = module.app_service.loadbalancer_app_service_id
}

output "loadbalancer_app_service_default_hostname" {
	description = "Load Balancer App Service ホスト名"
	value       = module.app_service.loadbalancer_app_service_default_hostname
}

output "loadbalancer_hostname" {
	description = "Load Balancer ホスト名（互換）"
	value       = module.app_service.loadbalancer_hostname
}

output "loadbalancer_app_service_identity_principal_id" {
	description = "Load Balancer Managed Identity Principal ID"
	value       = module.app_service.loadbalancer_app_service_identity_principal_id
}

output "service_plan_01_id" {
	description = "App Service Plan 01 ID"
	value       = module.app_service.service_plan_01_id
}

output "service_plan_02_id" {
	description = "Function App Service Plan ID"
	value       = module.app_service.service_plan_02_id
}

# -----------------------------------------------------------------------------
# Function Apps (required + useful)
# -----------------------------------------------------------------------------

output "function_chat_name" {
	description = "Function Chat 名"
	value       = module.azure_function_chat.name
}

output "function_rag_name" {
	description = "Function RAG 名"
	value       = module.azure_function_rag.name
}

output "function_register_name" {
	description = "Function Register 名"
	value       = module.azure_function_register.name
}

output "function_pii_name" {
	description = "Function PII 名"
	value       = module.azure_function_pii.name
}

output "function_prompt_name" {
	description = "Function Prompt 名"
	value       = module.azure_function_prompt.name
}

output "function_mfg_name" {
	description = "Function MFG 名"
	value       = module.azure_function_mfg.name
}

output "function_agent_rag_name" {
	description = "Function Agent RAG 名"
	value       = module.azure_function_agent_rag.name
}

output "function_agent_document_name" {
	description = "Function Agent Document 名"
	value       = module.azure_function_agent_document.name
}

output "function_pagesplitter_001_name" {
	description = "Function Pagesplitter 001 名"
	value       = module.azure_function_pagesplitter_001.name
}

output "function_pagespliter_001_name" {
	description = "Function Pagespliter 001 名（旧表記互換）"
	value       = module.azure_function_pagesplitter_001.name
}

output "function_markdown_001_name" {
	description = "Function Markdown 001 名"
	value       = module.azure_function_markdown_001.name
}

output "function_pdf_name" {
	description = "Function PDF 名"
	value       = module.azure_function_pdf.name
}

output "function_pagesplitter_002_name" {
	description = "Function Pagesplitter 002 名"
	value       = module.azure_function_pagesplitter_002.name
}

output "function_pagespliter_002_name" {
	description = "Function Pagespliter 002 名（旧表記互換）"
	value       = module.azure_function_pagesplitter_002.name
}

output "function_markdown_002_name" {
	description = "Function Markdown 002 名"
	value       = module.azure_function_markdown_002.name
}

output "function_indexer_name" {
	description = "Function Indexer 名"
	value       = module.azure_function_indexer.name
}

output "function_principal_ids" {
	description = "Function App Managed Identity Principal ID 一覧"
	value = {
		chat           = module.azure_function_chat.principal_id
		rag            = module.azure_function_rag.principal_id
		register       = module.azure_function_register.principal_id
		pii            = module.azure_function_pii.principal_id
		prompt         = module.azure_function_prompt.principal_id
		pagesplitter01 = module.azure_function_pagesplitter_001.principal_id
		markdown01     = module.azure_function_markdown_001.principal_id
		pdf            = module.azure_function_pdf.principal_id
		mfg            = module.azure_function_mfg.principal_id
		agent_rag      = module.azure_function_agent_rag.principal_id
		agent_document = module.azure_function_agent_document.principal_id
		pagesplitter02 = module.azure_function_pagesplitter_002.principal_id
		markdown02     = module.azure_function_markdown_002.principal_id
		indexer        = module.azure_function_indexer.principal_id
	}
}

# -----------------------------------------------------------------------------
# Event Grid / Monitor
# -----------------------------------------------------------------------------

output "event_grid_system_topic_id" {
	description = "Event Grid System Topic ID"
	value       = module.event_grid.system_topic_id
}

output "event_grid_system_topic_name" {
	description = "Event Grid System Topic 名"
	value       = module.event_grid.system_topic_name
}

output "event_grid_system_topic_identity_principal_id" {
	description = "Event Grid System Topic Managed Identity Principal ID"
	value       = module.event_grid.system_topic_identity
}

output "event_grid_subscription_ids" {
	description = "Event Grid Subscription ID 一覧"
	value = {
		pdf          = module.event_grid.pdf_event_subscription_id
		markdown     = module.event_grid.markdown_event_subscription_id
		pagesplitter = module.event_grid.pagesplitter_event_subscription_id
	}
}

output "azure_monitor_action_group_id" {
	description = "Azure Monitor Action Group ID"
	value       = module.azure_monitor.action_group_id
}

output "azure_monitor_action_group_name" {
	description = "Azure Monitor Action Group 名"
	value       = module.azure_monitor.action_group_name
}
