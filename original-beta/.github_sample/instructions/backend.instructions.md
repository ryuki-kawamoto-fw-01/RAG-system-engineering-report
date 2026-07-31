---
description:"Python向けコーディング規約"
applyTo: "/backend/**/**.py"
---

## 概要
このファイルは、`backend/` ディレクトリ内のPythonコードに適用されるコーディング規約とベストプラクティスを定義します。

## 1. コーディング規約

### 1.1 スタイルガイド
- **PEP 8**: Pythonの公式スタイルガイド（PEP 8）に準拠すること
- **インデント**: スペース4つを使用
- **行の長さ**: 最大79文字（docstringやコメントは72文字）
- **命名規則**:
  - クラス名: `PascalCase` (例: `AzureSearchIndexerManager`)
  - 関数/メソッド名: `snake_case` (例: `create_skillset`)
  - 定数: `UPPER_SNAKE_CASE` (例: `MAX_RETRY_COUNT`)
  - 変数名: `snake_case` (例: `endpoint`, `api_key`)
  - プライベートメソッド/変数: 先頭にアンダースコア (例: `_internal_method`)

### 1.2 インポート
- 標準ライブラリ、サードパーティライブラリ、ローカルモジュールの順に並べる
- 各グループは空行で区切る
- アルファベット順に並べる

```python
# 標準ライブラリ
import os
from typing import List, Optional

# サードパーティライブラリ
from azure.core.credentials import DefaultAzureCredential
from azure.search.documents.indexes import SearchIndexerClient

# ローカルモジュール
from .utils import helper_function
```

---

## 2. ドキュメント

### 2.1 モジュールドキュメント
- ファイルの先頭にモジュールの説明を記載
- 最終更新日、最終更新者、目的を明記

```python
# 最終更新日：2025-12-26
"""
モジュールの説明をここに記載

このモジュールは○○を行うためのものです。
"""
```

### 2.2 関数・メソッドのドキュメント
- すべての関数とメソッドにdocstringを記載
- Google形式またはNumPy形式を使用
- Args、Returns、Raisesを明記

```python
def create_skillset(self, skillset_name: str, cognitive_services_key: Optional[str] = None) -> SearchIndexerSkillset:
    """
    AI Enrichmentスキルセットを作成する

    Args:
        skillset_name (str): スキルセット名
        cognitive_services_key (Optional[str]): Cognitive Services APIキー

    Returns:
        SearchIndexerSkillset: 作成されたスキルセット

    Raises:
        ValueError: スキルセット名が空の場合
        AzureError: Azure APIとの通信エラー
    """
```

### 2.3 クラスのドキュメント
- クラスの目的と責務を明記
- 重要な属性を記載

```python
class AzureSearchIndexerManager:
    """
    Azure AI Searchのインデクサーを管理するクラス

    このクラスはインデクサー、データソース、スキルセットの
    作成と管理を行います。

    Attributes:
        endpoint (str): Azure AI Searchのエンドポイント
        credential (DefaultAzureCredential): 認証情報
    """
```

---

## 3. 型ヒント

### 3.1 型アノテーション
- すべての関数/メソッドの引数と戻り値に型ヒントを付ける
- 複雑な型は `typing` モジュールを使用

```python
from typing import List, Dict, Optional, Union

def process_data(items: List[str], config: Optional[Dict[str, any]] = None) -> Dict[str, int]:
    """データを処理する"""
    pass
```

### 3.2 型チェック
- 可能な限り静的型チェックツール（flake8）を使用
- 型の不一致を事前に検出

---

## 4. エラーハンドリング

### 4.1 例外処理
- 適切な例外クラスを使用
- 例外を捕捉する際は、具体的な例外クラスを指定
- 必要に応じてカスタム例外を定義

```python
try:
    result = api_call()
except ValueError as e:
    # 値エラーの処理
    logger.error(f"無効な値: {e}")
    raise
except AzureError as e:
    # Azure APIエラーの処理
    logger.error(f"Azure APIエラー: {e}")
    raise CustomAzureException("処理に失敗しました") from e
```

### 4.2 例外メッセージ
- ユーザーフレンドリーで具体的なエラーメッセージを提供
- デバッグに必要な情報を含める

---

## 5. ロギング

### 5.1 ロギングの使用
- `print()` の代わりに `logging` モジュールを使用
- 適切なログレベルを設定（DEBUG, INFO, WARNING, ERROR, CRITICAL）

```python
import logging

logger = logging.getLogger(__name__)

def process_request():
    logger.info("処理を開始します")
    try:
        # 処理
        logger.debug("詳細なデバッグ情報")
    except Exception as e:
        logger.error(f"エラーが発生しました: {e}", exc_info=True)
```

