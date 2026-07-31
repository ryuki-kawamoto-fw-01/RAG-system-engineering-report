<#
.SYNOPSIS
    完全デプロイスクリプト - terraform-ci-cd.ymlと同等の処理を実行

.DESCRIPTION
    このスクリプトは、GitHub Actionsワークフロー (terraform-ci-cd.yml) と同じ流れで
    以下のコンポーネントをデプロイします：
    1. Terraform Core (Phase 1: init_flag=true でパブリックアクセス有効化)
    2. Frontend (Next.js)
    3. Load Balancer (.NET 8.0)
    4. Backend Function Apps (14個)
    5. Terraform Core (Phase 2: init_flag=false でプライベートエンドポイント化)
    6. Terraform AI Service (Azure AI Search等)
    
    前提条件:
    - Azure CLI でログイン済み
    - Terraform 1.14.3+ インストール済み
    - Node.js 20+, .NET SDK 8.0, Python 3.12, Docker がインストール済み

.PARAMETER SkipTerraformCore
    Terraform Coreデプロイをスキップ（既存インフラを使用）

.PARAMETER SkipFrontend
    Frontendデプロイをスキップ

.PARAMETER SkipLoadBalancer
    Load Balancerデプロイをスキップ

.PARAMETER SkipBackend
    Backend Function Appsデプロイをスキップ

.PARAMETER SkipTerraformAI
    Terraform AI Serviceデプロイをスキップ

.PARAMETER SkipPhase2
    Phase 2 (プライベートエンドポイント化) をスキップ

.EXAMPLE
    .\deploy-manual.ps1
    全コンポーネントをフルデプロイ（初回構築向け）

.EXAMPLE
    .\deploy-manual.ps1 -SkipTerraformCore -SkipTerraformAI
    アプリケーション（Frontend/LoadBalancer/Backend）のみ再デプロイ
#>

[CmdletBinding()]
param(
    [switch]$SkipTerraformCore,
    [switch]$SkipFrontend,
    [switch]$SkipLoadBalancer,
    [switch]$SkipBackend,
    [switch]$SkipPhase2,
    [switch]$SkipTerraformAI
)

# ============================================
# 設定
# ============================================
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$WORKSPACE_ROOT = "C:\workspace\11_シス工_rag\01_genashi\original-beta"
$TERRAFORM_CORE_DIR = "$WORKSPACE_ROOT\infra\tenant\sst-harc\trial\core"
$TERRAFORM_AI_DIR = "$WORKSPACE_ROOT\infra\tenant\sst-harc\trial\ai_service"

# Terraform変数（必要に応じて変更）
$TENANT_ID = "f54277c9-dafe-44aa-85a4-73d5c7c52450"
$SUBSCRIPTION_ID = "def81dc7-dd19-48d9-a825-9aeb35274dd4"
$ENVIRONMENT_PREFIX = "hs"
$INIT_FLAG = $true  # Phase 1ではtrue

# ============================================
# ユーティリティ関数
# ============================================
function Write-Section {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# ============================================
# 環境確認
# ============================================
Write-Section "環境確認"

# Azure CLIログイン確認
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Success "Azure CLI: ログイン済み"
    Write-Host "  Subscription: $($account.name)" -ForegroundColor Gray
    Write-Host "  Tenant: $($account.tenantId)" -ForegroundColor Gray
} catch {
    Write-Error-Custom "Azure CLIにログインしていません。'az login' を実行してください。"
    exit 1
}

# Node.js確認
try {
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"
} catch {
    Write-Error-Custom "Node.jsがインストールされていません。"
    exit 1
}

# .NET SDK確認
try {
    $dotnetVersion = dotnet --version
    Write-Success ".NET SDK: $dotnetVersion"
} catch {
    Write-Error-Custom ".NET SDKがインストールされていません。"
    exit 1
}

# Python確認
try {
    $pythonVersion = python --version
    Write-Success "Python: $pythonVersion"
} catch {
    Write-Error-Custom "Pythonがインストールされていません。"
    exit 1
}

# Docker確認
try {
    $dockerVersion = docker --version
    Write-Success "Docker: $dockerVersion"
} catch {
    Write-Info "Dockerがインストールされていません。PDF Function Appのデプロイに必要です。"
}

# Terraform確認
try {
    $terraformVersion = terraform --version | Select-Object -First 1
    Write-Success "Terraform: $terraformVersion"
} catch {
    Write-Error-Custom "Terraformがインストールされていません。"
    exit 1
}

