# =============================================================================
# 1. Provider / Data Sources
# =============================================================================

# -----------------------------------------------------------------------------
# Azure Resource Manager Provider
# -----------------------------------------------------------------------------

provider "azurerm" {
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id

  features {
    key_vault {
      # 削除済みKey Vaultを再作成する際の挙動を制御
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }

    resource_group {
      # Resource Group内にリソースが残っている場合の削除を防止
      prevent_deletion_if_contains_resources = true
    }
  }
}


# -----------------------------------------------------------------------------
# Microsoft Entra ID Provider
# -----------------------------------------------------------------------------

provider "azuread" {
  tenant_id = var.tenant_id
}


# -----------------------------------------------------------------------------
# Current Azure Context
# -----------------------------------------------------------------------------

# Terraformを実行しているID、Tenant、Subscription等の情報を取得
data "azurerm_client_config" "current" {}

# 現在のSubscription情報を取得
data "azurerm_subscription" "current" {
  subscription_id = var.subscription_id
}


# =============================================================================
# 2. Resource Group
# =============================================================================

# -----------------------------------------------------------------------------
# Common Resource Group
# -----------------------------------------------------------------------------
# core環境の各Azureリソースを格納するResource Groupを作成する。
#
# Resource Group名:
#   rg-genashi-trial-hs
#
# 配置リージョン:
#   Japan East
# -----------------------------------------------------------------------------

module "common" {
  source = "../../../../modules/common"

  resource_group_name = local.resource_group_name
  location            = local.rg_location

  tags = local.tags
}


# =============================================================================
# 3. Log Analytics Workspace
# =============================================================================

# -----------------------------------------------------------------------------
# Centralized Log Analytics Workspace
# -----------------------------------------------------------------------------
# App Service、Azure Functions、Storage Account、Cosmos DB、
# Key Vault等の診断ログを一元的に収集する。
#
# Workspace名:
#   laws-genashi-trial-hs
#
# 配置リージョン:
#   Japan West
# -----------------------------------------------------------------------------

module "log_analytics" {
  source = "../../../../modules/log_analytics"

  resource_group_name = module.common.resource_group_name
  location_name       = local.location
  log_name            = local.log_name

  tags = local.tags

  depends_on = [
    module.common
  ]
}


# =============================================================================
# 3.5 Azure Monitor
# =============================================================================

module "azure_monitor" {
  source = "../../../../modules/azure_monitor"

  resource_group_name = module.common.resource_group_name
  location            = local.location

  action_group_name       = local.azure_monitor.action_group_name
  action_group_short_name = local.azure_monitor.action_group_short_name
  action_group_enabled    = local.azure_monitor.action_group_enabled
  email_receivers         = local.azure_monitor.email_receivers

  resource_health_alert_name         = local.azure_monitor.resource_health_alert_name
  resource_health_evaluation_frequency = local.azure_monitor.resource_health_evaluation_frequency
  resource_health_window_duration      = local.azure_monitor.resource_health_window_duration
  resource_health_scopes               = local.azure_monitor.resource_health_scopes
  resource_health_severity             = local.azure_monitor.resource_health_severity
  resource_health_enabled              = local.azure_monitor.resource_health_enabled
  resource_health_auto_mitigation      = local.azure_monitor.resource_health_auto_mitigation
  resource_health_query                = local.azure_monitor.resource_health_query

  service_health_alert_01_name = local.azure_monitor.service_health_alert_01_name
  service_health_scopes        = local.azure_monitor.service_health_scopes
  service_health_01_enabled    = local.azure_monitor.service_health_01_enabled
  service_health_01_events     = local.azure_monitor.service_health_01_events
  service_health_01_locations  = local.azure_monitor.service_health_01_locations
  service_health_01_services   = local.azure_monitor.service_health_01_services

  service_health_alert_02_name = local.azure_monitor.service_health_alert_02_name
  service_health_02_enabled    = local.azure_monitor.service_health_02_enabled
  service_health_02_events     = local.azure_monitor.service_health_02_events
  service_health_02_locations  = local.azure_monitor.service_health_02_locations
  service_health_02_services   = local.azure_monitor.service_health_02_services

  tags = local.tags

}


# =============================================================================
# 4. Virtual Network
# =============================================================================

