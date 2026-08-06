# =============================================================================
# Container Registry Module - Outputs
# =============================================================================

output "container_registry_id" {
  description = "Azure Container RegistryのリソースID"
  value       = azurerm_container_registry.acr.id
}

output "container_registry_name" {
  description = "Azure Container Registry名"
  value       = azurerm_container_registry.acr.name
}

output "container_registry_login_server" {
  description = "Azure Container RegistryのLogin Server"
  value       = azurerm_container_registry.acr.login_server
}

output "id" {
  description = "Azure Container RegistryのリソースID"
  value       = azurerm_container_registry.acr.id
}

output "name" {
  description = "Azure Container Registry名"
  value       = azurerm_container_registry.acr.name
}

output "login_server" {
  description = "Azure Container RegistryのLogin Server"
  value       = azurerm_container_registry.acr.login_server
}