#!/usr/bin/env python3
"""認証状態管理スクリプト

認証状態ファイルの管理を行うためのユーティリティスクリプト

使用方法:
    python manage_auth.py clear  # 認証状態を削除
    python manage_auth.py check  # 認証状態の確認
"""
import sys
import json
from pathlib import Path
from auth_helper import clear_auth_state, load_auth_state
from config import AUTH_STATE_FILE


def show_auth_state_info():
    """認証状態ファイルの情報を表示"""
    if not AUTH_STATE_FILE.exists():
        print(f"✗ 認証状態ファイルが存在しません: {AUTH_STATE_FILE}")
        print("\n初回実行時は以下のコマンドで認証を行ってください:")
        print("  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/<test_file>.py -v -s")
        return
    
    print(f"✓ 認証状態ファイルが存在します: {AUTH_STATE_FILE}")
    
    # ファイルサイズを取得
    file_size = AUTH_STATE_FILE.stat().st_size
    print(f"  ファイルサイズ: {file_size:,} bytes")
    
    # ファイルの更新日時を取得
    import datetime
    mtime = AUTH_STATE_FILE.stat().st_mtime
    mtime_str = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"  最終更新: {mtime_str}")
    
    # 認証状態の内容を確認
    auth_state = load_auth_state()
    if auth_state:
        cookie_count = len(auth_state.get('cookies', []))
        print(f"  Cookie数: {cookie_count}")
        
        # Cookie の詳細情報（ドメイン別に集計）
        cookies = auth_state.get('cookies', [])
        domains = {}
        for cookie in cookies:
            domain = cookie.get('domain', 'unknown')
            domains[domain] = domains.get(domain, 0) + 1
        
        print(f"\n  Cookie ドメイン別集計:")
        for domain, count in sorted(domains.items(), key=lambda x: x[1], reverse=True):
            print(f"    - {domain}: {count}個")
        
        # localStorage/sessionStorage の有無
        has_local = 'origins' in auth_state and any(
            origin.get('localStorage') for origin in auth_state.get('origins', [])
        )
        has_session = 'origins' in auth_state and any(
            origin.get('sessionStorage') for origin in auth_state.get('origins', [])
        )
        
        if has_local:
            print(f"  ✓ localStorage が保存されています")
        if has_session:
            print(f"  ✓ sessionStorage が保存されています")


def main():
    print("="*70)
    print("認証状態管理スクリプト")
    print("="*70)
    
    if len(sys.argv) < 2:
        print("\n使用方法:")
        print("  python manage_auth.py clear  # 認証状態を削除")
        print("  python manage_auth.py check  # 認証状態の確認")
        print("\n")
        show_auth_state_info()
        return
    
    command = sys.argv[1].lower()
    
    if command == "clear":
        print("\n[コマンド: clear] 認証状態を削除します")
        clear_auth_state()
        print("\n次回実行時は再認証が必要です:")
        print("  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/<test_file>.py -v -s")
        
    elif command == "check":
        print("\n[コマンド: check] 認証状態を確認します\n")
        show_auth_state_info()
        
    else:
        print(f"\n✗ 不明なコマンド: {command}")
        print("\n使用方法:")
        print("  python manage_auth.py clear  # 認証状態を削除")
        print("  python manage_auth.py check  # 認証状態の確認")
        sys.exit(1)
    
    print("\n" + "="*70)


if __name__ == "__main__":
    main()
