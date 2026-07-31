"""
auth_helper.py - Azure Entra ID認証ヘルパー

Azure Entra ID認証に関連する処理を提供します。
手動認証モードと自動認証モードの両方に対応しています。
認証状態の保存・再利用機能も提供します。
"""
import os
import time
import json
from pathlib import Path
from urllib.parse import urlparse


# 認証情報（環境変数から取得）
AUTH_EMAIL = os.getenv("AZURE_AUTH_EMAIL", "hiroki.sano.dx@hitachi-systems.com")
AUTH_PASSWORD = os.getenv("AZURE_AUTH_PASSWORD", "")

# 認証状態ファイルのパス
from .config import AUTH_STATE_FILE


def save_auth_state(context, auth_state_path=None):
    """
    認証状態をファイルに保存する
    
    Args:
        context: Playwrightのブラウザコンテキスト
        auth_state_path: 保存先パス（デフォルト: AUTH_STATE_FILE）
    """
    # 環境変数で保存を無効化
    if os.getenv("SKIP_AUTH_STATE_SAVE", "false").lower() == "true":
        print("ℹ️  SKIP_AUTH_STATE_SAVE=true のため、認証状態を保存しません")
        return
    
    if auth_state_path is None:
        auth_state_path = AUTH_STATE_FILE
    
    # ディレクトリが存在しない場合は作成
    auth_state_path.parent.mkdir(parents=True, exist_ok=True)
    
    # 認証状態を保存
    context.storage_state(path=str(auth_state_path))
    print(f"✓ 認証状態を保存しました: {auth_state_path}")


def load_auth_state(auth_state_path=None):
    """
    保存された認証状態を読み込む
    
    Args:
        auth_state_path: 読み込み元パス（デフォルト: AUTH_STATE_FILE）
    
    Returns:
        dict: 認証状態データ、ファイルが存在しない場合はNone
    """
    if auth_state_path is None:
        auth_state_path = AUTH_STATE_FILE
    
    if not auth_state_path.exists():
        print(f"ℹ️  認証状態ファイルが存在しません: {auth_state_path}")
        return None
    
    try:
        with open(auth_state_path, 'r', encoding='utf-8') as f:
            auth_state = json.load(f)
        print(f"✓ 認証状態を読み込みました: {auth_state_path}")
        return auth_state
    except Exception as e:
        print(f"⚠️  認証状態の読み込みに失敗: {e}")
        return None


def is_auth_state_valid(page, app_domain):
    """
    現在の認証状態が有効かチェックする
    
    Args:
        page: Playwrightのページオブジェクト
        app_domain: アプリケーションのドメイン
    
    Returns:
        bool: 認証状態が有効ならTrue
    """
    try:
        current_url = page.url
        # ログインページにリダイレクトされていなければ有効
        is_on_app = app_domain in current_url
        is_not_login = "login.microsoftonline.com" not in current_url
        return is_on_app and is_not_login
    except:
        return False


def clear_auth_state(auth_state_path=None):
    """
    保存された認証状態を削除する
    
    Args:
        auth_state_path: 削除するファイルのパス（デフォルト: AUTH_STATE_FILE）
    """
    if auth_state_path is None:
        auth_state_path = AUTH_STATE_FILE
    
    if auth_state_path.exists():
        auth_state_path.unlink()
        print(f"✓ 認証状態ファイルを削除しました: {auth_state_path}")
    else:
        print(f"ℹ️  認証状態ファイルは存在しません: {auth_state_path}")


