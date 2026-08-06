output "private_endpoint_id" {
  description = "プライベートエンドポイントのID"
  value       = azurerm_private_endpoint.genashi.id
}

output "private_endpoint_name" {
  description = "プライベートエンドポイント名"
  value       = azurerm_private_endpoint.genashi.name
}

output "private_endpoint_private_ip_address" {
  description = "プライベートエンドポイントのプライベートIPアドレス"
  value       = azurerm_private_endpoint.genashi.private_service_connection[0].private_ip_address
}

output "network_interface_id" {
  description = "ネットワークインターフェースID"
  value       = azurerm_private_endpoint.genashi.network_interface[0].id
}

output "dns_zone_group_id" {
  description = "プライベートDNSゾーングループのID (Private Endpoint ID)"
  value       = var.enable_private_dns_zone_group && length(var.private_dns_zone_ids) > 0 ? azurerm_private_endpoint.genashi.id : null
}