# -----------------------------------------------------------------------------
# Core Virtual Network
# -----------------------------------------------------------------------------
# App Service / Azure FunctionsのVNet統合、およびPrivate Endpointの
# 配置先として利用するVirtual NetworkとSubnetを構築する。
#
# VNet名:
#   vnet-genashi-trial-hs
#
# Address Space:
#   environment.tfのvnet_address_spaceを参照
#
# Subnet:
#   environment.tfのsubnet_definitionsを参照
# -----------------------------------------------------------------------------

module "vnet" {
  source = "../../../../modules/vnet"

  resource_group_name = module.common.resource_group_name
  location_name       = local.location

  # Virtual Network
  vnet_name     = local.vnet_name
  address_space = local.address_space

  # Subnet 01
  # Private Endpoint配置用
  subnet_01_name           = local.subnet_01_name
  subnet_01_address_prefix = local.subnet_01_address_prefix

  # Subnet 02
  # App Service / Azure Functions VNet統合用
  subnet_02_name           = local.subnet_02_name
  subnet_02_address_prefix = local.subnet_02_address_prefix

  # Subnet 03
  # 汎用リソース用
  subnet_03_name           = local.subnet_03_name
  subnet_03_address_prefix = local.subnet_03_address_prefix

  tags = local.tags

  depends_on = [
    module.common
  ]
}


# =============================================================================
# 5. Container Registry
# =============================================================================

# -----------------------------------------------------------------------------
# Azure Container Registry
# -----------------------------------------------------------------------------
# コンテナイメージを管理するためのAzure Container Registryを構築する。
# Function AppやApp ServiceからManaged Identityでイメージをプルする。
#
# Registry名:
#   crgenashitrial + environment_prefix
#
# SKU:
#   Standard
#
# init_flag対応の段階的デプロイ:
#   【1回目】init_flag=true でterraform apply
#     → public_network_access_enabled: true (パブリックアクセス有効)
#     → network_default_action: Allow
#     → 診断設定: スキップ（Managed Identity伝播待ち）
#
#   【2回目】init_flag=false でterraform apply
#     → public_network_access_enabled: false (Private Endpoint経由のみ)
#     → network_default_action: Deny
#     → 診断設定: 有効化
# -----------------------------------------------------------------------------

module "container_registry" {
  source = "../../../../modules/container_registry"

  container_registry_name = local.container_registry_name
  resource_group_name     = module.common.resource_group_name
  location                = local.rg_location

  # SKU設定
  sku           = "Premium"
  admin_enabled = false

  # init_flag対応の段階的デプロイ
  # 1回目: init_flag=true  → パブリックアクセス有効
  # 2回目: init_flag=false → 下記設定が適用される
  init_flag = var.init_flag

  # データエンドポイント（マルチリージョン対応時に有効化）
  data_endpoint_enabled = false

  # 匿名プル無効
  anonymous_pull_enabled = false

  # 診断設定
  diagnostic_setting_name    = local.container_registry_diagnostic_setting_name
  log_analytics_workspace_id = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [
    module.common,
    module.log_analytics
  ]
}


# =============================================================================
# 6. Storage Account
# =============================================================================

# -----------------------------------------------------------------------------
# Main Storage Account
# -----------------------------------------------------------------------------
# Function App用データ、Blob Trigger、Storage Queueなどで利用する。
#
# Storage Account名:
#   stgenashitrial + environment_prefix
#
# init_flag対応の段階的デプロイ:
#   【1回目】init_flag=true  → パブリックアクセス有効
#   【2回目】init_flag=false → Private Endpoint経由のみ
# -----------------------------------------------------------------------------

module "storage_account" {
  source = "../../../../modules/storage_account"

  storage_account_name = local.storage_account_name
  resource_group_name  = module.common.resource_group_name
  location             = local.location

  # Storage Account基本設定（account_kind/access_tier/routing_choiceはモジュールdefault値使用）
  account_tier             = local.account_tier
  account_replication_type = local.account_replication_type

  # Phase制御は呼び出し側で実施（init_flagはモジュールに渡すが内部では未使用）
  init_flag                     = var.init_flag
  public_network_access_enabled = true
  network_default_action        = var.init_flag ? "Allow" : "Deny"
  network_subnet_ids            = var.init_flag ? [] : [module.vnet.subnet_02_id]

  # コンテナー・Queue・フォルダプレースホルダー
  containers          = local.storage_containers
  queues              = local.storage_queues
  folder_placeholders = local.storage_folder_placeholders

