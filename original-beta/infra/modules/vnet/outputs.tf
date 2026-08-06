/**
 * VNet Module Outputs
 * 他のモジュールから参照可能な値を公開
 */

output "vnet_id" {
  description = "作成されたVirtual NetworkのID"
  value       = azurerm_virtual_network.genashi.id
}

output "vnet_name" {
  description = "作成されたVirtual Networkの名前"
  value       = azurerm_virtual_network.genashi.name
}

output "vnet_address_space" {
  description = "Virtual Networkのアドレス空間"
  value       = azurerm_virtual_network.genashi.address_space
}

output "subnet_ids" {
  description = "作成されたサブネットのIDマップ（key: サブネット名、value: サブネットID）"
  value = {
    (var.subnet_01_name) = azurerm_subnet.subnet_01.id
    (var.subnet_02_name) = azurerm_subnet.subnet_02.id
    (var.subnet_03_name) = azurerm_subnet.subnet_03.id
  }
}

output "subnet_01_id" {
  description = "Subnet01（Private Endpoint配置用）のID"
  value       = azurerm_subnet.subnet_01.id
}

output "subnet_02_id" {
  description = "Subnet02（App Service / Azure Functions VNet統合用）のID"
  value       = azurerm_subnet.subnet_02.id
}

output "subnet_03_id" {
  description = "Subnet03（汎用リソース用）のID"
  value       = azurerm_subnet.subnet_03.id
}
