# ==========================================
# Main Configuration - sst-harc/test/core
# =============================================================================
# 本ファイルでは、core環境の共通基盤を以下の順番で構築する。
#
#  1. Provider / Data Sources
#  2. Resource Group
#  3. Log Analytics Workspace
#  4. Virtual Network
#
# リソース名・アドレス空間・サブネット定義・タグなどの環境固有値は、
# 原則としてlocalsまたはenvironment.tfで一元管理する。
# =============================================================================


# =============================================================================
# 1. Provider / Data Sources
# =============================================================================

# -----------------------------------------------------------------------------
# Azure Resource Manager Provider
# -----------------------------------------------------------------------------

provider "azurerm" {
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id

  features {
    key_vault {
      # 削除済みKey Vaultを再作成する際の挙動を制御
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }

    resource_group {
      # Resource Group内にリソースが残っている場合の削除を防止
      prevent_deletion_if_contains_resources = true
    }
  }
}


# -----------------------------------------------------------------------------
# Microsoft Entra ID Provider
# -----------------------------------------------------------------------------

provider "azuread" {
  tenant_id = var.tenant_id
}


# -----------------------------------------------------------------------------
# Current Azure Context
# -----------------------------------------------------------------------------

# Terraformを実行しているID、Tenant、Subscription等の情報を取得
data "azurerm_client_config" "current" {}

# 現在のSubscription情報を取得
data "azurerm_subscription" "current" {
  subscription_id = var.subscription_id
}