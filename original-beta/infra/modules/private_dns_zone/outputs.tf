output "private_dns_zone_id" {
  description = "プライベートDNSゾーンのID"
  value       = azurerm_private_dns_zone.dns_zone.id
}

output "private_dns_zone_name" {
  description = "プライベートDNSゾーン名"
  value       = azurerm_private_dns_zone.dns_zone.name
}

output "virtual_network_link_ids" {
  description = "仮想ネットワークリンクのIDマップ"
  value       = { for link in azurerm_private_dns_zone_virtual_network_link.vnet_link : link.name => link.id }
}