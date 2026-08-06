resource "azurerm_container_registry" "acr" {
  name                = var.container_registry_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = var.admin_enabled

  # init_flag対応: 初回はtrue、2回目以降は指定値
  public_network_access_enabled = var.init_flag ? true : var.public_network_access_enabled
  data_endpoint_enabled         = var.data_endpoint_enabled
  anonymous_pull_enabled        = var.anonymous_pull_enabled

  identity {
    type = "SystemAssigned"
  }

  dynamic "network_rule_set" {
    # network_rule_set は Premium SKU のみ指定可能
    for_each = var.sku == "Premium" ? [1] : []
    content {
      default_action = var.init_flag ? "Allow" : var.network_default_action
      ip_rule        = []
    }
  }

  network_rule_bypass_option = "AzureServices"

  tags = var.tags
}

# 診断設定
resource "azurerm_monitor_diagnostic_setting" "acr_diagnostics" {
  name                       = var.diagnostic_setting_name
  target_resource_id         = azurerm_container_registry.acr.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }
  enabled_metric {
    category = "AllMetrics"
  }
}
