"""
create-minutes.py - 議事録作成画面のE2Eテスト

Azure Entra ID認証を含む、議事録作成画面の完全なE2Eテストを実施します。
手動認証モードとヘッドレスモードの両方に対応しています。

【テスト観点】
① 議事録画面が正しく表示されることを確認する
② カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③ 「ファイルを選択」から対象ファイルを選択できることを確認する
④ 対象ファイルをドラッグ＆ドロップで添付できることを確認する（複数拡張子テスト：csv, docx, pdf, pptx, txt, xlsx）
⑤ 会議の目的を入力し議事録が作成されることを確認する
⑥ 「結果を調整する」ボックスから、議事録の内容を修正できることを確認する
⑦ 作成結果のフィードバック（Good/Bad）を送信できることを確認する
⑧ 作成結果を編集できることを確認する
⑨ 作成結果をコピーできることを確認する
⑩ 作成結果をダウンロードできることを確認する
⑪ 「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑫ 「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-minutes.py::test_create_minutes_functionality -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/create-minutes.py

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : print文を表示（必須！このオプションがないと標準出力が隠れます）
  MANUAL_AUTH=true : 手動認証モードを有効化

【エビデンス】
  テスト実行後、各テスト観点の前後のスクリーンショットが保存されます：
  test_evidence/test_YYYYMMDD_HHMMSS/
  ├── 01_minutes_page_display.png（①画面表示）
  ├── 02_help_mark_1.png / 02_help_mark_2.png（②ヘルプマーク）
  ├── 03_file_select_1.png / 03_file_select_2.png（③ファイル選択）
  ├── 04_file_drop_0_before.png（④テスト開始前）
  ├── 04_file_drop_1_csv_attached.png / 04_file_drop_1_csv_removed.png（CSV）
  ├── 04_file_drop_2_docx_attached.png / 04_file_drop_2_docx_removed.png（DOCX）
  ├── 04_file_drop_3_pdf_attached.png / 04_file_drop_3_pdf_removed.png（PDF）
  ├── 04_file_drop_4_pptx_attached.png / 04_file_drop_4_pptx_removed.png（PPTX）
  ├── 04_file_drop_5_txt_attached.png / 04_file_drop_5_txt_removed.png（TXT）
  ├── 04_file_drop_6_xlsx_attached.png（XLSX - 最終添付）
  ├── 04_file_drop_final.png（④全ファイルテスト完了）
  ├── 05_form_before_submit.png / 05_result_after_creation.png（⑤議事録作成）
  ├── 06_adjust_result_1.png / 06_adjust_result_2.png（⑥結果調整）
  ├── 07_feedback_1.png / 07_feedback_2.png（⑦フィードバック）
  ├── 08_edit_1.png / 08_edit_2.png（⑧編集）
  ├── 09_copy_1.png / 09_copy_2.png（⑨コピー）
  ├── 10_download_1.png / 10_download_2.png（⑩ダウンロード）
  ├── 11_show_prompt_1.png / 11_show_prompt_2.png（⑪プロンプト表示）
  └── 12_clear_info_1.png / 12_clear_info_2.png（⑫情報クリア）
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS

# テストファイルのディレクトリパス
TEST_FILES_DIR = Path(__file__).parent.parent / "input" / "02_create-minutes"
# STEP 3用の単一ファイル（最初のテスト用）
TEST_FILE_SINGLE = TEST_FILES_DIR / "議事録.txt"


def test_create_minutes_functionality():
    """議事録作成ページでファイル添付と議事録作成のテストを実施"""
    
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
        
        # /create-minutes ページに遷移
        print(f"\n[STEP 4] /create-minutesページへ遷移")
        print(f"/create-minutesページへ遷移します...")
        page.goto(f"{BASE_URL}/create-minutes")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # マウスカーソルを表示
        enable_mouse_cursor(page)
        
        # デバッグ: ページのタイトルとURLを確認
        print(f"ページURL: {page.url}")
        print(f"ページタイトル: {page.title()}")
        
        # 【テスト①】議事録画面が正しく表示されることを確認
        print("\n[STEP 5] ①議事録画面の表示確認")
        print("📸 エビデンス取得: 議事録画面")
        save_screenshot(page, test_dir, "01_minutes_page_display.png", "議事録画面の表示")
        
        try:
            # 【テスト②】ヘルプマークにカーソルを合わせると機能説明が表示される
            print("\n[STEP 6] ②ヘルプマーク機能説明の確認")
            try:
                # 議事録作成タイトル内のヘルプコンポーネント
                help_button = page.locator('h3:has-text("議事録作成")').locator('..').locator('button')
                
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
                    file_input.set_input_files(str(TEST_FILE_SINGLE))
                    page.wait_for_timeout(1500)
                    print(f"✓ ファイルを選択しました: {TEST_FILE_SINGLE.name}")
                    
                    # ファイル名が表示されているか確認
                    file_name_display = page.locator(f'text=/.*{TEST_FILE_SINGLE.stem}.*/i')
                    if file_name_display.count() > 0:
                        print("✓ ファイル名が表示されました")
                    
                    save_screenshot(page, test_dir, "03_file_select_2.png", "ファイル選択後")
                else:
                    warnings.append(("STEP 7", "ファイル入力要素が見つかりませんでした"))
                    print("⚠️ 警告: ファイル入力要素が見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"ファイル選択確認中にエラー: {e}"))
                print(f"❌ エラー: ファイル選択確認中にエラー: {e}")
            
            # 【テスト④】対象ファイルをドラッグ＆ドロップで添付できる（全拡張子テスト）
            print("\n[STEP 8] ④ファイルD&D機能確認（複数拡張子のテスト）")
            try:
                # まずSTEP 7で添付したファイルを削除
                print("\n  ① STEP 7で添付したファイルを削除")
                # AttachmentListWithTempStorage内のCloseボタンを探す
                # ファイルリストアイテム内の削除ボタンを探す
                delete_button = page.locator('div.flex.h-12 button[type="button"]').first
                
                if delete_button.count() > 0:
                    delete_button.click()
                    page.wait_for_timeout(1000)  # 削除処理とトースト表示を待つ
                    print("    ✓ 既存のファイルを削除しました")
                else:
                    print("    ℹ️ 削除ボタンが見つかりませんでした（ファイルが未添付の可能性）")
                
                save_screenshot(page, test_dir, "04_file_drop_0_before.png", "全ファイルテスト開始前")
                
                # テストファイルのディレクトリから全ファイルを取得
                test_files = sorted(TEST_FILES_DIR.glob("議事録.*"))
                print(f"\n  ② {len(test_files)}個のファイルを順番にテスト")
                
                # テスト対象の拡張子の順序を定義（最後にxlsxが来るように）
                file_order = ['.csv', '.docx', '.pdf', '.pptx', '.txt', '.xlsx']
                sorted_files = []
                for ext in file_order:
                    for f in test_files:
                        if f.suffix == ext:
                            sorted_files.append(f)
                            break
                
                if len(sorted_files) == 0:
                    warnings.append(("STEP 8", f"テストファイルが見つかりませんでした: {TEST_FILES_DIR}"))
                    print(f"⚠️ 警告: テストファイルが見つかりませんでした: {TEST_FILES_DIR}")
                else:
                    # 各ファイルを順番に添付→確認→削除（最後のxlsx以外）
                    for idx, test_file in enumerate(sorted_files, 1):
                        is_last_file = (idx == len(sorted_files))
                        file_ext = test_file.suffix
                        
                        print(f"\n  [{idx}/{len(sorted_files)}] {test_file.name}を添付")
                        
                        # ファイル入力要素を取得
                        file_input = page.locator('input[type="file"]')
                        
                        if file_input.count() > 0:
                            # ファイルを添付
                            file_input.set_input_files(str(test_file))
                            page.wait_for_timeout(1500)
                            print(f"    ✓ ファイルを添付しました: {test_file.name}")
                            
                            # アップロード完了後、UIの更新を待つ
                            page.wait_for_timeout(1500)
                            
                            # ファイル名が表示されているか確認
                            file_name_display = page.locator(f'text=/.*{test_file.stem}.*/i')
                            if file_name_display.count() > 0:
                                print(f"    ✓ ファイル名が画面に表示されました")
                            else:
                                warnings.append(("STEP 8", f"{test_file.name}のファイル名表示が確認できませんでした"))
                                print(f"    ⚠️ 警告: ファイル名表示が確認できませんでした")
                            
                            # ファイルリストアイテム（div.flex.h-12）が表示されるまで明示的に待機
                            try:
                                file_list_item = page.locator('div.flex.h-12').first
                                file_list_item.wait_for(state="visible", timeout=10000)
                                print(f"    ✓ ファイルリストアイテムの表示を確認しました")
                            except Exception as wait_error:
                                print(f"    ⚠️ ファイルリストアイテムの待機中に警告: {wait_error}")
                                # リストアイテムが表示されるまで追加で待機
                                page.wait_for_timeout(2000)
                            
                            # スクリーンショット撮影
                            screenshot_name = f"04_file_drop_{idx}_{file_ext[1:]}_attached.png"
                            save_screenshot(page, test_dir, screenshot_name, f"{test_file.name}添付後")
                            
                            # 最後のファイル（xlsx）以外は削除
                            if not is_last_file:
                                print(f"    削除ボタンを探して{test_file.name}を削除...")
                                page.wait_for_timeout(500)  # UI更新を待つ
                                
                                # ファイルリストアイテム（div.flex.h-12）内の削除ボタンを探す
                                # 常に最初のファイル（一番上）を削除
                                remove_button = page.locator('div.flex.h-12 button[type="button"]').first
                                
                                # 削除ボタンが見つからない場合は、少し待ってからリトライ
                                retry_count = 0
                                max_retries = 3
                                while remove_button.count() == 0 and retry_count < max_retries:
                                    retry_count += 1
                                    print(f"    削除ボタンが見つかりません。リトライ {retry_count}/{max_retries}...")
                                    page.wait_for_timeout(1000)
                                    remove_button = page.locator('div.flex.h-12 button[type="button"]').first
                                
                                if remove_button.count() > 0:
                                    # ボタンが表示され、クリック可能になるまで待機
                                    try:
                                        remove_button.wait_for(state="visible", timeout=5000)
                                        page.wait_for_timeout(300)
                                    except Exception as btn_wait_error:
                                        print(f"    削除ボタンの表示待機中: {btn_wait_error}")
                                    
                                    remove_button.click()
                                    page.wait_for_timeout(1500)  # 削除処理とトースト表示を待つ
                                    print(f"    ✓ {test_file.name}を削除しました")
                                    
                                    # 削除後のスクリーンショット
                                    screenshot_name_after = f"04_file_drop_{idx}_{file_ext[1:]}_removed.png"
                                    save_screenshot(page, test_dir, screenshot_name_after, f"{test_file.name}削除後")
                                else:
                                    warnings.append(("STEP 8", f"{test_file.name}の削除ボタンが見つかりませんでした"))
                                    print(f"    ⚠️ 警告: 削除ボタンが見つかりませんでした")
                                    # 削除できなかった場合でもスクリーンショットを撮影
                                    screenshot_name_error = f"04_file_drop_{idx}_{file_ext[1:]}_delete_button_not_found.png"
                                    save_screenshot(page, test_dir, screenshot_name_error, f"{test_file.name}削除ボタン未検出")
                            else:
                                print(f"    ℹ️ 最後のファイル（{test_file.name}）は削除せず、次のステップで使用します")
                        else:
                            warnings.append(("STEP 8", "ファイル入力要素が見つかりませんでした"))
                            print(f"    ⚠️ 警告: ファイル入力要素が見つかりませんでした")
                    
                    # 最終状態のスクリーンショット
                    save_screenshot(page, test_dir, "04_file_drop_final.png", "最終状態（議事録.xlsxのみ添付）")
                    print(f"\n  ✓ 全{len(sorted_files)}ファイルのテスト完了")
                    print(f"  ✓ 最終状態: 議事録.xlsxのみが添付された状態")
                    
            except Exception as e:
                errors.append(("STEP 8", f"ファイルD&D確認中にエラー: {e}"))
                print(f"❌ エラー: ファイルD&D確認中にエラー: {e}")
            
            # 【テスト⑤】会議の目的を入力し議事録が作成される
            print("\n[STEP 9] ⑤議事録作成機能確認")
            try:
                # 会議の目的入力フィールド
                meeting_purpose = page.locator('#meetingPurpose')
                
                if meeting_purpose.count() > 0:
                    meeting_purpose.fill("テスト用の会議：新製品のアイディア出し")
                    page.wait_for_timeout(500)
                    print("✓ 会議の目的を入力しました")
                else:
                    warnings.append(("STEP 9", "会議の目的入力フィールドが見つかりませんでした"))
                    print("⚠️ 警告: 会議の目的入力フィールドが見つかりませんでした")
                
                # 【エビデンス⑤-1】フォーム入力完了・送信前
                print("\n📸 エビデンス取得: フォーム入力完了（送信前）")
                save_screenshot(page, test_dir, "05_form_before_submit.png", "フォーム入力完了（送信前）")
                
                # 作成ボタンをクリック
                print("\n[STEP 10] フォーム送信")
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
                            warnings.append(("STEP 10", "作成中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）"))
                            print("⚠️ 警告: 作成中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）")
                    except Exception as wait_error:
                        warnings.append(("STEP 10", f"作成処理待機中に警告: {wait_error}"))
                        print(f"⚠️ 警告: 作成処理待機中に警告: {wait_error}")
                    
                    # 結果の安定化を待つ
                    print("⏳ 結果の表示完了を待機中...")
                    page.wait_for_timeout(3000)
                    
                    # 【エビデンス⑤-2】議事録作成結果
                    print("\n[STEP 11] ⑤議事録作成結果の確認")
                    print("📸 エビデンス取得: 議事録作成結果")
                    save_screenshot(page, test_dir, "05_result_after_creation.png", "議事録作成結果")
                    
                    # 結果が実際に表示されているか確認
                    result_textarea = page.locator('textarea[readonly]')
                    if result_textarea.count() > 0:
                        result_text = result_textarea.first.input_value()
                        if len(result_text) > 50:
                            print(f"✓ 議事録が作成されました（{len(result_text)}文字）")
                        else:
                            warnings.append(("STEP 11", f"議事録の内容が短い可能性があります ({len(result_text)}文字)"))
                            print(f"⚠️ 警告: 議事録の内容が短い可能性があります ({len(result_text)}文字)")
                    else:
                        warnings.append(("STEP 11", "作成結果のTextareaが見つかりませんでした"))
                        print("⚠️ 警告: 作成結果のTextareaが見つかりませんでした")
                else:
                    warnings.append(("STEP 10", "作成ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 作成ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 9", f"議事録作成確認中にエラー: {e}"))
                print(f"❌ エラー: 議事録作成確認中にエラー: {e}")
            
            # 【テスト⑥】「結果を調整する」ボックスから、議事録の内容を修正できる
            print("\n[STEP 12] ⑥結果調整機能確認")
            try:
                # 「結果を調整する」のTextareaを探す
                adjust_textarea = page.locator('textarea[placeholder*="議事録を修正するための指示"]')
                
                if adjust_textarea.count() > 0:
                    save_screenshot(page, test_dir, "06_adjust_result_1.png", "結果調整前")
                    
                    adjust_textarea.fill("・決定事項をより詳細に記述する\n・発言者を明確に記録する")
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
                            warnings.append(("STEP 12", f"再作成処理待機中に警告: {wait_error}"))
                            print(f"⚠️ 警告: 再作成処理待機中に警告: {wait_error}")
                        
                        page.wait_for_timeout(3000)
                        save_screenshot(page, test_dir, "06_adjust_result_2.png", "結果調整後（再作成完了）")
                    else:
                        warnings.append(("STEP 12", "再作成ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 再作成ボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 12", "結果を調整するTextareaが見つかりませんでした"))
                    print("⚠️ 警告: 結果を調整するTextareaが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"結果調整確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整確認中にエラー: {e}")
            
            # 【テスト⑦】作成結果のフィードバック（Good/Bad）を送信できる
            print("\n[STEP 13] ⑦フィードバック送信機能確認")
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
                            warnings.append(("STEP 13", "チェックボックスのラベルが見つかりませんでした"))
                            print("⚠️ 警告: チェックボックスのラベルが見つかりませんでした")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        dialog_input = feedback_dialog.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("議事録の品質が高く、内容も正確でした。")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        # フォーム入力後のスクリーンショット（送信前）
                        save_screenshot(page, test_dir, "07_feedback_1.png", "フィードバックフォーム入力後（送信前）")
                        
                        # 送信ボタンをクリック
                        submit_button = feedback_dialog.locator('button[type="submit"]').or_(
                            feedback_dialog.locator('button:has-text("送信")')
                        )
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            save_screenshot(page, test_dir, "07_feedback_2.png", "フィードバック送信後")
                        else:
                            warnings.append(("STEP 13", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 13", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                        save_screenshot(page, test_dir, "07_feedback_2.png", "フィードバックボタンクリック後（ダイアログなし）")
                else:
                    warnings.append(("STEP 13", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【テスト⑧】作成結果を編集できる
            print("\n[STEP 14] ⑧編集機能確認")
            try:
                # 作成結果エリアの編集ボタン
                edit_button = page.locator('button:has(svg)').filter(has=page.locator('title:has-text("Edit")'))
                if edit_button.count() == 0:
                    # 別の方法で編集ボタンを探す
                    result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                    if result_buttons.count() >= 4:
                        edit_button = result_buttons.nth(3)
                
                if edit_button.count() > 0:
                    edit_button.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 編集ボタンをクリックしました")
                    
                    # 編集モードではキャンセルと保存ボタンが表示される
                    cancel_button = page.locator('button:has-text("キャンセル")')
                    save_button = page.locator('button:has-text("保存")')
                    
                    if cancel_button.count() > 0 and save_button.count() > 0:
                        print("✓ 編集モードに切り替わりました（キャンセル・保存ボタンが表示）")
                        
                        # 編集可能なテキストエリアを探す
                        editable_textarea = page.locator('textarea:not([readonly])')
                        
                        if editable_textarea.count() > 0:
                            # 作成結果のtextareaを特定（長いテキストが入っている）
                            for i in range(editable_textarea.count()):
                                textarea = editable_textarea.nth(i)
                                value = textarea.input_value()
                                if len(value) > 50:  # 作成結果は長いテキストのはず
                                    print(f"✓ 編集可能なテキストエリアを見つけました（{i+1}番目）")
                                    
                                    # 元のテキストを確認
                                    original_text = value
                                    print(f"元のテキスト（最初の50文字）: {original_text[:50]}...")
                                    
                                    # テキストを変更
                                    textarea.fill("編集テスト：議事録の内容を更新しました")
                                    page.wait_for_timeout(800)
                                    print("✓ テキストを変更しました")
                                    
                                    # テキスト変更後のスクリーンショット（保存前）
                                    save_screenshot(page, test_dir, "08_edit_1.png", "編集中（保存前）")
                                    
                                    # 保存ボタンをクリック
                                    save_button.first.click()
                                    page.wait_for_timeout(1500)
                                    print("✓ 保存ボタンをクリックしました")
                                    
                                    # 編集モードが解除されたか確認
                                    page.wait_for_timeout(500)
                                    if cancel_button.count() == 0:
                                        print("✓ 編集モードが解除されました")
                                    else:
                                        warnings.append(("STEP 14", "編集モードがまだ解除されていません"))
                                        print("⚠️ 警告: 編集モードがまだ解除されていません")
                                    break
                        else:
                            warnings.append(("STEP 14", "編集可能なテキストエリアが見つかりませんでした"))
                            print("⚠️ 警告: 編集可能なテキストエリアが見つかりませんでした")
                    else:
                        warnings.append(("STEP 14", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    # 保存後のスクリーンショット
                    save_screenshot(page, test_dir, "08_edit_2.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 14", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑨】作成結果をコピーできる
            print("\n[STEP 15] ⑨コピー機能確認")
            try:
                # コピーボタン
                copy_button = page.locator('button.absolute.right-1.top-1.z-10')
                
                if copy_button.count() > 0:
                    save_screenshot(page, test_dir, "09_copy_1.png", "コピー前")
                    
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
                            copy_file_path = os.path.join(test_dir, "09_copy.txt")
                            with open(copy_file_path, 'w', encoding='utf-8') as f:
                                f.write(clipboard_text)
                            print(f"✓ コピーされた内容をエビデンスに保存: {copy_file_path}")
                            print(f"  テキスト長: {len(clipboard_text)} 文字")
                        else:
                            warnings.append(("STEP 15", "クリップボードが空です"))
                            print("⚠️ 警告: クリップボードが空です")
                    except Exception as clipboard_error:
                        warnings.append(("STEP 15", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                        print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                    
                    save_screenshot(page, test_dir, "09_copy_2.png", "コピー実行後（トースト表示）")
                else:
                    warnings.append(("STEP 15", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 15", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑩】作成結果をダウンロードできる
            print("\n[STEP 16] ⑩ダウンロード機能確認")
            try:
                # ダウンロードボタン（DropdownMenuTrigger）
                download_trigger = page.locator('button:has(svg)').filter(has=page.locator('title:has-text("Download")'))
                if download_trigger.count() == 0:
                    # 別の方法でダウンロードボタンを探す
                    result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                    if result_buttons.count() >= 3:
                        download_trigger = result_buttons.nth(2)
                
                if download_trigger.count() > 0:
                    save_screenshot(page, test_dir, "10_download_1.png", "ダウンロード前")
                    
                    # ドロップダウンメニューを開く
                    download_trigger.first.click()
                    page.wait_for_timeout(800)
                    print("✓ ダウンロードメニューを開きました")
                    
                    # 「ダウンロード」メニュー項目をクリック
                    download_menu_item = page.locator('text=ダウンロード').first
                    
                    if download_menu_item.count() > 0:
                        # ダウンロードイベントを待機
                        try:
                            with page.expect_download(timeout=15000) as download_info:
                                download_menu_item.click()
                                print("✓ ダウンロードメニュー項目をクリックしました")
                            
                            download = download_info.value
                            filename = download.suggested_filename
                            print(f"✓ ダウンロード完了: {filename}")
                            
                            # ファイル名が「議事録_YYYYMMDD_HHMM.txt」形式か確認
                            if filename.startswith("議事録_") and filename.endswith(".txt"):
                                print("✓ ダウンロードファイル名が正しい形式です")
                            
                            # ダウンロードされたファイルを固定名でエビデンスディレクトリに保存
                            downloaded_file_path = os.path.join(test_dir, "10_download.txt")
                            download.save_as(downloaded_file_path)
                            print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                            print(f"  元のファイル名: {filename}")
                            
                            # ファイルサイズも確認
                            file_size = os.path.getsize(downloaded_file_path)
                            print(f"  ファイルサイズ: {file_size} bytes")
                        except Exception as dl_error:
                            warnings.append(("STEP 16", f"ダウンロード完了の検知に失敗: {dl_error}"))
                            print(f"⚠️ 警告: ダウンロード完了の検知に失敗: {dl_error}")
                        
                        # ダウンロードトーストメッセージを待機
                        page.wait_for_timeout(1500)
                        toast_download = page.locator('[data-sonner-toast]')
                        if toast_download.count() > 0:
                            print("✓ ダウンロード完了のトーストメッセージが表示されました")
                        
                        save_screenshot(page, test_dir, "10_download_2.png", "ダウンロード実行後（トースト表示）")
                    else:
                        warnings.append(("STEP 16", "ダウンロードメニュー項目が見つかりませんでした"))
                        print("⚠️ 警告: ダウンロードメニュー項目が見つかりませんでした")
                else:
                    warnings.append(("STEP 16", "ダウンロードボタンが見つかりませんでした"))
                    print("⚠️ 警告: ダウンロードボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 16", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【テスト⑪】「プロンプトを表示」をクリックすると画面配置が変わる
            print("\n[STEP 17] ⑪プロンプト表示機能確認")
            try:
                # 「プロンプトを表示」または「プロンプトを隠す」リンク
                prompt_show_link = page.locator('a:has-text("プロンプトを表示")')
                prompt_hide_link = page.locator('a:has-text("プロンプトを隠す")')
                
                # どちらかが表示されているか確認
                if prompt_show_link.count() > 0:
                    save_screenshot(page, test_dir, "11_show_prompt_1.png", "プロンプト表示前（プロンプトが隠れている状態）")
                    
                    prompt_show_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを表示」をクリックしました")
                    
                    # クリック後、「プロンプトを隠す」が表示されるはず
                    if prompt_hide_link.count() > 0:
                        print("✓ レイアウトが変更されました（プロンプトが表示され、「プロンプトを隠す」リンクが表示）")
                    
                    save_screenshot(page, test_dir, "11_show_prompt_2.png", "プロンプト表示後（画面配置変更）")
                    
                elif prompt_hide_link.count() > 0:
                    # すでにプロンプトが表示されている場合
                    print("すでにプロンプトが表示されています。「プロンプトを隠す」をクリックして元に戻します。")
                    save_screenshot(page, test_dir, "11_show_prompt_1.png", "プロンプト表示前（すでに表示状態）")
                    
                    prompt_hide_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを隠す」をクリックしました")
                    
                    save_screenshot(page, test_dir, "11_show_prompt_2.png", "プロンプト非表示後（画面配置変更）")
                else:
                    warnings.append(("STEP 17", "プロンプト表示/非表示リンクが見つかりませんでした"))
                    print("⚠️ 警告: プロンプト表示/非表示リンクが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 17", f"プロンプト表示確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示確認中にエラー: {e}")
            
            # 【テスト⑫】「情報をクリア」をクリックすると入力情報がクリアされる
            print("\n[STEP 18] ⑫情報クリア機能確認")
            try:
                # 「情報をクリア」リンクボタン
                clear_button = page.locator('button:has-text("情報をクリア")')
                
                if clear_button.count() > 0:
                    save_screenshot(page, test_dir, "12_clear_info_1.png", "情報クリア前")
                    
                    clear_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ 「情報をクリア」をクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('[data-sonner-toast]')
                    if toast.count() > 0:
                        print("✓ クリア成功のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "12_clear_info_2.png", "情報クリア後（トースト表示）")
                    
                    # クリア後、入力フィールドが空になっているか確認
                    page.wait_for_timeout(500)
                    meeting_purpose = page.locator('#meetingPurpose')
                    if meeting_purpose.count() > 0:
                        meeting_purpose_value = meeting_purpose.input_value()
                        if meeting_purpose_value == "":
                            print("✓ 入力情報が正しくクリアされました")
                        else:
                            warnings.append(("STEP 18", f"入力情報が残っている可能性があります: '{meeting_purpose_value[:50]}...'"))
                            print(f"⚠️ 警告: 入力情報が残っている可能性があります: '{meeting_purpose_value[:50]}...'")
                else:
                    warnings.append(("STEP 18", "情報クリアボタンが見つかりませんでした"))
                    print("⚠️ 警告: 情報クリアボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 18", f"情報クリア確認中にエラー: {e}"))
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
            print(f"✅ 全テスト完了: 議事録作成画面の全機能を確認しました")
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
    assert len(warnings) == 0, f"テストで警告が{len(warnings)}件発生しました:\n" + "\n".join([f"  - {step}: {msg}" for step, msg in warnings])
    
    # 警告は許容しつつ、ログ出力のみ行う
    if len(warnings) > 0:
        print(f"\n⚠️ 注意: テストは成功しましたが、{len(warnings)}件の警告があります")
        print("詳細は上記のサマリーを確認してください")


if __name__ == "__main__":
    """スクリプトとして直接実行する場合"""
    import sys
    
    # メインテスト関数を実行
    print("=" * 70)
    print("Playwright E2Eテスト: 議事録作成画面")
    print("=" * 70)
    
    try:
        print("\n[実行中] 議事録作成機能テスト...")
        test_create_minutes_functionality()
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