# ============================================
# Phase 1: Terraform Core デプロイ (init_flag=true)
# ============================================
if (-not $SkipTerraformCore) {
    Write-Section "Phase 1: Terraform Core デプロイ (パブリックアクセス有効)"
    
    Set-Location $TERRAFORM_CORE_DIR
    
    Write-Info "Terraform初期化中..."
    terraform init -input=false -upgrade
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform init 失敗"
        exit 1
    }
    
    Write-Info "Terraform検証中..."
    terraform validate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform validate 失敗"
        exit 1
    }
    
    Write-Info "Terraform Plan実行中（init_flag=true）..."
    terraform plan `
        -var="tenant_id=$TENANT_ID" `
        -var="subscription_id=$SUBSCRIPTION_ID" `
        -var="environment_prefix=$ENVIRONMENT_PREFIX" `
        -var="init_flag=true" `
        -out=tfplan-phase1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform plan 失敗"
        exit 1
    }
    
    Write-Info "Terraform Apply実行中..."
    terraform apply -input=false tfplan-phase1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform Core (Phase 1) デプロイ完了"
    } else {
        Write-Error-Custom "Terraform apply 失敗"
        exit 1
    }
    
    Remove-Item tfplan-phase1 -ErrorAction SilentlyContinue
    Set-Location $WORKSPACE_ROOT
} else {
    Write-Info "Terraform Core デプロイをスキップ"
}

# ============================================
# Terraformから情報取得
# ============================================
Write-Section "Terraform情報取得"

Set-Location $TERRAFORM_CORE_DIR

try {
    $RESOURCE_GROUP = (terraform output -raw resource_group_name)
    $STORAGE_ACCOUNT_NAME = (terraform output -raw storage_account_name)
    $FRONTEND_APP_NAME = (terraform output -raw frontend_app_service_name)
    $LOADBALANCER_APP_NAME = (terraform output -raw loadbalancer_app_service_name)
    $ACR_NAME = (terraform output -raw container_registry_name)
    
    # Function Apps
    $FUNCTION_CHAT_NAME = (terraform output -raw function_chat_name)
    $FUNCTION_RAG_NAME = (terraform output -raw function_rag_name)
    $FUNCTION_REGISTER_NAME = (terraform output -raw function_register_name)
    $FUNCTION_PII_NAME = (terraform output -raw function_pii_name)
    $FUNCTION_PROMPT_NAME = (terraform output -raw function_prompt_name)
    $FUNCTION_MFG_NAME = (terraform output -raw function_mfg_name)
    $FUNCTION_AGENT_RAG_NAME = (terraform output -raw function_agent_rag_name)
    $FUNCTION_AGENT_DOCUMENT_NAME = (terraform output -raw function_agent_document_name)
    $FUNCTION_PAGESPLITER_001_NAME = (terraform output -raw function_pagespliter_001_name)
    $FUNCTION_MARKDOWN_001_NAME = (terraform output -raw function_markdown_001_name)
    $FUNCTION_PDF_NAME = (terraform output -raw function_pdf_name)
    $FUNCTION_PAGESPLITER_002_NAME = (terraform output -raw function_pagespliter_002_name)
    $FUNCTION_MARKDOWN_002_NAME = (terraform output -raw function_markdown_002_name)
    $FUNCTION_INDEXER_NAME = (terraform output -raw function_indexer_name)
    
    Write-Success "Terraform情報取得完了"
    Write-Host "  Resource Group: $RESOURCE_GROUP" -ForegroundColor Gray
    Write-Host "  Frontend: $FRONTEND_APP_NAME" -ForegroundColor Gray
    Write-Host "  Load Balancer: $LOADBALANCER_APP_NAME" -ForegroundColor Gray
    Write-Host "  Function Apps: 14個" -ForegroundColor Gray
} catch {
    Write-Error-Custom "Terraform情報の取得に失敗しました。Terraform Coreがデプロイされているか確認してください。"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Set-Location $WORKSPACE_ROOT

# ============================================
# Frontend デプロイ
# ============================================
if (-not $SkipFrontend) {
    Write-Section "Frontend デプロイ"
    
    Set-Location "$WORKSPACE_ROOT\frontend"
    
    # 環境変数設定
    $env:NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME = "genashi-trial-06"
    $env:NEXT_PUBLIC_STANDARD_PREVIEW_STORAGE_CONTAINER_NAME = "genashi-trial-06"
    $env:NEXT_PUBLIC_DISABLED_ROUTE_PREFIXES = "image-generation,create-manual"
    
    Write-Info "依存関係インストール中..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "npm install 失敗"
        exit 1
    }
    
    Write-Info "コードフォーマット中..."
    npm run format
    
    Write-Info "Lint実行中..."
    npm run lint
    
    Write-Info "ビルド中..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Frontend ビルド失敗"
        exit 1
    }
    
    Write-Info "Azureへデプロイ中（軽量ZIP）..."
    
    # node_modulesを除外してZIP作成
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $zipPath = "$env:TEMP\frontend-deploy-$timestamp.zip"
    $excludeList = @("node_modules", ".next/cache", ".git", ".vscode")
    
    # 一時ディレクトリ作成
    $tempDir = "$env:TEMP\frontend-staging"
    if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    # 必要なファイルのみコピー
    Write-Info "デプロイファイル準備中..."
    Copy-Item -Path ".next" -Destination $tempDir -Recurse
    Copy-Item -Path "public" -Destination $tempDir -Recurse -ErrorAction SilentlyContinue
    Copy-Item -Path "package.json" -Destination $tempDir
    Copy-Item -Path "package-lock.json" -Destination $tempDir -ErrorAction SilentlyContinue
    Copy-Item -Path "next.config.mjs" -Destination $tempDir -ErrorAction SilentlyContinue
    
    # ZIP作成
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Fastest
    
    $sizeMB = [Math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Success "ZIP作成完了: $sizeMB MB"
    
    # デプロイ
    az webapp deploy --resource-group $RESOURCE_GROUP --name $FRONTEND_APP_NAME --src-path $zipPath --type zip
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend デプロイ完了"
    } else {
        Write-Error-Custom "Frontend デプロイ失敗"
        exit 1
    }
    
    # クリーンアップ
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    Remove-Item $zipPath -ErrorAction SilentlyContinue
    
    Set-Location $WORKSPACE_ROOT
} else {
    Write-Info "Frontend デプロイをスキップ"
}

# ============================================
# Load Balancer デプロイ
# ============================================
if (-not $SkipLoadBalancer) {
    Write-Section "Load Balancer デプロイ"
    
    Set-Location "$WORKSPACE_ROOT\loadbalancer\openai-aca-lb\src"
    
    Write-Info "ビルド中..."
    dotnet restore
    dotnet build --configuration Release --no-restore
    dotnet publish --configuration Release --no-build --output ./publish
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Load Balancer ビルド失敗"
        exit 1
    }
    
    Write-Info "Azureへデプロイ中..."
    az webapp deploy --resource-group $RESOURCE_GROUP --name $LOADBALANCER_APP_NAME --src-path "./publish" --type zip
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Load Balancer デプロイ完了"
    } else {
        Write-Error-Custom "Load Balancer デプロイ失敗"
        exit 1
    }
    
    Set-Location $WORKSPACE_ROOT
} else {
    Write-Info "Load Balancer デプロイをスキップ"
}

# ============================================
# Backend Function Apps デプロイ
# ============================================
if (-not $SkipBackend) {
    Write-Section "Backend Function Apps デプロイ"
    
    # Storage Account ネットワークアクセス有効化
    Write-Info "Storage Account ネットワークアクセス一時有効化..."
    az storage account update --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --default-action Allow
    
    $functionApps = @(
        @{ Name = $FUNCTION_CHAT_NAME; Path = "backend\orchestrator"; DisplayName = "01: Chat" }
        @{ Name = $FUNCTION_RAG_NAME; Path = "backend\orchestrator-rag"; DisplayName = "02: RAG" }
        @{ Name = $FUNCTION_REGISTER_NAME; Path = "backend\orchestrator-text-register"; DisplayName = "03: Text Register" }
        @{ Name = $FUNCTION_PII_NAME; Path = "backend\orchestrator-pii"; DisplayName = "04: PII" }
        @{ Name = $FUNCTION_PROMPT_NAME; Path = "backend\orchestrator-prompt"; DisplayName = "05: Prompt" }
        @{ Name = $FUNCTION_MFG_NAME; Path = "changedoc\mfg"; DisplayName = "09: MFG" }
        @{ Name = $FUNCTION_AGENT_RAG_NAME; Path = "changedoc\agent-rag"; DisplayName = "10: Agent RAG" }
        @{ Name = $FUNCTION_AGENT_DOCUMENT_NAME; Path = "changedoc\agent-document"; DisplayName = "11: Agent Document" }
        @{ Name = $FUNCTION_PAGESPLITER_001_NAME; Path = "changedoc\pagesplitter"; DisplayName = "06: Page Splitter 001" }
        @{ Name = $FUNCTION_MARKDOWN_001_NAME; Path = "changedoc\markdown"; DisplayName = "07: Markdown 001" }
        @{ Name = $FUNCTION_PAGESPLITER_002_NAME; Path = "changedoc\pagesplitter"; DisplayName = "12: Page Splitter 002" }
        @{ Name = $FUNCTION_MARKDOWN_002_NAME; Path = "changedoc\markdown"; DisplayName = "13: Markdown 002" }
        @{ Name = $FUNCTION_INDEXER_NAME; Path = "changedoc\indexer"; DisplayName = "14: Indexer" }
    )
    
    $deployedCount = 0
    $totalCount = $functionApps.Count + 1  # +1 for PDF
    
    foreach ($app in $functionApps) {
        Write-Info "[$($deployedCount+1)/$totalCount] $($app.DisplayName) デプロイ中..."
        
        $appPath = Join-Path $WORKSPACE_ROOT $app.Path
        Set-Location $appPath
        
        # 依存関係インストール
        if (Test-Path ".python_packages") {
            Remove-Item -Recurse -Force .python_packages
        }
        pip install -r requirements.txt --target .python_packages\lib\site-packages --quiet
        
        # ZIP作成
        $zipName = "function-$($app.Name).zip"
        $zipPath = Join-Path $WORKSPACE_ROOT $zipName
        if (Test-Path $zipPath) { Remove-Item $zipPath }
        
        Compress-Archive -Path * -DestinationPath $zipPath -CompressionLevel Fastest
        
        # デプロイ
        Set-Location $WORKSPACE_ROOT
        az webapp deploy --resource-group $RESOURCE_GROUP --name $app.Name --src-path $zipPath --type zip --timeout 600
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$($app.DisplayName) デプロイ完了"
            $deployedCount++
        } else {
            Write-Error-Custom "$($app.DisplayName) デプロイ失敗"
        }
        
        Remove-Item $zipPath -ErrorAction SilentlyContinue
    }
    
    # Function 08: PDF (Docker)
    Write-Info "[$($deployedCount+1)/$totalCount] 08: PDF (Docker) デプロイ中..."
    
    try {
        # Function App停止
        Write-Info "PDF Function App停止中..."
        az functionapp stop --name $FUNCTION_PDF_NAME --resource-group $RESOURCE_GROUP
        Start-Sleep -Seconds 30
        
        # ACRログイン
        Write-Info "Azure Container Registryログイン中..."
        az acr login --name $ACR_NAME
        
        # Dockerイメージビルド
        $imageName = "$ACR_NAME.azurecr.io/convert-to-pdf"
        $imageTag = "v1"
        
        Set-Location "$WORKSPACE_ROOT\changedoc\converttopdf"
        Write-Info "Dockerイメージビルド中..."
        docker build --build-arg _PROXY="" -t "${imageName}:${imageTag}" -f Dockerfile .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Dockerイメージビルド失敗"
        } else {
            # イメージプッシュ
            Write-Info "イメージプッシュ中..."
            docker push "${imageName}:${imageTag}"
            
            if ($LASTEXITCODE -eq 0) {
                # Function App設定更新
                Write-Info "Function App設定更新中..."
                az functionapp config container set `
                    --name $FUNCTION_PDF_NAME `
                    --resource-group $RESOURCE_GROUP `
                    --docker-custom-image-name "${imageName}:${imageTag}" `
                    --docker-registry-server-url "https://$ACR_NAME.azurecr.io"
                
                # Function App起動
                Write-Info "PDF Function App起動中..."
                az functionapp start --name $FUNCTION_PDF_NAME --resource-group $RESOURCE_GROUP
                
                Write-Success "08: PDF (Docker) デプロイ完了"
                $deployedCount++
            } else {
                Write-Error-Custom "Dockerイメージプッシュ失敗"
            }
        }
    } catch {
        Write-Error-Custom "PDF Function Appデプロイ中にエラー: $($_.Exception.Message)"
    }
    
    Set-Location $WORKSPACE_ROOT
    
    Write-Success "Backend Function Apps デプロイ完了: $deployedCount/$totalCount"
} else {
    Write-Info "Backend Function Apps デプロイをスキップ"
}

# ============================================
# Phase 2: Terraform Core 再適用 (init_flag=false)
# ============================================
if (-not $SkipPhase2) {
    Write-Section "Phase 2: Terraform Core 再適用 (プライベートエンドポイント化)"
    
    Set-Location $TERRAFORM_CORE_DIR
    
    Write-Info "Terraform Plan実行中（init_flag=false）..."
    terraform plan `
        -var="tenant_id=$TENANT_ID" `
        -var="subscription_id=$SUBSCRIPTION_ID" `
        -var="environment_prefix=$ENVIRONMENT_PREFIX" `
        -var="init_flag=false" `
        -out=tfplan-phase2
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform plan (Phase 2) 失敗"
        exit 1
    }
    
    Write-Info "Terraform Apply実行中（プライベートエンドポイント作成）..."
    terraform apply -input=false tfplan-phase2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform Core (Phase 2) 完了 - プライベートエンドポイント化済み"
    } else {
        Write-Error-Custom "Terraform apply (Phase 2) 失敗"
        exit 1
    }
    
    Remove-Item tfplan-phase2 -ErrorAction SilentlyContinue
    Set-Location $WORKSPACE_ROOT
} else {
    Write-Info "Phase 2 (プライベートエンドポイント化) をスキップ"
}