def wait_for_manual_authentication(page, timeout=300000):
    """
    手動認証完了を待機する関数
    
    Args:
        page: Playwrightのページオブジェクト
        timeout: タイムアウト時間（ミリ秒、デフォルト5分）
    
    Returns:
        bool: 認証完了ならTrue、タイムアウトならFalse
    """
    print("\n" + "="*70)
    print("【手動認証が必要です】")
    print("ブラウザウィンドウで以下の手順を実行してください：")
    print("1. メールアドレスとパスワードを入力")
    print("2. 多要素認証（MFA）がある場合は認証コードを入力")
    print("3. 「サインインしたままにする」を選択（任意）")
    print("")
    print("認証が完了すると、自動的にテストが続行されます。")
    print(f"タイムアウト: {timeout/1000:.0f}秒")
    print("="*70 + "\n")
    
    start_time = time.time()
    
    # URL変更を記録するためのリスト
    url_changes = []
    
    # ナビゲーションイベントのリスナーを設定
    def on_navigation(frame):
        if frame == page.main_frame:
            url = frame.url
            timestamp = time.strftime("%H:%M:%S")
            url_changes.append((timestamp, url))
            print(f"\n🔔 [{timestamp}] ナビゲーション検知: {url}")
    
    page.on("framenavigated", on_navigation)
    
    # 最初のURLを取得（JavaScriptで直接取得）
    try:
        initial_url = page.evaluate("() => window.location.href")
        print(f"🔍 開始時のURL (JavaScript): {initial_url}\n")
        last_url = initial_url
    except Exception as e:
        print(f"⚠️ 初期URL取得エラー: {e}")
        last_url = page.url
        print(f"🔍 開始時のURL (page.url): {last_url}\n")
    
    check_count = 0
    
    # アプリケーションのドメインをBASE_URLから動的に取得
    from .config import BASE_URL
    app_domain = urlparse(BASE_URL).netloc
    print(f"🎯 認証完了を待機するドメイン: {app_domain}\n")
    
    while True:
        try:
            # タイムアウトチェック（ループの最初で実行）
            elapsed = (time.time() - start_time) * 1000
            if elapsed > timeout:
                # JavaScriptで現在のURLを取得
                try:
                    current_url = page.evaluate("() => window.location.href")
                except:
                    current_url = page.url
                print(f"\n✗ タイムアウト: {timeout/1000:.0f}秒経過しましたが認証が完了しませんでした。")
                print(f"   現在のURL: {current_url}\n")
                print(f"   検知されたURL変更回数: {len(url_changes)}")
                return False
            
            # JavaScriptで直接URLを取得（より正確）
            try:
                current_url = page.evaluate("() => window.location.href")
            except Exception as e:
                # フォールバック：page.urlを使用
                current_url = page.url
                if check_count % 10 == 0:
                    print(f"⚠️ JavaScript URL取得失敗、page.url使用: {e}")
            
            check_count += 1
            
            # URLが変わったかを最初にチェック（重要！）
            if current_url != last_url:
                print(f"\n🔄 【URL変更検知 - メインループ】")
                print(f"   変更前: {last_url}")
                print(f"   変更後: {current_url}")
                last_url = current_url
            
            # 現在の状態を表示（3秒ごと）
            if check_count % 3 == 1:
                # URLから実際のドメインを抽出
                parsed_url = urlparse(current_url)
                actual_domain = parsed_url.netloc
                
                is_app_start = current_url.startswith(f"https://{app_domain}") or current_url.startswith(f"http://{app_domain}")
                is_login_domain = "login.microsoftonline.com" in actual_domain
                
                status = "🟢 アプリドメイン" if is_app_start else ("🔴 ログイン中" if is_login_domain else "⚪ その他")
                print(f"{status} | {check_count}秒経過 | ドメイン: {actual_domain}")
                
                # 5秒ごとに詳細表示
                if check_count % 5 == 0:
                    print(f"   🔍 完全URL: {current_url[:100]}...")
            
            # アプリケーションのドメインに戻ったか確認
            # 重要: URLの先頭（ドメイン部分）をチェック
            is_app_domain = current_url.startswith(f"https://{app_domain}") or current_url.startswith(f"http://{app_domain}")
            is_not_login = "login.microsoftonline.com" not in urlparse(current_url).netloc
            
            if is_app_domain and is_not_login:
                print(f"\n✅ アプリケーションドメインへの遷移を検知")
                print(f"   URL: {current_url}")
                
                # 追加の待機時間（リダイレクトが完全に完了するのを待つ）
                print("⏳ 追加の安定化待機（3秒）...")
                time.sleep(3)
                
                # ページが完全に読み込まれるまで待機
                try:
                    print("⏳ ページの読み込み完了を待機中...")
                    page.wait_for_load_state("domcontentloaded", timeout=15000)
                    page.wait_for_load_state("networkidle", timeout=15000)
                    print("✓ ページの読み込みが完了しました")
                except Exception as e:
                    print(f"⚠️  ページ読み込み待機中に警告: {e}")
                    # 警告だが続行
                
                # 最終確認：もう一度URLをチェック
                try:
                    final_url = page.evaluate("() => window.location.href")
                except:
                    final_url = page.url
                print(f"🔍 最終URL確認 (JavaScript): {final_url}")
                
                final_is_app = final_url.startswith(f"https://{app_domain}") or final_url.startswith(f"http://{app_domain}")
                final_not_login = "login.microsoftonline.com" not in urlparse(final_url).netloc
                
                if final_is_app and final_not_login:
                    print("\n✅✅ 認証が完了しました。テストを続行します。\n")
                    print(f"📊 検知されたURL変更: {len(url_changes)}回")
                    if url_changes:
                        print("   URL変更履歴:")
                        for ts, url in url_changes[-3:]:  # 最新3件
                            print(f"   - [{ts}] {url[:80]}...")
                    # リスナーを削除
                    try:
                        page.remove_listener("framenavigated", on_navigation)
                    except:
                        pass
                    return True
                else:
                    print(f"⚠️  URLが変わりました。待機を継続します。")
                    print(f"   final_is_app: {final_is_app}, final_not_login: {final_not_login}")
                    continue
            
            # 残り時間を定期的に表示（30秒ごと）
            if check_count % 30 == 1:
                remaining = int((timeout - elapsed) / 1000)
                print(f"⏱️  【認証待機中】 残り約{remaining}秒")
            
            time.sleep(1)
            
        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            print(f"❌ 認証待機中にエラー: {e}")
            print(f"   経過時間: {elapsed/1000:.1f}秒")
            # エラー時でもJavaScriptでURLを取得してみる
            try:
                error_url = page.evaluate("() => window.location.href")
                print(f"   現在のURL (JavaScript): {error_url}")
            except:
                print(f"   現在のURL (page.url): {page.url}")
            
            if elapsed > timeout:
                print(f"\n✗ タイムアウトしました\n")
                # リスナーを削除
                try:
                    page.remove_listener("framenavigated", on_navigation)
                except:
                    pass
                return False
            time.sleep(1)


