#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Azure AI Search デプロイスクリプト

このスクリプトは、指定されたディレクトリ配下の JSON ファイルを検出し、
Azure AI Search（データプレーン）に SDK（azure-search-documents）を使用して
idempotent にデプロイ（作成/更新）します。

対象リソース:
  - indexes/*.json              → Search Index (SDK)
  - skillsets/*.json            → Skillset (SDK)
  - datasources/*.json          → datasources (SDK)
  - indexers/*.json             → indexers (SDK)
  - knowledge-sources/*.json    → knowledgeSources (REST API, プレビュー)
  - knowledge-bases/*.json      → knowledgeBases (REST API, プレビュー)

認証: AAD (DefaultAzureCredential) のみ使用

Usage:
  SERVICE_NAME=genashi-trial-search \
  python original/infra/scripts/ai_search.py \
    --schemas-dir original/infra/tenant/sst-harc/trial/ai_service/schemas \
    --verbose

  または環境変数で指定:
  export SERVICE_NAME=genashi-trial-search
  export SCHEMAS_DIR=original/infra/tenant/sst-harc/trial/ai_service/schemas
  python original/infra/scripts/ai_search.py --verbose --dry-run

必須パラメータ:
  --service-name または SERVICE_NAME: Azure AI Search サービス名

オプション:
  --schemas-dir: スキーマディレクトリのパス (デフォルト: original/infra/tenant/sst-harc/trial/ai_service/schemas)
  --resource-group: リソースグループ名 (ログ出力用)
  --subscription-id: サブスクリプションID (ログ出力用)
  --map: リソースマッピング (例: "my-sources=knowledgesources")
  --dry-run: 実際のデプロイを行わずに検証のみ
  --verbose: 詳細なログ出力
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

import requests
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError, ResourceNotFoundError
from azure.identity import DefaultAzureCredential
from azure.search.documents.indexes import SearchIndexClient, SearchIndexerClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SearchIndexer,
    SearchIndexerDataSourceConnection,
    SearchIndexerSkillset,
)


# ログ設定
logger = logging.getLogger(__name__)


class DeploymentStats:
    """デプロイ統計情報"""

    def __init__(self) -> None:
        self.created: int = 0
        self.updated: int = 0
        self.skipped: int = 0
        self.failed: int = 0
        self.created_resources: List[str] = []
        self.updated_resources: List[str] = []
        self.skipped_resources: List[str] = []
        self.failed_resources: List[str] = []

    def record_created(self, resource_name: str) -> None:
        self.created += 1
        self.created_resources.append(resource_name)

    def record_updated(self, resource_name: str) -> None:
        self.updated += 1
        self.updated_resources.append(resource_name)

    def record_skipped(self, resource_name: str) -> None:
        self.skipped += 1
        self.skipped_resources.append(resource_name)

    def record_failed(self, resource_name: str) -> None:
        self.failed += 1
        self.failed_resources.append(resource_name)

    def has_failures(self) -> bool:
        return self.failed > 0

    def log_summary(self) -> None:
        """デプロイ結果のサマリをログ出力"""
        logger.info("=" * 60)
        logger.info("デプロイ結果サマリ:")
        logger.info(f"  作成: {self.created}")
        logger.info(f"  更新: {self.updated}")
        logger.info(f"  スキップ: {self.skipped}")
        logger.info(f"  失敗: {self.failed}")
        
        if self.created_resources:
            logger.info("  作成されたリソース:")
            for resource in self.created_resources:
                logger.info(f"    - {resource}")
        
        if self.updated_resources:
            logger.info("  更新されたリソース:")
            for resource in self.updated_resources:
                logger.info(f"    - {resource}")
        
        if self.skipped_resources:
            logger.info("  スキップされたリソース:")
            for resource in self.skipped_resources:
                logger.info(f"    - {resource}")
        
        if self.failed_resources:
            logger.info("  失敗したリソース:")
            for resource in self.failed_resources:
                logger.info(f"    - {resource}")
        
        logger.info("=" * 60)


class AzureSearchDeployer:
    """Azure AI Search リソースデプロイヤー"""

    # デフォルトのリソースタイプマッピング
    DEFAULT_RESOURCE_MAP = {
        "indexes": "indexes",
        "skillsets": "skillsets",
        "datasources": "datasources",
        "indexers": "indexers",
        "knowledge-sources": "knowledgesources",
        "knowledge-bases": "knowledgeagents",
    }

    # 処理順序（依存関係を考慮）
    PROCESSING_ORDER = [
        "datasources",
        "skillsets",
        "indexes",
        "indexers",
        "knowledgesources",
        "knowledgeagents", # knowledge-basesに対応
    ]

    # API バージョン - 最新プレビュー版を使用してすべてのプロパティをサポート
    API_VERSION = "2025-11-01-preview"  # Indexes用（normalizers, flightingOptIn等すべてサポート）
    # Knowledge Sources用API バージョン
    KNOWLEDGE_SOURCE_API_VERSION = "2025-11-01-preview"
    # Knowledge Agents用API バージョン
    KNOWLEDGE_AGENT_API_VERSION = "2025-11-01-preview"

    def __init__(
        self,
        service_name: str,
        schemas_dir: Path,
        resource_map: Optional[Dict[str, str]] = None,
        dry_run: bool = False,
        verbose: bool = False,
        resource_group: Optional[str] = None,
        subscription_id: Optional[str] = None,
    ) -> None:
        self.service_name = service_name
        self.schemas_dir = schemas_dir
        self.resource_map = resource_map or self.DEFAULT_RESOURCE_MAP
        self.dry_run = dry_run
        self.verbose = verbose
        self.resource_group = resource_group
        self.subscription_id = subscription_id
        self.stats = DeploymentStats()

        # エンドポイント構築
        self.endpoint = f"https://{service_name}.search.windows.net"

        # 認証設定
        self.credential = DefaultAzureCredential()

        # クライアント初期化
        self.index_client = SearchIndexClient(
            endpoint=self.endpoint, credential=self.credential
        )
        self.indexer_client = SearchIndexerClient(
            endpoint=self.endpoint, credential=self.credential
        )

        # RBAC ヒント出力
        if self.resource_group and self.subscription_id:
            logger.info(
                f"RBAC ヒント: Subscription={self.subscription_id}, "
                f"ResourceGroup={self.resource_group}, Service={self.service_name}"
            )

    def _get_access_token(self) -> str:
        """Azure アクセストークンを取得"""
        token = self.credential.get_token("https://search.azure.com/.default")
        return token.token

    def _call_rest_api(
        self, method: str, url: str, body: Optional[Dict[str, Any]] = None
    ) -> Tuple[int, Dict[str, Any]]:
        """REST API を呼び出し（ステータスコードとレスポンスボディを返す）"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._get_access_token()}",
        }

        logger.debug(f"REST API: {method} {url}")
        
        if method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=body, timeout=30)
        elif method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"サポートされていないHTTPメソッド: {method}")

        # GETで404はリソースが存在しないことを意味するのでエラーとしない
        if method.upper() == "GET" and response.status_code == 404:
            return (response.status_code, {})
        
        if response.status_code not in (200, 201, 204):
            logger.error(f"REST API エラー: {response.status_code} - {response.text}")
            response.raise_for_status()

        if response.status_code == 204:
            return (response.status_code, {})
        
        result = response.json() if response.text else {}
        return (response.status_code, result)

    def discover_json_files(self) -> Dict[str, List[Path]]:
        """スキーマディレクトリからJSONファイルを検出"""
        discovered: Dict[str, List[Path]] = {}

        if not self.schemas_dir.exists():
            logger.warning(f"スキーマディレクトリが存在しません: {self.schemas_dir}")
            return discovered

        # 各ディレクトリタイプを走査
        for dir_name, resource_type in self.resource_map.items():
            dir_path = self.schemas_dir / dir_name
            if not dir_path.exists():
                logger.debug(f"ディレクトリが存在しません: {dir_path}")
                continue

            json_files = list(dir_path.glob("*.json"))
            if json_files:
                discovered[resource_type] = json_files
                logger.info(
                    f"検出: {resource_type} - {len(json_files)} ファイル ({dir_name}/)"
                )
            else:
                logger.debug(f"{dir_name}/ 配下にJSONファイルが見つかりませんでした")

        return discovered

    def load_json_file(self, file_path: Path) -> Dict[str, Any]:
        """JSONファイルを読み込み、辞書として返す"""
        try:
            with open(file_path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                raise ValueError("JSONファイルはオブジェクト（辞書）である必要があります")
            return data
        except Exception as e:
            logger.error(f"JSONファイル読み込みエラー {file_path}: {e}")
            raise

    def deploy_index(self, json_data: Dict[str, Any], file_path: Path) -> None:
        """Search Index をデプロイ (REST API使用)"""
        resource_name = f"index:{file_path.stem}"
        try:
            if "name" not in json_data:
                raise ValueError("'name' プロパティが必須です")

            index_name = json_data["name"]
            resource_name = f"index:{index_name}"

            if self.dry_run:
                logger.info(f"[DRY-RUN] インデックス作成/更新: {index_name}")
                self.stats.record_skipped(resource_name)
                return

            # 存在確認
            is_new = True  # デフォルトは新規作成とする
            try:
                get_url = f"{self.endpoint}/indexes('{index_name}')?api-version={self.API_VERSION}"
                status_code, _ = self._call_rest_api("GET", get_url)
                if status_code == 404:
                    is_new = True
                else:
                    # リソースが存在する
                    is_new = False
            except Exception as e:
                # エラーの場合は新規作成として扱う
                logger.debug(f"リソース存在確認エラー ({index_name}): {e}")
                is_new = True

            logger.info(f"インデックスをデプロイ中: {index_name}")
            
            # REST APIで直接デプロイ（JSONをそのまま送信）
            url = f"https://{self.service_name}.search.windows.net/indexes('{index_name}')?api-version={self.API_VERSION}"
            status_code, result = self._call_rest_api("PUT", url, json_data)

            logger.info(f"インデックスをデプロイしました: {index_name}")
            
            # 事前確認で判定
            if is_new:
                self.stats.record_created(resource_name)
            else:
                self.stats.record_updated(resource_name)

        except Exception as e:
            logger.error(f"インデックスデプロイ失敗 ({file_path.name}): {e}")
            self.stats.record_failed(resource_name)
            raise

    def deploy_datasource(self, json_data: Dict[str, Any], file_path: Path) -> None:
        """Data Source をデプロイ (REST API使用)"""
        resource_name = f"datasource:{file_path.stem}"
        try:
            if "name" not in json_data:
                raise ValueError("'name' プロパティが必須です")

            datasource_name = json_data["name"]
            resource_name = f"datasource:{datasource_name}"

            if self.dry_run:
                logger.info(f"[DRY-RUN] データソース作成/更新: {datasource_name}")
                self.stats.record_skipped(resource_name)
                return

            # 存在確認
            is_new = True  # デフォルトは新規作成とする
            try:
                get_url = f"{self.endpoint}/datasources('{datasource_name}')?api-version={self.API_VERSION}"
                status_code, _ = self._call_rest_api("GET", get_url)
                if status_code == 404:
                    is_new = True
                else:
                    # リソースが存在する
                    is_new = False
            except Exception as e:
                # エラーの場合は新規作成として扱う
                logger.debug(f"リソース存在確認エラー ({datasource_name}): {e}")
                is_new = True

            logger.info(f"データソースをデプロイ中: {datasource_name}")
            
            # REST APIで直接デプロイ（JSONをそのまま送信）
            url = f"{self.endpoint}/datasources('{datasource_name}')?api-version={self.API_VERSION}"
            status_code, result = self._call_rest_api("PUT", url, json_data)

            logger.info(f"データソースをデプロイしました: {datasource_name}")
            
            # 事前確認で判定
            if is_new:
                self.stats.record_created(resource_name)
            else:
                self.stats.record_updated(resource_name)

        except Exception as e:
            logger.error(f"データソースデプロイ失敗 ({file_path.name}): {e}")
            self.stats.record_failed(resource_name)
            raise

    def deploy_skillset(self, json_data: Dict[str, Any], file_path: Path) -> None:
        """Skillset をデプロイ"""
        resource_name = f"skillset:{file_path.stem}"
        try:
            if "name" not in json_data:
                raise ValueError("'name' プロパティが必須です")

            skillset = SearchIndexerSkillset(**json_data)
            resource_name = f"skillset:{skillset.name}"

            if self.dry_run:
                logger.info(f"[DRY-RUN] スキルセット作成/更新: {skillset.name}")
                self.stats.record_skipped(resource_name)
                return

            # 存在確認
            is_new = True  # デフォルトは新規作成とする
            try:
                self.indexer_client.get_skillset(skillset.name)
                # 例外が発生しなかった = リソースが存在する
                is_new = False
            except ResourceNotFoundError:
                # リソースが見つからない = 新規作成
                is_new = True
            except Exception as e:
                # その他のエラーの場合は、新規作成として扱う
                logger.debug(f"リソース存在確認エラー ({skillset.name}): {e}")
                is_new = True

            logger.info(f"スキルセットをデプロイ中: {skillset.name}")
            result = self.indexer_client.create_or_update_skillset(skillset)

            logger.info(f"スキルセットをデプロイしました: {result.name}")
            if is_new:
                self.stats.record_created(resource_name)
            else:
                self.stats.record_updated(resource_name)

        except Exception as e:
            logger.error(f"スキルセットデプロイ失敗 ({file_path.name}): {e}")
            self.stats.record_failed(resource_name)
            raise

    def deploy_indexer(self, json_data: Dict[str, Any], file_path: Path) -> None:
        """Indexer をデプロイ (REST API使用)"""
        resource_name = f"indexer:{file_path.stem}"
        try:
            if "name" not in json_data:
                raise ValueError("'name' プロパティが必須です")

            indexer_name = json_data["name"]
            resource_name = f"indexer:{indexer_name}"

            if self.dry_run:
                logger.info(f"[DRY-RUN] インデクサー作成/更新: {indexer_name}")
                self.stats.record_skipped(resource_name)
                return

            # 存在確認
            is_new = True  # デフォルトは新規作成とする
            try:
                get_url = f"{self.endpoint}/indexers('{indexer_name}')?api-version={self.API_VERSION}"
                status_code, _ = self._call_rest_api("GET", get_url)
                if status_code == 404:
                    is_new = True
                else:
                    # リソースが存在する
                    is_new = False
            except Exception as e:
                # エラーの場合は新規作成として扱う
                logger.debug(f"リソース存在確認エラー ({indexer_name}): {e}")
                is_new = True

            logger.info(f"インデクサーをデプロイ中: {indexer_name}")
            
            # REST APIで直接デプロイ（JSONをそのまま送信）
            url = f"{self.endpoint}/indexers('{indexer_name}')?api-version={self.API_VERSION}"
            status_code, result = self._call_rest_api("PUT", url, json_data)

            logger.info(f"インデクサーをデプロイしました: {indexer_name}")
            
            # 事前確認で判定
            if is_new:
                self.stats.record_created(resource_name)
            else:
                self.stats.record_updated(resource_name)

        except Exception as e:
            logger.error(f"インデクサーデプロイ失敗 ({file_path.name}): {e}")
            self.stats.record_failed(resource_name)
            raise

    def deploy_knowledge_source(self, json_data: Dict[str, Any], file_path: Path) -> None:
        """Knowledge Source をデプロイ（REST API 使用）"""
        resource_name = f"knowledgesource:{file_path.stem}"
        try:
            if "name" not in json_data:
                raise ValueError("'name' プロパティが必須です")

            name = json_data["name"]
            resource_name = f"knowledgesource:{name}"

            if self.dry_run:
                logger.info(f"[DRY-RUN] ナレッジソース作成/更新: {name}")
                self.stats.record_skipped(resource_name)
                return

            # 存在確認
            is_new = True  # デフォルトは新規作成とする
            try:
                get_url = f"{self.endpoint}/knowledgesources('{name}')?api-version={self.KNOWLEDGE_SOURCE_API_VERSION}"
                status_code, _ = self._call_rest_api("GET", get_url)
                if status_code == 404:
                    is_new = True
                else:
                    # リソースが存在する
                    is_new = False
            except Exception as e:
                # エラーの場合は新規作成として扱う
                logger.debug(f"リソース存在確認エラー ({name}): {e}")
                is_new = True

            logger.info(f"ナレッジソースをデプロイ中: {name}")
            
            url = (
                f"{self.endpoint}/knowledgesources('{name}')"
                f"?api-version={self.KNOWLEDGE_SOURCE_API_VERSION}"
            )
            
            status_code, result = self._call_rest_api("PUT", url, json_data)

            logger.info(f"ナレッジソースをデプロイしました: {name}")
            
            # 事前確認で判定
            if is_new:
                self.stats.record_created(resource_name)
            else:
                self.stats.record_updated(resource_name)

        except Exception as e:
            logger.error(f"ナレッジソースデプロイ失敗 ({file_path.name}): {e}")
            self.stats.record_failed(resource_name)
            raise

    def deploy_knowledge_agent(self, json_data: Dict[str, Any], file_path: Path) -> None:
        """Knowledge Base をデプロイ（REST API 使用）"""
        resource_name = f"knowledgebase:{file_path.stem}"
        try:
            if "name" not in json_data:
                raise ValueError("'name' プロパティが必須です")

            name = json_data["name"]
            resource_name = f"knowledgebase:{name}"

            if self.dry_run:
                logger.info(f"[DRY-RUN] ナレッジベース作成/更新: {name}")
                self.stats.record_skipped(resource_name)
                return

            # 存在確認
            is_new = True  # デフォルトは新規作成とする
            try:
                get_url = f"{self.endpoint}/knowledgebases('{name}')?api-version={self.KNOWLEDGE_AGENT_API_VERSION}"
                status_code, _ = self._call_rest_api("GET", get_url)
                if status_code == 404:
                    is_new = True
                else:
                    # リソースが存在する
                    is_new = False
            except Exception as e:
                # エラーの場合は新規作成として扱う
                logger.debug(f"リソース存在確認エラー ({name}): {e}")
                is_new = True

            logger.info(f"ナレッジベースをデプロイ中: {name}")
            
            url = (
                f"{self.endpoint}/knowledgebases('{name}')"
                f"?api-version={self.KNOWLEDGE_AGENT_API_VERSION}"
            )
            
            status_code, result = self._call_rest_api("PUT", url, json_data)

            logger.info(f"ナレッジベースをデプロイしました: {name}")
            
            # 事前確認で判定
            if is_new:
                self.stats.record_created(resource_name)
            else:
                self.stats.record_updated(resource_name)

        except Exception as e:
            logger.error(f"ナレッジベースデプロイ失敗 ({file_path.name}): {e}")
            self.stats.record_failed(resource_name)
            raise

    def deploy_resource(
        self, resource_type: str, file_path: Path
    ) -> None:
        """リソースタイプに応じたデプロイ処理を実行"""
        logger.debug(f"処理中: {resource_type} - {file_path.name}")

        try:
            json_data = self.load_json_file(file_path)

            if resource_type == "indexes":
                self.deploy_index(json_data, file_path)
            elif resource_type == "datasources":
                self.deploy_datasource(json_data, file_path)
            elif resource_type == "skillsets":
                self.deploy_skillset(json_data, file_path)
            elif resource_type == "indexers":
                self.deploy_indexer(json_data, file_path)
            elif resource_type == "knowledgesources":
                self.deploy_knowledge_source(json_data, file_path)
            elif resource_type == "knowledgeagents":
                self.deploy_knowledge_agent(json_data, file_path)
            else:
                logger.warning(f"未知のリソースタイプ: {resource_type}")
                self.stats.record_skipped(f"unknown:{resource_type}")

        except Exception as e:
            # エラーは既にログ出力済みなので、ここでは何もしない
            pass

    def deploy_all(self) -> None:
        """全リソースをデプロイ"""
        logger.info(f"Azure AI Search エンドポイント: {self.endpoint}")
        logger.info(f"スキーマディレクトリ: {self.schemas_dir}")
        logger.info(f"リソースマッピング: {self.resource_map}")

        if self.dry_run:
            logger.info("*** DRY-RUN モード: 実際のデプロイは行いません ***")

        # JSONファイル検出
        discovered = self.discover_json_files()

        if not discovered:
            logger.warning("デプロイするリソースが見つかりませんでした")
            return

        # 処理順序に従ってデプロイ
        for resource_type in self.PROCESSING_ORDER:
            files = discovered.get(resource_type, [])
            
            if files:
                logger.info(f"\n--- {resource_type.upper()} のデプロイ開始 ---")
                for file_path in sorted(files):
                    self.deploy_resource(resource_type, file_path)
                logger.info(f"--- {resource_type.upper()} のデプロイ完了 ---\n")
            else:
                logger.debug(f"{resource_type} はスキップ（ファイルなし）")

        # サマリ出力
        self.stats.log_summary()

    def cleanup(self) -> None:
        """クライアントのクリーンアップ"""
        try:
            if hasattr(self.index_client, "close"):
                self.index_client.close()
            if hasattr(self.indexer_client, "close"):
                self.indexer_client.close()
        except Exception as e:
            logger.debug(f"クリーンアップエラー: {e}")


def parse_resource_map(map_str: Optional[str]) -> Optional[Dict[str, str]]:
    """リソースマッピング文字列をパース"""
    if not map_str:
        return None

    result = {}
    try:
        pairs = map_str.split(",")
        for pair in pairs:
            key, value = pair.split("=")
            result[key.strip()] = value.strip()
        return result
    except Exception as e:
        logger.error(f"リソースマッピングのパースエラー: {e}")
        raise ValueError(f"無効なリソースマッピング形式: {map_str}")


def setup_logging(verbose: bool) -> None:
    """ログ設定"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def parse_args() -> argparse.Namespace:
    """コマンドライン引数のパース"""
    parser = argparse.ArgumentParser(
        description="Azure AI Search デプロイスクリプト",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
環境変数:
  SERVICE_NAME      Azure AI Search サービス名（必須）
  SCHEMAS_DIR       スキーマディレクトリのパス
  RESOURCE_GROUP    リソースグループ名（ログ出力用）
  SUBSCRIPTION_ID   サブスクリプションID（ログ出力用）
  RESOURCE_MAP      リソースマッピング

例:
  python ai_search.py --service-name my-search --verbose
  SERVICE_NAME=my-search python ai_search.py --dry-run
        """,
    )

    parser.add_argument(
        "--service-name",
        type=str,
        default=os.environ.get("SERVICE_NAME"),
        help="Azure AI Search サービス名（必須）",
    )
    parser.add_argument(
        "--schemas-dir",
        type=Path,
        default=os.environ.get(
            "SCHEMAS_DIR", "original/infra/tenant/sst-harc/trial/ai_service/schemas"
        ),
        help="スキーマディレクトリのパス(デフォルト: original/infra/tenant/sst-harc/trial/ai_service/schemas)",
    )
    parser.add_argument(
        "--resource-group",
        type=str,
        default=os.environ.get("RESOURCE_GROUP"),
        help="リソースグループ名（ログ出力用）",
    )
    parser.add_argument(
        "--subscription-id",
        type=str,
        default=os.environ.get("SUBSCRIPTION_ID"),
        help="サブスクリプションID（ログ出力用）",
    )
    parser.add_argument(
        "--map",
        type=str,
        dest="resource_map",
        default=os.environ.get("RESOURCE_MAP"),
        help='リソースマッピング（例: "my-sources=knowledgesources,my-bases=knowledgebases"）',
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際のデプロイを行わずに検証のみ",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="詳細なログ出力",
    )

    return parser.parse_args()


def main() -> int:
    """メイン処理"""
    args = parse_args()

    # ログ設定
    setup_logging(args.verbose)

    # 必須パラメータチェック
    if not args.service_name:
        logger.error(
            "エラー: --service-name または環境変数 SERVICE_NAME が必要です"
        )
        return 1

    # リソースマッピングのパース
    resource_map = parse_resource_map(args.resource_map)
    if resource_map:
        # デフォルトマップをベースに上書き
        final_map = AzureSearchDeployer.DEFAULT_RESOURCE_MAP.copy()
        final_map.update(resource_map)
    else:
        final_map = None

    # デプロイヤー初期化
    deployer = AzureSearchDeployer(
        service_name=args.service_name,
        schemas_dir=args.schemas_dir,
        resource_map=final_map,
        dry_run=args.dry_run,
        verbose=args.verbose,
        resource_group=args.resource_group,
        subscription_id=args.subscription_id,
    )

    try:
        # デプロイ実行
        deployer.deploy_all()

        # 失敗があれば非ゼロ終了
        if deployer.stats.has_failures():
            logger.error("デプロイ中にエラーが発生しました")
            return 1

        logger.info("デプロイが正常に完了しました")
        return 0

    except Exception as e:
        logger.error(f"予期しないエラー: {e}", exc_info=args.verbose)
        return 1

    finally:
        deployer.cleanup()


if __name__ == "__main__":
    sys.exit(main())