# ============================================
# Terraform AI Service デプロイ
# ============================================
if (-not $SkipTerraformAI) {
    Write-Section "Terraform AI Service デプロイ"
    
    Set-Location $TERRAFORM_AI_DIR
    
    Write-Info "Terraform初期化中..."
    terraform init -input=false -upgrade
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform init (AI Service) 失敗"
        exit 1
    }
    
    Write-Info "Terraform検証中..."
    terraform validate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform validate (AI Service) 失敗"
        exit 1
    }
    
    Write-Info "Terraform Plan実行中..."
    terraform plan `
        -var="tenant_id=$TENANT_ID" `
        -var="subscription_id=$SUBSCRIPTION_ID" `
        -var="environment_prefix=$ENVIRONMENT_PREFIX" `
        -out=tfplan-ai
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Terraform plan (AI Service) 失敗"
        exit 1
    }
    
    Write-Info "Terraform Apply実行中..."
    terraform apply -input=false tfplan-ai
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform AI Service デプロイ完了"
    } else {
        Write-Error-Custom "Terraform apply (AI Service) 失敗"
        exit 1
    }
    
    Remove-Item tfplan-ai -ErrorAction SilentlyContinue
    Set-Location $WORKSPACE_ROOT
} else {
    Write-Info "Terraform AI Service デプロイをスキップ"
}