  # 診断設定
  log_analytics_workspace_id    = module.log_analytics.log_analytics_workspace_id
  blob_diagnostic_setting_name  = local.storage_account_diagnostic_settings.blob
  queue_diagnostic_setting_name = local.storage_account_diagnostic_settings.queue
  enable_blob_diagnostic_setting  = true
  enable_queue_diagnostic_setting = true

  tags = local.tags

  depends_on = [
    module.common,
    module.log_analytics
  ]
}


# =============================================================================
# Event Grid
# =============================================================================

# 【要確認：運用手順に依存。Phase3適用時はStorage Accountのネットワーク設定を
# 一時的にAllowに戻す必要がある】
module "event_grid" {
  source = "../../../../modules/event_grid"

  resource_group_name = module.common.resource_group_name
  location            = local.location

  system_topic_name       = local.event_grid.system_topic_name
  storage_account_id      = module.storage_account.storage_account_id
  diagnostic_setting_name = local.event_grid.diagnostic_setting_name
  included_event_types    = local.event_grid.included_event_types
  log_analytics_workspace_id = module.log_analytics.log_analytics_workspace_id

  enable_pdf_subscription        = !var.init_flag
  pdf_subscription_name          = local.event_grid.subscriptions.convert_to_pdf.name
  pdf_function_id                = module.azure_function_pdf.azure_function_id
  pdf_function_name              = local.event_grid.subscriptions.convert_to_pdf.function_name
  pdf_container_path             = local.event_grid.subscriptions.convert_to_pdf.target_container_path
  pdf_subject_ends_with          = local.event_grid.subscriptions.convert_to_pdf.subject_ends_with

  enable_markdown_subscription    = !var.init_flag
  markdown_subscription_name      = local.event_grid.subscriptions.markdown.name
  markdown_function_id            = module.azure_function_markdown_001.azure_function_id
  markdown_function_name          = local.event_grid.subscriptions.markdown.function_name
  markdown_container_path         = local.event_grid.subscriptions.markdown.target_container_path
  markdown_subject_ends_with      = local.event_grid.subscriptions.markdown.subject_ends_with

  enable_pagesplitter_subscription = !var.init_flag
  pagesplitter_subscription_name   = local.event_grid.subscriptions.pagesplitter.name
  pagesplitter_function_id         = module.azure_function_pagesplitter_001.azure_function_id
  pagesplitter_function_name       = local.event_grid.subscriptions.pagesplitter.function_name
  pagesplitter_container_path      = local.event_grid.subscriptions.pagesplitter.target_container_path
  pagesplitter_subject_ends_with   = local.event_grid.subscriptions.pagesplitter.subject_ends_with

  tags = local.tags

  depends_on = [
    module.storage_account,
    module.log_analytics,
    module.azure_function_pdf,
    module.azure_function_markdown_001,
    module.azure_function_pagesplitter_001
  ]
}


# =============================================================================
# 7. Cosmos DB
# =============================================================================

module "cosmos_db" {
  source = "../../../../modules/cosmos_db"

  cosmosdb_account_name = local.cosmosdb.account_name
  location              = local.rg_location
  resource_group_name   = module.common.resource_group_name

  public_network_access_enabled   = local.cosmosdb.public_network_access_enabled
  network_acl_bypass              = local.cosmosdb.network_acl_bypass
  disable_local_auth              = local.cosmosdb.disable_local_auth
  enable_automatic_failover       = local.cosmosdb.enable_automatic_failover
  enable_multiple_write_locations = local.cosmosdb.enable_multiple_write_locations
  total_throughput_limit          = local.cosmosdb.total_throughput_limit
  enable_free_tier                = local.cosmosdb.enable_free_tier
  analytical_storage_enabled      = local.cosmosdb.analytical_storage_enabled

  consistency_level                   = local.cosmosdb.consistency_policy.consistency_level
  consistency_max_interval_in_seconds = local.cosmosdb.consistency_policy.max_interval_in_seconds
  consistency_max_staleness_prefix    = local.cosmosdb.consistency_policy.max_staleness_prefix

  backup_type               = local.cosmosdb.backup_policy.type
  backup_interval_in_minutes = local.cosmosdb.backup_policy.interval_in_minutes
  backup_retention_in_hours  = local.cosmosdb.backup_policy.retention_in_hours
  backup_storage_redundancy  = local.cosmosdb.backup_policy.storage_redundancy

  failover_locations = local.cosmosdb.failover_locations

  databases = local.cosmosdb.databases

