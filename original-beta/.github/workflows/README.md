# GitHub Actions ワークフロー

このディレクトリには、CI/CDパイプラインのGitHub Actionsワークフロー定義が含まれます。インフラデプロイ（Terraform）、フロントエンド・バックエンドのテスト・デプロイを自動化します。

## ワークフロー概要

4つのワークフローで構成され、それぞれ異なる責務を持ちます。

**用途**:
- インフラストラクチャのデプロイ（Terraform）
- フロントエンド・バックエンドのテスト実行
- アプリケーションコードのビルド・デプロイ

**特徴**:
- OIDC認証によるAzureログイン（シークレット不要）
- ネットワークアクセス制御の自動管理（Private Endpointとパブリックアクセスの切り替え）
- Phase 1（初回構築）とPhase 2（更新）の分離
- 並列テスト実行（matrix strategy）

---

## システム全体での役割

「CI/CD自動化層」として、コード変更からデプロイまでを自動化します。

**ワークフローの関係**:
```
コード変更（push/PR）
  ↓
backend-tests.yml（backend/**変更時、PRでテスト実行）
frontend-tests.yml（frontend/**変更時、PRでテスト実行）
  ↓（マージ後）
terraform-ci-cd.yml（infra/**変更時、初回構築用、Phase 1+2統合デプロイ）
  - Phase 1: init_flag=true でパブリックアクセス有効化してインフラ構築
  - アプリケーションビルド・デプロイ
  - Phase 2: init_flag=false でセキュリティ強化（パブリックアクセス無効化）
  ↓（2回目以降の更新）
terraform-infra.yml（infra/**変更時、既存環境更新用、Phase 2のみ実行）
  - init_flag=false で既存インフラ設定変更
  - アプリケーションデプロイは実施しない（別途手動デプロイ必要）
```

**重要性**: ワークフロー失敗 → デプロイ停止。ネットワークアクセス制御失敗 → セキュリティリスク。

---

## 設計思想

### 責務範囲と境界

**各ワークフローの担当**:
- `backend-tests.yml`: バックエンド（Python Function Apps）のテスト実行のみ
- `frontend-tests.yml`: フロントエンド（Node.js）のテスト実行のみ
- `terraform-ci-cd.yml`: 初回構築（Phase 1+2統合）+ アプリデプロイ
- `terraform-infra.yml`: 2回目以降のインフラ更新（Phase 2のみ）、アプリデプロイなし

**分離理由**: 初回構築（時間がかかる）と更新（頻繁）でワークフローを分離し、実行時間を最適化。テストは変更箇所のみ実行してフィードバック速度向上。

### 変更時の注意

⚠️ **トリガー条件（paths）変更**: 意図しないワークフロー実行 or 必要時に実行されない  
⚠️ **init_flag変更**: Phase 1/2の制御が変わる → デプロイ失敗  
⚠️ **ネットワークアクセス制御削除**: セキュリティリスク（パブリックアクセス有効のまま）  
⚠️ **Azure Login (OIDC)削除**: 認証失敗 → デプロイ不可  
⚠️ **並列実行数（parallelism）変更**: Azure APIレート制限超過 → デプロイ失敗

---

## 主なワークフロー

### 1. backend-tests.yml
バックエンド（Python Function Apps）のテストを実行。

**トリガー**: 
- PR作成時（`backend/**`変更時）
- 対象ブランチ: `feature/xxx`

**実行内容**:
- Python 3.12環境でpytest実行
- orchestratorのテスト実行
- タイムアウト: 30分

### 2. frontend-tests.yml
フロントエンド（Node.js）のテストを実行。

**トリガー**: 
- PR作成時（`frontend/**`変更時）
- 対象ブランチ: `feature/xxx`

**実行内容**:
- Node.js 20環境でJestテスト実行
- タイムアウト: 15分

### 3. terraform-ci-cd.yml
初回構築用。インフラ（Terraform）+ アプリケーション（Frontend + Backend）の統合デプロイ。

**トリガー**: 
- push時（`infra/**`変更時）
- 対象ブランチ: `feature/xxx`

**実行内容**:
- Phase 1: `init_flag=true`でインフラ構築（パブリックアクセス有効化）
- アプリケーションビルド・デプロイ（Frontend + Backend）
- Phase 2: `init_flag=false`でセキュリティ強化（パブリックアクセス無効化）
- タイムアウト: 180分

**Phase 1とPhase 2の違い**:
- Phase 1: 初回構築、パブリックネットワークアクセス有効化、アプリデプロイ可能状態を構築
- Phase 2: セキュリティ強化、パブリックアクセス無効化、Private Endpointのみ許可

### 4. terraform-infra.yml
2回目以降の更新用。インフラ（Terraform）設定変更のみ。アプリデプロイなし。

**トリガー**: 
- push時（`infra/**`変更時）
- 対象ブランチ: `feature/SER-2-IaC`

**実行内容**:
- `init_flag=false`で既存インフラ設定変更
- Key Vaultシークレット更新（Function App Host Keys等）
- 環境変数再設定（テンプレートファイルから）
- Azure AI Searchスキーマデプロイ
- ネットワークアクセス一時開放・復元の自動制御
- タイムアウト: 180分

**前提条件**:
- 初回構築（`terraform-ci-cd.yml`）が完了していること
- Function Appsにアプリケーションがデプロイ済みであること
- 既存のTerraform Stateが存在すること

