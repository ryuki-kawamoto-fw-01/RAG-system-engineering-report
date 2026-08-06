/**
 * VNet Module
 * VNetと3つの固定サブネットを作成し、閉域ネットワークを構築する
 *
 * tenant/sst-harc/trial/core側の呼び出しで実際に使用している項目のみに
 * 対応したシンプルな構成（NSG・動的サブネットmap・DNSサーバー指定は未使用のため除外）。
 */

#  Vnetを作成するための箱
resource "azurerm_virtual_network" "genashi" {
  name                = var.vnet_name
  location            = var.location_name
  resource_group_name = var.resource_group_name
  address_space       = var.address_space
  tags                = var.tags
}

# Subnet 01:Private Endpoint用のNW
resource "azurerm_subnet" "subnet_01" {
  name                 = var.subnet_01_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.genashi.name
  address_prefixes     = [var.subnet_01_address_prefix]
}

# Subnet 02:App ServiceとAzure Functions のVNet統合のためのNW
resource "azurerm_subnet" "subnet_02" {
  name                 = var.subnet_02_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.genashi.name
  address_prefixes     = [var.subnet_02_address_prefix]
  service_endpoints    = ["Microsoft.Storage", "Microsoft.KeyVault"]

  # Azure Function App が VNet Integration を利用するための委任設定
  # Subnet 02はApp ServiceとAzure Functions のVNet統合のためのNW
  delegation {
    name = "function-app-delegation"

    service_delegation {
      name = "Microsoft.Web/serverFarms"

      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action"
      ]
    }
  }
}

# Subnet 03: 汎用リソース用
resource "azurerm_subnet" "subnet_03" {
  name                 = var.subnet_03_name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.genashi.name
  address_prefixes     = [var.subnet_03_address_prefix]
}
