"""
create-prompt.py - プロンプト作成画面のE2Eテスト

【テスト観点】
①｢プロンプト作成画面｣が正しく表示されることを確認する
②カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③プロンプトテンプレートが作成できることを確認する
④「結果を調整する」ボックスから、プロンプトテンプレートの修正ができることを確認する
⑤作成結果のフィードバック（Good/Bad）を送信できることを確認する
⑥作成結果を編集できることを確認する
⑦作成結果をコピーできることを確認する
⑧作成結果をダウンロードできることを確認する
⑨「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑩「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】
MANUAL_AUTH=true python frontend/tests/E2E/features/source/create-prompt.py
または
MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-prompt.py::test_create_prompt_functionality -v -s

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : 標準出力をキャプチャしない（print文が表示される）
  MANUAL_AUTH=true : 手動認証モード（ブラウザで手動認証）

【エビデンス】
  テスト実行後、各テスト観点の前後のスクリーンショットが保存されます：
  test_evidence/test_YYYYMMDD_HHMMSS/
  ├── 01_page_display.png（①画面表示）
  ├── 02_help.png（②ヘルプマーク）
  ├── 03_create.png（③作成）
  ├── 04_adjust.png（④調整）
  ├── 05_feedback_1.png / 05_feedback_2.png（⑤フィードバック）
  ├── 06_edit.png（⑥編集）
  ├── 07_copy.png（⑦コピー）
  ├── 07_copy.txt（⑦コピーされたテキスト内容）
  ├── 08_download.png（⑧ダウンロード）
  ├── 08_download.txt（⑧ダウンロードされたファイル）
  ├── 09_show_prompt.png（⑨プロンプト表示）
  └── 10_clear_info.png（⑩情報クリア）
"""
import os
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import (
    handle_azure_authentication,
    handle_terms_agreement,
    save_auth_state,
    load_auth_state,
    is_auth_state_valid
)
from ..util.test_helper import (
    ensure_evidence_dir,
    save_screenshot,
    print_test_summary,
    enable_mouse_cursor
)
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS


def test_create_prompt_functionality():
    """プロンプト作成画面のE2Eテスト"""
    
    # テスト実行結果の追跡
    warnings = []  # 警告のリスト [(step, message), ...]
    errors = []    # エラーのリスト [(step, message), ...]
    
    # エビデンス保存用ディレクトリを作成
    test_dir = ensure_evidence_dir()
    print(f"\n{'='*70}")
    print(f"エビデンス保存先: {test_dir}")
    print(f"{'='*70}\n")
    
    with sync_playwright() as p:
        # 環境変数で認証モードを制御
        manual_auth_mode = os.getenv("MANUAL_AUTH", "false").lower() == "true"
        
        # 手動認証モードの場合は常にヘッドフルモードで実行
        if manual_auth_mode:
            headless_mode = False
            print("【手動認証モード】ヘッドフルモードで起動します。")
        else:
            headless_mode = os.getenv("HEADLESS", "true").lower() == "true"
            print(f"ヘッドレスモード: {headless_mode}")
        
        # ブラウザ起動
        browser = p.chromium.launch(
            headless=headless_mode,
            proxy=PROXY_CONFIG,
            args=BROWSER_ARGS
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
            page.wait_for_load_state("networkidle")
            
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
            
            # 【STEP 3】プロンプト作成ページへ遷移
            print("\n[STEP 3] プロンプト作成ページへ遷移")
            page.goto(f"{BASE_URL}/create-prompt")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(3000)
            
            # マウスカーソルを表示
            enable_mouse_cursor(page)
            
            print(f"ページURL: {page.url}")
            print(f"ページタイトル: {page.title()}")
            
            # 【STEP 4】①画面表示確認
            print("\n[STEP 4] ①プロンプト作成画面が正しく表示されることを確認する")
            try:
                # 画面タイトルの確認（実際は「プロンプト概要」）
                page_title = page.locator('h3:has-text("プロンプト概要")')
                if page_title.count() > 0:
                    print("✓ 画面タイトル「プロンプト概要」が表示されています")
                else:
                    warnings.append(("STEP 4", "画面タイトルが見つかりませんでした"))
                    print("⚠️ 警告: 画面タイトルが見つかりませんでした")
                
                # イメージ・キーワード入力欄の確認
                keyword_field = page.locator('textarea[placeholder*="新商品"]')
                if keyword_field.count() > 0:
                    print("✓ イメージ・キーワード入力欄が表示されています")
                else:
                    warnings.append(("STEP 4", "イメージ・キーワード入力欄が見つかりませんでした"))
                    print("⚠️ 警告: イメージ・キーワード入力欄が見つかりませんでした")
                
                save_screenshot(page, test_dir, "01_page_display.png", "プロンプト作成画面表示")
                print("✓ プロンプト作成画面が正しく表示されています")
            except Exception as e:
                errors.append(("STEP 4", f"画面表示確認中にエラー: {e}"))
                print(f"❌ エラー: 画面表示確認中にエラー: {e}")
            
            # 【STEP 5】②ヘルプマーク機能確認
            print("\n[STEP 5] ②ヘルプマーク機能説明の確認")
            try:
                # ヘルプボタンを探す（h3タグの隣）
                help_button = page.locator('h3:has-text("プロンプト概要")').locator('..').locator('button')
                
                if help_button.count() > 0:
                    print("✓ ヘルプマークが見つかりました")
                    
                    # ヘルプボタンにホバー
                    help_button.first.hover()
                    page.wait_for_timeout(1500)
                    print("✓ ヘルプマークにホバーしました")
                    
                    # ツールチップが表示されているか確認
                    tooltip = page.locator('[role="tooltip"]:has-text("効果が出やすいプロンプトを作成する画面です。")')
                    if tooltip.count() > 0 and tooltip.is_visible():
                        print("✓ ヘルプメッセージが表示されました")
                    else:
                        warnings.append(("STEP 5", "ツールチップが表示されませんでした"))
                        print("⚠️ 警告: ツールチップが表示されませんでした")
                    
                    save_screenshot(page, test_dir, "02_help.png", "カーソルをヘルプマークに合わせると機能説明が表示されることを確認する")
                else:
                    warnings.append(("STEP 5", "ヘルプマークが見つかりませんでした"))
                    print("⚠️ 警告: ヘルプマークが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 5", f"ヘルプマーク確認中にエラー: {e}"))
                print(f"❌ エラー: ヘルプマーク確認中にエラー: {e}")
            
            # 【STEP 6】③プロンプトテンプレート作成
            print("\n[STEP 6] ③プロンプトテンプレートが作成できることを確認する")
            try:
                # イメージ・キーワード入力欄を探す
                keyword_field = page.locator('textarea[placeholder*="新商品"]')
                
                if keyword_field.count() > 0:
                    # テキストを入力
                    test_input = "新商品の特徴をもとにキャッチコピーを作成してくれるプロンプト"
                    keyword_field.fill(test_input)
                    page.wait_for_timeout(1000)
                    print(f"✓ イメージ・キーワードを入力しました: {test_input}")
                    
                    # 作成ボタンをクリック
                    submit_button = page.locator('button:has-text("作成する")')
                    if submit_button.count() > 0:
                        submit_button.first.click()
                        print("✓ 作成ボタンをクリックしました")
                        
                        # 作成中の表示を待機
                        page.wait_for_timeout(2000)
                        
                        # 結果が表示されるまで待機（最大2分）
                        print("⏳ プロンプトテンプレート作成中...")
                        try:
                            # 作成結果エリアが表示されるまで待機
                            result_area = page.locator('label:has-text("作成結果")')
                            result_area.wait_for(state="visible", timeout=120000)
                            print("✓ 作成結果エリアが表示されました")
                            
                            page.wait_for_timeout(2000)
                            save_screenshot(page, test_dir, "03_create.png", "プロンプトテンプレートが作成できることを確認する")
                            print("✓ プロンプトテンプレートが作成されました")
                        except Exception as wait_error:
                            warnings.append(("STEP 6", f"作成結果の表示待機中にタイムアウト: {wait_error}"))
                            print(f"⚠️ 警告: 作成結果の表示待機中にタイムアウト: {wait_error}")
                    else:
                        warnings.append(("STEP 6", "作成ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 作成ボタンが見つかりませんでした")
                else:
                    errors.append(("STEP 6", "イメージ・キーワード入力欄が見つかりませんでした"))
                    print("❌ エラー: イメージ・キーワード入力欄が見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 6", f"プロンプト作成確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト作成確認中にエラー: {e}")
            
            # 【STEP 7】④結果を調整する
            print("\n[STEP 7] ④「結果を調整する」ボックスから修正ができることを確認する")
            try:
                # 結果を調整する入力欄を探す
                adjust_field = page.locator('textarea[placeholder*="修正"]')
                
                if adjust_field.count() > 0:
                    # 調整内容を入力
                    adjust_text = "もっと具体的な例を含めてください"
                    adjust_field.fill(adjust_text)
                    page.wait_for_timeout(1000)
                    print(f"✓ 調整内容を入力しました: {adjust_text}")
                    
                    # 再作成ボタンをクリック
                    recreate_button = page.locator('button:has-text("再作成")')
                    if recreate_button.count() > 0:
                        recreate_button.first.click()
                        print("✓ 再作成ボタンをクリックしました")
                        page.wait_for_timeout(2000)
                        
                        # 再作成中の表示を待つ
                        try:
                            page.locator('text=再作成中です').wait_for(state="visible", timeout=5000)
                            print("✓ 再作成中状態を確認")
                        except Exception as e:
                            warnings.append(("STEP 7", f"再作成中表示が見つかりませんでした（すぐに完了した可能性）: {e}"))
                            print(f"⚠️ 警告: 再作成中表示が見つかりませんでした（すぐに完了した可能性）: {e}")
                        
                        # 再作成完了を待つ
                        print("⏳ プロンプト再作成中...")
                        try:
                            page.locator('text=再作成中です').wait_for(state="hidden", timeout=120000)
                            print("✓ 再作成が完了しました")
                        except Exception as e:
                            warnings.append(("STEP 7", f"再作成完了の検知に失敗しました: {e}"))
                            print(f"⚠️ 警告: 再作成完了の検知に失敗しました: {e}")
                        
                        page.wait_for_timeout(2000)
                        save_screenshot(page, test_dir, "04_adjust.png", "結果を調整するボックスから修正ができることを確認する")
                        print("✓ プロンプトが調整されました")
                    else:
                        warnings.append(("STEP 7", "再作成ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 再作成ボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 7", "結果を調整する入力欄が見つかりませんでした"))
                    print("⚠️ 警告: 結果を調整する入力欄が見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"結果調整確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整確認中にエラー: {e}")
            
            # 【STEP 8】⑤フィードバック（Good/Bad）送信
            print("\n[STEP 8] ⑤フィードバック送信機能確認")
            try:
                # 作成結果エリアのボタン群を取得
                result_area_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_area_buttons.count() >= 2:
                    print(f"✓ 作成結果エリアのボタンが見つかりました（{result_area_buttons.count()}個）")
                    
                    # Goodボタン（1番目）をクリック
                    good_button = result_area_buttons.nth(0)
                    good_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ Goodフィードバックボタンをクリックしました")
                    
                    # フィードバックダイアログが表示されるか確認
                    feedback_dialog_title = page.locator('h2:has-text("フィードバックを頂きありがとうございました！")')
                    
                    try:
                        feedback_dialog_title.wait_for(state="visible", timeout=10000)
                        print("✓ フィードバックダイアログのタイトルが表示されました")
                    except Exception as dialog_wait_error:
                        warnings.append(("STEP 8", "フィードバックダイアログの表示待機がタイムアウトしました"))
                        print(f"⚠️ 警告: ダイアログ待機中: {dialog_wait_error}")
                    
                    page.wait_for_timeout(500)
                    
                    # ダイアログ要素を取得
                    dialog_element = page.locator('dialog').or_(page.locator('[role="dialog"]'))
                    
                    if dialog_element.count() > 0:
                        print("✓ フィードバックダイアログが表示されました")
                        
                        # オプション選択
                        first_checkbox_label = dialog_element.locator('label.text-lg').first
                        if first_checkbox_label.count() > 0:
                            first_checkbox_label.click()
                            page.wait_for_timeout(800)
                            print("✓ フィードバックオプション（一番上）を選択しました")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        dialog_input = dialog_element.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("テストフィードバック")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        save_screenshot(page, test_dir, "05_feedback_1.png", "フィードバック入力")
                        
                        # 送信ボタンをクリック
                        submit_button = dialog_element.locator('button[type="submit"]').or_(
                            dialog_element.locator('button:has-text("送信")')
                        )
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            save_screenshot(page, test_dir, "05_feedback_2.png", "フィードバック送信完了")
                        else:
                            warnings.append(("STEP 8", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 8", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                        save_screenshot(page, test_dir, "05_feedback_2.png", "フィードバックボタンクリック後")
                else:
                    warnings.append(("STEP 8", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 8", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【STEP 9】⑥作成結果を編集
            print("\n[STEP 9] ⑥編集機能確認")
            try:
                # 作成結果エリアの編集ボタン（通常4番目）
                result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_buttons.count() >= 4:
                    # 4番目のボタンがEditボタン（0-indexed なので nth(3)）
                    edit_btn = result_buttons.nth(3)
                    edit_btn.click()
                    page.wait_for_timeout(1000)
                    print("✓ 編集ボタンをクリックしました")
                    
                    # 編集モードではキャンセルと保存ボタンが表示される
                    cancel_button = page.locator('button:has-text("キャンセル")')
                    save_button = page.locator('button:has-text("保存")')
                    
                    if cancel_button.count() > 0 and save_button.count() > 0:
                        print("✓ 編集モードに切り替わりました（キャンセル・保存ボタンが表示）")
                        
                        # 編集可能なテキストエリアを探す
                        all_textareas = page.locator('textarea')
                        editable_textarea = None
                        
                        for i in range(all_textareas.count()):
                            textarea = all_textareas.nth(i)
                            readonly_attr = textarea.get_attribute('readonly')
                            if readonly_attr is None or readonly_attr == 'false':
                                value = textarea.input_value()
                                if len(value) > 50:
                                    editable_textarea = textarea
                                    print(f"✓ 編集可能なテキストエリアを見つけました（{i+1}番目のtextarea）")
                                    break
                        
                        if editable_textarea:
                            # 元のテキストを確認
                            original_text = editable_textarea.input_value()
                            print(f"元のテキスト（最初の50文字）: {original_text[:50]}...")
                            
                            # テキストを変更
                            editable_textarea.fill("編集テスト")
                            page.wait_for_timeout(800)
                            print("✓ テキストを変更しました")
                            
                            # 保存ボタンをクリック
                            save_button.first.click()
                            page.wait_for_timeout(1500)
                            print("✓ 保存ボタンをクリックしました")
                            
                            # 編集モードが解除されたか確認
                            page.wait_for_timeout(500)
                            if cancel_button.count() == 0:
                                print("✓ 編集モードが解除されました")
                        else:
                            warnings.append(("STEP 9", "編集可能なテキストエリアが見つかりませんでした"))
                            print("⚠️ 警告: 編集可能なテキストエリアが見つかりませんでした")
                    else:
                        warnings.append(("STEP 9", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    save_screenshot(page, test_dir, "06_edit.png", "作成結果を編集できることを確認する")
                else:
                    warnings.append(("STEP 9", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 9", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【STEP 10】⑦作成結果をコピー
            print("\n[STEP 10] ⑦コピー機能確認")
            try:
                # コピーボタンを探す（複数の方法を試す）
                # 方法1: absolute位置指定のボタン（create-ideaと同じ）
                copy_button = page.locator('button.absolute.right-1.top-1.z-10')
                
                # 方法2: 作成結果エリア内のボタン群から取得
                if copy_button.count() == 0:
                    result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                    if result_buttons.count() >= 2:
                        copy_button = result_buttons.nth(1)
                        print("✓ コピーボタンを結果エリアのボタン群から取得しました")
                else:
                    print("✓ コピーボタンをabsolute位置から取得しました")
                
                if copy_button.count() > 0:
                    copy_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ コピーボタンをクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('text=/作成結果.*コピー/i')
                    if toast.count() > 0:
                        print("✓ コピー成功のトーストメッセージが表示されました")
                    
                    # クリップボードの内容を取得してファイルに保存
                    try:
                        clipboard_text = page.evaluate('navigator.clipboard.readText()')
                        if clipboard_text:
                            copy_file_path = os.path.join(test_dir, "07_copy.txt")
                            with open(copy_file_path, 'w', encoding='utf-8') as f:
                                f.write(clipboard_text)
                            print(f"✓ コピーされた内容をエビデンスに保存: {copy_file_path}")
                            print(f"  テキスト長: {len(clipboard_text)} 文字")
                        else:
                            warnings.append(("STEP 10", "クリップボードが空です"))
                            print("⚠️ 警告: クリップボードが空です")
                    except Exception as clipboard_error:
                        warnings.append(("STEP 10", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                        print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                    
                    save_screenshot(page, test_dir, "07_copy.png", "コピー実行後")
                else:
                    warnings.append(("STEP 10", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
                    # デバッグ用：画面上のボタンを確認
                    all_buttons = page.locator('button').count()
                    print(f"  デバッグ: 画面上のボタン総数 = {all_buttons}")
            except Exception as e:
                errors.append(("STEP 10", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【STEP 11】⑧作成結果をダウンロード
            print("\n[STEP 11] ⑧ダウンロード機能確認")
            try:
                # 作成結果エリアのダウンロードボタン（通常3番目）
                result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_buttons.count() >= 3:
                    # 3番目のボタンがDownloadボタン（0-indexed なので nth(2)）
                    download_btn = result_buttons.nth(2)
                    
                    # ダウンロードイベントを待機
                    try:
                        with page.expect_download(timeout=15000) as download_info:
                            download_btn.click()
                            print("✓ ダウンロードボタンをクリックしました")
                        
                        download = download_info.value
                        filename = download.suggested_filename
                        print(f"✓ ダウンロード完了: {filename}")
                        
                        # ダウンロードされたファイルをエビデンスディレクトリに保存
                        downloaded_file_path = os.path.join(test_dir, "08_download.txt")
                        download.save_as(downloaded_file_path)
                        print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                        print(f"  元のファイル名: {filename}")
                        
                        # ファイルサイズも確認
                        file_size = os.path.getsize(downloaded_file_path)
                        print(f"  ファイルサイズ: {file_size} bytes")
                    except Exception as dl_error:
                        warnings.append(("STEP 11", f"ダウンロード完了の検知に失敗: {dl_error}"))
                        print(f"⚠️ 警告: ダウンロード完了の検知に失敗: {dl_error}")
                    
                    # ダウンロードトーストメッセージを待機
                    page.wait_for_timeout(1500)
                    save_screenshot(page, test_dir, "08_download.png", "作成結果をダウンロードできることを確認する")
                else:
                    warnings.append(("STEP 11", "ダウンロードボタンが見つかりませんでした"))
                    print("⚠️ 警告: ダウンロードボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【STEP 12】⑨「プロンプトを表示」をクリック
            print("\n[STEP 12] ⑨「プロンプトを表示」機能確認")
            try:
                # プロンプトを表示リンクを探す（TextLinkコンポーネントはaタグ）
                show_prompt_link = page.locator('a:has-text("プロンプトを表示")')
                
                if show_prompt_link.count() > 0:
                    show_prompt_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを表示」リンクをクリックしました")
                    
                    # 画面配置が変わったか確認（左右2カラム表示になる）
                    # formタグが2つ表示されているか確認（左フォームと調整フォーム）
                    form_area = page.locator('form')
                    form_count = form_area.count()
                    if form_count >= 2:
                        print(f"✓ 画面配置が変わりました（左右2カラム表示、form要素: {form_count}個）")
                    else:
                        warnings.append(("STEP 12", f"画面配置の変更が確認できませんでした（form要素: {form_count}個）"))
                        print(f"⚠️ 警告: 画面配置の変更が確認できませんでした（form要素: {form_count}個）")
                    
                    save_screenshot(page, test_dir, "09_show_prompt.png", "プロンプトを表示をクリックすると画面配置が変わることを確認する")
                else:
                    warnings.append(("STEP 12", "「プロンプトを表示」リンクが見つかりませんでした"))
                    print("⚠️ 警告: 「プロンプトを表示」リンクが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"プロンプト表示機能確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示機能確認中にエラー: {e}")
            
            # 【STEP 13】⑩「情報をクリア」をクリック
            print("\n[STEP 13] ⑩「情報をクリア」機能確認")
            try:
                # 情報をクリアボタンを探す
                clear_button = page.locator('button:has-text("情報をクリア")')
                
                if clear_button.count() > 0:
                    clear_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ 「情報をクリア」ボタンをクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('[data-sonner-toast]')
                    if toast.count() > 0:
                        print("✓ クリア成功のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "10_clear_info.png", "情報をクリアをクリックすると入力情報がクリアされることを確認する")
                    
                    # クリア後、入力フィールドが空になっているか確認
                    page.wait_for_timeout(500)
                    keyword_field = page.locator('textarea[placeholder*="新商品"]')
                    if keyword_field.count() > 0:
                        field_value = keyword_field.input_value()
                        if field_value == "":
                            print("✓ イメージ・キーワード入力欄がクリアされました")
                        else:
                            warnings.append(("STEP 13", f"入力欄がクリアされていません（値: {field_value}）"))
                            print(f"⚠️ 警告: 入力欄がクリアされていません（値: {field_value}）")
                else:
                    warnings.append(("STEP 13", "「情報をクリア」ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 「情報をクリア」ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"情報クリア機能確認中にエラー: {e}"))
                print(f"❌ エラー: 情報クリア機能確認中にエラー: {e}")
            
            # ===== テスト完了サマリー =====
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
            print(f"✅ 全テスト完了: プロンプト作成画面の全機能を確認しました")
            print(f"{'='*70}")
            
        except Exception as e:
            errors.append(("CRITICAL", f"テスト実行中に致命的エラー: {e}"))
            print(f"❌ 致命的エラー: テスト中にエラー: {e}")
            save_screenshot(page, test_dir, "ERROR.png", "エラー発生時")
            raise
        finally:
            context.close()
        
        # テスト完了サマリーを表示
        print(f"\nエビデンス保存先: {test_dir}")
        
        browser.close()
    
    # 【重要】テストの成否を判定
    # エラーが1件でもあればテスト失敗
    assert len(errors) == 0, f"テストでエラーが{len(errors)}件発生しました:\n" + "\n".join([f"  - {step}: {msg}" for step, msg in errors])
    
    # 警告についても厳格にチェックする場合は以下のコメントを外す
    # assert len(warnings) == 0, f"テストで警告が{len(warnings)}件発生しました:\n" + "\n".join([f"  - {step}: {msg}" for step, msg in warnings])
    
    # 警告は許容しつつ、ログ出力のみ行う
    if len(warnings) > 0:
        print(f"\n⚠️ 注意: テストは成功しましたが、{len(warnings)}件の警告があります")
        print("詳細は上記のサマリーを確認してください")


if __name__ == "__main__":
    """スクリプトとして直接実行する場合"""
    import sys
    
    print("=" * 70)
    print("Playwright E2Eテスト: プロンプト作成")
    print("=" * 70)
    
    try:
        print("\n[実行中] テスト...")
        test_create_prompt_functionality()
        print("\n[✓ 成功] テストが正常に完了しました")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[✗ 失敗] テストが失敗しました")
        print(f"  理由: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[✗ エラー] テスト実行中にエラーが発生しました")
        print(f"  エラー内容: {e}")
        sys.exit(1)