⚠️ **重要**: このワークフローはアプリケーションコードをデプロイしません。アプリ更新が必要な場合は別途デプロイ作業を実施してください。

---

## トリガー条件

| ワークフロー | トリガー | ブランチ | パス条件 |
|------------|---------|---------|---------|
| `backend-tests.yml` | pull_request | `feature/xxx` | `backend/**` |
| `frontend-tests.yml` | pull_request | `feature/xxx` | `frontend/**` |
| `terraform-ci-cd.yml` | push | `feature/xxx` | `infra/**` |
| `terraform-infra.yml` | push | `feature/SER-2-IaC` | `infra/**` |

⚠️ **変更時の影響**:
- `paths`変更 → トリガー条件変更 → 意図しない実行 or 実行されない
- `branches`変更 → 対象ブランチ変更 → 開発フロー影響

---

## 必要なSecrets

**Azure認証（OIDC）**:
- `TRIAL98_ARM_CLIENT_ID`: Azure Service Principal Client ID
- `TRIAL98_ARM_TENANT_ID`: Azure Tenant ID
- `TRIAL98_ARM_SUBSCRIPTION_ID`: Azure Subscription ID

**Frontend認証**:
- `TRIAL98_FRONTEND_AUTH_CLIENT_ID`: Azure AD Application Client ID
- `TRIAL98_FRONTEND_AUTH_CLIENT_SECRET`: Azure AD Application Client Secret

⚠️ **重要**: SecretsはGitHub Settings → Secrets and variablesで管理。削除・変更 → 認証失敗 → デプロイ不可。

---

## 環境変数

**共通設定**:
- `TF_VERSION`: Terraform バージョン（`1.14.3`）
- `WORKDIR_CORE`: coreディレクトリパス（`infra/tenant/hisys/trial/core`）
- `WORKDIR_AI`: ai_serviceディレクトリパス（`infra/tenant/hisys/trial/ai_service`）
- `ARM_USE_OIDC`: OIDC認証有効化（`true`）

**Azure AI Search**:
- `SCHEMAS_DIR`: スキーマディレクトリパス（`infra/tenant/sst-harc/trial/ai_service/schemas`）

---

## 依存関係

### 外部依存
- **GitHub Actions**: actions/checkout@v4、actions/setup-node@v4、actions/setup-python@v5、hashicorp/setup-terraform@v3、azure/login@v2
- **Azure CLI**: ネットワークアクセス制御、リソース情報取得
- **Terraform**: インフラデプロイ（v1.14.3）
- **Python**: バックエンドテスト（v3.12）
- **Node.js**: フロントエンドテスト・ビルド（v20）

### ワークフロー間の依存
- `terraform-infra.yml`は`terraform-ci-cd.yml`の初回実行完了が前提
- テストワークフロー（backend-tests、frontend-tests）は独立

---

## Copilot向け注意事項

### 1. 責務を越える変更禁止
各ワークフローは明確な責務を持つ。`backend-tests.yml`にインフラデプロイ処理を追加しない。

### 2. トリガー条件は慎重に変更
`paths`、`branches`変更 → ワークフロー実行タイミング変更 → 開発フロー影響。

### 3. init_flagの意味を理解
`init_flag=true`（Phase 1、パブリックアクセス有効）と`init_flag=false`（Phase 2、セキュリティ強化）の違いを理解。誤った設定 → セキュリティリスク。

### 4. ネットワークアクセス制御は削除禁止
ネットワークアクセス一時開放・復元の処理は、Terraform実行とセキュリティ維持の両立に必須。削除 → セキュリティリスク。

### 5. Secrets変更は慎重に
Secrets名変更 → 認証失敗 → デプロイ不可。変更時は必ずGitHub Settingsも更新。

### 6. タイムアウト設定を理解
`terraform-ci-cd.yml`と`terraform-infra.yml`は180分（インフラデプロイは時間がかかる）。安易な短縮 → デプロイ途中でタイムアウト。

### 7. 並列実行数（parallelism）変更禁止
Terraform `parallelism=5`はAzure APIレート制限を考慮。増やすとレート制限超過。

---

## 動作確認観点

### 1. ワークフロー構文確認
- YAMLシンタックスエラーがないこと
- GitHub Actionsのlinterでチェック

### 2. トリガー条件確認
- 意図したブランチ・パスでトリガーされること
- 不要なトリガーがないこと

### 3. Secrets確認
- 必要なSecretsがGitHub Settingsで設定されていること
- Secrets名がワークフロー内の参照と一致すること

### 4. テストワークフロー確認（PR作成時）
- `backend-tests.yml`: backend変更時にテスト実行
- `frontend-tests.yml`: frontend変更時にテスト実行
- テスト結果がPRに表示されること

### 5. デプロイワークフロー確認（初回）
- `terraform-ci-cd.yml`: Phase 1 → アプリデプロイ → Phase 2の順序で実行
- Azureポータルでリソースが作成されていること
- パブリックアクセスが無効化されていること（Phase 2完了後）

### 6. デプロイワークフロー確認（2回目以降）
- `terraform-infra.yml`: 既存リソースに設定変更が適用されること
- ネットワークアクセス一時開放・復元が正常動作すること
- アプリケーションコードはデプロイされないこと（意図通り）

### 7. ロールバック時の確認
- ワークフロー失敗時、ネットワークアクセス制御が正常に復元されること
- タイムアウト時、リソースが中途半端な状態にならないこと