  diagnostic_setting_name    = local.cosmosdb.diagnostic_setting_name
  log_analytics_workspace_id = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [
    module.common,
    module.log_analytics
  ]
}


# =============================================================================
# 8. Key Vault
# =============================================================================

# -----------------------------------------------------------------------------
# Key Vault
# -----------------------------------------------------------------------------
# 機密情報を保管するKey Vaultを構築する。
#
# Key Vault名:
#   kv-genashi-trial-{environment_prefix}
# -----------------------------------------------------------------------------

module "key_vault" {
  source = "../../../../modules/key_vault"

  key_vault_name      = local.key_vault.name
  resource_group_name = module.common.resource_group_name
  location            = local.rg_location
  tenant_id           = local.key_vault.tenant_id

  sku_name                        = local.key_vault.sku_name
  public_network_access_enabled   = local.key_vault.public_network_access_enabled
  rbac_authorization_enabled      = local.key_vault.rbac_authorization_enabled
  enabled_for_deployment          = local.key_vault.enabled_for_deployment
  enabled_for_disk_encryption     = local.key_vault.enabled_for_disk_encryption
  enabled_for_template_deployment = local.key_vault.enabled_for_template_deployment
  soft_delete_retention_days      = local.key_vault.soft_delete_retention_days
  purge_protection_enabled        = local.key_vault.purge_protection_enabled

  init_flag                               = var.init_flag
  network_acls_virtual_network_subnet_ids = [module.vnet.subnet_02_id]

  # RBAC方式のため空
  access_policies = []

  # Key Vault本体作成時点ではSecretを作成しない
  secrets = {}

  enable_diagnostic_setting  = true
  diagnostic_setting_name    = local.key_vault.diagnostic_setting_name
  log_analytics_workspace_id = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [
    module.vnet,
    module.log_analytics
  ]
}

# TerraformのSP自身にシークレット操作権限を付与（Phase 3でのシークレット作成に必要）
resource "azurerm_role_assignment" "terraform_sp_kv_secrets_officer" {
  scope                = module.key_vault.key_vault_id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id

  skip_service_principal_aad_check = true
}


# =============================================================================
# 9. App Service
# =============================================================================
# Phase 1:
#   App Service Plan、Frontend、Load Balancer、監視リソースを作成する。
#
# Phase 3:
#   VNet統合とFrontend用RBACを有効化する。

module "app_service" {
  source = "../../../../modules/app_service"

  # 共通設定
  resource_group_name = module.common.resource_group_name
  location            = local.location

  # Frontend App Service
  frontend_app_service_name = local.frontend_app_service_name
  frontend_subnet_id        = module.vnet.subnet_02_id

  # Frontend環境変数
  frontend_app_settings = jsondecode(
    templatefile("${path.module}/env_vars/frontend-app.tpl", {
      environment_prefix       = var.environment_prefix
      security_group_object_id = var.security_group_object_id
      tenant_id                = var.tenant_id
    })
  )

  # Easy Auth
  frontend_auth_client_id     = var.frontend_auth_client_id
  frontend_auth_client_secret = var.frontend_auth_client_secret

  # Frontend IP制限
  frontend_base_ip_restrictions = (
    local.frontend_base_ip_restrictions
  )

  frontend_additional_ip_restrictions = (
    var.frontend_additional_ip_restrictions
  )

  # Load Balancer App Service
  loadbalancer_app_service_name = local.loadbalancer_app_service_name
  loadbalancer_subnet_id        = module.vnet.subnet_02_id

  # Load Balancer環境変数
  loadbalancer_app_settings = jsondecode(
    templatefile("${path.module}/env_vars/loadbalancer-app.tpl", {
      environment_prefix = var.environment_prefix
    })
  )

  # App Service Plan 01
  app_service_plan_name = local.app_service_plan_01_name
  app_service_sku_name  = local.app_service_plan_01_sku_name

  # App Service Plan 02
  function_app_service_plan_name = local.app_service_plan_02_name
  function_app_sku_name          = local.app_service_plan_02_sku_name
  function_app_service_plan_maximum_elastic_worker_count = (
    local.app_service_plan_02_maximum_elastic_worker_count
  )

  # Phase 3で作成するFrontend RBAC
  frontend_key_vault_id = var.init_flag ? null : module.key_vault.key_vault_id
  frontend_cosmos_db_id = var.init_flag ? null : module.cosmos_db.cosmosdb_account_id
  create_key_vault_role_assignment = !var.init_flag
  create_cosmos_db_role_assignment = !var.init_flag