def handle_azure_authentication(page, manual_auth_mode=False):
    """
    Azure Entra ID認証を処理する関数
    
    Args:
        page: Playwrightのページオブジェクト
        manual_auth_mode: 手動認証モードかどうか（デフォルト: False）
    
    Returns:
        bool: 認証成功ならTrue、失敗ならFalse
    """
    # Azure Entra ID認証処理
    if "login.microsoftonline.com" in page.url or "microsoft.com" in page.url:
        print("\nAzure Entra ID認証")
        print("Azure Entra ID認証ページが表示されています。")
        print(f"認証URL: {page.url}")
        
        if manual_auth_mode:
            # 手動認証モード：ユーザーの入力を待つ
            if not wait_for_manual_authentication(page, timeout=300000):
                print("認証がタイムアウトしました。")
                return False
        else:
            # 自動認証モード：環境変数から認証情報を使用
            try:
                email_input = page.locator('input[type="email"]')
                if email_input.count() > 0:
                    email_input.wait_for(state="visible", timeout=10000)
                    email_input.fill(AUTH_EMAIL)
                    print(f"メールアドレス入力完了: {AUTH_EMAIL}")
                    
                    # 次へボタンをクリック
                    next_button = page.locator('input[type="submit"], button[type="submit"]')
                    next_button.click()
                    print("次へボタンをクリックしました")
                    
                    # パスワード入力画面を待機
                    page.wait_for_load_state("networkidle", timeout=30000)
                    print(f"メール入力後のURL: {page.url}")
                
                # パスワード入力フィールドを探して入力
                password_input = page.locator('input[type="password"]')
                if password_input.count() > 0:
                    print("パスワード入力フィールドが見つかりました。")
                    
                    if not AUTH_PASSWORD:
                        print("エラー: パスワードが設定されていません。")
                        print("環境変数 AZURE_AUTH_PASSWORD にパスワードを設定してください。")
                        print("または、MANUAL_AUTH=true で手動認証モードを使用してください。")
                        return False
                    
                    password_input.wait_for(state="visible", timeout=10000)
                    password_input.fill(AUTH_PASSWORD)
                    print("パスワード入力完了")
                    
                    # サインインボタンをクリック
                    signin_button = page.locator('input[type="submit"], button[type="submit"]')
                    signin_button.click()
                    print("サインインボタンをクリックしました")
                    
                    # ページ遷移を待機（MFA等の追加認証がある場合も考慮）
                    page.wait_for_load_state("networkidle", timeout=30000)
                    print(f"サインイン後のURL: {page.url}")
                    
                    # サインインの状態を保持する確認がある場合
                    stay_signed_in = page.locator('input[type="submit"]')
                    if stay_signed_in.count() > 0 and "サインインしたままにする" in page.content():
                        print("「サインインしたままにする」確認が表示されています。")
                        stay_signed_in.click()
                        page.wait_for_load_state("networkidle", timeout=30000)
                        print(f"サインイン保持後のURL: {page.url}")
                
                # 認証完了を確認
                page.wait_for_timeout(3000)
                print(f"認証処理後のURL: {page.url}")
                
                # まだMicrosoftのログインページにいる場合はエラー
                if "login.microsoftonline.com" in page.url:
                    print("エラー: 認証が完了していません。")
                    print("MFAや追加の認証が必要な可能性があります。")
                    print("MANUAL_AUTH=true で手動認証モードを使用してください。")
                    return False
                    
            except Exception as e:
                print(f"認証処理中にエラー: {e}")
                print("認証が必要な場合は、以下のいずれかの方法を試してください：")
                print("1. 環境変数 AZURE_AUTH_PASSWORD にパスワードを設定")
                print("2. MANUAL_AUTH=true で手動認証モードを使用")
                return False
    
    return True