# ============================================
# 完了
# ============================================
Write-Section "デプロイ完了"

Write-Success "全てのデプロイが完了しました"

Write-Host "`n📊 デプロイ概要:" -ForegroundColor Cyan
if (-not $SkipTerraformCore) {
    Write-Host "  ✅ Terraform Core (Phase 1): パブリックアクセス有効化" -ForegroundColor Green
}
if (-not $SkipFrontend) {
    Write-Host "  ✅ Frontend: デプロイ完了" -ForegroundColor Green
}
if (-not $SkipLoadBalancer) {
    Write-Host "  ✅ Load Balancer: デプロイ完了" -ForegroundColor Green
}
if (-not $SkipBackend) {
    Write-Host "  ✅ Backend Function Apps: デプロイ完了" -ForegroundColor Green
}
if (-not $SkipPhase2) {
    Write-Host "  ✅ Terraform Core (Phase 2): プライベートエンドポイント化" -ForegroundColor Green
}
if (-not $SkipTerraformAI) {
    Write-Host "  ✅ Terraform AI Service: デプロイ完了" -ForegroundColor Green
}

Write-Host "`n🔗 リソース情報:" -ForegroundColor Cyan
Write-Host "  Resource Group: $RESOURCE_GROUP" -ForegroundColor Gray
if (-not $SkipFrontend) {
    Write-Host "  Frontend: https://$FRONTEND_APP_NAME.azurewebsites.net" -ForegroundColor Gray
}
if (-not $SkipLoadBalancer) {
    Write-Host "  Load Balancer: https://$LOADBALANCER_APP_NAME.azurewebsites.net" -ForegroundColor Gray
}

Write-Host "`n📝 次のステップ:" -ForegroundColor Yellow
Write-Host "  1. Azure Portalで各サービスの状態を確認" -ForegroundColor Gray
Write-Host "  2. Frontendアプリケーションにアクセスして動作確認" -ForegroundColor Gray
Write-Host "  3. Azure AI Searchのインデックス作成・データ投入" -ForegroundColor Gray
Write-Host "  4. 必要に応じてログとメトリクスを確認" -ForegroundColor Gray