  # Application Insights
  frontend_application_insights_name = (
    local.app_service_application_insights.frontend
  )

  loadbalancer_application_insights_name = (
    local.app_service_application_insights.loadbalancer
  )

  # 診断設定
  log_analytics_workspace_id = (
    module.log_analytics.log_analytics_workspace_id
  )

  # Phase制御
  init_flag = var.init_flag

  tags = local.tags
}

# -----------------------------------------------------------------------------
# Key Vault / Function App Host Key / URL を Key Vault Secret として登録（Phase 3のみ）
# -----------------------------------------------------------------------------

data "azurerm_linux_function_app" "function_chat" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.chat.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_chat]
}

data "azurerm_linux_function_app" "function_rag" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.rag.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_rag]
}

data "azurerm_linux_function_app" "function_register" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.register.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_register]
}

data "azurerm_linux_function_app" "function_pii" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.pii.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_pii]
}

data "azurerm_linux_function_app" "function_prompt" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.prompt.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_prompt]
}

data "azurerm_linux_function_app" "function_mfg" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.mfg.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_mfg]
}

data "azurerm_linux_function_app" "function_agent_rag" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.agent_rag.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_agent_rag]
}

data "azurerm_linux_function_app" "function_agent_document" {
  count = var.init_flag ? 0 : 1

  name                = local.function_app.agent_document.name
  resource_group_name = module.common.resource_group_name

  depends_on = [module.azure_function_agent_document]
}

data "azurerm_function_app_host_keys" "function_chat" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_chat[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_chat]
}

data "azurerm_function_app_host_keys" "function_rag" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_rag[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_rag]
}

data "azurerm_function_app_host_keys" "function_register" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_register[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_register]
}

data "azurerm_function_app_host_keys" "function_pii" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_pii[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_pii]
}

data "azurerm_function_app_host_keys" "function_mfg" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_mfg[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_mfg]
}

data "azurerm_function_app_host_keys" "function_agent_rag" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_agent_rag[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_agent_rag]
}

data "azurerm_function_app_host_keys" "function_agent_document" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_agent_document[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_agent_document]
}

data "azurerm_function_app_host_keys" "function_prompt" {
  count = var.init_flag ? 0 : 1

  name                = data.azurerm_linux_function_app.function_prompt[0].name
  resource_group_name = module.common.resource_group_name

  depends_on = [data.azurerm_linux_function_app.function_prompt]
}

resource "azurerm_key_vault_secret" "function_secrets" {
  for_each = var.init_flag ? {} : {
    orchestrator_agent_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_agent_api_credential
      value = data.azurerm_function_app_host_keys.function_agent_rag[0].default_function_key
    }
    orchestrator_api_url = {
      name  = local.key_vault_secret_names.orchestrator_api_url
      value = "https://${data.azurerm_linux_function_app.function_chat[0].default_hostname}/api/chat?code=${data.azurerm_function_app_host_keys.function_chat[0].default_function_key}"
    }
    orchestrator_document_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_document_api_credential
      value = data.azurerm_function_app_host_keys.function_register[0].default_function_key
    }
    orchestrator_file_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_file_api_credential
      value = data.azurerm_function_app_host_keys.function_chat[0].default_function_key
    }
    orchestrator_it_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_it_api_credential
      value = data.azurerm_function_app_host_keys.function_mfg[0].default_function_key
    }
    orchestrator_mfg_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_mfg_api_credential
      value = data.azurerm_function_app_host_keys.function_mfg[0].default_function_key
    }
    orchestrator_pii_api_url = {
      name  = local.key_vault_secret_names.orchestrator_pii_api_url
      value = "https://${data.azurerm_linux_function_app.function_pii[0].default_hostname}/api/pii?code=${data.azurerm_function_app_host_keys.function_pii[0].default_function_key}"
    }
    orchestrator_rag_api_url = {
      name  = local.key_vault_secret_names.orchestrator_rag_api_url
      value = "https://${data.azurerm_linux_function_app.function_rag[0].default_hostname}/api/rag-chat?code=${data.azurerm_function_app_host_keys.function_rag[0].default_function_key}"
    }
    orchestrator_standard_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_standard_api_credential
      value = data.azurerm_function_app_host_keys.function_agent_document[0].default_function_key
    }
    orchestrator_use_case_api_credential = {
      name  = local.key_vault_secret_names.orchestrator_use_case_api_credential
      value = data.azurerm_function_app_host_keys.function_prompt[0].default_function_key
    }
  }

  name         = each.value.name
  value        = each.value.value
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault]
}


