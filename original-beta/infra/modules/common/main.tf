/**
 * Common Module
 * リソースグループを作成する
 */

resource "azurerm_resource_group" "geanashi" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}
