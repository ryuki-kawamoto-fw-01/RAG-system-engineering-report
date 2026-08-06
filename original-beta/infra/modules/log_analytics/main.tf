resource "azurerm_log_analytics_workspace" "log_analytics" {
  name                = var.log_name
  location            = var.location_name
  resource_group_name = var.resource_group_name
  tags                = var.tags
}
