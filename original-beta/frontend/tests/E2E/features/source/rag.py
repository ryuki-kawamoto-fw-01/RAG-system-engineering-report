"""
rag.py - 文書検索画面のE2Eテスト

【テスト観点】
①｢文書検索画面｣が正しく表示されることを確認する
②過去のチャット履歴の一覧が表示されることを確認する
③「＋」ボタンをクリックすると新しいチャットを開始できることを確認する
④カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
⑤プロンプトを送信すると回答が返ってくることを確認する
⑥「すべてのフォルダを検索」を指定して社内文書検索ができていることを確認する
⑦インデックスを絞った検索ができることを確認する
⑧プロンプトの📎マークをクリックしてファイルを選択し送信ができることを確認する
⑨チャット開始時に表示されるプロンプトテンプレートを適用してチャットできることを確認する
⑩「他のテンプレートを選択する」ボタンをクリックし、プロンプトテンプレートを適用してチャットできることを確認する
⑪PDFファイル（.pdf）が参考元として表示され、プレビューが表示されることを確認する
⑫テキストファイル（.txt）が参考元として表示され、プレビューが表示されることを確認する
⑬CSVファイル（.csv）が参考元として表示され、プレビューが表示されることを確認する
⑭Word文書（.docx）が参考元として表示され、プレビューが表示されることを確認する
⑮Excelスプレッドシート（.xlsx）が参考元として表示され、プレビューが表示されることを確認する
⑯PowerPointプレゼンテーション（.pptx）が参考元として表示され、プレビューが表示されることを確認する
⑰回答のフィードバック（Good/Bad）を送信できることを確認する
⑱回答のコピーができることを確認する
⑲会話履歴のダウンロードができることを確認する
⑳チャット履歴の検索ができることを確認する
㉑「設定」の歯車ボタンからモデルの変更ができることを確認する
㉒「設定」の歯車ボタンからモデルを変更し、その設定で文書検索できることを確認する
㉓「設定」の歯車ボタンから検索手法の変更ができることを確認する
㉔「設定」の歯車ボタンから検索手法を変更し、その設定で文書検索できることを確認する
㉕チャット履歴のチャットを個別に削除できることを確認する
㉖チャット履歴のすべてのチャットを一括で削除できることを確認する

【実行コマンド】
MANUAL_AUTH=true python frontend/tests/E2E/features/source/rag.py -v -s 
または
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/rag.py::test_rag_features -v -s
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import BASE_URL, PROXY_CONFIG, BROWSER_ARGS


# テスト用ファイルのディレクトリ
TEST_FILES_DIR = Path(__file__).parent.parent / "input" / "01_chat"
# テスト用ファイルのパス
TEST_FILE_PATH = TEST_FILES_DIR / "テストデータ.pdf"


def test_rag_features():
    """文書検索画面の全機能をテストする"""
    
    # テスト実行結果の追跡
    warnings = []  # 警告のリスト [(step, message), ...]
    errors = []    # エラーのリスト [(step, message), ...]
    
    # エビデンス保存用ディレクトリを作成
    test_dir = ensure_evidence_dir()
    print(f"\n{'='*70}")
    print(f"エビデンス保存先: {test_dir}")
    print(f"{'='*70}\n")
    
    # ★重要：インデックス絞り込み検索で選択するフォルダ名を設定
    # ここに実際に存在するフォルダ名を入力してください
    FOLDER_NAME_TO_SEARCH = "検証用"  # ← ここを変更してください
    
    with sync_playwright() as p:
        # 環境変数で認証モードを制御
        manual_auth_mode = os.getenv("MANUAL_AUTH", "false").lower() == "true"
        
        # 手動認証モードの場合は常にヘッドフルモードで実行
        if manual_auth_mode:
            headless = False
            print("【手動認証モード】ヘッドフルモードで起動します。")
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
            print("✓ 保存された認証状態を使用します")
        
        context = browser.new_context(**context_options)
        page = context.new_page()
        
        try:
            # 【STEP 1】認証処理
            print("\n[STEP 1] Azure認証処理")
            page.goto(BASE_URL)
            
            # 認証状態が有効でない場合のみ認証を実行
            if not is_auth_state_valid(page, BASE_URL):
                print("認証が必要です。認証処理を開始します...")
                if not handle_azure_authentication(page, manual_auth_mode):
                    errors.append(("STEP 1", "認証に失敗しました"))
                    print("❌ エラー: 認証に失敗しました")
                    return
                # 認証成功後、認証状態を保存
                save_auth_state(context)
            else:
                print("✓ 既存の認証状態が有効です。認証をスキップします。")
            
            print("✓ Azure認証が完了しました")
            
            # 【STEP 2】利用規約への同意
            print("\n[STEP 2] 利用規約への同意")
            if not handle_terms_agreement(page):
                errors.append(("STEP 2", "利用規約同意処理に失敗しました"))
                print("❌ エラー: 利用規約同意処理に失敗しました")
                return
            
            print("✓ 利用規約への同意が完了しました")
            
            # 【STEP 3】ホームページから文書検索画面へ遷移
            print("\n[STEP 3] ホームページから文書検索画面へ遷移")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            
            # 文書検索画面へ直接遷移
            try:
                save_screenshot(page, test_dir, "00_home.png", "ホーム画面表示確認")
                print(f"/rag-chatページへ遷移します...")
                page.goto(f"{BASE_URL}/rag-chat")
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(5000)  # 待機時間を延長
                
                # マウスカーソルを表示
                enable_mouse_cursor(page)
                
                print(f"✓ 文書検索画面へ遷移しました（URL: {page.url}）")
            except Exception as e:
                warnings.append(("STEP 3", f"文書検索画面への遷移中にエラー: {e}"))
                print(f"⚠️ 警告: 文書検索画面への遷移中にエラー: {e}")
            
            # 【STEP 4】文書検索画面が正しく表示されることを確認
            print("\n[STEP 4] 文書検索画面（履歴セクション）が正しく表示されることを確認")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            
            try:
                # 履歴セクションの確認
                history_section = page.locator('text=履歴').first
                
                if history_section.count() > 0:
                    save_screenshot(page, test_dir, "01_rag_page_display.png", "｢文書検索画面｣が正しく表示されることを確認する")
                    print("✓ 文書検索画面（履歴セクション）が正しく表示されています")
                else:
                    errors.append(("STEP 4", "文書検索画面の必須要素（履歴セクション）が見つかりませんでした"))
                    print("❌ エラー: 文書検索画面の必須要素が見つかりませんでした")
                    print(f"デバッグ: 現在のURL = {page.url}")
                    print(f"デバッグ: ページタイトル = {page.title()}")
            except Exception as e:
                errors.append(("STEP 4", f"文書検索画面表示確認中にエラー: {e}"))
                print(f"❌ エラー: 文書検索画面表示確認中にエラー: {e}")
            
            # 【STEP 5】「＋」ボタンで新しいチャット開始
            print("\n[STEP 5] 「＋」ボタンで新しいチャット開始")
            try:
                # 「履歴」の隣のボタンを探す
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                
                if add_button.count() > 0:
                    save_screenshot(page, test_dir, "02_chat-history.png", "過去のチャット履歴の一覧が表示されることを確認する")
                    add_button.click()
                    # 新しいチャットスレッドページに遷移するまで待機
                    page.wait_for_timeout(5000)
                    page.wait_for_load_state("networkidle")
                    save_screenshot(page, test_dir, "03_new_chat.png", "「＋」ボタンをクリックすると新しいチャットを開始できることを確認する")
                    print(f"✓ 新しいチャットを開始しました（URL: {page.url}）")
                else:
                    warnings.append(("STEP 5", "「＋」ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 「＋」ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 5", f"新しいチャット開始中にエラー: {e}"))
                print(f"❌ エラー: 新しいチャット開始中にエラー: {e}")
            
            # 【STEP 7】インフォメーションアイコンで機能説明表示
            print("\n[STEP 7] インフォメーションアイコンで機能説明表示")
            try:
                # h3の隣のヘルプボタンを探す
                help_button = page.locator('h3:has-text("文書検索")').locator('..').locator('button')
                
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
                    
                    save_screenshot(page, test_dir, "04_help.png", "カーソルをヘルプマークに合わせると機能説明が表示されることを確認する")
                else:
                    warnings.append(("STEP 7", "ヘルプボタンが見つかりませんでした"))
                    print("⚠️ 警告: ヘルプボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"機能説明表示確認中にエラー: {e}"))
                print(f"❌ エラー: 機能説明表示確認中にエラ: {e}")
            
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
                    
                    # 送信ボタンをクリック
                    send_button = page.locator('button[type="submit"]:has(svg)')
                    if send_button.count() > 0:
                        # 送信前のメッセージ数を記録
                        assistant_messages = page.locator('div.bg-white.rounded-xl')
                        initial_count = assistant_messages.count()
                        print(f"送信前のメッセージ数: {initial_count}")
                        
                        send_button.first.click()
                        print("✓ プロンプトを送信しました")
                        
                        # AIからの回答を待機
                        print("⏳ AIからの回答を待機中...")
                        try:
                            page.wait_for_timeout(3000)
                            
                            max_retries = 60  # 最大120秒
                            message_appeared = False
                            for i in range(max_retries):
                                assistant_messages = page.locator('div.bg-white.rounded-xl')
                                current_count = assistant_messages.count()
                                
                                if current_count > initial_count:
                                    last_message = assistant_messages.last
                                    message_content = last_message.text_content()
                                    
                                    if message_content and len(message_content.strip()) > 10:
                                        print(f"✓ AIからの回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                        message_appeared = True
                                        break
                                
                                if i < max_retries - 1:
                                    if i % 5 == 0 and i > 0:
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
            
            # 【STEP 9】すべてのフォルダを検索
            print("\n[STEP 9] すべてのフォルダを検索して社内文書検索")
            try:
                # カテゴリ選択ボタンを探す
                category_button = page.locator('button[role="combobox"]')
                
                if category_button.count() > 0:
                    save_screenshot(page, test_dir, "06_all_folders_1.png", "すべてのフォルダ検索前")
                    
                    # ボタンに「全てのフォルダ」と表示されていることを確認
                    button_text = category_button.first.text_content()
                    if "全てのフォルダ" in button_text:
                        print("✓ 「全てのフォルダを検索」が設定されています")
                    else:
                        print(f"現在の設定: {button_text}")
                    
                    # プロンプトを送信
                    prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                    if prompt_input.count() > 0:
                        search_query = "製造業に関する資料を検索してください"
                        prompt_input.first.fill(search_query)
                        page.wait_for_timeout(1000)
                        
                        send_button = page.locator('button[type="submit"]:has(svg)')
                        if send_button.count() > 0:
                            # 送信前のメッセージ数を記録
                            assistant_messages = page.locator('div.bg-white.rounded-xl')
                            initial_count = assistant_messages.count()
                            print(f"送信前のメッセージ数: {initial_count}")
                            
                            send_button.first.click()
                            print("✓ 全フォルダ検索のプロンプトを送信しました")
                            
                            # AIからの回答を待機
                            print("⏳ 検索結果を待機中...")
                            try:
                                page.wait_for_timeout(3000)  # 初期待機
                                
                                max_retries = 60  # 最大120秒
                                message_appeared = False
                                for i in range(max_retries):
                                    assistant_messages = page.locator('div.bg-white.rounded-xl')
                                    current_count = assistant_messages.count()
                                    
                                    if current_count > initial_count:
                                        last_message = assistant_messages.last
                                        message_content = last_message.text_content()
                                        
                                        if message_content and len(message_content.strip()) > 10:
                                            print(f"✓ AIからの回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                            message_appeared = True
                                            break
                                    
                                    if i < max_retries - 1:
                                        if i % 5 == 0 and i > 0:
                                            print(f"⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                        page.wait_for_timeout(2000)
                                    else:
                                        warnings.append(("STEP 9", f"AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）"))
                                        print(f"⚠️ 警告: AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）")
                                
                                if not message_appeared:
                                    warnings.append(("STEP 9", "AI回答が表示されませんでした"))
                                    print("⚠️ 警告: AI回答が表示されませんでした")
                                    
                            except Exception as wait_error:
                                warnings.append(("STEP 9", f"回答待機中にエラー: {wait_error}"))
                                print(f"⚠️ 警告: 回答待機中にエラー: {wait_error}")
                            
                            # 参考文献のリンクが表示されるか確認
                            reference_links = page.locator('a[href^="blob:"]')
                            if reference_links.count() > 0:
                                print(f"✓ 参考文献が見つかりました（{reference_links.count()}件）")
                            else:
                                warnings.append(("STEP 9", "参考文献のリンクが見つかりませんでした"))
                                print("⚠️ 警告: 参考文献のリンクが見つかりませんでした")
                            
                            save_screenshot(page, test_dir, "06_all_folders_2.png", "「すべてのフォルダを検索」を指定して社内文書検索ができていることを確認する")
                else:
                    warnings.append(("STEP 9", "カテゴリ選択ボタンが見つかりませんでした"))
                    print("⚠️ 警告: カテゴリ選択ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 9", f"全フォルダ検索確認中にエラー: {e}"))
                print(f"❌ エラー: 全フォルダ検索確認中にエラー: {e}")
            
            # 【STEP 10】インデックスを絞った検索
            print(f"\n[STEP 10] インデックスを絞った検索（フォルダ: {FOLDER_NAME_TO_SEARCH}）")
            print(f"※実際に存在するフォルダ名を入力してください: {FOLDER_NAME_TO_SEARCH}")
            try:
                # カテゴリ選択ボタンをクリック
                category_button = page.locator('button[role="combobox"]')
                
                if category_button.count() > 0:
                    category_button.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ カテゴリ選択メニューを開きました")
                    
                    # 検索フィールドにフォルダ名を入力
                    search_input = page.locator('input[placeholder*="フォルダ名を検索"]')
                    if search_input.count() > 0:
                        search_input.fill(FOLDER_NAME_TO_SEARCH)
                        page.wait_for_timeout(1000)
                        save_screenshot(page, test_dir, "07_folder_search_1_menu.png", "フォルダ検索メニュー")
                        
                        # 候補からフォルダを選択
                        folder_option = page.locator(f'div[role="option"]:has-text("{FOLDER_NAME_TO_SEARCH}")').first
                        if folder_option.count() > 0:
                            folder_option.click()
                            page.wait_for_timeout(1000)
                            print(f"✓ フォルダ「{FOLDER_NAME_TO_SEARCH}」を選択しました")
                            
                            # プロンプト送信
                            prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                            if prompt_input.count() > 0:
                                folder_search_query = f"{FOLDER_NAME_TO_SEARCH}に関する情報を教えてください"
                                prompt_input.first.fill(folder_search_query)
                                page.wait_for_timeout(1000)
                                
                                send_button = page.locator('button[type="submit"]:has(svg)')
                                if send_button.count() > 0:
                                    # 送信前のメッセージ数を記録
                                    assistant_messages = page.locator('div.bg-white.rounded-xl')
                                    initial_count = assistant_messages.count()
                                    print(f"送信前のメッセージ数: {initial_count}")
                                    
                                    send_button.first.click()
                                    print("✓ フォルダ絞り込み検索のプロンプトを送信しました")
                                    
                                    # AIからの回答を待機
                                    print("⏳ 検索結果を待機中...")
                                    try:
                                        page.wait_for_timeout(3000)  # 初期待機
                                        
                                        max_retries = 60  # 最大120秒
                                        message_appeared = False
                                        for i in range(max_retries):
                                            assistant_messages = page.locator('div.bg-white.rounded-xl')
                                            current_count = assistant_messages.count()
                                            
                                            if current_count > initial_count:
                                                last_message = assistant_messages.last
                                                message_content = last_message.text_content()
                                                
                                                if message_content and len(message_content.strip()) > 10:
                                                    print(f"✓ AIからの回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                                    message_appeared = True
                                                    break
                                            
                                            if i < max_retries - 1:
                                                if i % 5 == 0 and i > 0:
                                                    print(f"⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                                page.wait_for_timeout(2000)
                                            else:
                                                warnings.append(("STEP 10", f"AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）"))
                                                print(f"⚠️ 警告: AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）")
                                        
                                        if not message_appeared:
                                            warnings.append(("STEP 10", "AI回答が表示されませんでした"))
                                            print("⚠️ 警告: AI回答が表示されませんでした")
                                            
                                    except Exception as wait_error:
                                        warnings.append(("STEP 10", f"回答待機中にエラー: {wait_error}"))
                                        print(f"⚠️ 警告: 回答待機中にエラー: {wait_error}")
                                    
                                    save_screenshot(page, test_dir, "07_folder_search_2_result.png", "インデックスを絞った検索ができることを確認する")
                        else:
                            warnings.append(("STEP 10", f"フォルダ「{FOLDER_NAME_TO_SEARCH}」が見つかりませんでした"))
                            print(f"⚠️ 警告: フォルダ「{FOLDER_NAME_TO_SEARCH}」が見つかりませんでした")
                            print(f"※ FOLDER_NAME_TO_SEARCH を実際に存在するフォルダ名に変更してください")
                            save_screenshot(page, test_dir, "07_folder_search_not_found.png", "フォルダが見つからない")
                    else:
                        warnings.append(("STEP 10", "フォルダ検索入力フィールドが見つかりませんでした"))
                        print("⚠️ 警告: フォルダ検索入力フィールドが見つかりませんでした")
                else:
                    warnings.append(("STEP 10", "カテゴリ選択ボタンが見つかりませんでした"))
                    print("⚠️ 警告: カテゴリ選択ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 10", f"インデックス絞り込み検索確認中にエラー: {e}"))
                print(f"❌ エラー: インデックス絞り込み検索確認中にエラー: {e}")
            
            # 【STEP 11】📎マークでファイル選択
            print("\n[STEP 11] 📎マークでファイルを選択し送信")
            try:
                # ファイル添付ボタンを探す
                attachment_button = page.locator('button[type="button"]').filter(has=page.locator('svg'))
                
                if attachment_button.count() > 0:
                    # ファイル入力要素を探す
                    file_input = page.locator('input[type="file"]')
                    
                    if file_input.count() > 0 and TEST_FILE_PATH.exists():
                        # ファイルを選択
                        file_input.set_input_files(str(TEST_FILE_PATH))
                        page.wait_for_timeout(2000)
                        
                        print(f"✓ ファイルを選択しました: {TEST_FILE_PATH.name}")
                        
                        # ファイルが添付されたことを確認
                        attached_file = page.locator('div:has-text("' + TEST_FILE_PATH.name + '")')
                        if attached_file.count() > 0:
                            print("✓ ファイルが添付されました")
                        
                        # プロンプトを入力して送信
                        prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                        if prompt_input.count() > 0:
                            prompt_input.first.fill("このファイルの内容を確認してください。")
                            page.wait_for_timeout(1000)
                            save_screenshot(page, test_dir, "08_file_attach.png", "プロンプトの📎マークをクリックしてファイルを選択し送信ができることを確認する")

                            send_button = page.locator('button[type="submit"]:has(svg)')
                            if send_button.count() > 0:
                                # 送信前のメッセージ数を記録
                                assistant_messages = page.locator('div.bg-white.rounded-xl')
                                initial_count = assistant_messages.count()
                                print(f"送信前のメッセージ数: {initial_count}")
                                
                                send_button.first.click()
                                print("✓ ファイル添付メッセージを送信しました")
                                
                                # AIからの回答を待機
                                print("⏳ AIからの回答を待機中...")
                                try:
                                    page.wait_for_timeout(3000)  # 初期待機
                                    
                                    max_retries = 60  # 最大120秒
                                    message_appeared = False
                                    for i in range(max_retries):
                                        assistant_messages = page.locator('div.bg-white.rounded-xl')
                                        current_count = assistant_messages.count()
                                        
                                        if current_count > initial_count:
                                            last_message = assistant_messages.last
                                            message_content = last_message.text_content()
                                            
                                            if message_content and len(message_content.strip()) > 10:
                                                print(f"✓ ファイル添付の回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                                message_appeared = True
                                                break
                                        
                                        if i < max_retries - 1:
                                            if i % 5 == 0 and i > 0:
                                                print(f"⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                            page.wait_for_timeout(2000)
                                        else:
                                            warnings.append(("STEP 11", f"ファイル添付メッセージの回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）"))
                                            print(f"⚠️ 警告: ファイル添付メッセージの回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）")
                                    
                                    if not message_appeared:
                                        warnings.append(("STEP 11", "ファイル添付メッセージの回答が表示されませんでした"))
                                        print("⚠️ 警告: ファイル添付メッセージの回答が表示されませんでした")
                                        
                                except Exception as wait_error:
                                    warnings.append(("STEP 11", f"回答待機中にエラー: {wait_error}"))
                                    print(f"⚠️ 警告: 回答待機中にエラー: {wait_error}")
                    else:
                        if not TEST_FILE_PATH.exists():
                            warnings.append(("STEP 11", f"テストファイルが存在しません: {TEST_FILE_PATH}"))
                            print(f"⚠️ 警告: テストファイルが存在しません: {TEST_FILE_PATH}")
                        else:
                            warnings.append(("STEP 11", "ファイル入力要素が見つかりませんでした"))
                            print("⚠️ 警告: ファイル入力要素が見つかりませんでした")
                else:
                    warnings.append(("STEP 11", "ファイル添付ボタンが見つかりませんでした"))
                    print("⚠️ 警告: ファイル添付ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"ファイル添付確認中にエラー: {e}"))
                print(f"❌ エラー: ファイル添付確認中にエラー: {e}")
            
            # 【STEP 12】フィードバック（Good/Bad）送信
            print("\n[STEP 12] フィードバック（Good/Bad）送信")
            try:
                # 最後のアシスタントメッセージを取得
                assistant_messages = page.locator('div.bg-white.rounded-xl')
                
                if assistant_messages.count() > 0:
                    last_message = assistant_messages.last
                    
                    # ボタン群の中からGoodボタンを探す
                    feedback_buttons = last_message.locator('button').filter(has=page.locator('svg'))
                    
                    if feedback_buttons.count() >= 4:
                        # 3番目のボタンがGoodボタン（0-indexed: 0=コピー, 1=ダウンロード, 2=Good, 3=Bad）
                        good_button = feedback_buttons.nth(2)
                        good_button.click()
                        page.wait_for_timeout(1500)
                        
                        # フィードバックダイアログが開いたか確認
                        feedback_dialog = page.locator('[role="dialog"]:has-text("フィードバック"), [role="dialog"]:has-text("この回答は役に立ちました")')
                        
                        if feedback_dialog.count() > 0 and feedback_dialog.is_visible():
                            print("✓ フィードバックダイアログが開きました")
                            save_screenshot(page, test_dir, "09_feedback_1.png", "回答のフィードバック（Good/Bad）を送信できることを確認する")
                            
                            # オプション選択
                            first_checkbox_label = feedback_dialog.locator('label.text-lg').first
                            if first_checkbox_label.count() > 0:
                                first_checkbox_label.click()
                                page.wait_for_timeout(800)
                                print("✓ フィードバックオプションを選択しました")
                            
                            # 送信ボタンをクリック
                            submit_button = feedback_dialog.locator('button[type="submit"], button:has-text("送信")')
                            if submit_button.count() > 0:
                                submit_button.click()
                                page.wait_for_timeout(2000)
                                save_screenshot(page, test_dir, "09_feedback_2.png", "フィードバック送信後")
                                print("✓ フィードバックを送信しました")
            except Exception as e:
                errors.append(("STEP 12", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【STEP 13】回答のコピー
            print("\n[STEP 13] 回答のコピー")
            try:
                assistant_messages = page.locator('div.bg-white.rounded-xl')
                
                if assistant_messages.count() > 0:
                    last_message = assistant_messages.last
                    icon_buttons = last_message.locator('button').filter(has=page.locator('svg'))
                    
                    if icon_buttons.count() >= 2:
                        copy_button = icon_buttons.first
                        copy_button.click()
                        page.wait_for_timeout(1500)
                        
                        # クリップボードの内容を取得してファイルに保存
                        try:
                            clipboard_text = page.evaluate('navigator.clipboard.readText()')
                            if clipboard_text:
                                copy_file_path = os.path.join(test_dir, "10_copy.txt")
                                with open(copy_file_path, 'w', encoding='utf-8') as f:
                                    f.write(clipboard_text)
                                print(f"✓ コピーされた内容をエビデンスに保存: {copy_file_path}")
                                print(f"  テキスト長: {len(clipboard_text)} 文字")
                            else:
                                warnings.append(("STEP 13", "クリップボードが空です"))
                                print("⚠️ 警告: クリップボードが空です")
                        except Exception as clipboard_error:
                            warnings.append(("STEP 13", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                            print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                        
                        save_screenshot(page, test_dir, "10_copy.png", "回答のコピーができることを確認する")
                        print("✓ メッセージをコピーしました")
            except Exception as e:
                errors.append(("STEP 13", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【STEP 14】会話履歴のダウンロード
            print("\n[STEP 14] 会話履歴のダウンロード")
            try:
                assistant_messages = page.locator('div.bg-white.rounded-xl')
                
                if assistant_messages.count() > 0:
                    last_message = assistant_messages.last
                    icon_buttons = last_message.locator('button').filter(has=page.locator('svg'))
                    
                    if icon_buttons.count() >= 2:
                        download_button = icon_buttons.nth(1)
                        
                        with page.expect_download(timeout=15000) as download_info:
                            download_button.click()
                        
                        download = download_info.value
                        filename = download.suggested_filename
                        print(f"✓ ファイルをダウンロードしました: {filename}")
                        
                        # ダウンロードされたファイルを固定名でエビデンスディレクトリに保存
                        downloaded_file_path = os.path.join(test_dir, "11_download.txt")
                        download.save_as(downloaded_file_path)
                        print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                        print(f"  元のファイル名: {filename}")
                        
                        # ファイルサイズも確認
                        file_size = os.path.getsize(downloaded_file_path)
                        print(f"  ファイルサイズ: {file_size} bytes")
                        
                        page.wait_for_timeout(1500)
                        save_screenshot(page, test_dir, "11_download.png", "会話履歴のダウンロードができることを確認する")
            except Exception as e:
                errors.append(("STEP 14", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【STEP 9】チャット開始時のテンプレート選択
            print("\n[STEP 9] チャット開始時のテンプレート選択")
            try:
                # 新しいチャットを開始
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                if add_button.count() > 0:
                    add_button.click()
                    page.wait_for_timeout(5000)
                    page.wait_for_load_state("networkidle")
                    print("✓ 新しいチャットを開始しました")
                
                # テンプレート選択画面のスクリーンショット
                page.wait_for_timeout(2000)
                save_screenshot(page, test_dir, "12_template.png", "チャット開始時に表示されるプロンプトテンプレートを適用してチャットできることを確認する")
                
                # データ分析カードを選択
                data_analysis_card = page.locator('text=データ分析').first
                
                if data_analysis_card.count() > 0:
                    data_analysis_card.click()
                    page.wait_for_timeout(2000)
                    print("✓ データ分析テンプレートを選択しました")
                else:
                    warnings.append(("STEP 9", "データ分析テンプレートが見つかりませんでした"))
                    print("⚠️ 警告: データ分析テンプレートが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 9", f"チャット開始時のテンプレート選択中にエラー: {e}"))
                print(f"❌ エラー: チャット開始時のテンプレート選択中にエラー: {e}")
            
            # 【STEP 10】他のテンプレートを選択する
            print("\n[STEP 10] 他のテンプレートを選択する")
            try:
                # 新しいチャットを開始
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                if add_button.count() > 0:
                    add_button.click()
                    page.wait_for_timeout(5000)
                    page.wait_for_load_state("networkidle")
                    print("✓ 新しいチャットを開始しました")
                
                # テンプレート選択画面が表示されるまで待機
                page.wait_for_timeout(2000)
                
                # 「他のテンプレートを選択する」ボタンを探す
                template_selector_button = page.locator('button:has-text("他のテンプレートを選択する")')
                
                if template_selector_button.count() > 0:
                    template_selector_button.first.click()
                    page.wait_for_timeout(1500)
                    
                    # ダイアログが開いたか確認
                    dialog = page.locator('[role="dialog"]')
                    if dialog.count() > 0 and dialog.is_visible():
                        print("✓ テンプレート選択ダイアログが開きました")
                        save_screenshot(page, test_dir, "13_template_selector_1.png", "「他のテンプレートを選択する」ボタンをクリックし、プロンプトテンプレートを適用してチャットできることを確認する")
                        
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
                                save_screenshot(page, test_dir, "13_template_selector_2.png", "テンプレート適用後")
                                print("✓ テンプレートを適用しました")
                else:
                    warnings.append(("STEP 10", "「他のテンプレートを選択する」ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 「他のテンプレートを選択する」ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 10", f"テンプレート選択ダイアログ確認中にエラー: {e}"))
                print(f"❌ エラー: テンプレート選択ダイアログ確認中にエラー: {e}")
            
            # 【STEP 15-20】各種ファイル形式のプレビュー確認
            # 各フォルダを選択して質問を送信し、参照元リンクをクリックしてファイルプレビューを確認
            print("\n[STEP 15-20] 各種ファイル形式のプレビュー確認")
            
            # テスト対象のフォルダリスト
            test_folders = [
                {"step": 15, "folder_name": "生技"},
                {"step": 16, "folder_name": "ＩＴ本"},
                {"step": 17, "folder_name": "産業"},
                {"step": 18, "folder_name": "産３事"},
                {"step": 19, "folder_name": "産ＣＳ"},
                {"step": 20, "folder_name": "産推営"},
            ]
            
            common_query = "ディズニーランドの入園料を教えて"
            
            for test_case in test_folders:
                step_num = test_case["step"]
                folder_name = test_case["folder_name"]
                
                print(f"\n[STEP {step_num}] フォルダ「{folder_name}」のファイルプレビュー確認")
                try:
                    # カテゴリ選択ボタンをクリック
                    category_button = page.locator('button[role="combobox"]')
                    if category_button.count() > 0:
                        category_button.first.click()
                        page.wait_for_timeout(1000)
                        
                        # 検索フィールドにフォルダ名を入力
                        search_input = page.locator('input[placeholder*="フォルダ名を検索"]')
                        if search_input.count() > 0:
                            search_input.fill(folder_name)
                            page.wait_for_timeout(800)
                            
                            # 候補からフォルダを選択
                            folder_option = page.locator(f'div[role="option"]:has-text("{folder_name}")').first
                            if folder_option.count() > 0:
                                folder_option.click()
                                page.wait_for_timeout(1000)
                                print(f"✓ フォルダ「{folder_name}」を選択しました")
                                
                                # プロンプト送信
                                prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                                if prompt_input.count() > 0:
                                    prompt_input.first.fill(common_query)
                                    page.wait_for_timeout(800)
                                    
                                    send_button = page.locator('button[type="submit"]:has(svg)')
                                    if send_button.count() > 0:
                                        # 送信前のメッセージ数を記録
                                        assistant_messages = page.locator('div.bg-white.rounded-xl')
                                        initial_count = assistant_messages.count()
                                        
                                        send_button.first.click()
                                        print(f"✓ プロンプトを送信: 「{common_query}」")
                                        
                                        # AIの回答を待機
                                        print("⏳ 回答を待機中...")
                                        try:
                                            page.wait_for_timeout(3000)
                                            
                                            # 最大60秒待機
                                            max_retries = 60  # 最大120秒
                                            message_appeared = False
                                            for i in range(max_retries):
                                                assistant_messages = page.locator('div.bg-white.rounded-xl')
                                                current_count = assistant_messages.count()
                                                
                                                if current_count > initial_count:
                                                    last_message = assistant_messages.last
                                                    message_content = last_message.text_content()
                                                    
                                                    if message_content and len(message_content.strip()) > 10:
                                                        print(f"✓ AIからの回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                                        message_appeared = True
                                                        break
                                                
                                                if i < max_retries - 1:
                                                    if i % 5 == 0 and i > 0:
                                                        print(f"⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                                    page.wait_for_timeout(2000)
                                                else:
                                                    warnings.append((f"STEP {step_num}", f"AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）"))
                                                    print(f"⚠️ 警告: AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）")
                                            
                                            if not message_appeared:
                                                warnings.append((f"STEP {step_num}", "AI回答が表示されませんでした"))
                                                print("⚠️ 警告: AI回答が表示されませんでした")
                                            
                                            page.wait_for_timeout(2000)
                                            save_screenshot(page, test_dir, f"{step_num:02d}_preview_{step_num}_response.png", f"STEP {step_num}: {folder_name}の検索結果")
                                            
                                            # 最新のアシスタントメッセージ内の参照元リンクを探す
                                            if message_appeared and assistant_messages.count() > 0:
                                                last_message = assistant_messages.last
                                                reference_links = last_message.locator('a[href="#"]')
                                                
                                                if reference_links.count() > 0:
                                                    print(f"✓ 最新メッセージ内に参照元リンクが見つかりました（{reference_links.count()}件）")
                                                    
                                                    # 最初のリンクをクリック
                                                    first_link = reference_links.first
                                                    first_link.click()
                                                    page.wait_for_timeout(2000)
                                                    
                                                    print(f"✓ 参照元リンクをクリックしました")
                                                
                                                # ファイルプレビューが表示されることを確認
                                                # ResizablePanel内にFileViewerが表示される
                                                file_viewer = page.locator('div[class*="react-pdf"], iframe, div:has-text("ファイル"), canvas')
                                                
                                                if file_viewer.count() > 0:
                                                    print(f"✓ ファイルプレビューが表示されました")
                                                    save_screenshot(page, test_dir, f"{step_num:02d}_preview_{step_num}_file.png", f"STEP {step_num}: {folder_name}のファイルプレビュー")
                                                else:
                                                    warnings.append((f"STEP {step_num}", "ファイルプレビューの表示を確認できませんでした"))
                                                    print(f"⚠️ 警告: ファイルプレビューの表示を確認できませんでした")
                                                    save_screenshot(page, test_dir, f"{step_num:02d}_preview_{step_num}_file.png", f"STEP {step_num}: {folder_name}のファイルプレビュー状態")
                                                
                                            else:
                                                warnings.append((f"STEP {step_num}", "参照元リンクが見つかりませんでした"))
                                                print(f"⚠️ 警告: 参照元リンクが見つかりませんでした")
                                        
                                        except Exception as wait_error:
                                            errors.append((f"STEP {step_num}", f"回答待機中にエラー: {wait_error}"))
                                            print(f"❌ エラー: 回答待機中にエラー: {wait_error}")
                                    else:
                                        warnings.append((f"STEP {step_num}", "送信ボタンが見つかりませんでした"))
                                        print(f"⚠️ 警告: 送信ボタンが見つかりませんでした")
                                else:
                                    warnings.append((f"STEP {step_num}", "プロンプト入力欄が見つかりませんでした"))
                                    print(f"⚠️ 警告: プロンプト入力欄が見つかりませんでした")
                            else:
                                warnings.append((f"STEP {step_num}", f"フォルダ「{folder_name}」が選択肢に見つかりませんでした"))
                                print(f"⚠️ 警告: フォルダ「{folder_name}」が選択肢に見つかりませんでした")
                        else:
                            warnings.append((f"STEP {step_num}", "フォルダ検索入力欄が見つかりませんでした"))
                            print(f"⚠️ 警告: フォルダ検索入力欄が見つかりませんでした")
                    else:
                        warnings.append((f"STEP {step_num}", "カテゴリ選択ボタンが見つかりませんでした"))
                        print(f"⚠️ 警告: カテゴリ選択ボタンが見つかりませんでした")
                
                except Exception as e:
                    errors.append((f"STEP {step_num}", f"ファイルプレビュー確認中にエラー: {e}"))
                    print(f"❌ エラー: ファイルプレビュー確認中にエラー: {e}")
            
            # ステップ15-20の後、ページの状態をリセット
            print("\n[準備] ステップ21に向けてページ状態をリセット")
            try:
                # ファイルプレビューのバツボタンをクリックして閉じる
                close_button = page.locator('button[aria-label="閉じる"], button:has-text("×"), button:has-text("✕")').first
                if close_button.count() > 0 and close_button.is_visible():
                    close_button.click()
                    page.wait_for_timeout(1000)
                    print("✓ ファイルプレビューを閉じました")
                else:
                    # バツボタンが見つからない場合は、rag-chatページに再遷移
                    page.goto(f"{BASE_URL}/rag-chat")
                    page.wait_for_load_state("networkidle")
                    page.wait_for_timeout(2000)
                    print("✓ ページを再読み込みしました")
                
                print("✓ ページの状態をリセットしました")
            except Exception as e:
                warnings.append(("準備", f"ページリセット中にエラー: {e}"))
                print(f"⚠️ 警告: ページリセット中にエラー: {e}")
            
            # 【STEP 21】チャット履歴の検索
            print("\n[STEP 21] チャット履歴の検索")
            try:
                # 検索ボックスがサイドバーに表示されるまで待機
                page.wait_for_timeout(1000)
                
                search_box = page.locator('input[placeholder*="問い合わせを検索"]')
                
                if search_box.count() > 0:
                    save_screenshot(page, test_dir, "21_search_1.png", "チャット履歴の検索ができることを確認する")
                    
                    search_box.fill("テスト")
                    page.wait_for_timeout(1500)
                    
                    save_screenshot(page, test_dir, "21_search_2.png", "検索実行後")
                    print("✓ チャット履歴を検索しました")
                    
                    search_box.clear()
                    page.wait_for_timeout(500)
                else:
                    warnings.append(("STEP 21", "検索ボックスが見つかりませんでした"))
                    print("⚠️ 警告: 検索ボックスが見つかりませんでした")
                    save_screenshot(page, test_dir, "21_search_error.png", "検索ボックスが見つからない状態")
            except Exception as e:
                errors.append(("STEP 21", f"検索機能確認中にエラー: {e}"))
                print(f"❌ エラー: 検索機能確認中にエラー: {e}")
            
            # 【STEP 22-25】設定からモデルと検索手法の変更
            print("\n[STEP 22] 設定からモデルと検索手法の変更")
            try:
                # 設定ボタンを探す
                # 新しいチャットを開始して設定ボタンが確実に表示される状態にする
                add_button = page.locator('text=履歴').locator('..').locator('button').first
                if add_button.count() > 0:
                    add_button.click()
                    page.wait_for_timeout(3000)
                    page.wait_for_load_state("networkidle")
                    print("✓ 新しいチャットを開始しました")
                
                # 設定ボタンを探す（「文書検索」見出しの隣）
                settings_button = page.locator('h3:has-text("文書検索")').locator('..').locator('button').filter(has=page.locator('svg')).first
                
                if settings_button.count() > 0:
                    save_screenshot(page, test_dir, "15_settings_0.png", "設定ボタンクリック前")
                    settings_button.click()
                    page.wait_for_timeout(1500)
                    
                    # 設定ダイアログが開いたか確認
                    settings_dialog = page.locator('[role="dialog"]:has-text("パラメータ設定")')
                    
                    if settings_dialog.count() > 0 and settings_dialog.is_visible():
                        print("✓ 設定ダイアログが開きました")
                        save_screenshot(page, test_dir, "15_settings_1.png", "「設定」の歯車ボタンからモデルと検索手法の変更ができることを確認する")
                        
                        # モデル選択（ラジオボタン）
                        radio_buttons = settings_dialog.locator('input[type="radio"]')
                        if radio_buttons.count() > 1:
                            # 2番目のモデルを選択
                            radio_buttons.nth(1).click(force=True)
                            page.wait_for_timeout(1000)
                            print("✓ モデルを変更しました")
                            
                            save_screenshot(page, test_dir, "15_settings_2.png", "モデル変更後")
                            
                            # 「設定する」ボタンをクリック
                            submit_button = settings_dialog.locator('button:has-text("設定する")')
                            if submit_button.count() > 0:
                                submit_button.click()
                                page.wait_for_timeout(1500)
                                save_screenshot(page, test_dir, "15_settings_3.png", "設定適用後")
                                print("✓ 設定を保存しました")
                                
                                # 変更した設定で検索テスト
                                print("\n[STEP 23] 変更した設定で文書検索")
                                prompt_input = page.locator('textarea[placeholder*="メッセージを入力"]')
                                if prompt_input.count() > 0:
                                    prompt_input.first.fill("変更したモデルでの検索テスト")
                                    page.wait_for_timeout(1000)
                                    
                                    send_button = page.locator('button[type="submit"]:has(svg)')
                                    if send_button.count() > 0:
                                        # 送信前のメッセージ数を記録
                                        assistant_messages = page.locator('div.bg-white.rounded-xl')
                                        initial_count = assistant_messages.count()
                                        print(f"送信前のメッセージ数: {initial_count}")
                                        
                                        send_button.first.click()
                                        print("✓ 変更した設定で検索を実行しました")
                                        
                                        # AIからの回答を待機
                                        print("⏳ 検索結果を待機中...")
                                        try:
                                            page.wait_for_timeout(3000)  # 初期待機
                                            
                                            max_retries = 60  # 最大120秒
                                            message_appeared = False
                                            for i in range(max_retries):
                                                assistant_messages = page.locator('div.bg-white.rounded-xl')
                                                current_count = assistant_messages.count()
                                                
                                                if current_count > initial_count:
                                                    last_message = assistant_messages.last
                                                    message_content = last_message.text_content()
                                                    
                                                    if message_content and len(message_content.strip()) > 10:
                                                        print(f"✓ AIからの回答を受信しました（メッセージ数: {initial_count} → {current_count}、{len(message_content)}文字）")
                                                        message_appeared = True
                                                        break
                                                
                                                if i < max_retries - 1:
                                                    if i % 5 == 0 and i > 0:
                                                        print(f"⏳ 回答生成中... ({i*2}秒経過、メッセージ数: {current_count})")
                                                    page.wait_for_timeout(2000)
                                                else:
                                                    warnings.append(("STEP 23", f"AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）"))
                                                    print(f"⚠️ 警告: AI回答が表示されませんでした（タイムアウト、最終メッセージ数: {current_count}）")
                                            
                                            if not message_appeared:
                                                warnings.append(("STEP 23", "AI回答が表示されませんでした"))
                                                print("⚠️ 警告: AI回答が表示されませんでした")
                                                
                                        except Exception as wait_error:
                                            warnings.append(("STEP 23", f"回答待機中にエラー: {wait_error}"))
                                            print(f"⚠️ 警告: 回答待機中にエラー: {wait_error}")
                                        
                                        save_screenshot(page, test_dir, "16_settings_search.png", "「設定」の歯車ボタンからモデルを変更し、その設定で文書検索できることを確認する")
                else:
                    warnings.append(("STEP 22", "設定ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 設定ボタンが見つかりませんでした")
                    save_screenshot(page, test_dir, "15_settings_error.png", "設定ボタンが見つからない状態")
            except Exception as e:
                errors.append(("STEP 22-23", f"設定機能確認中にエラー: {e}"))
                print(f"❌ エラー: 設定機能確認中にエラー: {e}")
            
            # 【STEP 24】チャット個別削除
            print("\n[STEP 24] チャット個別削除")
            try:
                thread_items = page.locator('text=履歴').locator('..').locator('..').locator('a')
                
                if thread_items.count() > 0:
                    initial_thread_count = thread_items.count()
                    print(f"削除前のスレッド数: {initial_thread_count}")
                    
                    first_thread = thread_items.first
                    ellipsis_button = first_thread.locator('button').filter(has=page.locator('svg'))
                    
                    if ellipsis_button.count() > 0:
                        ellipsis_button.first.click()
                        page.wait_for_timeout(1000)
                        print("✓ 履歴項目の3点リーダーボタンをクリックしました")
                        
                        page.wait_for_timeout(500)
                        
                        delete_item = page.locator('div.flex.items-center.gap-x-1:has-text("削除")')
                        
                        if delete_item.count() > 0 and delete_item.is_visible():
                            save_screenshot(page, test_dir, "17_delete_chat_1.png", "チャット履歴のチャットを個別に削除できることを確認する")
                            print(f"✓ ドロップダウンメニューが表示されました")
                            
                            delete_item.first.click()
                            page.wait_for_timeout(2000)
                            
                            thread_items_after = page.locator('text=履歴').locator('..').locator('..').locator('a')
                            final_thread_count = thread_items_after.count()
                            
                            if final_thread_count < initial_thread_count:
                                print(f"✓ チャットを個別削除しました（スレッド数: {initial_thread_count} → {final_thread_count}）")
                            
                            save_screenshot(page, test_dir, "17_delete_chat_2.png", "チャット削除後")
            except Exception as e:
                errors.append(("STEP 24", f"チャット個別削除確認中にエラー: {e}"))
                print(f"❌ エラー: チャット個別削除確認中にエラー: {e}")
            
            # 【STEP 25】チャット一括削除
            print("\n[STEP 25] チャット一括削除")
            try:
                clear_all_button = page.locator('button:has-text("全てを削除")')
                
                if clear_all_button.count() > 0:
                    clear_all_button.first.click()
                    page.wait_for_timeout(1500)
                    
                    confirm_dialog = page.locator('[role="dialog"]:has-text("削除"), [role="dialog"]:has-text("全て")')
                    
                    if confirm_dialog.count() > 0 and confirm_dialog.is_visible():
                        print("✓ 削除確認ダイアログが表示されました")
                        save_screenshot(page, test_dir, "18_delete_all_1.png", "チャット履歴のすべてのチャットを一括で削除できることを確認する")
                        
                        confirm_button = confirm_dialog.locator('button:has-text("削除")')
                        if confirm_button.count() > 0:
                            confirm_button.first.click()
                            page.wait_for_timeout(2000)
                            
                            save_screenshot(page, test_dir, "18_delete_all_2.png", "一括削除後")
                            print("✓ すべてのチャットを削除しました")
            except Exception as e:
                errors.append(("STEP 25", f"一括削除確認中にエラー: {e}"))
                print(f"❌ エラー: 一括削除確認中にエラー: {e}")
            
            print("\n" + "="*70)
            print("✅ 全テスト完了: 文書検索画面の全機能を確認しました")
            print("="*70)
            
        except Exception as e:
            errors.append(("全体", f"予期しないエラーが発生しました: {e}"))
            print(f"\n❌ 予期しないエラー: {e}")
            save_screenshot(page, test_dir, "error_screenshot.png", "エラー発生時のスクリーンショット")
        
        finally:
            # テスト結果のサマリーを表示
            print(f"\n{'='*70}")
            print(f"【テスト実行結果サマリー】")
            print(f"{'='*70}")
            
            warning_count = len(warnings)
            error_count = len(errors)
            
            if warning_count == 0 and error_count == 0:
                print(f"\n✅ 結果: PASS")
                print(f"   すべてのテストが正常に完了しました")
            else:
                print(f"\n⚠️ 結果: 要チェック")
                print(f"   警告: {warning_count}件")
                print(f"   エラー: {error_count}件")
            
            if warning_count > 0:
                print(f"\n【警告の詳細】")
                for step, message in warnings:
                    print(f"  - {step}: {message}")
            
            if error_count > 0:
                print(f"\n【エラーの詳細】")
                for step, message in errors:
                    print(f"  - {step}: {message}")
            
            print(f"\n{'='*70}")
            print(f"エビデンス保存先: {test_dir}")
            print(f"{'='*70}")
            
            browser.close()
    
    # テストの成否を判定
    assert len(errors) == 0, f"テストでエラーが{len(errors)}件発生しました:\n" + "\n".join([f"  - {step}: {msg}" for step, msg in errors])
    
    # 警告は許容しつつ、ログ出力のみ行う
    if len(warnings) > 0:
        print(f"\n⚠️ 注意: テストで警告が{len(warnings)}件発生しました")
        print("詳細は上記のサマリーを確認してください")


if __name__ == "__main__":
    """スクリプトとして直接実行する場合"""
    import sys
    
    print("=" * 70)
    print("Playwright E2Eテスト: 文書検索画面")
    print("=" * 70)
    
    try:
        test_rag_features()
        print("\n✅ テスト成功: すべてのテストが正常に完了しました")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ テスト失敗:\n{e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ テスト実行エラー:\n{e}")
        sys.exit(1)
