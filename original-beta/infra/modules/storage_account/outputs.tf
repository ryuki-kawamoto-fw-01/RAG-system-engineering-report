# =============================================================================
# Storage Account Module - Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Storage Account 基本情報
# -----------------------------------------------------------------------------

output "storage_account_id" {
  description = "Storage AccountのリソースID"
  value       = azurerm_storage_account.main.id
}

output "storage_account_name" {
  description = "Storage Account名"
  value       = azurerm_storage_account.main.name
}

output "storage_account_primary_location" {
  description = "Storage Accountのプライマリロケーション"
  value       = azurerm_storage_account.main.location
}

output "storage_account_primary_blob_endpoint" {
  description = "Storage AccountのプライマリBlob Endpoint"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "storage_account_primary_queue_endpoint" {
  description = "Storage AccountのプライマリQueue Endpoint"
  value       = azurerm_storage_account.main.primary_queue_endpoint
}

# -----------------------------------------------------------------------------
# Managed Identity
# -----------------------------------------------------------------------------

output "storage_account_principal_id" {
  description = "Storage AccountのManaged Identity Principal ID"
  value       = azurerm_storage_account.main.identity[0].principal_id
}

output "storage_account_tenant_id" {
  description = "Storage AccountのManaged Identity Tenant ID"
  value       = azurerm_storage_account.main.identity[0].tenant_id
}

# -----------------------------------------------------------------------------
# 互換性のための短縮名出力
# -----------------------------------------------------------------------------

output "id" {
  description = "Storage AccountのリソースID（互換性のため）"
  value       = azurerm_storage_account.main.id
}

output "name" {
  description = "Storage Account名（互換性のため）"
  value       = azurerm_storage_account.main.name
}

output "primary_blob_endpoint" {
  description = "Storage AccountのプライマリBlob Endpoint（互換性のため）"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "primary_queue_endpoint" {
  description = "Storage AccountのプライマリQueue Endpoint（互換性のため）"
  value       = azurerm_storage_account.main.primary_queue_endpoint
}

output "principal_id" {
  description = "Storage AccountのManaged Identity Principal ID（互換性のため）"
  value       = azurerm_storage_account.main.identity[0].principal_id
}

# -----------------------------------------------------------------------------
# コンテナー情報
# -----------------------------------------------------------------------------

output "container_ids" {
  description = "作成されたBlobコンテナーのIDマップ"
  value = {
    for k, v in azurerm_storage_container.containers : k => v.id
  }
}

output "container_names" {
  description = "作成されたBlobコンテナーの名前リスト"
  value       = [for v in azurerm_storage_container.containers : v.name]
}

# -----------------------------------------------------------------------------
# Queue 情報
# -----------------------------------------------------------------------------

output "queue_ids" {
  description = "作成されたStorage QueueのIDマップ"
  value = {
    for k, v in azurerm_storage_queue.queues : k => v.id
  }
}

output "queue_names" {
  description = "作成されたStorage Queueの名前リスト"
  value       = [for v in azurerm_storage_queue.queues : v.name]
}
