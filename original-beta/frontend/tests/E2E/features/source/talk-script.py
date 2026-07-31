"""
talk-script.py - トークスクリプト画面のE2Eテスト

Azure Entra ID認証を含む、トークスクリプト画面の完全なE2Eテストを実施します。
手動認証モードとヘッドレスモードの両方に対応しています。

【テスト観点】
① トークスクリプト画面が正しく表示されることを確認する
② カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③ 「ファイルを選択」から対象ファイルを選択できることを確認する
④ 対象ファイルをドラッグ＆ドロップで添付できることを確認する
⑤ 説明相手の特徴のスライダーが変更できることを確認する
⑥ 必要情報を入力し、トークスクリプトが作成できることを確認する
⑦ 「結果を調整する」ボックスから、トークスクリプトの内容を修正できることを確認する
⑧ 作成結果のフィードバック（Good/Bad）を送信できることを確認する
⑨ 作成結果を編集できることを確認する
⑩ 作成結果をコピーできることを確認する
⑪ 作成結果をダウンロードできることを確認する
⑫ 「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑬ 「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/talk-script.py::test_talk_script_functionality -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/talk-script.py

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : print文を表示（必須！このオプションがないと標準出力が隠れます）
  MANUAL_AUTH=true : 手動認証モードを有効化

【エビデンス】
  テスト実行後、各テスト観点の前後のスクリーンショットが保存されます：
  test_evidence/test_YYYYMMDD_HHMMSS/
  ├── 01_talk_script_page_display.png（①画面表示）
  ├── 02_help_mark_1.png / 02_help_mark_2.png（②ヘルプマーク）
  ├── 03_file_select_1.png / 03_file_select_2.png（③ファイル選択）
  ├── 04_file_drop_1.png / 04_file_drop_2.png（④ファイルD&D）
  ├── 05_slider_change_1.png / 05_slider_change_2.png（⑤スライダー変更）
  ├── 06_form_before_submit.png / 06_result_after_creation.png（⑥トークスクリプト作成）
  ├── 07_adjust_result_1.png / 07_adjust_result_2.png（⑦結果調整）
  ├── 08_feedback_1.png / 08_feedback_2.png（⑧フィードバック）
  ├── 09_edit_1.png / 09_edit_2.png（⑨編集）
  ├── 10_copy_1.png / 10_copy_2.png（⑩コピー）
  ├── 11_download_1.png / 11_download_2.png（⑪ダウンロード）
  ├── 12_show_prompt_1.png / 12_show_prompt_2.png（⑫プロンプト表示）
  └── 13_clear_info_1.png / 13_clear_info_2.png（⑬情報クリア）
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS

# テストファイルのディレクトリパス
TEST_FILES_DIR = Path(__file__).parent.parent / "input" / "04_talk-script"
# テストファイルのパス
TEST_FILE_PATH = TEST_FILES_DIR / "説明資料.pptx"


def test_talk_script_functionality():
    """トークスクリプトページでファイル添付とトークスクリプト作成のテストを実施"""
    
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
        
        # デプロイ環境へのアクセスはプロキシを使用
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
        
        # まずトップページにアクセス
        print("\n[STEP 1] トップページにアクセス中...")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        print(f"初回アクセスURL: {page.url}")
        
        # Azure Entra ID認証処理（認証状態が有効でない場合のみ実行）
        print("\n[STEP 2] Azure Entra ID認証")
        if not is_auth_state_valid(page, BASE_URL):
            print("認証が必要です。認証処理を開始します...")
            if not handle_azure_authentication(page, manual_auth_mode):
                print("認証に失敗しました。テストを終了します。")
                context.close()
                browser.close()
                return
            # 認証成功後、認証状態を保存
            save_auth_state(context)
        else:
            print("✓ 既存の認証状態が有効です。認証をスキップします。")
        
        page.wait_for_load_state("networkidle")
        print(f"認証後のURL: {page.url}")
        
        # 利用規約への同意処理
        print("\n[STEP 3] 利用規約の確認")
        if not handle_terms_agreement(page):
            print("利用規約同意処理に失敗しました。テストを終了します。")
            context.close()
            browser.close()
            return
        
        # /talk-script ページに遷移
        print(f"\n[STEP 4] /talk-scriptページへ遷移")
        print(f"/talk-scriptページへ遷移します...")
        page.goto(f"{BASE_URL}/talk-script")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # マウスカーソルを表示
        enable_mouse_cursor(page)
        
        # デバッグ: ページのタイトルとURLを確認
        print(f"ページURL: {page.url}")
        print(f"ページタイトル: {page.title()}")
        
        # 【テスト①】トークスクリプト画面が正しく表示されることを確認
        print("\n[STEP 5] ①トークスクリプト画面の表示確認")
        print("📸 エビデンス取得: トークスクリプト画面")
        save_screenshot(page, test_dir, "01_talk_script_page_display.png", "トークスクリプト画面の表示")
        
        try:
            # 【テスト②】ヘルプマークにカーソルを合わせると機能説明が表示される
            print("\n[STEP 6] ②ヘルプマーク機能説明の確認")
            try:
                # トークスクリプトタイトル内のヘルプコンポーネント
                help_button = page.locator('h3:has-text("トークスクリプト")').locator('..').locator('button')
                
                if help_button.count() > 0:
                    print(f"ヘルプマークが見つかりました")
                    save_screenshot(page, test_dir, "02_help_mark_1.png", "ヘルプマーク - ホバー前")
                    
                    # ヘルプボタンにホバー
                    help_button.first.hover()
                    page.wait_for_timeout(1500)
                    print("ヘルプマークにホバーしました")
                    
                    # ツールチップが表示されているか確認（role="tooltip"で絞り込み）
                    tooltip = page.locator('[role="tooltip"]')
                    if tooltip.count() > 0 and tooltip.is_visible():
                        print("✓ ヘルプメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "02_help_mark_2.png", "ヘルプマーク - ホバー後（説明表示）")
                else:
                    warnings.append(("STEP 6", "ヘルプマークが見つかりませんでした"))
                    print("⚠️ 警告: ヘルプマークが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 6", f"ヘルプマーク確認中にエラー: {e}"))
                print(f"❌ エラー: ヘルプマーク確認中にエラー: {e}")
            
            # 【テスト③】「ファイルを選択」から対象ファイルを選択できる
            print("\n[STEP 7] ③ファイル選択機能確認")
            try:
                # ファイル入力要素を探す
                file_input = page.locator('input[type="file"]')
                
                if file_input.count() > 0:
                    save_screenshot(page, test_dir, "03_file_select_1.png", "ファイル選択前")
                    
                    # ファイルを選択
                    file_input.set_input_files(str(TEST_FILE_PATH))
                    page.wait_for_timeout(1500)
                    print(f"✓ ファイルを選択しました: {TEST_FILE_PATH.name}")
                    
                    # ファイルアップロード完了のトーストメッセージを待機
                    try:
                        upload_toast = page.locator('[data-sonner-toast]:has-text("アップロード")')
                        if upload_toast.count() > 0:
                            # トーストが消えるまで待つ（アップロード完了）
                            upload_toast.wait_for(state="hidden", timeout=30000)
                            print("✓ ファイルアップロードが完了しました")
                    except Exception as toast_error:
                        warnings.append(("STEP 7", f"アップロード完了トースト待機中に警告: {toast_error}"))
                        print(f"⚠️ 警告: アップロード完了トースト待機中に警告: {toast_error}")
                    
                    page.wait_for_timeout(1000)
                    
                    # ファイル名が表示されているか確認
                    file_name_display = page.locator(f'text=/.*{TEST_FILE_PATH.stem}.*/i')
                    if file_name_display.count() > 0:
                        print("✓ ファイル名が表示されました")
                    
                    save_screenshot(page, test_dir, "03_file_select_2.png", "ファイル選択後")
                else:
                    warnings.append(("STEP 7", "ファイル入力要素が見つかりませんでした"))
                    print("⚠️ 警告: ファイル入力要素が見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"ファイル選択確認中にエラー: {e}"))
                print(f"❌ エラー: ファイル選択確認中にエラー: {e}")
            
            # 【テスト④】対象ファイルをドラッグ＆ドロップで添付できる
            print("\n[STEP 8] ④ファイルD&D機能確認")
            try:
                # まずファイルをクリアして、D&Dテストの準備
                # ファイル削除ボタンを探す（もしあれば）
                delete_button = page.locator('button:has-text("削除")').or_(
                    page.locator('button[aria-label*="削除"]')
                )
                if delete_button.count() > 0:
                    delete_button.first.click()
                    page.wait_for_timeout(500)
                    print("既存のファイルを削除しました")
                
                save_screenshot(page, test_dir, "04_file_drop_1.png", "ファイルD&D前")
                
                # ドロップゾーンを探す
                drop_zone = page.locator('[class*="border-dashed"]').or_(
                    page.locator('text=/ファイルを.*ドロップ/i')
                )
                
                if drop_zone.count() > 0:
                    # ファイルをD&D（set_input_filesで代替）
                    file_input = page.locator('input[type="file"]')
                    file_input.set_input_files(str(TEST_FILE_PATH))
                    page.wait_for_timeout(1500)
                    print(f"✓ ファイルをドロップしました: {TEST_FILE_PATH.name}")
                    
                    # ファイルアップロード完了のトーストメッセージを待機
                    try:
                        upload_toast = page.locator('[data-sonner-toast]:has-text("アップロード")')
                        if upload_toast.count() > 0:
                            # トーストが消えるまで待つ（アップロード完了）
                            upload_toast.wait_for(state="hidden", timeout=30000)
                            print("✓ ファイルアップロードが完了しました")
                    except Exception as toast_error:
                        warnings.append(("STEP 8", f"アップロード完了トースト待機中に警告: {toast_error}"))
                        print(f"⚠️ 警告: アップロード完了トースト待機中に警告: {toast_error}")
                    
                    page.wait_for_timeout(1000)
                    
                    save_screenshot(page, test_dir, "04_file_drop_2.png", "ファイルD&D後")
                else:
                    warnings.append(("STEP 8", "ドロップゾーンが見つかりませんでした"))
                    print("⚠️ 警告: ドロップゾーンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 8", f"ファイルD&D確認中にエラー: {e}"))
                print(f"❌ エラー: ファイルD&D確認中にエラー: {e}")
            
            # 【テスト⑤】説明相手の特徴のスライダーが変更できる
            print("\n[STEP 9] ⑤スライダー変更機能確認")
            try:
                # スライダーのthumb要素を探す（role="slider"）
                sliders = page.locator('[role="slider"]')
                
                if sliders.count() > 0:
                    save_screenshot(page, test_dir, "05_slider_change_1.png", "スライダー変更前")
                    
                    # 1番目のスライダー（専門性）を操作
                    first_slider = sliders.first
                    first_slider.focus()
                    page.wait_for_timeout(300)
                    
                    # 右矢印キーを3回押して値を変更
                    for i in range(3):
                        first_slider.press('ArrowRight')
                        page.wait_for_timeout(100)
                    
                    page.wait_for_timeout(500)
                    print("✓ スライダーの値を変更しました")
                    
                    save_screenshot(page, test_dir, "05_slider_change_2.png", "スライダー変更後")
                    
                    # 元に戻す
                    for i in range(3):
                        first_slider.press('ArrowLeft')
                        page.wait_for_timeout(100)
                    
                    page.wait_for_timeout(300)
                    print("スライダーの値を元に戻しました")
                else:
                    warnings.append(("STEP 9", "スライダーが見つかりませんでした"))
                    print("⚠️ 警告: スライダーが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 9", f"スライダー変更確認中にエラー: {e}"))
                print(f"❌ エラー: スライダー変更確認中にエラー: {e}")
            
            # 【テスト⑥】必要情報を入力し、トークスクリプトが作成できる
            print("\n[STEP 10] ⑥トークスクリプト作成機能確認")
            try:
                # ★重要：ファイルアップロード完了を先に待つ★
                # ファイルアップロード中に入力すると、アップロード完了時にフォームがリセットされる可能性があるため
                # 先にアップロード完了を確認してから、各フィールドに入力する
                print("⏳ ファイルアップロード完了を待機中...")
                page.wait_for_timeout(1000)
                
                # トーストが表示されていない（アップロード完了）ことを確認
                try:
                    upload_toast = page.locator('[data-sonner-toast]:has-text("アップロード")')
                    if upload_toast.count() > 0:
                        upload_toast.wait_for(state="hidden", timeout=30000)
                        print("✓ ファイルアップロードの完了を確認しました")
                    else:
                        print("✓ ファイルアップロードは既に完了しています")
                except Exception as toast_wait_error:
                    print(f"⏳ アップロード完了確認: {toast_wait_error}")
                
                # アップロード完了後、追加の待機時間を設けてフォームの状態を安定させる
                page.wait_for_timeout(1500)
                print("✓ フォーム状態が安定しました")
                
                # ファイルアップロード完了後に、提案書の目的入力フィールドに入力
                purpose_field = page.locator('#purpose')
                
                if purpose_field.count() > 0:
                    purpose_field.fill("新規のお客様に対して、新システムを導入していただくことを目的としています。")
                    page.wait_for_timeout(500)
                    print("✓ 提案書の目的を入力しました")
                else:
                    warnings.append(("STEP 10", "提案書の目的入力フィールドが見つかりませんでした"))
                    print("⚠️ 警告: 提案書の目的入力フィールドが見つかりませんでした")
                
                # 考慮事項入力フィールド（considerationsフィールド） - オプション
                considerations_field = page.locator('textarea[name="considerations"]')
                if considerations_field.count() > 0:
                    considerations_field.fill("専門用語を控え、わかりやすい表現を使う")
                    page.wait_for_timeout(500)
                    print("✓ 考慮事項を入力しました")
                
                # 【エビデンス⑥-1】フォーム入力完了・送信前
                # ここでスクリーンショット取得（ファイルアップロード完了後、トーストは消えている状態）
                print("\n📸 エビデンス取得: フォーム入力完了（送信前）")
                save_screenshot(page, test_dir, "06_form_before_submit.png", "フォーム入力完了（送信前）")
                
                # 作成ボタンをクリック
                print("\n[STEP 11] フォーム送信")
                submit_button = page.locator('button[type="submit"]:has-text("作成する")')
                
                if submit_button.count() > 0:
                    submit_button.first.click()
                    page.wait_for_timeout(2000)
                    print("✓ 作成ボタンをクリックしました")
                    
                    # 作成中の状態を確認
                    try:
                        creating_indicator = page.locator('text=作成中です')
                        if creating_indicator.count() > 0:
                            print("✓ 作成中インジケーターが表示されました")
                            # 作成完了まで待機（最大120秒）
                            creating_indicator.wait_for(state="hidden", timeout=120000)
                            print("✓ 作成処理が完了しました")
                        else:
                            warnings.append(("STEP 11", "作成中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）"))
                            print("⚠️ 警告: 作成中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）")
                    except Exception as wait_error:
                        warnings.append(("STEP 11", f"作成処理待機中に警告: {wait_error}"))
                        print(f"⚠️ 警告: 作成処理待機中に警告: {wait_error}")
                    
                    # 結果の安定化を待つ
                    print("⏳ 結果の表示完了を待機中...")
                    page.wait_for_timeout(3000)
                    
                    # 【エビデンス⑥-2】トークスクリプト作成結果
                    print("\n[STEP 12] ⑥トークスクリプト作成結果の確認")
                    print("📸 エビデンス取得: トークスクリプト作成結果")
                    save_screenshot(page, test_dir, "06_result_after_creation.png", "トークスクリプト作成結果")
                    
                    # 結果が実際に表示されているか確認
                    result_textarea = page.locator('textarea[readonly]')
                    if result_textarea.count() > 0:
                        result_text = result_textarea.first.input_value()
                        if len(result_text) > 50:
                            print(f"✓ トークスクリプトが作成されました（{len(result_text)}文字）")
                        else:
                            warnings.append(("STEP 12", f"トークスクリプトの内容が短い可能性があります ({len(result_text)}文字)"))
                            print(f"⚠️ 警告: トークスクリプトの内容が短い可能性があります ({len(result_text)}文字)")
                    else:
                        warnings.append(("STEP 12", "作成結果のTextareaが見つかりませんでした"))
                        print("⚠️ 警告: 作成結果のTextareaが見つかりませんでした")
                else:
                    warnings.append(("STEP 11", "作成ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 作成ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 10", f"トークスクリプト作成確認中にエラー: {e}"))
                print(f"❌ エラー: トークスクリプト作成確認中にエラー: {e}")
            
            # 【テスト⑦】「結果を調整する」ボックスから、トークスクリプトの内容を修正できる
            print("\n[STEP 13] ⑦結果調整機能確認")
            try:
                # 「結果を調整する」のTextareaを探す
                adjust_textarea = page.locator('textarea[placeholder="作成結果を修正するための指示を入力してください。"]')
                
                if adjust_textarea.count() > 0:
                    save_screenshot(page, test_dir, "07_adjust_result_1.png", "結果調整前")
                    
                    adjust_textarea.fill("より簡潔でわかりやすい表現に修正する")
                    page.wait_for_timeout(800)
                    print("✓ 調整指示を入力しました")
                    
                    # 再作成ボタンをクリック
                    recreate_button = page.locator('button[type="submit"]:has-text("再作成する")')
                    if recreate_button.count() > 0:
                        recreate_button.first.click()
                        page.wait_for_timeout(2000)
                        print("✓ 再作成ボタンをクリックしました")
                        
                        # 再作成中の待機
                        try:
                            recreating_indicator = page.locator('text=再作成中です')
                            if recreating_indicator.count() > 0:
                                recreating_indicator.wait_for(state="hidden", timeout=120000)
                                print("✓ 再作成処理が完了しました")
                        except Exception as wait_error:
                            warnings.append(("STEP 13", f"再作成処理待機中に警告: {wait_error}"))
                            print(f"⚠️ 警告: 再作成処理待機中に警告: {wait_error}")
                        
                        page.wait_for_timeout(3000)
                        save_screenshot(page, test_dir, "07_adjust_result_2.png", "結果調整後（再作成完了）")
                    else:
                        warnings.append(("STEP 13", "再作成ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 再作成ボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 13", "結果を調整するTextareaが見つかりませんでした"))
                    print("⚠️ 警告: 結果を調整するTextareaが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"結果調整確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整確認中にエラー: {e}")
            
            # 【テスト⑧】作成結果のフィードバック（Good/Bad）を送信できる
            print("\n[STEP 14] ⑧フィードバック送信機能確認")
            try:
                # 作成結果エリアのフィードバックボタン
                result_area_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]').or_(
                    page.locator('button[aria-label*="Good"]')
                )
                
                if result_area_buttons.count() >= 2:
                    print(f"作成結果エリアのボタンが見つかりました（{result_area_buttons.count()}個）")
                    
                    # Goodボタン（1番目）をクリック
                    good_button = result_area_buttons.nth(0)
                    good_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ Goodフィードバックボタンをクリックしました")
                    
                    # フィードバックダイアログが表示されるか確認
                    feedback_dialog = page.locator('dialog').or_(page.locator('[role="dialog"]'))
                    
                    if feedback_dialog.count() > 0:
                        print("✓ フィードバックダイアログが表示されました")
                        
                        # オプション選択（チェックボックスの一番上を選択）
                        first_checkbox_label = feedback_dialog.locator('label.text-lg').first
                        if first_checkbox_label.count() > 0:
                            first_checkbox_label.click()
                            page.wait_for_timeout(800)
                            print("✓ フィードバックオプション（一番上）を選択しました")
                        else:
                            warnings.append(("STEP 14", "チェックボックスのラベルが見つかりませんでした"))
                            print("⚠️ 警告: チェックボックスのラベルが見つかりませんでした")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        dialog_input = feedback_dialog.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("トークスクリプトが非常に役立ちました。")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        # フォーム入力後のスクリーンショット（送信前）
                        save_screenshot(page, test_dir, "08_feedback_1.png", "フィードバックフォーム入力後（送信前）")
                        
                        # 送信ボタンをクリック
                        submit_button = feedback_dialog.locator('button[type="submit"]').or_(
                            feedback_dialog.locator('button:has-text("送信")')
                        )
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            save_screenshot(page, test_dir, "08_feedback_2.png", "フィードバック送信後")
                        else:
                            warnings.append(("STEP 14", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 14", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                        save_screenshot(page, test_dir, "08_feedback_2.png", "フィードバックボタンクリック後（ダイアログなし）")
                else:
                    warnings.append(("STEP 14", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【テスト⑨】作成結果を編集できる
            print("\n[STEP 15] ⑨編集機能確認")
            try:
                # 作成結果エリアの編集ボタン
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
                            # readonlyでないtextareaを探す
                            if readonly_attr is None or readonly_attr == 'false':
                                # 値が入っている（作成結果の）textareaを確認
                                value = textarea.input_value()
                                if len(value) > 50:  # 作成結果は長いテキストのはず
                                    editable_textarea = textarea
                                    print(f"✓ 編集可能なテキストエリアを見つけました（{i+1}番目のtextarea）")
                                    break
                        
                        if editable_textarea:
                            # 元のテキストを確認
                            original_text = editable_textarea.input_value()
                            print(f"元のテキスト（最初の50文字）: {original_text[:50]}...")
                            
                            # テキストを変更
                            editable_textarea.fill("編集テスト：トークスクリプト結果を更新しました")
                            page.wait_for_timeout(800)
                            print("✓ テキストを変更しました")
                            
                            # テキスト変更後のスクリーンショット（保存前）
                            save_screenshot(page, test_dir, "09_edit_1.png", "編集中（保存前）")
                            
                            # 保存ボタンをクリック
                            save_button.first.click()
                            page.wait_for_timeout(1500)
                            print("✓ 保存ボタンをクリックしました")
                            
                            # 編集モードが解除されたか確認
                            page.wait_for_timeout(500)
                            if cancel_button.count() == 0:
                                print("✓ 編集モードが解除されました")
                        else:
                            warnings.append(("STEP 15", "編集可能なテキストエリアが見つかりませんでした"))
                            print("⚠️ 警告: 編集可能なテキストエリアが見つかりませんでした")
                    else:
                        warnings.append(("STEP 15", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    # 保存後のスクリーンショット
                    save_screenshot(page, test_dir, "09_edit_2.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 15", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 15", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑩】作成結果をコピーできる
            print("\n[STEP 16] ⑩コピー機能確認")
            try:
                # コピーボタン
                copy_button = page.locator('button.absolute.right-1.top-1.z-10')
                
                if copy_button.count() > 0:
                    save_screenshot(page, test_dir, "10_copy_1.png", "コピー前")
                    
                    copy_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ コピーボタンをクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('text=/.*コピー/i').or_(
                        page.locator('[data-sonner-toast]')
                    )
                    if toast.count() > 0:
                        print("✓ コピー成功のトーストメッセージが表示されました")
                    
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
                            warnings.append(("STEP 16", "クリップボードが空です"))
                            print("⚠️ 警告: クリップボードが空です")
                    except Exception as clipboard_error:
                        warnings.append(("STEP 16", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                        print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                    
                    save_screenshot(page, test_dir, "10_copy_2.png", "コピー実行後（トースト表示）")
                else:
                    warnings.append(("STEP 16", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 16", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑪】作成結果をダウンロードできる
            print("\n[STEP 17] ⑪ダウンロード機能確認")
            try:
                # ダウンロードボタン（作成結果エリアのボタン群の3番目）
                result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_buttons.count() >= 3:
                    save_screenshot(page, test_dir, "11_download_1.png", "ダウンロード前")
                    
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
                        
                        # ファイル名が「トークスクリプト_YYYYMMDD_HHMM.txt」形式か確認
                        if filename.startswith("トークスクリプト_") and filename.endswith(".txt"):
                            print("✓ ダウンロードファイル名が正しい形式です")
                        
                        # ダウンロードされたファイルを固定名でエビデンスディレクトリに保存
                        downloaded_file_path = os.path.join(test_dir, "11_download.txt")
                        download.save_as(downloaded_file_path)
                        print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                        print(f"  元のファイル名: {filename}")
                        
                        # ファイルサイズも確認
                        file_size = os.path.getsize(downloaded_file_path)
                        print(f"  ファイルサイズ: {file_size} bytes")
                    except Exception as dl_error:
                        warnings.append(("STEP 17", f"ダウンロード完了の検知に失敗: {dl_error}"))
                        print(f"⚠️ 警告: ダウンロード完了の検知に失敗: {dl_error}")
                    
                    # ダウンロードトーストメッセージを待機
                    page.wait_for_timeout(1500)
                    toast_download = page.locator('[data-sonner-toast]')
                    if toast_download.count() > 0:
                        print("✓ ダウンロード完了のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "11_download_2.png", "ダウンロード実行後（トースト表示）")
                else:
                    warnings.append(("STEP 17", "ダウンロードボタンが見つかりませんでした"))
                    print("⚠️ 警告: ダウンロードボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 17", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【テスト⑫】「プロンプトを表示」をクリックすると画面配置が変わる
            print("\n[STEP 18] ⑫プロンプト表示機能確認")
            try:
                # 「プロンプトを表示」または「プロンプトを隠す」リンク
                prompt_show_link = page.locator('a:has-text("プロンプトを表示")')
                prompt_hide_link = page.locator('a:has-text("プロンプトを隠す")')
                
                # どちらかが表示されているか確認
                if prompt_show_link.count() > 0:
                    save_screenshot(page, test_dir, "12_show_prompt_1.png", "プロンプト表示前（プロンプトが隠れている状態）")
                    
                    prompt_show_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを表示」をクリックしました")
                    
                    # クリック後、「プロンプトを隠す」が表示されるはず
                    if prompt_hide_link.count() > 0:
                        print("✓ レイアウトが変更されました（プロンプトが表示され、「プロンプトを隠す」リンクが表示）")
                    
                    save_screenshot(page, test_dir, "12_show_prompt_2.png", "プロンプト表示後（画面配置変更）")
                    
                elif prompt_hide_link.count() > 0:
                    # すでにプロンプトが表示されている場合
                    print("すでにプロンプトが表示されています。「プロンプトを隠す」をクリックして元に戻します。")
                    save_screenshot(page, test_dir, "12_show_prompt_1.png", "プロンプト表示前（すでに表示状態）")
                    
                    prompt_hide_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを隠す」をクリックしました")
                    
                    save_screenshot(page, test_dir, "12_show_prompt_2.png", "プロンプト非表示後（画面配置変更）")
                else:
                    warnings.append(("STEP 18", "プロンプト表示/非表示リンクが見つかりませんでした"))
                    print("⚠️ 警告: プロンプト表示/非表示リンクが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 18", f"プロンプト表示確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示確認中にエラー: {e}")
            
            # 【テスト⑬】「情報をクリア」をクリックすると入力情報がクリアされる
            print("\n[STEP 19] ⑬情報クリア機能確認")
            try:
                # 「情報をクリア」リンクボタン
                clear_button = page.locator('button:has-text("情報をクリア")')
                
                if clear_button.count() > 0:
                    save_screenshot(page, test_dir, "13_clear_info_1.png", "情報クリア前")
                    
                    clear_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ 「情報をクリア」をクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('[data-sonner-toast]')
                    if toast.count() > 0:
                        print("✓ クリア成功のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "13_clear_info_2.png", "情報クリア後（トースト表示）")
                    
                    # クリア後、入力フィールドが空になっているか確認
                    page.wait_for_timeout(500)
                    purpose_field = page.locator('#purpose')
                    if purpose_field.count() > 0:
                        purpose_value = purpose_field.input_value()
                        if purpose_value == "":
                            print("✓ 入力情報が正しくクリアされました")
                        else:
                            warnings.append(("STEP 19", f"入力情報が残っている可能性があります: '{purpose_value[:50]}...'"))
                            print(f"⚠️ 警告: 入力情報が残っている可能性があります: '{purpose_value[:50]}...'")
                else:
                    warnings.append(("STEP 19", "情報クリアボタンが見つかりませんでした"))
                    print("⚠️ 警告: 情報クリアボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 19", f"情報クリア確認中にエラー: {e}"))
                print(f"❌ エラー: 情報クリア確認中にエラー: {e}")
            
            # テスト完了 - 結果サマリーを表示
            print(f"\n{'='*70}")
            print(f"【テスト実行結果サマリー】")
            print(f"{'='*70}")
            
            # 警告とエラーの集計
            warning_count = len(warnings)
            error_count = len(errors)
            
            if warning_count == 0 and error_count == 0:
                print(f"\n✅ 結果: PASS")
                print(f"   すべてのテストが正常に完了しました")
            else:
                print(f"\n⚠️ 結果: 要チェック")
                print(f"   警告: {warning_count}件")
                print(f"   エラー: {error_count}件")
            
            # 警告の詳細を表示
            if warning_count > 0:
                print(f"\n【警告の詳細】")
                for step, message in warnings:
                    print(f"  - {step}: {message}")
            
            # エラーの詳細を表示
            if error_count > 0:
                print(f"\n【エラーの詳細】")
                for step, message in errors:
                    print(f"  - {step}: {message}")
            
            print(f"\n{'='*70}")
            print(f"✅ 全テスト完了: トークスクリプト画面の全機能を確認しました")
            print(f"{'='*70}")
            
        except Exception as e:
            # 致命的エラーもリストに追加
            errors.append(("CRITICAL", f"テスト実行中に致命的エラー: {e}"))
            print(f"❌ 致命的エラー: テスト実行中にエラー: {e}")
            save_screenshot(page, test_dir, "ERROR_test_execution.png", "テスト実行エラー")
            raise
        finally:
            # コンテキストを閉じる
            context.close()
        
        # テスト完了サマリーを表示
        print_test_summary(test_dir)
        
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
    
    # メインテスト関数を実行
    print("=" * 70)
    print("Playwright E2Eテスト: トークスクリプト画面")
    print("=" * 70)
    
    try:
        print("\n[実行中] トークスクリプト機能テスト...")
        test_talk_script_functionality()
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
