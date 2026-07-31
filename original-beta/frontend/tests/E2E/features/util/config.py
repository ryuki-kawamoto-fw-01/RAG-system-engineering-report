"""E2Eテスト共通設定

このファイルでは、全テストで共通的に使用する設定値を管理します。
環境に応じて値を変更してください。
"""

# プロキシ設定
# Windowsから打鍵する場合はコメントアウトを外す。
# PROXY_CONFIG = None  # VPN経由で直接アクセス

# WSLから打鍵する場合はコメントアウトを外す。
PROXY_CONFIG = {
    "server": "http://umproxy.prx.intra.hitachi.co.jp:8080",
}

# フロントエンドのデプロイURL
BASE_URL = "https://frontend-hr-ateam-14-fqahaudqdydsc3dn.japaneast-01.azurewebsites.net"

# 本番環境の例
# BASE_URL = "https://frontend-genashi-test-01-ehbvhxhxezh0fmeb.japaneast-01.azurewebsites.net"

# 本番同等環境の例
# BASE_URL = "https://frontend-genashi-test-01-stg.azurewebsites.net"

# スクリーンショット設定
SCREENSHOT_FULL_PAGE = True  # ページ全体をキャプチャ（スクロール領域含む）

# ブラウザ起動オプション
BROWSER_ARGS = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
]

# 認証状態保存ファイル
# 認証情報（Cookie、localStorage等）を保存するファイルパス
import os
from pathlib import Path

# プロジェクトルートからの相対パスで frontend/tests/E2E/features/temp/ に保存
# frontend/tests/E2E/features/util/config.py から見てプロジェクトルートは6階層上
# config.py -> util/ -> features/ -> E2E/ -> tests/ -> frontend/ -> original-beta/
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent
AUTH_STATE_FILE = PROJECT_ROOT / "frontend" / "tests" / "E2E" / "features" / "temp" / "auth_state.json"
