# =============================================================================
# Local Values - sst-harc/test/core
# =============================================================================
# 繰り返し使用する計算値と命名規則を定義
# =============================================================================
locals {
  # ===========================================================================
  # 環境変数の参照（environment.tfから取得）
  # ===========================================================================

  # 環境情報
  environment  = var.environment
  tenant_name  = var.tenant_name
  project_name = var.project_name

  # ネットワーク設定
  vnet_address_space = var.vnet_address_space
  subnet_definitions = var.subnet_definitions

  # Log Analytics設定
  log_retention_days = var.log_retention_days

  # Storage Account設定
  storage_account_tier        = var.storage_account_tier
  storage_account_replication = var.storage_account_replication

  # Cosmos DB設定
  cosmosdb_consistency_level = var.cosmosdb_consistency_level
  # cosmosdb_max_throughput    = var.cosmosdb_max_throughput  # 旧実装用（現在未使用）

  # Key Vault設定
  key_vault_sku = var.key_vault_sku

  # App Service設定
  app_service_sku_name  = var.app_service_sku_name
  function_app_sku_name = var.function_app_sku_name

  # タグ設定
  common_tags = {
    "機能名称" = "製造現場アシスタントAI"
    "環境"   = "本番"
  }

  # ロケーション
  location = "japanwest"

  #サブスクリプションID
  subscription_id = var.subscription_id

  # ===========================================================================
  # 共通タグ
  # ===========================================================================

  # すべてのリソースに付与するタグ
  tags = {
    "機能名称" = "製造現場アシスタントAI"
    "環境"   = "本番"
  }

  # ---------------------------------------------------------------------------
  # 1️.Resource Group
  # ---------------------------------------------------------------------------

  # Resource Group（すべてのリソースを格納するコンテナ）
  resource_group_name    = "rg-genashi-trial-${var.environment_prefix}"
  rg_location            = "japaneast"
  location_log_analytics = "japanwest"

  # ---------------------------------------------------------------------------
  # 2️.Log Analytics Workspace
  # ---------------------------------------------------------------------------

  # Log Analytics Workspace（全リソースの診断ログを集約）
  log_name = "laws-genashi-trial-${var.environment_prefix}"

  # ---------------------------------------------------------------------------
  # 3️.Network Infrastructure
  # ---------------------------------------------------------------------------

  # Virtual Network（閉域ネットワーク構築）
  vnet_name                = "vnet-genashi-trial-${var.environment_prefix}"
  address_space            = ["10.173.8.0/23", "10.173.36.0/23"]
  subnet_01_name           = "snet-genashi-trial-01"
  subnet_01_address_prefix = "10.173.8.64/26"
  # subnet_01_nsg_name       = "snet-genashi-trial-01-nsg"
  subnet_02_name           = "snet-genashi-trial-02"
  subnet_02_address_prefix = "10.173.8.128/26"
  # subnet_02_nsg_name       = "snet-genashi-trial-02-nsg"
  subnet_03_name           = "snet-genashi-trial-03"
  subnet_03_address_prefix = "10.173.9.0/25"
  # subnet_03_nsg_name       = "snet-genashi-trial-03-nsg"

  # ---------------------------------------------------------------------------
  # 5️.Azure Container Registry
  # ---------------------------------------------------------------------------

  # Azure Container Registry（コンテナイメージ管理）
  container_registry_name = "crgenashitrial${var.environment_prefix}"

  # Container Registry診断設定
  container_registry_diagnostic_setting_name = "diag-crgenashitrial${var.environment_prefix}"

  # Container Registry Private Endpoint
  # Network Layer の private_endpoint.container_registry で管理
  # → pep-crgenashitrial${var.environment_prefix}

  # Container Registry Private Endpoint NIC
  # Network Layer の private_endpoint_network_interface.container_registry で管理
  # → nic-crgenashitrial${var.environment_prefix}

  # Container Registry Private DNS Zone
  # Network Layer の private_dns_zones.container_registry で管理
  # → privatelink.azurecr.io

  # ---------------------------------------------------------------------------
  # 6️.Storage Account
  # ---------------------------------------------------------------------------

  # Storage Account名
  storage_account_name = "stgenashitrial${var.environment_prefix}"

  # Storage Account基本設定
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  access_tier              = "Hot"

  # ルーティング設定
  routing_choice = "MicrosoftRouting"

  # データ保護設定（設計書より7日）
  blob_soft_delete_retention_days       = 7
  container_soft_delete_retention_days  = 7
  file_share_soft_delete_retention_days = 7

  # Blobコンテナー定義（リスト型、全コンテナーprivate）
  storage_containers = [
    { name = "agent-container-01", container_access_type = "private" },
    { name = "agent-container-02", container_access_type = "private" },
    { name = "agent-container-03", container_access_type = "private" },
    { name = "azure-webjobs-hosts", container_access_type = "private" },
    { name = "azure-webjobs-secrets", container_access_type = "private" },
    { name = "create-minutes", container_access_type = "private" },
    { name = "genashi-trial-01", container_access_type = "private" },
    { name = "genashi-trial-02", container_access_type = "private" },
    { name = "genashi-trial-03", container_access_type = "private" },
    { name = "genashi-trial-04", container_access_type = "private" },
    { name = "genashi-trial-05", container_access_type = "private" },
    { name = "genashi-trial-06", container_access_type = "private" },
    { name = "genashi-trial-07", container_access_type = "private" },
    { name = "genashi-trial-08", container_access_type = "private" },
    { name = "input-movie-01", container_access_type = "private" },
    { name = "output-manuals-01", container_access_type = "private" },
    { name = "proposal-generator-container", container_access_type = "private" },
    { name = "image-generation", container_access_type = "private" },
  ]

  # Storage Queue定義（フラットな文字列リスト）
  # Blob Trigger用（ページ分割・Markdown変換・PDF変換・標準文書用）、
  # 動画処理制御用、エラー処理用（poison）を定義
  storage_queues = [
    "azure-webjobs-blobtrigger-func-genashi-trial-06-pagesplit",
    "azure-webjobs-blobtrigger-func-genashi-trial-07-markdown",
    "azure-webjobs-blobtrigger-func-genashi-trial-08-pdf",
    "azure-webjobs-blobtrigger-func-genashi-trial-12-page-std",
    "azure-webjobs-blobtrigger-func-genashi-trial-13-mark-std",
    "funcgenashitrialmovie001-control-00",
    "funcgenashitrialmovie001-control-01",
    "funcgenashitrialmovie001-control-02",
    "funcgenashitrialmovie001-control-03",
    "funcgenashitrialmovie001-workitems",
    "webjobs-blobtrigger-poison",
  ]

  # フォルダプレースホルダー定義（マップ型）
  # 【要確認】設計書「フォルダ一覧」の具体的なパスが未確認のため空マップとする。
  # 実際のフォルダ構造（blobreceipts、規格、設計基準書 等）を設計書で確認の上追記すること。
  storage_folder_placeholders = {}

  # 診断設定名
  storage_account_diagnostic_settings = {
    blob  = "diag-stgenashitrial${var.environment_prefix}-blob"
    queue = "diag-stgenashitrial${var.environment_prefix}-queue"
  }

  # ---------------------------------------------------------------------------
  # 7️.Event Grid
  # ---------------------------------------------------------------------------

  # Storage Blobイベントを検知して各Functionへ連携するための命名規則。
  # 既存の storage_containers 一覧に実在するコンテナ名のみを参照する。
  event_grid = {
    system_topic_name       = "egst-genashi-trial-${var.environment_prefix}"
    diagnostic_setting_name = "diag-egst-genashi-trial-${var.environment_prefix}"
    included_event_types    = ["Microsoft.Storage.BlobCreated"]

    subscriptions = {
      convert_to_pdf = {
        name                  = "converttopdf"
        function_name         = "blob_trigger"
        target_container_name = "genashi-trial-01"
        target_container_path = "/blobServices/default/containers/genashi-trial-01/blobs/"
        subject_begins_with   = "/blobServices/default/containers/genashi-trial-01/blobs/"
        subject_ends_with     = "" # 【要確認】設計書で拡張子指定を確認できていないため空文字
      }

      markdown = {
        name                  = "markdown"
        function_name         = "markdown"
        target_container_name = "genashi-trial-02"
        target_container_path = "/blobServices/default/containers/genashi-trial-02/blobs/"
        subject_begins_with   = "/blobServices/default/containers/genashi-trial-02/blobs/"
        subject_ends_with     = "" # 【要確認】設計書で拡張子指定を確認できていないため空文字
      }

      pagesplitter = {
        name                  = "pagesplitter"
        function_name         = "page_splitter"
        target_container_name = "genashi-trial-03"
        target_container_path = "/blobServices/default/containers/genashi-trial-03/blobs/"
        subject_begins_with   = "/blobServices/default/containers/genashi-trial-03/blobs/"
        subject_ends_with     = "" # 【要確認】設計書で拡張子指定を確認できていないため空文字
      }
    }
  }

  # ---------------------------------------------------------------------------
  # 6️.Cosmos DB
  # ---------------------------------------------------------------------------
  cosmosdb = {
    # -------------------------------------------------------------------------
    # Cosmos DBアカウント基本設定
    # -------------------------------------------------------------------------
    account_name                    = "cosno-genashi-trial-${var.environment_prefix}"
    public_network_access_enabled   = false
    enable_automatic_failover       = true
    enable_multiple_write_locations = false
    disable_local_auth              = true
    enable_free_tier                = false
    capacity_mode                   = "Provisioned"
    total_throughput_limit          = 6000
    minimal_tls_version             = "Tls12"
    network_acl_bypass              = "None"
    analytical_storage_enabled      = false

    # -------------------------------------------------------------------------
    # 一貫性ポリシー
    # -------------------------------------------------------------------------
    consistency_policy = {
      consistency_level       = "BoundedStaleness"
      max_interval_in_seconds = 300
      max_staleness_prefix    = 100
    }

    # -------------------------------------------------------------------------
    # バックアップポリシー
    # -------------------------------------------------------------------------
    backup_policy = {
      type                = "Periodic"
      interval_in_minutes = 240 # 4時間
      retention_in_hours  = 8
      storage_redundancy  = "Local"
    }

    # -------------------------------------------------------------------------
    # フェールオーバー設定
    # -------------------------------------------------------------------------
    failover_locations = [
      {
        location          = "japanwest"
        failover_priority = 0
        zone_redundant    = false
      }
    ]

    # -------------------------------------------------------------------------
    # データベース設定
    # すべて共有Autoscaleスループットを使用
    # -------------------------------------------------------------------------
    databases = [
      {
        name = "cosmos-genashi-trial-01"
        autoscale_settings = {
          max_throughput = 1000
        }

        containers = [
          {
            name               = "ban-word"
            partition_key_path = "/category"
          },
          {
            name               = "dictionary"
            partition_key_path = "/category"
          },
          {
            name               = "hiyari-hat"
            partition_key_path = "/category"
          },
          {
            name               = "message"
            partition_key_path = "/userId"
          },
          {
            name               = "message-agent"
            partition_key_path = "/category"
          },
          {
            name               = "message-rag"
            partition_key_path = "/userId"
          },
          {
            name               = "past-qa"
            partition_key_path = "/category"
          },
          {
            name               = "speech-to-text"
            partition_key_path = "/userId"
          },
          {
            name               = "template"
            partition_key_path = "/category"
          },
          {
            name               = "thread"
            partition_key_path = "/userId"
          },
          {
            name               = "thread-agent"
            partition_key_path = "/userId"
          },
          {
            name               = "thread-rag"
            partition_key_path = "/userId"
          },
          {
            name               = "use-case-search"
            partition_key_path = "/category"
          }
        ]
      },
      {
        name = "cosmos-genashi-trial-02"
        autoscale_settings = {
          max_throughput = 1000
        }

        containers = [
          {
            name               = "advice-consulting"
            partition_key_path = "/userId"
          },
          {
            name               = "advice-react"
            partition_key_path = "/userId"
          },
          {
            name               = "code-explanation"
            partition_key_path = "/userId"
          },
          {
            name               = "company-analysis"
            partition_key_path = "/userId"
          },
          {
            name               = "corporate-survey"
            partition_key_path = "/userId"
          },
          {
            name               = "create-design-document"
            partition_key_path = "/userId"
          },
          {
            name               = "create-idea"
            partition_key_path = "/userId"
          },
          {
            name               = "create-mail"
            partition_key_path = "/userId"
          },
          {
            name               = "create-minutes"
            partition_key_path = "/userId"
          },
          {
            name               = "create-prompt"
            partition_key_path = "/userId"
          },
          {
            name               = "create-technology-proposal"
            partition_key_path = "/userId"
          },
          {
            name               = "image-generation"
            partition_key_path = "/userId"
          },
          {
            name               = "market-research"
            partition_key_path = "/userId"
          },
          {
            name               = "new-product-proposal"
            partition_key_path = "/userId"
          },
          {
            name               = "quality-report"
            partition_key_path = "/userId"
          },
          {
            name               = "quality-standard-document"
            partition_key_path = "/userId"
          },
          {
            name               = "research-report"
            partition_key_path = "/userId"
          },
          {
            name               = "schedule"
            partition_key_path = "/userId"
          },
          {
            name               = "summary"
            partition_key_path = "/userId"
          },
          {
            name               = "supposed-question"
            partition_key_path = "/userId"
          },
          {
            name               = "talk-script"
            partition_key_path = "/userId"
          },
          {
            name               = "text-correction"
            partition_key_path = "/userId"
          },
          {
            name               = "translation"
            partition_key_path = "/userId"
          },
          {
            name               = "wall-hitting"
            partition_key_path = "/userId"
          }
        ]
      },
      {
        name = "cosmos-genashi-trial-03"
        autoscale_settings = {
          max_throughput = 1000
        }

        containers = [
          {
            name               = "brainstorming"
            partition_key_path = "/userId"
          },
          {
            name               = "business-plan"
            partition_key_path = "/userId"
          },
          {
            name               = "code-explanation"
            partition_key_path = "/userId"
          },
          {
            name               = "crisis-management-scenarios"
            partition_key_path = "/userId"
          },
          {
            name               = "defect-analysis-report"
            partition_key_path = "/userId"
          },
          {
            name               = "design-document-review"
            partition_key_path = "/userId"
          },
          {
            name               = "error-analysis"
            partition_key_path = "/userId"
          },
          {
            name               = "incident-report"
            partition_key_path = "/userId"
          },
          {
            name               = "judge-idea"
            partition_key_path = "/userId"
          },
          {
            name               = "key-point-extraction"
            partition_key_path = "/userId"
          },
          {
            name               = "needs-survey"
            partition_key_path = "/userId"
          },
          {
            name               = "product-expansion-aarrr"
            partition_key_path = "/userId"
          },
          {
            name               = "production-tech-list"
            partition_key_path = "/userId"
          },
          {
            name               = "product-service-benefit-idea"
            partition_key_path = "/userId"
          },
          {
            name               = "risk-assessment"
            partition_key_path = "/userId"
          },
          {
            name               = "sales-forecast"
            partition_key_path = "/userId"
          },
          {
            name               = "task-breakdown"
            partition_key_path = "/userId"
          },
          {
            name               = "technology-training"
            partition_key_path = "/userId"
          },
          {
            name               = "text-check"
            partition_key_path = "/userId"
          },
          {
            name               = "transcription-handwritten"
            partition_key_path = "/userId"
          },
          {
            name               = "trouble-shooting-guide"
            partition_key_path = "/userId"
          },
          {
            name               = "use-case-search"
            partition_key_path = "/category"
          }
        ]
      },
      {
        name = "cosmos-genashi-trial-04"
        autoscale_settings = {
          max_throughput = 1000
        }

        containers = [
          {
            name               = "flow-designer"
            partition_key_path = "/userId"
          },
          {
            name               = "movie-manual"
            partition_key_path = "/userId"
          },
          {
            name               = "product-catchphrase"
            partition_key_path = "/userId"
          },
          {
            name               = "product-promotion-strategy"
            partition_key_path = "/userId"
          },
          {
            name               = "marketing-strategy"
            partition_key_path = "/userId"
          },
          {
            name               = "tech-assess"
            partition_key_path = "/userId"
          }
        ]
      }
    ]

    # -------------------------------------------------------------------------
    # 診断設定
    # -------------------------------------------------------------------------
    diagnostic_setting_name = "diag-cosmos-genashi-trial-${var.environment_prefix}"
  }


  # ---------------------------------------------------------------------------
  # 7.Key Vault
  # ---------------------------------------------------------------------------

  key_vault = {
    name                            = "kv-genashi-trial-${var.environment_prefix}"
    tenant_id                       = var.tenant_id
    sku_name                        = var.key_vault_sku
    public_network_access_enabled   = true
    rbac_authorization_enabled      = true
    enabled_for_deployment          = false
    enabled_for_disk_encryption     = false
    enabled_for_template_deployment = false
    soft_delete_retention_days      = 7
    purge_protection_enabled        = false
    diagnostic_setting_name         = "diag-kv-genashi-trial-${var.environment_prefix}"
  }

  key_vault_secret_names = {
    orchestrator_agent_api_credential    = "ORCHESTRATOR-AGENT-API-CREDENTIAL"
    orchestrator_api_url                 = "ORCHESTRATOR-API-URL"
    orchestrator_document_api_credential = "ORCHESTRATOR-DOCUMENT-API-CREDENTIAL"
    orchestrator_file_api_credential     = "ORCHESTRATOR-FILE-API-CREDENTIAL"
    orchestrator_it_api_credential       = "ORCHESTRATOR-IT-API-CREDENTIAL"
    orchestrator_mfg_api_credential      = "ORCHESTRATOR-MFG-API-CREDENTIAL"
    orchestrator_pii_api_url             = "ORCHESTRATOR-PII-API-URL"
    orchestrator_rag_api_url             = "ORCHESTRATOR-RAG-API-URL"
    orchestrator_standard_api_credential = "ORCHESTRATOR-STANDARD-API-CREDENTIAL"
    orchestrator_use_case_api_credential = "ORCHESTRATOR-USE-CASE-API-CREDENTIAL"
  }

  # ---------------------------------------------------------------------------
  # 8. Webアプリケーション基盤（App Service）
  # ---------------------------------------------------------------------------

  app_service_plan_01_name     = "asp-genashi-trial-${var.environment_prefix}-01"
  app_service_plan_01_sku_name = var.app_service_sku_name
  app_service_plan_01_os_type  = "Linux"

  app_service_plan_02_name                         = "asp-genashi-trial-${var.environment_prefix}-02"
  app_service_plan_02_sku_name                     = var.function_app_sku_name
  app_service_plan_02_os_type                      = "Linux"
  app_service_plan_02_maximum_elastic_worker_count = 20

  frontend_app_service_name          = "frontend-genashi-trial-${var.environment_prefix}-01"
  frontend_app_service_runtime_stack = "22-lts"

  frontend_base_ip_restrictions = [
    {
      name       = "hitachi-proxy-001"
      priority   = 1001
      action     = "Allow"
      ip_address = "202.246.252.96/27"
    },
    {
      name       = "hitachi-proxy-002"
      priority   = 1002
      action     = "Allow"
      ip_address = "202.246.252.128/25"
    },
    {
      name       = "hitachi-proxy-003"
      priority   = 1003
      action     = "Allow"
      ip_address = "180.12.177.128/28"
    },
    {
      name       = "hitachi-proxy-004"
      priority   = 1004
      action     = "Allow"
      ip_address = "202.252.109.0/24"
    },
    {
      name       = "hitachi-proxy-005"
      priority   = 1005
      action     = "Allow"
      ip_address = "180.12.177.153/32"
    },
    {
      name       = "hitachi-proxy-006"
      priority   = 1006
      action     = "Allow"
      ip_address = "119.81.77.52/31"
    },
    {
      name       = "hitachi-proxy-007"
      priority   = 1007
      action     = "Allow"
      ip_address = "194.223.149.212/31"
    },
    {
      name       = "hitachi-proxy-008"
      priority   = 1008
      action     = "Allow"
      ip_address = "148.109.35.210/31"
    },
    {
      name       = "hitachi-proxy-009"
      priority   = 1009
      action     = "Allow"
      ip_address = "194.223.149.82/31"
    },
    {
      name       = "hitachi-proxy-010"
      priority   = 1010
      action     = "Allow"
      ip_address = "158.213.160.0/26"
    },
    {
      name       = "hitachi-proxy-011"
      priority   = 1011
      action     = "Allow"
      ip_address = "158.213.204.0/24"
    },
    {
      name       = "hitachi-proxy-012"
      priority   = 1012
      action     = "Allow"
      ip_address = "158.213.151.0/24"
    },
    {
      name       = "hitachi-proxy-013"
      priority   = 1013
      action     = "Allow"
      ip_address = "158.214.171.192/26"
    },
    {
      name       = "umbrella-001"
      priority   = 2001
      action     = "Allow"
      ip_address = "155.190.0.0/16"
    },
    {
      name       = "umbrella-002"
      priority   = 2002
      action     = "Allow"
      ip_address = "146.112.0.0/16"
    },
    {
      name       = "umbrella-003"
      priority   = 2003
      action     = "Allow"
      ip_address = "151.186.144.0/20"
    },
    {
      name       = "umbrella-004"
      priority   = 2004
      action     = "Allow"
      ip_address = "151.186.160.0/20"
    },
    {
      name       = "umbrella-005"
      priority   = 2005
      action     = "Allow"
      ip_address = "151.186.176.0/20"
    },
    {
      name       = "umbrella-006"
      priority   = 2006
      action     = "Allow"
      ip_address = "151.186.192.0/20"
    }
  ]

  loadbalancer_app_service_name          = "app-load-balancer-genashi-trial-${var.environment_prefix}-01"
  loadbalancer_app_service_runtime_stack = "8.0"

  app_service_application_insights = {
    frontend     = "appi-frontend-genashi-trial-${var.environment_prefix}"
    loadbalancer = "appi-app-load-balancer-genashi-trial-${var.environment_prefix}"
  }

  app_service_diagnostic_settings = {
    frontend     = "diag-frontend-genashi-trial-${var.environment_prefix}"
    loadbalancer = "diag-app-load-balancer-genashi-trial-${var.environment_prefix}"
  }

  # ---------------------------------------------------------------------------
  # 11. Azure Functions
  # ---------------------------------------------------------------------------
  # 設計書: genashi_trial_terraform_rag_standard.md § 11
  # 命名規則: func-genashi-trial-{environment_prefix}-{番号}-{機能名}
  #
  # RBAC割り当て根拠（MODULE_AzureFunction設計書 + env_vars/配下 tpl ファイル）:
  #   create_cosmos_db_role_assignment = true
  #     → AZURE_COSMOSDB_URI が tpl に存在するもの: 02-rag, 05-prompt, 10-agent-rag
  #   create_acr_role_assignment = true
  #     → use_container_image = true のもの: 08-pdf（DOCKER_REGISTRY_SERVER_URL あり）
  #   use_storageaccount_queue = true
  #     → Storage Queue 定義に azure-webjobs-blobtrigger-* が存在するもの: 06, 07, 08, 12, 13
  # ---------------------------------------------------------------------------

  function_app = {
    # 01 Chat: チャット要求受付 / Plan 01
    chat = {
      name                             = "func-genashi-trial-${var.environment_prefix}-01-chat"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 02 RAG: RAG処理 / Plan 01 / Cosmos DB利用
    rag = {
      name                             = "func-genashi-trial-${var.environment_prefix}-02-rag"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = true
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 03 Register: 文書登録 / 文書プレビュー / Plan 01
    register = {
      name                             = "func-genashi-trial-${var.environment_prefix}-03-text-register"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 04 PII: 個人情報検知 / Plan 01
    pii = {
      name                             = "func-genashi-trial-${var.environment_prefix}-04-pii"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 05 Prompt: プロンプト管理 / Plan 01 / Cosmos DB利用
    prompt = {
      name                             = "func-genashi-trial-${var.environment_prefix}-05-prompt"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = true
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 06 Pagesplitter 001: ページ分割 / Plan 02 / Queue Trigger
    pagesplitter_001 = {
      name                             = "func-genashi-trial-${var.environment_prefix}-06-pagesplitter"
      service_plan                     = "plan_02"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = true
    }
    # 07 Markdown 001: Markdown変換 / Plan 02 / Queue Trigger
    markdown_001 = {
      name                             = "func-genashi-trial-${var.environment_prefix}-07-markdown"
      service_plan                     = "plan_02"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = true
    }
    # 08 PDF: PDF変換 / Plan 02 / コンテナーイメージ / ACRPull / Queue Trigger
    pdf = {
      name                             = "func-genashi-trial-${var.environment_prefix}-08-pdf"
      service_plan                     = "plan_02"
      python_version                   = "3.12"
      use_container_image              = true
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = true
      use_storageaccount_queue         = true
    }
    # 09 MFG: 製造データ分析 / Plan 01
    mfg = {
      name                             = "func-genashi-trial-${var.environment_prefix}-09-mfg"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 10 Agent RAG: エージェントRAG / Plan 01 / Cosmos DB利用
    agent_rag = {
      name                             = "func-genashi-trial-${var.environment_prefix}-10-agent-rag"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = true
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 11 Agent Document: エージェント文書処理 / Plan 01
    agent_document = {
      name                             = "func-genashi-trial-${var.environment_prefix}-11-agent-document"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
    # 12 Pagesplitter 002: 標準エージェント用ページ分割 / Plan 02 / Queue Trigger
    pagesplitter_002 = {
      name                             = "func-genashi-trial-${var.environment_prefix}-12-page-std"
      service_plan                     = "plan_02"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = true
    }
    # 13 Markdown 002: 標準エージェント用Markdown変換 / Plan 02 / Queue Trigger
    markdown_002 = {
      name                             = "func-genashi-trial-${var.environment_prefix}-13-mark-std"
      service_plan                     = "plan_02"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = true
    }
    # 14 Indexer: インデクサー連携 / Plan 01
    indexer = {
      name                             = "func-genashi-trial-${var.environment_prefix}-14-indexer"
      service_plan                     = "plan_01"
      python_version                   = "3.12"
      use_container_image              = false
      create_cosmos_db_role_assignment = false
      create_acr_role_assignment       = false
      use_storageaccount_queue         = false
    }
  }

  # Application Insights（Function App ごとに作成: appi-{func_name}）
  function_application_insights = {
    chat             = "appi-func-genashi-trial-${var.environment_prefix}-01-chat"
    rag              = "appi-func-genashi-trial-${var.environment_prefix}-02-rag"
    register         = "appi-func-genashi-trial-${var.environment_prefix}-03-text-register"
    pii              = "appi-func-genashi-trial-${var.environment_prefix}-04-pii"
    prompt           = "appi-func-genashi-trial-${var.environment_prefix}-05-prompt"
    pagesplitter_001 = "appi-func-genashi-trial-${var.environment_prefix}-06-pagesplitter"
    markdown_001     = "appi-func-genashi-trial-${var.environment_prefix}-07-markdown"
    pdf              = "appi-func-genashi-trial-${var.environment_prefix}-08-pdf"
    mfg              = "appi-func-genashi-trial-${var.environment_prefix}-09-mfg"
    agent_rag        = "appi-func-genashi-trial-${var.environment_prefix}-10-agent-rag"
    agent_document   = "appi-func-genashi-trial-${var.environment_prefix}-11-agent-document"
    pagesplitter_002 = "appi-func-genashi-trial-${var.environment_prefix}-12-page-std"
    markdown_002     = "appi-func-genashi-trial-${var.environment_prefix}-13-mark-std"
    indexer          = "appi-func-genashi-trial-${var.environment_prefix}-14-indexer"
  }

  # 診断設定（Function App ごとに有効化: diag-{func_name}）
  function_diagnostic_settings = {
    chat             = "diag-func-genashi-trial-${var.environment_prefix}-01-chat"
    rag              = "diag-func-genashi-trial-${var.environment_prefix}-02-rag"
    register         = "diag-func-genashi-trial-${var.environment_prefix}-03-text-register"
    pii              = "diag-func-genashi-trial-${var.environment_prefix}-04-pii"
    prompt           = "diag-func-genashi-trial-${var.environment_prefix}-05-prompt"
    pagesplitter_001 = "diag-func-genashi-trial-${var.environment_prefix}-06-pagesplitter"
    markdown_001     = "diag-func-genashi-trial-${var.environment_prefix}-07-markdown"
    pdf              = "diag-func-genashi-trial-${var.environment_prefix}-08-pdf"
    mfg              = "diag-func-genashi-trial-${var.environment_prefix}-09-mfg"
    agent_rag        = "diag-func-genashi-trial-${var.environment_prefix}-10-agent-rag"
    agent_document   = "diag-func-genashi-trial-${var.environment_prefix}-11-agent-document"
    pagesplitter_002 = "diag-func-genashi-trial-${var.environment_prefix}-12-page-std"
    markdown_002     = "diag-func-genashi-trial-${var.environment_prefix}-13-mark-std"
    indexer          = "diag-func-genashi-trial-${var.environment_prefix}-14-indexer"
  }

  # ---------------------------------------------------------------------------
  # 9. Azure Monitor
  # ---------------------------------------------------------------------------
  # 設計書の固有名詞は使用せず、core の命名規則に合わせて trial で定義する。
  azure_monitor = {
    action_group_name       = "ag-genashi-trial"
    action_group_short_name = "trial"
    action_group_enabled    = true

    email_receivers = [
      {
        name                    = "Generative-AI_-EmailAction-"
        email_address           = "Generative-AI@hitachi-systems.com"
        use_common_alert_schema = false
      }
    ]

    resource_health_alert_name         = "ResourceHealthAlert-genashi-trial"
    resource_health_evaluation_frequency = "PT5M"
    resource_health_window_duration      = "PT5M"
    resource_health_scopes               = [module.log_analytics.log_analytics_workspace_id]
    resource_health_query = <<-KQL
      AzureActivity
      | where CategoryValue contains "ResourceHealth"
      | where Level !contains "informational"
      | where ResourceGroup == "rg-genashi-trial-${var.environment_prefix}"
    KQL
    resource_health_severity        = 1
    resource_health_enabled         = true
    resource_health_auto_mitigation = true

    service_health_alert_01_name = "ServiceHealthAlert-genashi-trial-01"
    service_health_01_enabled    = true
    service_health_01_events     = ["Incident", "Maintenance", "Informational", "ActionRequired", "Security"]

    service_health_alert_02_name = "ServiceHealthAlert-genashi-trial-02"
    service_health_02_enabled    = true
    service_health_02_events     = ["Incident", "Maintenance", "Informational", "ActionRequired", "Security"]

    service_health_01_locations = [
      "Global",
      "Japan West"
    ]

    # 全サービス監視
    service_health_01_services = null

    service_health_02_locations = [
      "East US 2",
      "Global",
      "Sweden Central"
    ]

    service_health_02_services = [
      "Azure OpenAI Service"
    ]

    service_health_scopes = ["/subscriptions/${var.subscription_id}"]
  }

  # 既存参照との互換性維持
  key_vault_name                    = local.key_vault.name
  key_vault_diagnostic_setting_name = local.key_vault.diagnostic_setting_name

  # ---------------------------------------------------------------------------
  # 10.Private DNS zones
  # ---------------------------------------------------------------------------

  private_dns_zones = {

    # Storage
    blob  = "privatelink.blob.core.windows.net"
    queue = "privatelink.queue.core.windows.net"

    # Cosmos DB
    cosmos_db = "privatelink.documents.azure.com"

    # Key Vault
    key_vault = "privatelink.vaultcore.azure.net"

    # App Service / Functions
    app_service = "privatelink.azurewebsites.net"

    # Container Registry
    container_registry = "privatelink.azurecr.io"

    # Azure OpenAI
    openai = "privatelink.openai.azure.com"

    # Azure AI Search
    search_service = "privatelink.search.windows.net"

    # Azure AI Services
    cognitive_services = "privatelink.cognitiveservices.azure.com"

    # Azure AI Foundry
    services_ai = "privatelink.services.ai.azure.com"
  }

  # ---------------------------------------------------------------------------
  # 11.Private Endpoint
  # ---------------------------------------------------------------------------
  # 設計書: 【げんあし】PC2.0環境_プライベートエンドポイント_v1.3_20251106
  # 命名規則: pep-{リソース名} / nic-{リソース名}

  # Storage Account Private Endpoint (Blob)
  pe_storage_blob_name  = "pep-stgenashitrial${var.environment_prefix}-blob"
  nic_storage_blob_name = "nic-stgenashitrial${var.environment_prefix}-blob"

  # Storage Account Private Endpoint (Queue)
  pe_storage_queue_name  = "pep-stgenashitrial${var.environment_prefix}-queue"
  nic_storage_queue_name = "nic-stgenashitrial${var.environment_prefix}-queue"

  # Container Registry Private Endpoint
  pe_container_registry_name  = "pep-crgenashitrial${var.environment_prefix}"
  nic_container_registry_name = "nic-crgenashitrial${var.environment_prefix}"

  # Cosmos DB Private Endpoint
  pe_cosmos_db_name  = "pep-cosno-genashi-trial-${var.environment_prefix}"
  nic_cosmos_db_name = "nic-cosno-genashi-trial-${var.environment_prefix}"

  # Key Vault Private Endpoint
  pe_key_vault_name  = "pep-kv-genashi-trial-${var.environment_prefix}"
  nic_key_vault_name = "nic-kv-genashi-trial-${var.environment_prefix}"

  # 既存/解答形式の差分吸収用
  private_endpoint = {
    key_vault = local.pe_key_vault_name
  }

  # Load Balancer (App Service) Private Endpoint
  pe_load_balancer_name  = "pep-app-load-balancer-trial-${var.environment_prefix}"
  nic_load_balancer_name = "nic-app-load-balancer-trial-${var.environment_prefix}"

  # Function App Private Endpoints
  # Chat Function App
  pe_function_app_chat_name  = "pep-func-genashi-trial-${var.environment_prefix}-01-chat"
  nic_function_app_chat_name = "nic-func-genashi-trial-${var.environment_prefix}-01-chat"

  # RAG Function App
  pe_function_app_rag_name  = "pep-func-genashi-trial-${var.environment_prefix}-02-rag"
  nic_function_app_rag_name = "nic-func-genashi-trial-${var.environment_prefix}-02-rag"

  # Text Register Function App
  pe_function_app_register_name  = "pep-func-genashi-trial-${var.environment_prefix}-03-text-register"
  nic_function_app_register_name = "nic-func-genashi-trial-${var.environment_prefix}-03-text-register"

  # PII Function App
  pe_function_app_pii_name  = "pep-func-genashi-trial-${var.environment_prefix}-04-pii"
  nic_function_app_pii_name = "nic-func-genashi-trial-${var.environment_prefix}-04-pii"

  # Prompt Function App
  pe_function_app_prompt_name  = "pep-func-genashi-trial-${var.environment_prefix}-05-prompt"
  nic_function_app_prompt_name = "nic-func-genashi-trial-${var.environment_prefix}-05-prompt"

  # PDF Function App
  pe_function_app_pdf_name  = "pep-func-genashi-trial-${var.environment_prefix}-08-pdf"
  nic_function_app_pdf_name = "nic-func-genashi-trial-${var.environment_prefix}-08-pdf"

  # MFG Function App
  pe_function_app_mfg_name  = "pep-func-genashi-trial-${var.environment_prefix}-09-mfg"
  nic_function_app_mfg_name = "nic-func-genashi-trial-${var.environment_prefix}-09-mfg"

  # Agent RAG Function App
  pe_function_app_agent_rag_name  = "pep-func-genashi-trial-${var.environment_prefix}-10-agent-rag"
  nic_function_app_agent_rag_name = "nic-func-genashi-trial-${var.environment_prefix}-10-agent-rag"

  # Agent Document Function App
  pe_function_app_agent_document_name  = "pep-func-genashi-trial-${var.environment_prefix}-11-agent-document"
  nic_function_app_agent_document_name = "nic-func-genashi-trial-${var.environment_prefix}-11-agent-document"

  # 【重要】設計書「プライベートエンドポイント_v1.3」には記載がないが
  # 設計書が更新漏れの可能性あり。
  pe_function_app_indexer_name  = "pep-func-genashi-trial-${var.environment_prefix}-14-indexer"
  nic_function_app_indexer_name = "nic-func-genashi-trial-${var.environment_prefix}-14-indexer"

  # ---------------------------------------------------------------------------
  # Terraform対象外のPrivate Endpoint（設計書上明記）
  # ---------------------------------------------------------------------------
  # 以下のリソースは設計書上「今回のTerraform定義対象外（要確認)」と明記されているため、
  # Terraform管理の対象外です:
  # - language（言語サービス）
  # - ai search
  # - oai-01, oai-02, oai-03（Azure OpenAI）
  # - docintel（Document Intelligence）
  # - it
  # - Speech, Speechサービス
  # - frontend
  # - movie
  # - aif, aif-movie

}