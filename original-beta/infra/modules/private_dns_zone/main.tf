# =============================================================================
# Private DNS Zone Module - Main Resources
# =============================================================================

# -----------------------------------------------------------------------------
# Private DNS Zone
# -----------------------------------------------------------------------------
# Private Endpoint用の名前解決領域を作成する。
#
# Private DNS Zone本体はinit_flagの値に関係なく作成する。
#
# Phase 1（init_flag=true）:
#   - Private DNS Zone本体を作成する
#   - VNet Linkはまだ作成しない
#
# Phase 3（init_flag=false）:
#   - Private DNS Zone本体は維持する
#   - 指定されたVNetとのLinkを作成する
resource "azurerm_private_dns_zone" "dns_zone" {
  name                = var.dns_zone_name
  resource_group_name = var.resource_group_name

  tags = var.tags

  lifecycle {
    # Terraform外でタグが変更されても差分として検出しない
    ignore_changes = [
      tags,
    ]
  }
}

# -----------------------------------------------------------------------------
# Private DNS Zone Virtual Network Link
# -----------------------------------------------------------------------------
# Private DNS ZoneをVNetへ関連付け、
# VNet内のApp ServiceやFunction Appなどから
# Private Endpointの名前解決を可能にする。
#
# Phase 1（init_flag=true）:
#   count=0となるため、VNet Linkは作成しない。
#
# Phase 3（init_flag=false）:
#   virtual_network_idsに指定されたVNet数だけVNet Linkを作成する。
#
# 注意:
#   Phase 3完了後にinit_flag=trueで再度Applyすると、
#   count=0となり、既存VNet Linkが削除対象になる。
resource "azurerm_private_dns_zone_virtual_network_link" "vnet_link" {
  count = var.init_flag ? 0 : length(var.virtual_network_ids)

  # 複数VNetを指定した場合でも一意になるよう、添字をLink名へ付与する
  name = "${var.dns_zone_name}-vnet-link-${count.index}"

  # Phase 1で作成済みのPrivate DNS Zoneへ接続する
  private_dns_zone_name = azurerm_private_dns_zone.dns_zone.name
  resource_group_name   = var.resource_group_name

  # virtual_network_idsに指定された各VNetへLinkを作成する
  virtual_network_id = var.virtual_network_ids[count.index]

  # Private Endpoint用Zoneでは通常falseを指定する
  registration_enabled = var.auto_registration_enabled

  tags = var.tags
}