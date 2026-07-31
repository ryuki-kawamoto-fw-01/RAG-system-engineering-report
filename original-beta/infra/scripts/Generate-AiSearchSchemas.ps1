<#
.SYNOPSIS
AI Search スキーマ生成スクリプト

.DESCRIPTION
テンプレート(.json.tpl)から environment_prefix と subscription_id を置換してJSONファイルを生成します。
このスクリプトは環境構築時の事前準備として実行してください。

.PARAMETER EnvironmentPrefix
環境プレフィックス（必須）

.PARAMETER SubscriptionId
AzureサブスクリプションID（必須）

.PARAMETER SchemasPath
スキーマディレクトリのパス（デフォルト: hisys/trial/ai_service/schemas）

.PARAMETER TargetDirectories
対象ディレクトリ（デフォルト: indexes, knowledge-bases, skillsets, datasources, indexers）

.EXAMPLE
.\Generate-AiSearchSchemas.ps1 -EnvironmentPrefix 97 -SubscriptionId "42d397c4-592f-46d7-bfd8-bb585816cef6"

.EXAMPLE
.\Generate-AiSearchSchemas.ps1 -EnvironmentPrefix 97 -SubscriptionId "42d397c4-592f-46d7-bfd8-bb585816cef6" -TargetDirectories @("indexes", "skillsets", "knowledge-bases", "datasources", "indexers")
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$EnvironmentPrefix,
    
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [string]$SchemasPath = "$PSScriptRoot\hisys\trial\ai_service\schemas",
    [string[]]$TargetDirectories = @("indexes", "knowledge-bases", "skillsets", "datasources", "indexers")
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Search スキーマ生成スクリプト" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment Prefix : $EnvironmentPrefix" -ForegroundColor White
Write-Host "Subscription ID    : $SubscriptionId" -ForegroundColor White
Write-Host "Schemas Path       : $SchemasPath" -ForegroundColor White
Write-Host "Target Directories : $($TargetDirectories -join ', ')" -ForegroundColor White
Write-Host ""

$totalGeneratedCount = 0
$totalErrorCount = 0

foreach ($targetDir in $TargetDirectories) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  処理中: $targetDir" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # スキーマディレクトリの存在確認
    $targetPath = Join-Path $SchemasPath $targetDir

    if (-not (Test-Path $targetPath)) {
        Write-Host "⚠️  スキップ: ディレクトリが見つかりません: $targetPath" -ForegroundColor Yellow
        Write-Host ""
        continue
    }

    # テンプレートファイルを検索
    $templateFiles = Get-ChildItem -Path $targetPath -Filter "*.json.tpl" -File

    if ($templateFiles.Count -eq 0) {
        Write-Host "⚠️  スキップ: テンプレートファイル (*.json.tpl) が見つかりませんでした" -ForegroundColor Yellow
        Write-Host "   検索パス: $targetPath" -ForegroundColor Gray
        Write-Host ""
        continue
    }

    $generatedCount = 0
    $errorCount = 0

    foreach ($tplFile in $templateFiles) {
        try {
            $relativePath = $tplFile.Name
            Write-Host "  処理: $relativePath" -ForegroundColor Gray
            
            # テンプレート読み込み（UTF-8 BOM付き対応）
            $tplContent = Get-Content $tplFile.FullName -Raw -Encoding UTF8
            
            # 変数置換（シンプルな文字列置換を使用）
            $replacedContent = $tplContent.Replace('${environment_prefix}', $EnvironmentPrefix)
            $replacedContent = $replacedContent.Replace('${subscription_id}', $SubscriptionId)
            
            # 出力ファイル名（.tpl を削除）
            $outputFileName = $tplFile.Name.Replace('.tpl', '')
            $outputFile = Join-Path $tplFile.Directory $outputFileName
            
            # JSONファイルとして出力（UTF-8 BOMなし）
            [System.IO.File]::WriteAllText($outputFile, $replacedContent, [System.Text.UTF8Encoding]::new($false))
            
            Write-Host "    → 生成: $outputFileName" -ForegroundColor Green
            
            $generatedCount++
        }
        catch {
            Write-Host "    ✗ エラー: $_" -ForegroundColor Red
            $errorCount++
        }
    }

    $totalGeneratedCount += $generatedCount
    $totalErrorCount += $errorCount

    Write-Host ""
    Write-Host "  $targetDir - 生成完了: $generatedCount ファイル" -ForegroundColor Green
    if ($errorCount -gt 0) {
        Write-Host "  $targetDir - エラー  : $errorCount ファイル" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  処理結果" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  生成完了: $totalGeneratedCount ファイル" -ForegroundColor Green

if ($totalErrorCount -gt 0) {
    Write-Host "  エラー  : $totalErrorCount ファイル" -ForegroundColor Red
}

Write-Host ""

if ($totalErrorCount -eq 0) {
    Write-Host "✅ スキーマ生成が正常に完了しました" -ForegroundColor Green
    Write-Host ""
    Write-Host "次のステップ:" -ForegroundColor Cyan
    Write-Host "  1. 生成されたJSONファイルを確認" -ForegroundColor White
    Write-Host "  2. git add && git commit でコミット" -ForegroundColor White
    Write-Host "  3. Terraform apply を実行してインフラをデプロイ" -ForegroundColor White
    Write-Host "  4. ai_search.py を実行してスキーマをデプロイ" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  一部のファイルでエラーが発生しました" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}