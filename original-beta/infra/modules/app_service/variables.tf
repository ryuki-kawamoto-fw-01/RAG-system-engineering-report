variable "resource_group_name" {
	description = "App Service を配置するリソースグループ名"
	type        = string
}

variable "location" {
	description = "App Service を配置するリージョン"
	type        = string
}

variable "log_analytics_workspace_id" {
	description = "Application Insights を接続する Log Analytics Workspace ID"
	type        = string
}

variable "app_service_plan_name" {
	description = "Frontend / LoadBalancer 用 App Service Plan 名"
	type        = string
}

variable "app_service_sku_name" {
	description = "Frontend / LoadBalancer 用 App Service Plan SKU"
	type        = string
}

variable "function_app_service_plan_name" {
	description = "Function App 用 App Service Plan 名"
	type        = string
}

variable "function_app_sku_name" {
	description = "Function App 用 App Service Plan SKU"
	type        = string
}

variable "function_app_service_plan_maximum_elastic_worker_count" {
	description = "Function App 用 Elastic Premium Plan の最大ワーカー数"
	type        = number
	default     = 20
}

variable "frontend_app_service_name" {
	description = "Frontend App Service 名"
	type        = string
}

variable "frontend_application_insights_name" {
	description = "Frontend 用 Application Insights 名"
	type        = string
}

variable "frontend_app_settings" {
	description = "Frontend App Service に設定する app_settings"
	type        = map(string)
	default     = {}
}

variable "frontend_subnet_id" {
	description = "Frontend App Service VNet 統合先 subnet ID"
	type        = string
	default     = null
}

variable "frontend_key_vault_id" {
	description = "Frontend に Key Vault Secrets User を付与する対象 Key Vault ID"
	type        = string
	default     = null
}

variable "frontend_cosmos_db_id" {
	description = "Frontend に Cosmos DB Built-in Data Contributor を付与する対象 Cosmos DB ID"
	type        = string
	default     = null
}

variable "create_key_vault_role_assignment" {
	description = "Frontend 用 Key Vault RBAC を作成するか"
	type        = bool
	default     = false
}

variable "create_cosmos_db_role_assignment" {
	description = "Frontend 用 Cosmos DB RBAC を作成するか"
	type        = bool
	default     = false
}

variable "frontend_auth_client_id" {
	description = "Frontend Easy Auth 用 Microsoft Entra アプリの Client ID"
	type        = string
	default     = null
}

variable "frontend_auth_client_secret" {
	description = "Frontend Easy Auth 用 Client Secret"
	type        = string
	sensitive   = true
	default     = null
}

variable "frontend_additional_ip_restrictions" {
	description = "Frontend App Service に追加適用する IP 制限ルール"
	type = list(object({
		name        = string
		ip_address  = optional(string)
		priority    = number
		action      = string
		service_tag = optional(string)
	}))
	default = []
}

variable "frontend_base_ip_restrictions" {
	description = "Frontend App Service に適用する共通IP制限ルール（環境ごとのベース）"
	type = list(object({
		name        = string
		ip_address  = optional(string)
		priority    = number
		action      = string
		service_tag = optional(string)
	}))
	default = []
}

variable "frontend_ip_restrictions_override" {
	description = "Frontend App Service のIP制限を完全差し替えする場合のルール一覧。null時は base + additional を使用"
	type = list(object({
		name        = string
		ip_address  = optional(string)
		priority    = number
		action      = string
		service_tag = optional(string)
	}))
	default  = null
	nullable = true
}

variable "frontend_vnet_route_all_enabled" {
	description = "Frontend App Service で vnet_route_all_enabled を有効化するか"
	type        = bool
	default     = true
}

variable "loadbalancer_vnet_route_all_enabled" {
	description = "LoadBalancer App Service で vnet_route_all_enabled を有効化するか"
	type        = bool
	default     = true
}

variable "frontend_app_service_runtime_stack" {
	description = "Frontend App Service の Node.js ランタイムスタック"
	type        = string
	default     = "22-lts"
}

variable "loadbalancer_app_service_runtime_stack" {
	description = "LoadBalancer App Service の .NET ランタイムスタック"
	type        = string
	default     = "8.0"
}

variable "frontend_auth_tenant_id" {
	description = "Easy Auth で利用する Tenant ID。未指定時は現在の実行コンテキストを使用"
	type        = string
	default     = null
}

variable "frontend_diagnostic_setting_name" {
	description = "Frontend App Service の診断設定名。未指定時は app 名から自動生成"
	type        = string
	default     = null
}

variable "loadbalancer_diagnostic_setting_name" {
	description = "LoadBalancer App Service の診断設定名。未指定時は app 名から自動生成"
	type        = string
	default     = null
}

variable "enable_basic_publishing_credentials_policy" {
	description = "SCM/FTP の basicPublishingCredentialsPolicies を AzAPI で明示制御するか"
	type        = bool
	default     = true
}

variable "loadbalancer_app_service_name" {
	description = "LoadBalancer App Service 名"
	type        = string
}

variable "loadbalancer_application_insights_name" {
	description = "LoadBalancer 用 Application Insights 名"
	type        = string
}

variable "loadbalancer_app_settings" {
	description = "LoadBalancer App Service に設定する app_settings"
	type        = map(string)
	default     = {}
}

variable "loadbalancer_subnet_id" {
	description = "LoadBalancer App Service VNet 統合先 subnet ID"
	type        = string
	default     = null
}

variable "init_flag" {
	description = "初回デプロイ用フラグ。true の間はネットワーク制御を緩める"
	type        = bool
	default     = false
}

variable "tags" {
	description = "全リソースに付与するタグ"
	type        = map(string)
	default     = {}
}
