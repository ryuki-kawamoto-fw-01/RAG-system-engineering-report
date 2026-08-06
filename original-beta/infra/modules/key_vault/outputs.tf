# =============================================================================
# Key Vault Module - Outputs
# =============================================================================

output "key_vault_id" {
  description = "Key VaultのリソースID"
  value       = azurerm_key_vault.main.id
}

output "key_vault_name" {
  description = "Key Vault名"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# 互換性のための短縮出力
output "id" {
  description = "Key VaultのリソースID（互換性のため）"
  value       = azurerm_key_vault.main.id
}

output "name" {
  description = "Key Vault名（互換性のため）"
  value       = azurerm_key_vault.main.name
}

output "vault_uri" {
  description = "Key Vault URI（互換性のため）"
  value       = azurerm_key_vault.main.vault_uri
}