# =============================================================================
# 10. Private DNS Zone
# =============================================================================

module "private_dns_zone_keyvault" {
  source = "../../../../modules/private_dns_zone"

  dns_zone_name       = local.private_dns_zones.key_vault
  resource_group_name = module.common.resource_group_name
  virtual_network_ids = [module.vnet.vnet_id]
  init_flag           = var.init_flag

  tags = local.tags

  depends_on = [module.vnet]
}

module "private_dns_zone" {
  for_each = {
    blob               = local.private_dns_zones.blob
    queue              = local.private_dns_zones.queue
    container_registry = local.private_dns_zones.container_registry
    cosmos_db          = local.private_dns_zones.cosmos_db
    app_service        = local.private_dns_zones.app_service
  }

  source = "../../../../modules/private_dns_zone"

  dns_zone_name       = each.value
  resource_group_name = module.common.resource_group_name
  virtual_network_ids = [module.vnet.vnet_id]
  init_flag           = var.init_flag

  tags = local.tags

  depends_on = [module.vnet]
}

# =============================================================================
# 11. Private Endpoint
# =============================================================================

module "private_endpoint_storage_blob" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_storage_blob_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "blob"
  target_resource_id = module.storage_account.id
  subresource_names  = ["blob"]

  dns_zone_group_name  = "blob"
  private_dns_zone_ids = [module.private_dns_zone["blob"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.storage_account, module.private_dns_zone["blob"]]
}

module "private_endpoint_storage_queue" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_storage_queue_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "queue"
  target_resource_id = module.storage_account.id
  subresource_names  = ["queue"]

  dns_zone_group_name  = "queue"
  private_dns_zone_ids = [module.private_dns_zone["queue"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.storage_account, module.private_dns_zone["queue"]]
}

module "private_endpoint_container_registry" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_container_registry_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "registry"
  target_resource_id = module.container_registry.id
  subresource_names  = ["registry"]

  dns_zone_group_name  = "registry"
  private_dns_zone_ids = [module.private_dns_zone["container_registry"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.container_registry, module.private_dns_zone["container_registry"]]
}

module "private_endpoint_cosmos_db" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_cosmos_db_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "Sql"
  target_resource_id = module.cosmos_db.id
  subresource_names  = ["Sql"]

  dns_zone_group_name  = "cosmosdb"
  private_dns_zone_ids = [module.private_dns_zone["cosmos_db"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.cosmos_db, module.private_dns_zone["cosmos_db"]]
}

module "private_endpoint_key_vault" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.private_endpoint.key_vault
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "vault"
  target_resource_id = module.key_vault.key_vault_id
  subresource_names  = ["vault"]

  enable_private_dns_zone_group = true
  dns_zone_group_name           = "keyvault-dns-zone-group"
  private_dns_zone_ids          = [module.private_dns_zone_keyvault.private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.key_vault, module.private_dns_zone_keyvault]
}

module "private_endpoint_loadbalancer" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_load_balancer_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.app_service.loadbalancer_app_service_id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.app_service, module.private_dns_zone["app_service"]]
}

# Function App用 Private Endpoint（9個+indexer）
module "private_endpoint_function_chat" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_chat_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_chat.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_chat, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_rag" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_rag_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_rag.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_rag, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_register" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_register_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_register.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_register, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_pii" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_pii_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_pii.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_pii, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_prompt" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_prompt_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_prompt.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_prompt, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_pdf" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_pdf_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_pdf.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_pdf, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_mfg" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_mfg_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_mfg.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_mfg, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_agent_rag" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_agent_rag_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_agent_rag.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_agent_rag, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_agent_document" {
  source = "../../../../modules/private_endpoint"

  private_endpoint_name = local.pe_function_app_agent_document_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_agent_document.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_agent_document, module.private_dns_zone["app_service"]]
}

module "private_endpoint_function_indexer" {
  source = "../../../../modules/private_endpoint"

  # 【要確認】設計書にIndexer Private Endpointの記載なし。
  # 正解ファイル側には存在が確認できているため実装するが、
  # 命名規則(pep-func-genashi-trial-hs-14-indexer)は要件定義書での再確認を推奨。
  private_endpoint_name = local.pe_function_app_indexer_name
  location              = local.location
  resource_group_name   = module.common.resource_group_name
  subnet_id             = module.vnet.subnet_01_id