def handle_terms_agreement(page):
    """
    利用規約への同意を処理する関数
    
    Args:
        page: Playwrightのページオブジェクト
    
    Returns:
        bool: 処理成功ならTrue、失敗ならFalse
    """
    # /check-terms にリダイレクトされた場合、利用規約に同意
    if "check-terms" in page.url:
        print("\n利用規約への同意")
        print("利用規約ページが表示されています。同意処理を実行します。")
        
        try:
            # 利用規約のチェックボックスをクリック
            checkbox = page.locator('button[id="terms"]')
            checkbox.wait_for(state="visible", timeout=10000)
            checkbox.click()
            print("利用規約チェックボックスをクリックしました")
            
            # 同意ボタンが有効になるまで待機
            page.wait_for_timeout(500)
            
            # 同意ボタンをクリック
            # disabledが外れたボタンを探す
            agree_button = page.locator('button.bg-secondary:not([disabled])')
            agree_button.wait_for(state="visible", timeout=10000)
            agree_button.click()
            print("同意ボタンをクリックしました")
            
            # ページ遷移を待機
            page.wait_for_load_state("networkidle")
            print(f"同意後のURL: {page.url}")
            return True
        except Exception as e:
            print(f"利用規約同意処理中にエラー: {e}")
            return False
    
    return True
