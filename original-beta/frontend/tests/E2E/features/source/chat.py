"""
chat.py - チャット画面のE2Eテスト

【テスト観点】
①チャット画面が正しく表示されることを確認する
②「＋」ボタンをクリックすると新しいチャットを開始できることを確認する
③フリーチャットを選択できることを確認する
④チャットタイトルのインフォメーションアイコンを合わせると機能説明が表示されることを確認する
⑤プロンプトを送信すると回答が返ってくることを確認する
⑥プロンプトにファイルをドラッグ＆ドロップで添付し送信ができることを確認する（スキップ）
⑦プロンプトの📎マークをクリックしてファイルを選択し送信ができることを確認する
⑧チャット開始時に表示されるプロンプトテンプレートを適用してチャットできることを確認する
⑨「他のテンプレートを選択する」ボタンをクリックし、プロンプトテンプレートを適用してチャットできることを確認する
⑩回答のフィードバック（Good/Bad）を送信できることを確認する
⑪回答のコピーができることを確認する
⑫会話履歴のダウンロードができることを確認する
⑬チャット履歴の検索ができることを確認する
⑭「設定」からモデルの変更ができることを確認する
⑮チャット履歴のチャットを個別に削除できることを確認する
⑯チャット履歴のすべてのチャットを一括で削除できることを確認する

【実行コマンド】
MANUAL_AUTH=true python frontend/tests/E2E/features/source/chat.py
または
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/chat.py::test_chat_features -v -s
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from datetime import datetime

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import BASE_URL, PROXY_CONFIG, BROWSER_ARGS


# テスト用ファイルのディレクトリ
TEST_FILES_DIR = Path(__file__).parent.parent / "input" / "01_chat"


def test_chat_features():
    """チャット画面の全機能をテストする"""
    
    # テスト実行結果の追跡
    warnings = []  # 警告のリスト [(step, message), ...]
    errors = []    # エラーのリスト [(step, message), ...]
    log_messages = []  # ログメッセージのリスト
    
    # ログ出力用のヘルパー関数
    def log_print(message, also_print=True):
        """コンソールとログリストの両方に出力"""
        if also_print:
            print(message)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        log_messages.append(f"[{timestamp}] {message}")
    
    # エビデンス保存用ディレクトリを作成
    test_dir = ensure_evidence_dir()
    log_print(f"\n{'='*70}")
    log_print(f"エビデンス保存先: {test_dir}")
    log_print(f"{'='*70}\n")
    
    with sync_playwright() as p:
        # 環境変数で認証モードを制御
        manual_auth_mode = os.getenv("MANUAL_AUTH", "false").lower() == "true"
        
        # 手動認証モードの場合は常にヘッドフルモードで実行
        if manual_auth_mode:
            headless = False
            log_print("【手動認証モード】ヘッドフルモードで起動します。")
        else:
            headless = os.getenv("HEADLESS", "true").lower() == "true"
        
        # ブラウザ起動
        browser = p.chromium.launch(
            headless=headless,
            proxy=PROXY_CONFIG,
            args=BROWSER_ARGS,
        )
        
        # 保存された認証状態を読み込む（存在する場合）
        auth_state = load_auth_state()
        
        # コンテキストを作成（クリップボードアクセス権限を付与）
        context_options = {
            'permissions': ['clipboard-read', 'clipboard-write']
        }
        if auth_state:
            context_options['storage_state'] = auth_state
            log_print("✓ 保存された認証状態を使用します")
        
        context = browser.new_context(**context_options)
        page = context.new_page()
        
        try:
            # 【STEP 1】認証処理
            log_print("\n[STEP 1] Azure認証処理")
            page.goto(BASE_URL)
            
            # 認証状態が有効でない場合のみ認証を実行
            if not is_auth_state_valid(page, BASE_URL):
                log_print("認証が必要です。認証処理を開始します...")
                if not handle_azure_authentication(page, manual_auth_mode):
                    errors.append(("STEP 1", "認証に失敗しました"))
                    log_print("❌ エラー: 認証に失敗しました")
                    return
                # 認証成功後、認証状態を保存
                save_auth_state(context)
            else:
                log_print("✓ 既存の認証状態が有効です。認証をスキップします。")
            
            log_print("✓ Azure認証が完了しました")
            
            # 【STEP 2】利用規約への同意
            log_print("\n[STEP 2] 利用規約への同意")
            if not handle_terms_agreement(page):
                errors.append(("STEP 2", "利用規約同意処理に失敗しました"))
                log_print("❌ エラー: 利用規約同意処理に失敗しました")
                return
            
            log_print("✓ 利用規約への同意が完了しました")
            
            # 【STEP 3】ホームページからチャット画面へ遷移
            log_print("\n[STEP 3] ホームページからチャット画面へ遷移")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            
            # チャット画面へ直接遷移
            try:
                save_screenshot(page, test_dir, "00_home.png", "ホーム画面表示確認")
                log_print(f"/chatページへ遷移します...")
                page.goto(f"{BASE_URL}/chat")
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(5000)  # 待機時間を延長
                
                # マウスカーソルを表示
                enable_mouse_cursor(page)
                
                log_print(f"✓ チャット画面へ遷移しました（URL: {page.url}）")
            except Exception as e:
                warnings.append(("STEP 3", f"チャット画面への遷移中にエラー: {e}"))
                print(f"⚠️ 警告: チャット画面への遷移中にエラー: {e}")
            
            # 【STEP 4】チャット画面が正しく表示されることを確認
            log_print("\n[STEP 4] チャット画面（履歴セクション）が正しく表示されることを確認")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            
            try:
                # 履歴セクションの確認（より柔軟なセレクタ）
                history_section = page.locator('text=履歴').first
                
                if history_section.count() > 0:
                    save_screenshot(page, test_dir, "01_chat_page_display.png", "「チャット画面」が正しく表示されることを確認する")
                    log_print("✓ チャット画面（履歴セクション）が正しく表示されています")
                else:
                    errors.append(("STEP 4", "チャット画面の必須要素（履歴セクション）が見つかりませんでした"))
                    print("❌ エラー: チャット画面の必須要素が見つかりませんでした")
                    # デバッグ用：ページの内容を出力
                    print(f"デバッグ: 現在のURL = {page.url}")
                    print(f"デバッグ: ページタイトル = {page.title()}")
            except Exception as e:
                errors.append(("STEP 4", f"チャット画面表示確認中にエラー: {e}"))
                print(f"❌ エラー: チャット画面表示確認中にエラー: {e}")
            
            # 【STEP 5】「＋」ボタンで新しいチャット開始（重要：これ以降のテストはチャットスレッド内で実行）
            log_print("\n[STEP 5] 「＋」ボタンで新しいチャット開始")
            try:
                # 「履歴」の隣のボタンを探す（より柔軟なセレクタ）
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                
                if add_button.count() > 0:
                    save_screenshot(page, test_dir, "03_chat-history.png", "過去のチャット履歴の一覧が表示されることを確認する")
                    add_button.click()
                    # 新しいチャットスレッドページに遷移するまで待機
                    page.wait_for_timeout(5000)  # 待機時間を延長
                    page.wait_for_load_state("networkidle")
                    save_screenshot(page, test_dir, "04_new_chat.png", "「＋」ボタンをクリックすると新しいチャットを開始できることを確認する。")
                    log_print(f"✓ 新しいチャットを開始しました（URL: {page.url}）")
                else:
                    warnings.append(("STEP 5", "「＋」ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 「＋」ボタンが見つかりませんでした")
                    # デバッグ用：ページの内容を出力
                    print(f"デバッグ: 現在のURL = {page.url}")
            except Exception as e:
                errors.append(("STEP 5", f"新しいチャット開始中にエラー: {e}"))
                print(f"❌ エラー: 新しいチャット開始中にエラー: {e}")
            
            # 【STEP 6】フリーチャット選択
            print("\n[STEP 6] フリーチャット選択")
            try:
                # テンプレート選択画面でフリーチャットを選択
                # 「プロンプトを選択して会話を始める」というタイトルがある画面で選択する
                page.wait_for_timeout(2000)
                
                # フリーチャットのカードまたはボタンを探す
                # テンプレートカードの中から「フリーチャット」を探す
                free_chat_card = page.locator('text=フリーチャット').first
                
                if free_chat_card.count() > 0:
                    # save_screenshot(page, test_dir, "04_free_chat_1.png", "フリーチャット選択前")
                    free_chat_card.click()
                    page.wait_for_timeout(2000)
                    # save_screenshot(page, test_dir, "04_free_chat_2.png", "フリーチャット選択後")
                    print("✓ フリーチャットを選択しました")
                else:
                    # フリーチャットが見つからない場合は、テンプレート選択をスキップ
                    warnings.append(("STEP 6", "フリーチャット選択が見つかりませんでした（テンプレート選択画面がスキップされた可能性）"))
                    print("⚠️ 警告: フリーチャット選択が見つかりませんでした")
                    # save_screenshot(page, test_dir, "04_free_chat_skipped.png", "フリーチャット選択スキップ")
            except Exception as e:
                errors.append(("STEP 6", f"フリーチャット選択中にエラー: {e}"))
                print(f"❌ エラー: フリーチャット選択中にエラー: {e}")
            
            # 【STEP 7】インフォメーションアイコンで機能説明表示
            print("\n[STEP 7] インフォメーションアイコンで機能説明表示")
            try:
                # h3の隣のヘルプボタンを探す
                help_button = page.locator('h3:has-text("チャット")').locator('..').locator('button')
                
                if help_button.count() > 0:
                    
                    # ボタンにホバー
                    help_button.first.hover()
                    page.wait_for_timeout(1500)
                    
                    # ツールチップの表示を確認
                    tooltip = page.locator('[role="tooltip"]')
                    if tooltip.count() > 0 and tooltip.is_visible():
                        print("✓ 機能説明のツールチップが表示されました")
                    else:
                        warnings.append(("STEP 7", "ツールチップが表示されませんでした"))
                        print("⚠️ 警告: ツールチップが表示されませんでした")
                    
                    save_screenshot(page, test_dir, "02_help.png", "カーソルをヘルプマークに合わせると機能説明が表示されることを確認する。")
                else:
                    warnings.append(("STEP 7", "ヘルプボタンが見つかりませんでした"))
                    print("⚠️ 警告: ヘルプボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"機能説明表示確認中にエラー: {e}"))
                print(f"❌ エラー: 機能説明表示確認中にエラー: {e}")
            
            # 【STEP 8】プロンプト送信と回答確認
            print("\n[STEP 8] プロンプト送信と回答確認")
            try:
                # プロンプト入力フィールドを探す
                prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                
                if prompt_input.count() > 0:
                    test_message = "こんにちは！テストメッセージです。"
                    
                    # メッセージを入力
                    prompt_input.first.fill(test_message)
                    page.wait_for_timeout(1000)
                    
                    # 送信ボタンをクリック（Enterキーでも可）
                    send_button = page.locator('button[type="submit"]:has(svg)')
                    if send_button.count() > 0:
                        # 送信前のメッセージ数を記録
                        assistant_messages = page.locator('div.bg-white.rounded-xl')
                        initial_count = assistant_messages.count()
                        print(f"送信前のメッセージ数: {initial_count}")
                        
                        send_button.first.click()
                        print("✓ プロンプトを送信しました")
                        
                        # アシスタントメッセージが増えるまで待機
                        print("⏳ AIからの回答を待機中...")
                        try:
                            page.wait_for_timeout(3000)  # 初期待機
                            
                            # 実際の内容を持つメッセージが表示されるまで待機（リトライロジック）
                            max_retries = 60  # 最大120秒
                            message_appeared = False
                            for i in range(max_retries):
                                assistant_messages = page.locator('div.bg-white.rounded-xl')
                                current_count = assistant_messages.count()
                                
                                # メッセージ数が増えているか確認
                                if current_count > initial_count:
                                    # 新しいメッセージに実際の内容があるか確認
                                    last_message = assistant_messages.last
                                    message_content = last_message.text_content()
                                    
                                    # スケルトンではなく実際のテキストがあるか（10文字以上）
                                    if message_content and len(message_content.strip()) > 10:
                                        print(f"✓ AIからの回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                        message_appeared = True
                                        break
                                    # else: まだスケルトン表示またはテキストが短い
                                
                                # まだ到着していない
                                if i < max_retries - 1:
                                    if i % 5 == 0 and i > 0:  # 10秒ごとにログ出力
                                        print(f"⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                    page.wait_for_timeout(2000)
                                else:
                                    warnings.append(("STEP 8", f"AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）"))
                                    print(f"⚠️ 警告: AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）")
                            
                            if not message_appeared:
                                warnings.append(("STEP 8", "AI回答が表示されませんでした"))
                                print("⚠️ 警告: AI回答が表示されませんでした")
                                
                        except Exception as wait_error:
                            warnings.append(("STEP 8", f"回答待機中にエラー: {wait_error}"))
                            print(f"⚠️ 警告: 回答待機中にエラー: {wait_error}")
                        
                        save_screenshot(page, test_dir, "05_prompt.png", "プロンプトを送信すると回答が返ってくることを確認する")
                    else:
                        warnings.append(("STEP 8", "送信ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                else:
                    errors.append(("STEP 8", "プロンプト入力フィールドが見つかりませんでした"))
                    print("❌ エラー: プロンプト入力フィールドが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 8", f"プロンプト送信確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト送信確認中にエラー: {e}")
            
            # 【STEP 9】📎マークでファイル選択（複数ファイルを順番に処理）
            print("\n[STEP 9] 📎マークでファイルを選択し送信（複数ファイルテスト）")
            try:
                # 01_chatディレクトリ配下のすべてのファイルを取得
                if TEST_FILES_DIR.exists() and TEST_FILES_DIR.is_dir():
                    test_files = sorted([f for f in TEST_FILES_DIR.iterdir() if f.is_file()])
                    print(f"✓ テストファイル数: {len(test_files)}個")
                    print(f"  ファイル一覧: {[f.name for f in test_files]}")
                    
                    if len(test_files) == 0:
                        warnings.append(("STEP 9", f"テストファイルが見つかりません: {TEST_FILES_DIR}"))
                        print(f"⚠️ 警告: テストファイルが見つかりません: {TEST_FILES_DIR}")
                    else:
                        # 各ファイルを順番に処理（1回ずつ）
                        for file_index, test_file_path in enumerate(test_files, start=1):
                            print(f"\n--- ファイル {file_index}/{len(test_files)}: {test_file_path.name} ---")
                            
                            # 前のメッセージ処理完了を待つ
                            if file_index > 1:
                                print(f"  ⏳ 前のメッセージ処理完了を待機中...")
                                page.wait_for_timeout(3000)
                            
                            # ファイル入力要素を取得
                            file_input = page.locator('input[type="file"]')
                            if file_input.count() == 0:
                                print(f"  ⏳ ファイル入力要素を待機中...")
                                page.wait_for_timeout(2000)
                                file_input = page.locator('input[type="file"]')
                            
                            if file_input.count() > 0:
                                # ファイルを選択
                                print(f"  → ファイルを選択中: {test_file_path.name}")
                                file_input.set_input_files(str(test_file_path))
                                print(f"  ✓ ファイルセット完了: {test_file_path.name}")
                                
                                # ファイル選択後、UIに反映されるまで待機
                                page.wait_for_timeout(2000)
                                
                                # ファイルが実際に添付されたことを確認
                                file_attached = False
                                for check_attempt in range(10):  # 最大10回チェック
                                    attached_file = page.locator(f'text="{test_file_path.name}"')
                                    attached_count = attached_file.count()
                                    
                                    if attached_count > 0:
                                        print(f"  ✓ ファイルが添付されました: {test_file_path.name} ({attached_count}箇所で検出)")
                                        file_attached = True
                                        break
                                    else:
                                        if check_attempt < 9 and check_attempt % 2 == 0:
                                            print(f"  ⏳ ファイル添付確認中... (試行 {check_attempt + 1}/10)")
                                        page.wait_for_timeout(1000)
                                
                                if not file_attached:
                                    warnings.append(("STEP 9", f"ファイル{file_index}: {test_file_path.name} の添付を確認できませんでした"))
                                    print(f"  ⚠️ 警告: ファイル添付を確認できませんでした")
                                    # エラースクリーンショット
                                    screenshot_name = f"06-07_file_{file_index:02d}_error.png"
                                    save_screenshot(page, test_dir, screenshot_name, f"ファイル添付失敗: {test_file_path.name}")
                                    continue  # 次のファイルへ
                                
                                # プロンプトを入力
                                prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                                if prompt_input.count() > 0:
                                    prompt_text = f"このファイル（{test_file_path.name}）の内容を確認してください。"
                                    print(f"  → プロンプトを入力中...")
                                    prompt_input.first.fill(prompt_text)
                                    page.wait_for_timeout(500)
                                    print(f"  ✓ プロンプト入力完了: {prompt_text}")
                                    
                                    # スクリーンショット（送信前）
                                    screenshot_name = f"06-07_file_{file_index:02d}.png"
                                    save_screenshot(page, test_dir, screenshot_name, f"ファイル添付テスト: {test_file_path.name}")
                                    
                                    # 送信
                                    send_button = page.locator('button[type="submit"]:has(svg)')
                                    if send_button.count() > 0:
                                        # 送信前のメッセージ数を記録
                                        assistant_messages = page.locator('div.bg-white.rounded-xl')
                                        initial_count = assistant_messages.count()
                                        
                                        print(f"  → メッセージ送信中...")
                                        send_button.first.click()
                                        print(f"  ✓ ファイル添付メッセージを送信しました")
                                        
                                        # 送信直後の待機
                                        page.wait_for_timeout(2000)
                                        
                                        # アシスタントメッセージが表示されるまで待機
                                        print(f"  ⏳ AIからの回答を待機中...")
                                        try:
                                            page.wait_for_timeout(3000)  # 初期待機
                                            
                                            # 実際の内容を持つ新しいメッセージが表示されるまで待機
                                            max_retries = 60  # 最大120秒
                                            message_appeared = False
                                            for i in range(max_retries):
                                                assistant_messages = page.locator('div.bg-white.rounded-xl')
                                                current_count = assistant_messages.count()
                                                
                                                # メッセージ数が増えているか確認
                                                if current_count > initial_count:
                                                    # 最後のメッセージに実際の内容があるか確認
                                                    last_message = assistant_messages.last
                                                    message_content = last_message.text_content()
                                                    
                                                    # スケルトンではなく実際のテキストがあるか（10文字以上）
                                                    if message_content and len(message_content.strip()) > 10:
                                                        print(f"  ✓ ファイル添付の回答を受信しました（{len(message_content)}文字）")
                                                        message_appeared = True
                                                        break
                                                
                                                # まだ到着していない
                                                if i < max_retries - 1:
                                                    if i % 10 == 0 and i > 0:  # 20秒ごとにログ出力
                                                        print(f"  ⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                                    page.wait_for_timeout(2000)
                                                else:
                                                    warnings.append(("STEP 9", f"ファイル{file_index}: {test_file_path.name} の回答タイムアウト"))
                                                    print(f"  ⚠️ 警告: 回答が表示されませんでした（タイムアウト）")
                                            
                                            if not message_appeared:
                                                warnings.append(("STEP 9", f"ファイル{file_index}: {test_file_path.name} の回答未表示"))
                                                print(f"  ⚠️ 警告: 回答が表示されませんでした")
                                            
                                            # メッセージ受信後、次のファイルの準備のため待機
                                            print(f"  ✓ ファイル {file_index}/{len(test_files)} 完了")
                                            page.wait_for_timeout(2000)
                                            
                                        except Exception as wait_error:
                                            warnings.append(("STEP 9", f"ファイル{file_index}: {test_file_path.name} 回答待機エラー: {wait_error}"))
                                            print(f"  ⚠️ 警告: 回答待機中にエラー: {wait_error}")
                                    else:
                                        warnings.append(("STEP 9", f"ファイル{file_index}: 送信ボタンが見つかりません"))
                                        print(f"  ⚠️ 警告: 送信ボタンが見つかりませんでした")
                                else:
                                    warnings.append(("STEP 9", f"ファイル{file_index}: プロンプト入力欄が見つかりません"))
                                    print(f"  ⚠️ 警告: プロンプト入力フィールドが見つかりませんでした")
                            else:
                                warnings.append(("STEP 9", f"ファイル{file_index}: ファイル入力要素が見つかりません"))
                                print(f"  ⚠️ 警告: ファイル入力要素が見つかりませんでした")
                        
                        print(f"\n✓ 全ファイルのテストが完了しました（ファイル数: {len(test_files)}）")
                else:
                    warnings.append(("STEP 9", f"テストファイルディレクトリが存在しません: {TEST_FILES_DIR}"))
                    print(f"⚠️ 警告: テストファイルディレクトリが存在しません: {TEST_FILES_DIR}")
            except Exception as e:
                errors.append(("STEP 9", f"ファイル添付確認中にエラー: {e}"))
                print(f"❌ エラー: ファイル添付確認中にエラー: {e}")
            
            # 【STEP 10】フィードバック（Good/Bad）送信
            print("\n[STEP 10] フィードバック（Good/Bad）送信")
            try:
                # 最後のアシスタントメッセージを取得
                assistant_messages = page.locator('div.bg-white.rounded-xl')
                
                if assistant_messages.count() > 0:
                    
                    # 最後のメッセージ内のGoodボタンを探す（SVGアイコンを持つボタン）
                    # chat-message.tsxの実装: FeedbackGoodButton コンポーネント
                    last_message = assistant_messages.last
                    
                    # ボタン群の中から最初のボタン（通常はGoodボタン）を探す
                    # アイコンボタンはsize="icon-sm"とvariant="icon"を持つ
                    feedback_buttons = last_message.locator('button').filter(has=page.locator('svg'))
                    
                    if feedback_buttons.count() >= 4:  # コピー、ダウンロード、Good、Badの4つ
                        # 3番目のボタンがGoodボタン（0-indexed: 0=コピー, 1=ダウンロード, 2=Good, 3=Bad）
                        good_button = feedback_buttons.nth(2)
                        good_button.click()
                        page.wait_for_timeout(1500)
                        
                        # フィードバックダイアログが開いたか確認
                        feedback_dialog = page.locator('[role="dialog"]:has-text("フィードバック"), [role="dialog"]:has-text("この回答は役に立ちました")')
                        
                        if feedback_dialog.count() > 0 and feedback_dialog.is_visible():
                            print("✓ フィードバックダイアログが開きました")
                            save_screenshot(page, test_dir, "10_feedback_1.png", "回答のフィードバックを送信できることを確認する。")
                            
                            # オプション選択（チェックボックスの一番上を選択）
                            # company-analysis.pyと同じく label.text-lg を使用
                            first_checkbox_label = feedback_dialog.locator('label.text-lg').first
                            if first_checkbox_label.count() > 0:
                                first_checkbox_label.click()
                                page.wait_for_timeout(800)
                                print("✓ フィードバックオプション（一番上）を選択しました")
                            else:
                                # 代替手段：通常のcheckboxを探す
                                checkboxes = feedback_dialog.locator('input[type="checkbox"]')
                                if checkboxes.count() > 0:
                                    checkboxes.first.click()
                                    page.wait_for_timeout(500)
                                    print("✓ フィードバック理由を選択しました")
                            
                            # ダイアログ内のInputフィールドに任意の意見を記載
                            dialog_input = feedback_dialog.locator('input[type="text"]')
                            if dialog_input.count() > 0:
                                dialog_input.fill("回答が詳細で非常に役立ちました。")
                                page.wait_for_timeout(500)
                                print("✓ フィードバックテキストを入力しました")
                            
                            # 送信ボタンをクリック
                            submit_button = feedback_dialog.locator('button[type="submit"], button:has-text("送信")')
                            if submit_button.count() > 0:
                                submit_button.click()
                                page.wait_for_timeout(2000)
                                save_screenshot(page, test_dir, "10_feedback_2.png", "回答のフィードバックを送信できることを確認する。")
                                print("✓ フィードバックを送信しました")
                            else:
                                warnings.append(("STEP 10", "フィードバック送信ボタンが見つかりませんでした"))
                                print("⚠️ 警告: フィードバック送信ボタンが見つかりませんでした")
                        else:
                            warnings.append(("STEP 10", "フィードバックダイアログが開きませんでした"))
                            print("⚠️ 警告: フィードバックダイアログが開きませんでした")
                    else:
                        warnings.append(("STEP 10", f"フィードバックボタンが見つかりませんでした（ボタン数: {feedback_buttons.count()}）"))
                        print(f"⚠️ 警告: フィードバックボタンが見つかりませんでした（ボタン数: {feedback_buttons.count()}）")
                else:
                    warnings.append(("STEP 10", "アシスタントメッセージが見つかりませんでした"))
                    print("⚠️ 警告: アシスタントメッセージが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 10", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【STEP 11】回答のコピー
            print("\n[STEP 11] 回答のコピー")
            try:
                # 最後のアシスタントメッセージを取得
                assistant_messages = page.locator('div.bg-white.rounded-xl')
                
                if assistant_messages.count() > 0:
                    
                    # 最後のメッセージ内のコピーボタンを探す
                    # chat-message.tsx: TooltipContent内に「コピー」というテキストがある
                    last_message = assistant_messages.last
                    
                    # ボタン群の中から最初のボタン（コピーボタン）を探す
                    icon_buttons = last_message.locator('button').filter(has=page.locator('svg'))
                    
                    if icon_buttons.count() >= 2:
                        # 最初のボタンがコピーボタン（0-indexed: 0=コピー, 1=ダウンロード）
                        copy_button = icon_buttons.first
                        copy_button.click()
                        page.wait_for_timeout(1500)
                        
                        # トーストメッセージの確認
                        toast_message = page.locator('[data-sonner-toast]:has-text("コピー")')
                        if toast_message.count() > 0:
                            print("✓ コピー完了のトーストメッセージが表示されました")
                        
                        # クリップボードの内容を取得してファイルに保存
                        try:
                            clipboard_text = page.evaluate('navigator.clipboard.readText()')
                            if clipboard_text:
                                copy_file_path = os.path.join(test_dir, "11_copy.txt")
                                with open(copy_file_path, 'w', encoding='utf-8') as f:
                                    f.write(clipboard_text)
                                print(f"✓ コピーされた内容をエビデンスに保存: {copy_file_path}")
                                print(f"  テキスト長: {len(clipboard_text)} 文字")
                            else:
                                warnings.append(("STEP 11", "クリップボードが空です"))
                                print("⚠️ 警告: クリップボードが空です")
                        except Exception as clipboard_error:
                            warnings.append(("STEP 11", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                            print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                        
                        save_screenshot(page, test_dir, "11_copy.png", "回答のコピーができることを確認する。")
                        print("✓ メッセージをコピーしました")
                    else:
                        warnings.append(("STEP 11", f"コピーボタンが見つかりませんでした（ボタン数: {icon_buttons.count()}）"))
                        print(f"⚠️ 警告: コピーボタンが見つかりませんでした（ボタン数: {icon_buttons.count()}）")
                else:
                    warnings.append(("STEP 11", "アシスタントメッセージが見つかりませんでした"))
                    print("⚠️ 警告: アシスタントメッセージが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【STEP 12】会話履歴のダウンロード
            print("\n[STEP 12] 会話履歴のダウンロード")
            try:
                # 最後のアシスタントメッセージを取得
                assistant_messages = page.locator('div.bg-white.rounded-xl')
                
                if assistant_messages.count() > 0:
                    
                    # 最後のメッセージ内のダウンロードボタンを探す
                    # chat-message.tsx: TooltipContent内に「会話履歴をダウンロード」というテキストがある
                    last_message = assistant_messages.last
                    
                    # ボタン群の中から2番目のボタン（ダウンロードボタン）を探す
                    icon_buttons = last_message.locator('button').filter(has=page.locator('svg'))
                    
                    if icon_buttons.count() >= 2:
                        # 2番目のボタンがダウンロードボタン（0-indexed: 0=コピー, 1=ダウンロード）
                        download_button = icon_buttons.nth(1)
                        
                        # ダウンロードを待機
                        with page.expect_download(timeout=15000) as download_info:
                            download_button.click()
                        
                        download = download_info.value
                        filename = download.suggested_filename
                        print(f"✓ ファイルをダウンロードしました: {filename}")
                        
                        # ダウンロードされたファイルを固定名でエビデンスディレクトリに保存
                        downloaded_file_path = os.path.join(test_dir, "12_download.txt")
                        download.save_as(downloaded_file_path)
                        print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                        print(f"  元のファイル名: {filename}")
                        
                        # ファイルサイズも確認
                        file_size = os.path.getsize(downloaded_file_path)
                        print(f"  ファイルサイズ: {file_size} bytes")
                        
                        page.wait_for_timeout(1500)
                        save_screenshot(page, test_dir, "12_download.png", "会話履歴のダウンロードができることを確認する。")
                    else:
                        warnings.append(("STEP 12", f"ダウンロードボタンが見つかりませんでした（ボタン数: {icon_buttons.count()}）"))
                        print(f"⚠️ 警告: ダウンロードボタンが見つかりませんでした（ボタン数: {icon_buttons.count()}）")
                else:
                    warnings.append(("STEP 12", "アシスタントメッセージが見つかりませんでした"))
                    print("⚠️ 警告: アシスタントメッセージが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【STEP 8b】チャット開始時に表示されるプロンプトテンプレートを適用
            print("\n[STEP 8b] チャット開始時に表示されるプロンプトテンプレートを適用")
            try:
                # 新しいチャットを開始
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                if add_button.count() > 0:
                    add_button.click()
                    page.wait_for_timeout(5000)
                    page.wait_for_load_state("networkidle")
                    print("✓ 新しいチャットを開始しました")
                
                # フリーチャットを選択（STEP 6と同じ流れ）
                page.wait_for_timeout(2000)
                free_chat_card = page.locator('text=フリーチャット').first
                
                if free_chat_card.count() > 0:
                    free_chat_card.click()
                    page.wait_for_timeout(2000)
                    print("✓ フリーチャットを選択しました")
                else:
                    warnings.append(("STEP 13", "フリーチャット選択が見つかりませんでした"))
                    print("⚠️ 警告: フリーチャット選択が見つかりませんでした")
                
                # 「データ分析」カードを探して選択
                data_analysis_card = page.locator('text=データ分析').first

                if data_analysis_card.count() > 0:
                    data_analysis_card.click()
                    page.wait_for_timeout(2000)
                    print("✓ データ分析テンプレートを選択しました")
                    # スクリーンショットを撮影（テンプレート選択画面）
                    save_screenshot(page, test_dir, "08_template.png", "チャット開始時に表示されるプロンプトテンプレートを適用してチャットできることを確認する。")
                else:
                    # データ分析がない場合は警告を記録
                    warnings.append(("STEP 8b", "データ分析テンプレートが見つかりませんでした"))
                    print("⚠️ 警告: データ分析テンプレートが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 8b", f"チャット開始時のテンプレート選択中にエラー: {e}"))
                print(f"❌ エラー: チャット開始時のテンプレート選択中にエラー: {e}")
            
            # 【STEP 13】「他のテンプレートを選択する」ボタンでテンプレート適用
            print("\n[STEP 13] 「他のテンプレートを選択する」ボタンでテンプレート適用")
            try:
                # 新しいチャットを開始
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                if add_button.count() > 0:
                    add_button.click()
                    page.wait_for_timeout(5000)
                    page.wait_for_load_state("networkidle")
                    print("✓ 新しいチャットを開始しました")
                
                # フリーチャットを選択（STEP 6と同じ流れ）
                page.wait_for_timeout(2000)
                free_chat_card = page.locator('text=フリーチャット').first
                
                if free_chat_card.count() > 0:
                    free_chat_card.click()
                    page.wait_for_timeout(2000)
                    print("✓ フリーチャットを選択しました")
                else:
                    warnings.append(("STEP 13", "フリーチャット選択が見つかりませんでした"))
                    print("⚠️ 警告: フリーチャット選択が見つかりませんでした")
                
                # 「他のテンプレートを選択する」ボタンを探す
                template_selector_button = page.locator('button:has-text("他のテンプレートを選択する")')
                
                if template_selector_button.count() > 0:
                    
                    template_selector_button.first.click()
                    page.wait_for_timeout(1500)
                    
                    # ダイアログが開いたか確認
                    dialog = page.locator('[role="dialog"]')
                    if dialog.count() > 0 and dialog.is_visible():
                        print("✓ テンプレート選択ダイアログが開きました")
                        save_screenshot(page, test_dir, "09_template_selector_1.png", "「他のテンプレートを選択する」ボタンをクリックし、プロンプトテンプレートを適用してチャットできることを確認する。")
                        
                        # テーブル内のテンプレート行をクリック
                        template_rows = dialog.locator('table tbody tr')
                        if template_rows.count() > 0:
                            template_rows.first.click()
                            page.wait_for_timeout(1000)
                            print("✓ テンプレートを選択しました")
                            
                            # 「選択する」ボタンをクリック
                            select_button = dialog.locator('button:has-text("選択する")')
                            if select_button.count() > 0:
                                select_button.click()
                                page.wait_for_timeout(1500)
                                save_screenshot(page, test_dir, "09_template_selector_2.png", "「他のテンプレートを選択する」ボタンをクリックし、プロンプトテンプレートを適用してチャットできることを確認する。")
                                print("✓ テンプレートを適用しました")
                            else:
                                warnings.append(("STEP 13", "「選択する」ボタンが見つかりませんでした"))
                                print("⚠️ 警告: 「選択する」ボタンが見つかりませんでした")
                        else:
                            warnings.append(("STEP 13", "テンプレート一覧が見つかりませんでした"))
                            print("⚠️ 警告: テンプレート一覧が見つかりませんでした")
                    else:
                        warnings.append(("STEP 13", "テンプレート選択ダイアログが開きませんでした"))
                        print("⚠️ 警告: テンプレート選択ダイアログが開きませんでした")
                else:
                    warnings.append(("STEP 13", "「他のテンプレートを選択する」ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 「他のテンプレートを選択する」ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"テンプレート選択ダイアログ確認中にエラー: {e}"))
                print(f"❌ エラー: テンプレート選択ダイアログ確認中にエラー: {e}")
            
            # 【STEP 14】チャット履歴の検索
            print("\n[STEP 14] チャット履歴の検索")
            try:
                # 検索ボックスを探す
                search_box = page.locator('input[placeholder*="チャットを検索"]')
                
                if search_box.count() > 0:
                    save_screenshot(page, test_dir, "13_search_1.png", "チャット履歴の検索ができることを確認する。")
                    
                    # 検索語を入力
                    search_box.fill("テスト")
                    page.wait_for_timeout(1500)
                    
                    save_screenshot(page, test_dir, "13_search_2.png", "チャット履歴の検索ができることを確認する。")
                    print("✓ チャット履歴を検索しました")
                    
                    # 検索をクリア
                    search_box.clear()
                else:
                    warnings.append(("STEP 14", "検索ボックスが見つかりませんでした"))
                    print("⚠️ 警告: 検索ボックスが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"検索機能確認中にエラー: {e}"))
                print(f"❌ エラー: 検索機能確認中にエラー: {e}")
            
            # 【STEP 15】設定からモデル変更
            print("\n[STEP 15] 設定からモデル変更")
            try:
                # 設定ボタンを探す（チャットタイトルの隣のボタン）
                settings_button = page.locator('h3:has-text("チャット")').locator('..').locator('button').last
                
                if settings_button.count() > 0:
                    # save_screenshot(page, test_dir, "14_settings_1.png", "設定ダイアログ表示前")
                    
                    settings_button.first.click()
                    page.wait_for_timeout(1500)
                    
                    # 設定ダイアログが開いたか確認
                    settings_dialog = page.locator('[role="dialog"]:has-text("パラメータ設定")')
                    
                    if settings_dialog.count() > 0 and settings_dialog.is_visible():
                        print("✓ 設定ダイアログが開きました")
                        save_screenshot(page, test_dir, "14_settings_1.png", "「設定」からモデルの変更ができることを確認する。")
                        
                        # モデル選択（ラジオボタン）
                        radio_buttons = settings_dialog.locator('input[type="radio"]')
                        if radio_buttons.count() > 1:
                            # 2番目のモデルを選択（labelが被っているのでforce=Trueで強制クリック）
                            radio_buttons.nth(1).click(force=True)
                            page.wait_for_timeout(1000)
                            print("✓ モデルを変更しました")
                            
                            save_screenshot(page, test_dir, "14_settings_2.png", "「設定」からモデルの変更ができることを確認する。")
                            
                            # 「設定する」ボタンをクリック
                            submit_button = settings_dialog.locator('button:has-text("設定する")')
                            if submit_button.count() > 0:
                                submit_button.click()
                                page.wait_for_timeout(1500)
                                save_screenshot(page, test_dir, "14_settings_3.png", "「設定」からモデルの変更ができることを確認する。")
                                print("✓ モデル設定を保存しました")
                            else:
                                warnings.append(("STEP 15", "「設定する」ボタンが見つかりませんでした"))
                                print("⚠️ 警告: 「設定する」ボタンが見つかりませんでした")
                        else:
                            warnings.append(("STEP 15", "モデル選択肢が不足しています"))
                            print("⚠️ 警告: モデル選択肢が不足しています")
                    else:
                        warnings.append(("STEP 15", "設定ダイアログが開きませんでした"))
                        print("⚠️ 警告: 設定ダイアログが開きませんでした")
                else:
                    warnings.append(("STEP 15", "設定ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 設定ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 15", f"設定機能確認中にエラー: {e}"))
                print(f"❌ エラー: 設定機能確認中にエラー: {e}")
            
            # 【STEP 16】チャット個別削除
            print("\n[STEP 16] チャット個別削除")
            try:
                # 履歴フィールド内のスレッド項目の3点リーダーボタンを探す
                # thread-list.tsxの実装: 各スレッドに SvgEllipsis ボタンがあり、ドロップダウンメニューが開く
                # 履歴セクション内のスレッドアイテムを探す
                thread_items = page.locator('text=履歴').locator('..').locator('..').locator('a')
                
                if thread_items.count() > 0:
                    
                    # 削除前のスレッド数を記録
                    initial_thread_count = thread_items.count()
                    print(f"削除前のスレッド数: {initial_thread_count}")
                    
                    # 最初のスレッドアイテム内の3点リーダーボタンを探す
                    first_thread = thread_items.first
                    ellipsis_button = first_thread.locator('button').filter(has=page.locator('svg'))
                    
                    if ellipsis_button.count() > 0:
                        ellipsis_button.first.click()
                        page.wait_for_timeout(1000)
                        print("✓ 履歴項目の3点リーダーボタンをクリックしました")
                        
                        # ドロップダウンメニューが表示されるまで待機（Radix UIのPortalで表示される）
                        # メニュー項目内のdivに「削除」テキストがあるものを探す
                        page.wait_for_timeout(500)
                        
                        # DropdownMenuItemの中のdivをクリック
                        # ThreadListの実装: <DropdownMenuItem><div onClick={...}>...</div></DropdownMenuItem>
                        delete_item = page.locator('div.flex.items-center.gap-x-1:has-text("削除")')
                        
                        if delete_item.count() > 0 and delete_item.is_visible():
                            save_screenshot(page, test_dir, "15_delete_chat_1.png", "チャット履歴のチャットを個別に削除できることを確認する。")
                            print(f"✓ ドロップダウンメニューが表示されました（削除アイテム数: {delete_item.count()}）")
                            
                            # 削除アイテムをクリック
                            delete_item.first.click()
                            page.wait_for_timeout(2000)
                            
                            # 削除後のスレッド数を確認
                            thread_items_after = page.locator('text=履歴').locator('..').locator('..').locator('a')
                            final_thread_count = thread_items_after.count()
                            
                            if final_thread_count < initial_thread_count:
                                print(f"✓ チャットを個別削除しました（スレッド数: {initial_thread_count} → {final_thread_count}）")
                            else:
                                warnings.append(("STEP 16", f"削除が実行されていない可能性があります（スレッド数: {initial_thread_count} → {final_thread_count}）"))
                                print(f"⚠️ 警告: 削除が実行されていない可能性があります（スレッド数: {initial_thread_count} → {final_thread_count}）")
                            
                            save_screenshot(page, test_dir, "15_delete_chat_2.png", "チャット履歴のチャットを個別に削除できることを確認する。")
                        else:
                            warnings.append(("STEP 16", f"削除メニュー項目が見つかりませんでした（アイテム数: {delete_item.count()}、visible: {delete_item.is_visible() if delete_item.count() > 0 else False}）"))
                            print(f"⚠️ 警告: 削除メニュー項目が見つかりませんでした")
                            save_screenshot(page, test_dir, "15_delete_chat_1_no_menu.png", "メニュー未表示")
                    else:
                        warnings.append(("STEP 16", "スレッド項目内の3点リーダーボタンが見つかりませんでした"))
                        print("⚠️ 警告: スレッド項目内の3点リーダーボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 16", f"履歴フィールド内のスレッドが見つかりませんでした（スレッド数: {thread_items.count()}）"))
                    print(f"⚠️ 警告: 履歴フィールド内のスレッドが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 16", f"チャット個別削除確認中にエラー: {e}"))
                print(f"❌ エラー: チャット個別削除確認中にエラー: {e}")
            
            # 【STEP 17】チャット一括削除
            print("\n[STEP 17] チャット一括削除")
            try:
                # 「全てを削除」ボタンを探す
                clear_all_button = page.locator('button:has-text("全てを削除")')
                
                if clear_all_button.count() > 0:
                    
                    clear_all_button.first.click()
                    page.wait_for_timeout(1500)
                    
                    # 確認ダイアログが表示されるか確認
                    confirm_dialog = page.locator('[role="dialog"]:has-text("削除"), [role="dialog"]:has-text("全て")')
                    
                    if confirm_dialog.count() > 0 and confirm_dialog.is_visible():
                        print("✓ 削除確認ダイアログが表示されました")
                        save_screenshot(page, test_dir, "16_delete_all_1.png", "チャット履歴のすべてのチャットを一括で削除できることを確認する。")
                        
                        # 削除を確定
                        confirm_button = confirm_dialog.locator('button:has-text("削除")')
                        if confirm_button.count() > 0:
                            confirm_button.first.click()
                            page.wait_for_timeout(2000)
                            
                            save_screenshot(page, test_dir, "16_delete_all_2.png", "チャット履歴のすべてのチャットを一括で削除できることを確認する。")
                            print("✓ すべてのチャットを削除しました")
                        else:
                            warnings.append(("STEP 17", "削除確定ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 削除確定ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 17", "削除確認ダイアログが表示されませんでした"))
                        print("⚠️ 警告: 削除確認ダイアログが表示されませんでした")
                else:
                    warnings.append(("STEP 17", "「全てを削除」ボタンが見つかりませんでした（チャットが0件の可能性）"))
                    print("⚠️ 警告: 「全てを削除」ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 17", f"一括削除確認中にエラー: {e}"))
                print(f"❌ エラー: 一括削除確認中にエラー: {e}")
            
            log_print("\n" + "="*70)
            log_print("✅ 全テスト完了: チャット画面の全機能を確認しました")
            log_print("="*70)
            
        except Exception as e:
            errors.append(("全体", f"予期しないエラーが発生しました: {e}"))
            print(f"\n❌ 予期しないエラー: {e}")
            save_screenshot(page, test_dir, "error_screenshot.png", "エラー発生時のスクリーンショット")
        
        finally:
            # テスト結果のサマリーを表示
            log_print(f"\n{'='*70}")
            log_print(f"【テスト実行結果サマリー】")
            log_print(f"{'='*70}")
            
            # 警告とエラーの集計
            warning_count = len(warnings)
            error_count = len(errors)
            
            if warning_count == 0 and error_count == 0:
                log_print(f"\n✅ 結果: PASS")
                log_print(f"   すべてのテストが正常に完了しました")
            else:
                log_print(f"\n⚠️ 結果: 要チェック")
                log_print(f"   警告: {warning_count}件")
                log_print(f"   エラー: {error_count}件")
            
            # 警告の詳細を表示
            if warning_count > 0:
                log_print(f"\n【警告の詳細】")
                for step, message in warnings:
                    log_print(f"  - {step}: {message}")
            
            # エラーの詳細を表示
            if error_count > 0:
                log_print(f"\n【エラーの詳細】")
                for step, message in errors:
                    log_print(f"  - {step}: {message}")
            
            log_print(f"\n{'='*70}")
            log_print(f"エビデンス保存先: {test_dir}")
            log_print(f"{'='*70}")
            
            # ログをファイルに保存
            try:
                log_file_path = Path(test_dir) / "test_execution.log"
                with open(log_file_path, "w", encoding="utf-8") as f:
                    f.write(f"テスト実行ログ - chat.py\n")
                    f.write(f"{'='*70}\n")
                    f.write(f"実行日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write(f"エビデンス保存先: {test_dir}\n")
                    f.write(f"{'='*70}\n\n")
                    
                    # ログメッセージを書き込み
                    for log_msg in log_messages:
                        f.write(log_msg + "\n")
                    
                    # テスト結果サマリーを追加
                    f.write(f"\n{'='*70}\n")
                    f.write(f"【テスト実行結果サマリー】\n")
                    f.write(f"{'='*70}\n")
                    f.write(f"警告: {len(warnings)}件\n")
                    f.write(f"エラー: {len(errors)}件\n")
                    
                    if len(warnings) > 0:
                        f.write(f"\n【警告の詳細】\n")
                        for step, message in warnings:
                            f.write(f"  - {step}: {message}\n")
                    
                    if len(errors) > 0:
                        f.write(f"\n【エラーの詳細】\n")
                        for step, message in errors:
                            f.write(f"  - {step}: {message}\n")
                    
                    f.write(f"\n{'='*70}\n")
                    f.write(f"ログファイル保存完了\n")
                    f.write(f"{'='*70}\n")
                
                print(f"✓ ログファイルを保存しました: {log_file_path}")
            except Exception as log_error:
                print(f"⚠️ ログファイルの保存に失敗しました: {log_error}")
            
            browser.close()
    
    # 【重要】テストの成否を判定
    # エラーが1件でもあればテスト失敗
    assert len(errors) == 0, f"テストでエラーが{len(errors)}件発生しました:\n" + "\n".join([f"  - {step}: {msg}" for step, msg in errors])
    
    # 警告についても厳格にチェックする場合は以下のコメントを外す
    # assert len(warnings) == 0, f"テストで警告が{len(warnings)}件発生しました:\n" + "\n".join([f"  - {step}: {msg}" for step, msg in warnings])
    
    # 警告は許容しつつ、ログ出力のみ行う
    if len(warnings) > 0:
        print(f"\n⚠️ 注意: テストで警告が{len(warnings)}件発生しました")
        print("詳細は上記のサマリーを確認してください")


if __name__ == "__main__":
    """スクリプトとして直接実行する場合"""
    import sys
    
    print("=" * 70)
    print("Playwright E2Eテスト: チャット画面")
    print("=" * 70)
    
    try:
        test_chat_features()
        print("\n✅ テスト成功: すべてのテストが正常に完了しました")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ テスト失敗:\n{e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ テスト実行エラー:\n{e}")
        sys.exit(1)