  connection_name    = "sites"
  target_resource_id = module.azure_function_indexer.id
  subresource_names  = ["sites"]

  dns_zone_group_name  = "sites"
  private_dns_zone_ids = [module.private_dns_zone["app_service"].private_dns_zone_id]

  tags = local.tags

  depends_on = [module.vnet, module.azure_function_indexer, module.private_dns_zone["app_service"]]
}

# 【要確認】Loadbalancer Private Endpointについて、設計文書に記載が見つからないため実装保留
# 設計文書の確認が必要

# =============================================================================
# 11. Azure Functions
# =============================================================================

# --- Plan 01 グループ (chat, rag, register, pii, prompt, mfg, agent_rag, agent_document, indexer) ---

module "azure_function_chat" {
  source = "../../../../modules/azure_function"

  function_app_name           = local.function_app.chat.name
  resource_group_name         = module.common.resource_group_name
  location                    = local.location
  service_plan_id             = module.app_service.service_plan_01_id

  python_version              = local.function_app.chat.python_version
  use_container_image         = local.function_app.chat.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name        = local.storage_account_name
  storage_account_id          = module.storage_account.id
  use_storageaccount_queue    = local.function_app.chat.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.chat.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment  = local.function_app.chat.create_acr_role_assignment
  container_registry_id       = null
  docker_registry_url         = null
  docker_image_name           = null

  virtual_network_subnet_id   = module.vnet.subnet_02_id
  init_flag                   = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/01-chat.tpl", {
    environment_prefix = var.environment_prefix
    loadbalancer_url   = module.app_service.loadbalancer_hostname
  }))

  application_insights_name   = local.function_application_insights.chat
  diagnostic_setting_name     = local.function_diagnostic_settings.chat
  log_analytics_workspace_id  = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_rag" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.rag.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.rag.python_version
  use_container_image          = local.function_app.rag.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.rag.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.rag.create_cosmos_db_role_assignment
  cosmos_db_account_id             = module.cosmos_db.id

  create_acr_role_assignment   = local.function_app.rag.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/02-rag.tpl", {
    environment_prefix = var.environment_prefix
    loadbalancer_url   = module.app_service.loadbalancer_hostname
  }))

  application_insights_name    = local.function_application_insights.rag
  diagnostic_setting_name      = local.function_diagnostic_settings.rag
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics, module.cosmos_db]
}

module "azure_function_register" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.register.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.register.python_version
  use_container_image          = local.function_app.register.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.register.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.register.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.register.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/03-text-register.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.register
  diagnostic_setting_name      = local.function_diagnostic_settings.register
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_pii" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.pii.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.pii.python_version
  use_container_image          = local.function_app.pii.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.pii.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.pii.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.pii.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/04-pii.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.pii
  diagnostic_setting_name      = local.function_diagnostic_settings.pii
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_prompt" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.prompt.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.prompt.python_version
  use_container_image          = local.function_app.prompt.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.prompt.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.prompt.create_cosmos_db_role_assignment
  cosmos_db_account_id             = module.cosmos_db.id

  create_acr_role_assignment   = local.function_app.prompt.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/05-prompt.tpl", {
    environment_prefix = var.environment_prefix
    loadbalancer_url   = module.app_service.loadbalancer_hostname
  }))

  application_insights_name    = local.function_application_insights.prompt
  diagnostic_setting_name      = local.function_diagnostic_settings.prompt
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics, module.cosmos_db]
}

module "azure_function_pagesplitter_001" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.pagesplitter_001.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_02_id

  python_version               = local.function_app.pagesplitter_001.python_version
  use_container_image          = local.function_app.pagesplitter_001.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.pagesplitter_001.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.pagesplitter_001.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.pagesplitter_001.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/06-pagesplitter.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.pagesplitter_001
  diagnostic_setting_name      = local.function_diagnostic_settings.pagesplitter_001
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_markdown_001" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.markdown_001.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_02_id

  python_version               = local.function_app.markdown_001.python_version
  use_container_image          = local.function_app.markdown_001.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.markdown_001.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.markdown_001.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.markdown_001.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/07-markdown.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.markdown_001
  diagnostic_setting_name      = local.function_diagnostic_settings.markdown_001
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_pdf" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.pdf.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_02_id

  python_version               = local.function_app.pdf.python_version
  use_container_image          = local.function_app.pdf.use_container_image
  enable_detailed_vnet_routing = true

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.pdf.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.pdf.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.pdf.create_acr_role_assignment
  container_registry_id        = module.container_registry.id
  # Phase 2-4 でビルド・プッシュされるイメージ名・URL
  docker_registry_url          = "https://${local.container_registry_name}.azurecr.io"
  docker_image_name            = "convert-to-pdf"
  docker_image_tag             = "v1"

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/08-pdf.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.pdf
  diagnostic_setting_name      = local.function_diagnostic_settings.pdf
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics, module.container_registry]
}