---

## 6. セキュリティ

### 6.1 機密情報の管理
- APIキー、パスワード、接続文字列などをコードにハードコードしない
- 環境変数や Azure Key Vault を使用

```python
import os

# 良い例
api_key = os.environ.get("AZURE_SEARCH_API_KEY")

# 悪い例
# api_key = "abc123xyz456"  # ハードコードしない！
```

### 6.2 入力検証
- すべての外部入力を検証
- SQLインジェクション、コマンドインジェクションなどを防ぐ

```python
def validate_input(user_input: str) -> bool:
    """ユーザー入力を検証する"""
    if not user_input or len(user_input) > 100:
        raise ValueError("入力が無効です")
    # 特殊文字のチェックなど
    return True
```

---

## 7. パフォーマンス

### 7.1 効率的なコード
- リスト内包表記を活用
- 不要な計算を避ける
- 適切なデータ構造を選択

```python
# 良い例: リスト内包表記
squared = [x**2 for x in range(10)]

# 悪い例: 非効率なループ
squared = []
for x in range(10):
    squared.append(x**2)
```

### 7.2 非同期処理
- I/O バウンドな処理には async/await を検討
- Azure SDK の非同期クライアントを活用

---

## 8. テスト

### 8.1 テストコードは作成しない
- このプロジェクトでは、原則テストコードの自動生成は行わない
- 例外として、ユーザプロンプトやシステムプロンプトで明示的にテストコードの生成を指示された場合のみ作成する

### 8.2 テスタビリティ
- テストしやすいコードを書く
- 依存性注入を活用
- 関数は単一責任の原則に従う

---

## 9. Azure固有のベストプラクティス

### 9.1 Azure SDK の使用
- 最新の Azure SDK for Python を使用
- 公式ドキュメントに従う
- 適切な認証方法を選択（AzureKeyCredential、DefaultAzureCredential など）

### 9.2 リトライとタイムアウト
- ネットワークエラーに備えてリトライロジックを実装
- 適切なタイムアウト値を設定

```python
from azure.core.pipeline.policies import RetryPolicy

# リトライポリシーの設定
retry_policy = RetryPolicy(retry_total=3, retry_backoff_factor=1)
```

### 9.3 リソース管理
- `with` 文を使用してリソースを適切にクリーンアップ
- コネクションプールを活用

---

## 10. コメント

### 10.1 日本語コメント
- すべてのコメントは日本語で記載
- 初心者エンジニアにも理解できるよう、丁寧に説明

### 10.2 コメントのベストプラクティス
- なぜそのコードを書いたのか（Why）を説明
- 何をするか（What）はコード自体で表現
- 複雑なロジックには必ずコメントを付ける

```python
# 良い例: 理由を説明
# パフォーマンス向上のためキャッシュを使用
cache = {}

# 悪い例: 自明なことを説明
# iに1を足す
i = i + 1
```

---

## 11. クラス設計

### 11.1 SOLID原則
- 単一責任の原則（SRP）: 1つのクラスは1つの責任のみを持つ
- オープン・クローズドの原則（OCP）: 拡張に開いて修正に閉じている
- リスコフの置換原則（LSP）: 派生クラスは基底クラスと置換可能
- インターフェース分離の原則（ISP）: 使用しないメソッドへの依存を強制しない
- 依存性逆転の原則（DIP）: 抽象に依存し、具体に依存しない

### 11.2 クラスの構造
1. クラス変数
2. `__init__` メソッド
3. パブリックメソッド
4. プライベート/保護されたメソッド
5. 静的メソッド、クラスメソッド

---

## 12. ファイル構成

### 12.1 モジュール構成
- 関連する機能ごとにファイルを分割
- 1ファイルは300行以内を目安に

### 12.2 パッケージ構成
```
src/backend/
└── [機能と関連したフォルダ名]/
    ├── function_app.py（メインのAzure Functionアプリケーションファイル）
    ├── .vscode/
    ├── modules/
    |   └── [その他関数のファイル]
    └── tests/
        └── [単体テストのファイル]

```

---

## 13. その他のベストプラクティス

### 13.1 マジックナンバーを避ける
```python
# 良い例
MAX_RETRY_COUNT = 3
timeout = MAX_RETRY_COUNT * 10

# 悪い例
timeout = 3 * 10
```

### 13.2 関数は小さく保つ
- 1つの関数は1つのことをする
- 関数の行数は30行以内を目安に

### 13.3 早期リターン
- ネストを減らすために早期リターンを使用

```python
def process(data):
    if not data:
        return None

    if not validate(data):
        return None

    # メイン処理
    return result
```

---
