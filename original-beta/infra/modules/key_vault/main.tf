# =============================================================================
# Key Vault Module - Main
# =============================================================================

resource "azurerm_key_vault" "main" {
  name                = var.key_vault_name
  resource_group_name = var.resource_group_name
  location            = var.location
  tenant_id           = var.tenant_id

  sku_name = var.sku_name

  public_network_access_enabled = var.public_network_access_enabled

  # RBACベースのアクセス制御
  rbac_authorization_enabled = var.rbac_authorization_enabled

  # オプション設定
  enabled_for_deployment          = var.enabled_for_deployment
  enabled_for_disk_encryption     = var.enabled_for_disk_encryption
  enabled_for_template_deployment = var.enabled_for_template_deployment

  # ソフト削除 / パージ保護
  soft_delete_retention_days = var.soft_delete_retention_days
  purge_protection_enabled   = var.purge_protection_enabled

  # init_flagで段階的にネットワーク制御
  network_acls {
    default_action             = "Allow"
    bypass                     = var.init_flag ? var.network_acls_bypass : "None"
    ip_rules                   = var.network_acls_ip_rules
    virtual_network_subnet_ids = var.init_flag ? [] : var.network_acls_virtual_network_subnet_ids
  }

  tags = var.tags
}

resource "azurerm_monitor_diagnostic_setting" "main" {
  count = var.enable_diagnostic_setting ? 1 : 0

  name                       = var.diagnostic_setting_name
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_key_vault_access_policy" "main" {
  count = var.rbac_authorization_enabled ? 0 : length(var.access_policies)

  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = var.access_policies[count.index].tenant_id
  object_id    = var.access_policies[count.index].object_id

  key_permissions         = var.access_policies[count.index].key_permissions
  secret_permissions      = var.access_policies[count.index].secret_permissions
  certificate_permissions = var.access_policies[count.index].certificate_permissions
}

resource "azurerm_key_vault_secret" "main" {
  for_each = var.secrets

  name         = each.key
  value        = each.value.value
  content_type = each.value.content_type
  key_vault_id = azurerm_key_vault.main.id
  tags         = each.value.tags
}