module "azure_function_mfg" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.mfg.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.mfg.python_version
  use_container_image          = local.function_app.mfg.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.mfg.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.mfg.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.mfg.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/09-mfg.tpl", {
    environment_prefix = var.environment_prefix
    loadbalancer_url   = module.app_service.loadbalancer_hostname
    subscription_id    = var.subscription_id
  }))

  application_insights_name    = local.function_application_insights.mfg
  diagnostic_setting_name      = local.function_diagnostic_settings.mfg
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_agent_rag" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.agent_rag.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.agent_rag.python_version
  use_container_image          = local.function_app.agent_rag.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.agent_rag.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.agent_rag.create_cosmos_db_role_assignment
  cosmos_db_account_id             = module.cosmos_db.id

  create_acr_role_assignment   = local.function_app.agent_rag.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/10-agent-rag.tpl", {
    environment_prefix = var.environment_prefix
    loadbalancer_url   = module.app_service.loadbalancer_hostname
  }))

  application_insights_name    = local.function_application_insights.agent_rag
  diagnostic_setting_name      = local.function_diagnostic_settings.agent_rag
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics, module.cosmos_db]
}

module "azure_function_agent_document" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.agent_document.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.agent_document.python_version
  use_container_image          = local.function_app.agent_document.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.agent_document.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.agent_document.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.agent_document.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/11-agent-document.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.agent_document
  diagnostic_setting_name      = local.function_diagnostic_settings.agent_document
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_pagesplitter_002" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.pagesplitter_002.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_02_id

  python_version               = local.function_app.pagesplitter_002.python_version
  use_container_image          = local.function_app.pagesplitter_002.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.pagesplitter_002.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.pagesplitter_002.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.pagesplitter_002.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/12-page-std.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.pagesplitter_002
  diagnostic_setting_name      = local.function_diagnostic_settings.pagesplitter_002
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_markdown_002" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.markdown_002.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_02_id

  python_version               = local.function_app.markdown_002.python_version
  use_container_image          = local.function_app.markdown_002.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.markdown_002.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.markdown_002.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.markdown_002.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/13-mark-std.tpl", {
    environment_prefix = var.environment_prefix
  }))

  application_insights_name    = local.function_application_insights.markdown_002
  diagnostic_setting_name      = local.function_diagnostic_settings.markdown_002
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}

module "azure_function_indexer" {
  source = "../../../../modules/azure_function"

  function_app_name            = local.function_app.indexer.name
  resource_group_name          = module.common.resource_group_name
  location                     = local.location
  service_plan_id              = module.app_service.service_plan_01_id

  python_version               = local.function_app.indexer.python_version
  use_container_image          = local.function_app.indexer.use_container_image
  enable_detailed_vnet_routing = false

  storage_account_name         = local.storage_account_name
  storage_account_id           = module.storage_account.id
  use_storageaccount_queue     = local.function_app.indexer.use_storageaccount_queue

  create_cosmos_db_role_assignment = local.function_app.indexer.create_cosmos_db_role_assignment
  cosmos_db_account_id             = null

  create_acr_role_assignment   = local.function_app.indexer.create_acr_role_assignment
  container_registry_id        = null
  docker_registry_url          = null
  docker_image_name            = null

  virtual_network_subnet_id    = module.vnet.subnet_02_id
  init_flag                    = var.init_flag

  app_settings = jsondecode(templatefile("${path.module}/env_vars/14-indexer.tpl", {}))

  application_insights_name    = local.function_application_insights.indexer
  diagnostic_setting_name      = local.function_diagnostic_settings.indexer
  log_analytics_workspace_id   = module.log_analytics.log_analytics_workspace_id

  tags = local.tags

  depends_on = [module.app_service, module.storage_account, module.log_analytics]
}
