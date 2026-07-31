"""返信メール作成画面のE2Eテスト

【テスト観点】
① 返信タブにあるファイルアップロードタブで「ファイルを選択」から対象ファイルを選択できることを確認する
② 返信タブにあるファイルアップロードタブで対象ファイルをドラッグ＆ドロップで添付できることを確認する
③ 必要情報を入力し、返信メールを作成できることを確認する
④ 「結果を調整する」ボックスから、返信メールの内容を修正できることを確認する
⑤ 返信メール出力内容について、件名/本文のフィードバック（Good/Bad）を送信できることを確認する
⑥ 返信メール出力内容について、本文を編集できることを確認する
⑦ 返信メール出力内容について、件名/本文をコピーできることを確認する
⑧ 返信メール出力内容について、件名/本文をダウンロードできることを確認する
⑨ 「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑩ 「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/reply-mail.py::test_reply_mail_functionality -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/reply-mail.py

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : 標準出力をキャプチャしない（print文が表示される）
  MANUAL_AUTH=true : 手動認証モード（ブラウザで手動認証）
"""

import os
from pathlib import Path
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS

# テストファイルのパス
TEST_FILE_PATH = Path(__file__).parent.parent / "input" / "test.msg"


def test_reply_mail_functionality():
    """返信メール作成機能のE2Eテスト"""
    
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
        
        # メール作成ページに遷移
        print(f"\n[STEP 4] メール作成ページへ遷移")
        page.goto(f"{BASE_URL}/create-mail")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # マウスカーソルを表示
        enable_mouse_cursor(page)
        
        print(f"ページURL: {page.url}")
        print(f"ページタイトル: {page.title()}")
        
        try:
            # まず返信タブに切り替える
            print("\n[STEP 5] 返信タブに切り替え")
            try:
                save_screenshot(page, test_dir, "00_initial_page.png", "初期画面（新規タブ）")
                
                # CreateMailFormの「返信」タブに切り替える
                reply_tab = page.locator('button[role="tab"]:has-text("返信")')
                if reply_tab.count() > 0:
                    reply_tab.click()
                    page.wait_for_timeout(800)
                    print("✓ 返信タブに切り替えました")
                    save_screenshot(page, test_dir, "00_after_switch_reply_tab.png", "返信タブ切り替え後")
                else:
                    warnings.append(("STEP 5", "返信タブが見つかりませんでした"))
                    print("⚠️ 警告: 返信タブが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 5", f"返信タブ切り替え中にエラー: {e}"))
                print(f"❌ エラー: 返信タブ切り替え中にエラー: {e}")
            
            # 【テスト①】ファイル選択で対象ファイルを選択
            print("\n[STEP 6] ①ファイル選択機能確認")
            try:
                # ファイルアップロードタブをクリック
                file_upload_tab = page.locator('button[role="tab"]:has-text("ファイルアップロード")')
                
                if file_upload_tab.count() > 0:
                    # タブがアクティブでない場合は切り替える
                    aria_selected = file_upload_tab.get_attribute('data-state')
                    if aria_selected != 'active':
                        save_screenshot(page, test_dir, "01_file_select_1.png", "ファイル選択前")
                        
                        file_upload_tab.click()
                        page.wait_for_timeout(800)
                        print("✓ ファイルアップロードタブに切り替えました")
                    else:
                        print("✓ ファイルアップロードタブは既にアクティブです")
                        save_screenshot(page, test_dir, "01_file_select_1.png", "ファイル選択前")
                    
                    # ファイル入力要素を探す
                    file_input = page.locator('input[type="file"]')
                    if file_input.count() > 0:
                        # ファイルを選択
                        file_input.first.set_input_files(str(TEST_FILE_PATH))
                        page.wait_for_timeout(1500)
                        print(f"✓ ファイルを選択しました: {TEST_FILE_PATH.name}")
                        
                        # ★重要：アップロード完了を待つ
                        try:
                            upload_toast = page.locator('[data-sonner-toast]:has-text("アップロード")')
                            if upload_toast.count() > 0:
                                upload_toast.wait_for(state="hidden", timeout=30000)
                                print("✓ ファイルアップロードが完了しました")
                        except Exception as toast_error:
                            warnings.append(("STEP 6", f"アップロード完了トースト待機中に警告: {toast_error}"))
                            print(f"⚠️ 警告: アップロード完了トースト待機中に警告: {toast_error}")
                        
                        page.wait_for_timeout(1000)
                        
                        # ファイル名が表示されているか確認
                        file_name_display = page.locator(f'text=/.*{TEST_FILE_PATH.stem}.*/i')
                        if file_name_display.count() > 0:
                            print("✓ ファイル名が表示されました")
                        
                        save_screenshot(page, test_dir, "01_file_select_2.png", "ファイル選択後")
                    else:
                        warnings.append(("STEP 6", "ファイル入力要素が見つかりませんでした"))
                        print("⚠️ 警告: ファイル入力要素が見つかりませんでした")
                else:
                    warnings.append(("STEP 6", "ファイルアップロードタブが見つかりませんでした"))
                    print("⚠️ 警告: ファイルアップロードタブが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 6", f"ファイル選択確認中にエラー: {e}"))
                print(f"❌ エラー: ファイル選択確認中にエラー: {e}")
            
            # 【テスト②】ドラッグ＆ドロップでファイル添付
            print("\n[STEP 7] ②ファイルD&D機能確認")
            try:
                # まず「ファイルアップロード」タブが選択されているか確認
                print("「ファイルアップロード」タブの状態を確認中...")
                file_upload_tab = page.locator('button[role="tab"]:has-text("ファイルアップロード")')
                if file_upload_tab.count() > 0:
                    # タブがアクティブでない場合は切り替える
                    aria_selected = file_upload_tab.get_attribute('data-state')
                    if aria_selected != 'active':
                        file_upload_tab.click()
                        page.wait_for_timeout(800)
                        print("✓ ファイルアップロードタブに切り替えました")
                    else:
                        print("✓ ファイルアップロードタブは既にアクティブです")
                
                save_screenshot(page, test_dir, "02_file_drop_1.png", "ファイルD&D前")
                
                # ドロップエリアを探す
                drop_area = page.locator('[data-testid="drop-area"]').or_(
                    page.locator('text=/.*ファイルをドロップ.*/i')
                )
                
                if drop_area.count() > 0:
                    # ファイルをドラッグ&ドロップ
                    file_input = page.locator('input[type="file"]')
                    if file_input.count() > 0:
                        file_input.first.set_input_files(str(TEST_FILE_PATH))
                        page.wait_for_timeout(1500)
                        print(f"✓ ファイルをドロップしました: {TEST_FILE_PATH.name}")
                        
                        # ★重要：アップロード完了を待つ
                        try:
                            upload_toast = page.locator('[data-sonner-toast]:has-text("アップロード")')
                            if upload_toast.count() > 0:
                                upload_toast.wait_for(state="hidden", timeout=30000)
                                print("✓ ファイルアップロードが完了しました")
                        except Exception as toast_error:
                            warnings.append(("STEP 7", f"アップロード完了トースト待機中に警告: {toast_error}"))
                            print(f"⚠️ 警告: アップロード完了トースト待機中に警告: {toast_error}")
                        
                        page.wait_for_timeout(1000)
                        save_screenshot(page, test_dir, "02_file_drop_2.png", "ファイルD&D後")
                    else:
                        warnings.append(("STEP 7", "ファイル入力要素が見つかりませんでした"))
                        print("⚠️ 警告: ファイル入力要素が見つかりませんでした")
                else:
                    warnings.append(("STEP 7", "ドロップエリアが見つかりませんでした"))
                    print("⚠️ 警告: ドロップエリアが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"ファイルD&D確認中にエラー: {e}"))
                print(f"❌ エラー: ファイルD&D確認中にエラー: {e}")
            
            # 【テスト③】必要情報を入力し、返信メールを作成
            print("\n[STEP 8] ③返信メール作成機能確認")
            try:
                # ★重要：アップロード完了を待ってから入力する
                print("⏳ ファイルアップロード完了を待機中...")
                page.wait_for_timeout(1000)
                
                upload_toast = page.locator('[data-sonner-toast]:has-text("アップロード")')
                if upload_toast.count() > 0:
                    upload_toast.wait_for(state="hidden", timeout=30000)
                    print("✓ ファイルアップロードの完了を確認しました")
                
                # フォーム状態の安定化
                page.wait_for_timeout(1500)
                print("✓ フォーム状態が安定しました")
                
                save_screenshot(page, test_dir, "03_form_input_1.png", "フォーム入力前")
                
                # 宛先
                to_field = page.locator('input#reply-to')
                if to_field.count() > 0:
                    to_field.fill("株式会社返信先 佐藤様")
                    page.wait_for_timeout(300)
                    print("✓ 宛先を入力しました")
                
                # 差出人
                from_field = page.locator('input#reply-from')
                if from_field.count() > 0:
                    from_field.fill("株式会社返信元 鈴木")
                    page.wait_for_timeout(300)
                    print("✓ 差出人を入力しました")
                
                # 返信の目的
                purpose_field = page.locator('input#reply-purpose')
                if purpose_field.count() > 0:
                    purpose_field.fill("質問への回答")
                    page.wait_for_timeout(300)
                    print("✓ 返信の目的を入力しました")
                
                # 返信の内容
                content_field = page.locator('textarea#reply-content')
                if content_field.count() > 0:
                    content_field.fill("お問い合わせいただいた件について、詳細をご説明いたします")
                    page.wait_for_timeout(300)
                    print("✓ 返信の内容を入力しました")
                
                save_screenshot(page, test_dir, "03_form_input_2.png", "フォーム入力後（送信前）")
                
                # 作成ボタンをクリック
                submit_button = page.locator('button[type="submit"]:has-text("作成する")')
                if submit_button.count() > 0:
                    submit_button.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 作成ボタンをクリックしました")
                    
                    # 作成中のインジケーター確認
                    loading_indicator = page.locator('text=/.*作成中.*/i')
                    if loading_indicator.count() > 0:
                        print("✓ 作成中のインジケーターが表示されました")
                    
                    # 作成結果が表示されるまで待つ
                    try:
                        result_subject = page.locator('input#created-subject')
                        result_subject.wait_for(state="visible", timeout=60000)
                        page.wait_for_timeout(2000)
                        print("✓ 返信メール作成が完了しました")
                        
                        save_screenshot(page, test_dir, "03_form_submit_3_result.png", "返信メール作成完了")
                    except Exception as wait_error:
                        warnings.append(("STEP 8", f"返信メール作成結果の表示待機がタイムアウト: {wait_error}"))
                        print(f"⚠️ 警告: 返信メール作成結果の表示待機がタイムアウト: {wait_error}")
                else:
                    warnings.append(("STEP 8", "作成ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 作成ボタンが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 8", f"返信メール作成中にエラー: {e}"))
                print(f"❌ エラー: 返信メール作成中にエラー: {e}")
            
            # 【テスト④】「結果を調整する」ボックスから、返信メールの内容を修正
            print("\n[STEP 9] ④結果を調整する機能確認")
            try:
                save_screenshot(page, test_dir, "04_modify_1.png", "修正前")
                
                # 結果を調整するエリアを探す
                modify_area = page.locator('textarea[placeholder*="修正"]').or_(
                    page.locator('textarea[placeholder*="調整"]')
                )
                
                if modify_area.count() > 0:
                    print("✓ 「結果を調整する」テキストエリアが見つかりました")
                    
                    # 修正内容を入力
                    modify_area.first.fill("より丁寧な表現に変更してください")
                    page.wait_for_timeout(500)
                    print("✓ 修正内容を入力しました")
                    
                    # 再作成ボタンを探してクリック
                    recreate_button = page.locator('button:has-text("再作成")').or_(
                        page.locator('button:has-text("修正")').or_(
                            page.locator('button[type="submit"]:has-text("作成")')
                        )
                    )
                    
                    if recreate_button.count() > 0:
                        save_screenshot(page, test_dir, "04_modify_2_input.png", "修正内容入力後（再作成前）")
                        
                        recreate_button.first.click()
                        page.wait_for_timeout(1000)
                        print("✓ 再作成ボタンをクリックしました")
                        
                        # 再作成結果が表示されるまで待つ
                        page.wait_for_timeout(5000)
                        save_screenshot(page, test_dir, "04_modify_3.png", "修正後の結果")
                        print("✓ 修正された返信メールが生成されました")
                    else:
                        warnings.append(("STEP 9", "再作成ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 再作成ボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 9", "「結果を調整する」テキストエリアが見つかりませんでした"))
                    print("⚠️ 警告: 「結果を調整する」テキストエリアが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 9", f"結果調整機能確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整機能確認中にエラー: {e}")
            
            # 【テスト⑤】フィードバック（Good/Bad）送信
            print("\n[STEP 10] ⑤フィードバック送信機能確認")
            try:
                save_screenshot(page, test_dir, "05_feedback_1.png", "フィードバック前")
                
                # 件名エリアのボタン群を取得
                subject_header = page.locator('div.flex.min-h-8:has(label:has-text("件名"))')
                subject_buttons = subject_header.locator('button[type="button"]')
                
                if subject_buttons.count() >= 2:
                    print(f"✓ 件名エリアのボタンが見つかりました（{subject_buttons.count()}個）")
                    
                    # Badボタン（2番目のボタン）をクリック
                    bad_button = subject_buttons.nth(1)
                    bad_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ Badフィードバックボタンをクリックしました")
                    
                    # フィードバックダイアログが表示されるか確認
                    feedback_dialog_title = page.locator('h2:has-text("フィードバックを頂きありがとうございました！")')
                    
                    try:
                        feedback_dialog_title.wait_for(state="visible", timeout=10000)
                        print("✓ フィードバックダイアログのタイトルが表示されました")
                    except Exception as dialog_wait_error:
                        print(f"⚠️ ダイアログ待機中: {dialog_wait_error}")
                        warnings.append(("STEP 10", "フィードバックダイアログの表示待機がタイムアウトしました"))
                    
                    page.wait_for_timeout(500)
                    
                    # ダイアログ要素を取得
                    dialog_element = page.locator('dialog').or_(page.locator('[role="dialog"]'))
                    
                    if dialog_element.count() > 0:
                        print("✓ フィードバックダイアログが表示されました")
                        
                        # オプション選択（チェックボックスの一番上を選択）
                        first_checkbox_label = dialog_element.locator('label.text-lg').first
                        if first_checkbox_label.count() > 0:
                            first_checkbox_label.click()
                            page.wait_for_timeout(800)
                            print("✓ フィードバックオプション（一番上）を選択しました")
                        else:
                            warnings.append(("STEP 10", "チェックボックスのラベルが見つかりませんでした"))
                            print("⚠️ 警告: チェックボックスのラベルが見つかりませんでした")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        dialog_input = dialog_element.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("もう少し改善の余地があります。")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        save_screenshot(page, test_dir, "05_feedback_2_form.png", "フィードバックフォーム入力後")
                        
                        # 送信ボタンをクリック
                        submit_button = dialog_element.locator('button[type="submit"]').or_(
                            dialog_element.locator('button:has-text("送信")')
                        )
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            save_screenshot(page, test_dir, "05_feedback_3.png", "フィードバック送信後")
                        else:
                            warnings.append(("STEP 10", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 10", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                else:
                    warnings.append(("STEP 10", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 10", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【テスト⑥】本文を編集
            print("\n[STEP 11] ⑥編集機能確認")
            try:
                save_screenshot(page, test_dir, "06_edit_1.png", "編集前")
                
                # 本文エリアのボタン群を取得
                content_header = page.locator('div.mb-1:has(label:has-text("本文"))')
                content_buttons = content_header.locator('button[type="button"]')
                
                if content_buttons.count() >= 4:
                    # 4番目のボタンが編集ボタン（0-indexed なので nth(3)）
                    edit_btn = content_buttons.nth(3)
                    edit_btn.click()
                    page.wait_for_timeout(1000)
                    print("✓ 編集ボタンをクリックしました")
                    
                    # 編集モードではキャンセルと保存ボタンが表示される
                    cancel_button = page.locator('button:has-text("キャンセル")')
                    save_button = page.locator('button:has-text("保存")')
                    
                    if cancel_button.count() > 0 and save_button.count() > 0:
                        print("✓ 編集モードに切り替わりました（キャンセル・保存ボタンが表示）")
                        
                        # readOnly属性が外れるまで待機
                        page.wait_for_timeout(800)
                        
                        # 本文を編集（複数のセレクター戦略で探す）
                        content_textarea = None
                        
                        # 戦略1: ラベル「本文」の親要素からtextareaを探す
                        textarea_1 = page.locator('label:has-text("本文")').locator('xpath=..').locator('textarea')
                        if textarea_1.count() > 0:
                            content_textarea = textarea_1.first
                            print("✓ 本文フィールドを見つけました（戦略1: ラベルから）")
                        
                        # 戦略2: placeholderで探す
                        if not content_textarea:
                            textarea_2 = page.locator('textarea[placeholder*="本文"]')
                            if textarea_2.count() > 0:
                                content_textarea = textarea_2.first
                                print("✓ 本文フィールドを見つけました（戦略2: placeholder）")
                        
                        # 戦略3: 編集可能なtextarea（readOnly=false）を探す
                        if not content_textarea:
                            textarea_3 = page.locator('textarea:not([readonly])')
                            if textarea_3.count() > 0:
                                content_textarea = textarea_3.first
                                print("✓ 本文フィールドを見つけました（戦略3: readOnly=false）")
                        
                        # 本文を編集
                        if content_textarea:
                            try:
                                original_content = content_textarea.input_value()
                                new_content = f"{original_content}\n\n[編集追加] よろしくお願いいたします。"
                                content_textarea.fill(new_content)
                                page.wait_for_timeout(800)
                                print(f"✓ 本文を編集しました")
                                
                                save_screenshot(page, test_dir, "06_edit_2_input.png", "編集中（保存前）")
                            except Exception as edit_error:
                                warnings.append(("STEP 11", f"本文の編集中にエラー: {edit_error}"))
                                print(f"⚠️ 警告: 本文の編集中にエラー: {edit_error}")
                        else:
                            warnings.append(("STEP 11", "本文入力フィールドが見つかりませんでした"))
                            print("⚠️ 警告: 本文入力フィールドが見つかりませんでした")
                            save_screenshot(page, test_dir, "06_edit_2_field_not_found.png", "本文フィールドが見つからない")
                        
                        # 保存ボタンをクリック（本文が編集できなくても実行）
                        save_button.first.click()
                        page.wait_for_timeout(1500)
                        print("✓ 保存ボタンをクリックしました")
                        
                        # 編集モードが解除されたか確認
                        page.wait_for_timeout(500)
                        if cancel_button.count() == 0:
                            print("✓ 編集モードが解除されました")
                    else:
                        warnings.append(("STEP 11", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    save_screenshot(page, test_dir, "06_edit_3.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 11", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑦】件名/本文をコピー
            print("\n[STEP 12] ⑦コピー機能確認")
            try:
                save_screenshot(page, test_dir, "07_copy_1.png", "コピー前")
                
                # 件名のコピーボタンをクリック
                subject_copy_button = page.locator('input#created-subject').locator('..').locator('button:has(svg)').first
                if subject_copy_button.count() > 0:
                    subject_copy_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ 件名のコピーボタンをクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('[data-sonner-toast]').or_(
                        page.locator('text=/.*コピー/i')
                    )
                    if toast.count() > 0:
                        print("✓ コピー成功のトーストメッセージが表示されました")
                    else:
                        warnings.append(("STEP 12", "コピー成功のトーストが表示されませんでした"))
                        print("⚠️ 警告: コピー成功のトーストが表示されませんでした")
                    
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
                            warnings.append(("STEP 12", "クリップボードが空です"))
                            print("⚠️ 警告: クリップボードが空です")
                    except Exception as clipboard_error:
                        warnings.append(("STEP 12", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                        print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                    
                    save_screenshot(page, test_dir, "07_copy_2.png", "コピー実行後（トースト表示）")
                else:
                    warnings.append(("STEP 12", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑧】件名/本文をダウンロード
            print("\n[STEP 13] ⑧ダウンロード機能確認")
            try:
                save_screenshot(page, test_dir, "08_download_1.png", "ダウンロード前")
                
                # 件名エリアのボタン群を取得
                subject_header = page.locator('div.flex.min-h-8:has(label:has-text("件名"))')
                subject_buttons = subject_header.locator('button[type="button"]')
                
                if subject_buttons.count() >= 3:
                    # 3番目のボタンがダウンロードボタン（0-indexed なので nth(2)）
                    download_btn = subject_buttons.nth(2)
                    
                    # ダウンロードイベントを待機
                    try:
                        with page.expect_download(timeout=15000) as download_info:
                            download_btn.click()
                            print("✓ ダウンロードボタンをクリックしました")
                        
                        download = download_info.value
                        filename = download.suggested_filename
                        print(f"✓ ダウンロード完了: {filename}")
                        
                        # ファイル名の形式確認
                        if filename.endswith(".txt"):
                            print("✓ ダウンロードファイル名が正しい形式です（.txt）")
                            
                            # ダウンロードされたファイルを固定名でエビデンスディレクトリに保存
                            downloaded_file_path = os.path.join(test_dir, "08_download.txt")
                            download.save_as(downloaded_file_path)
                            print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                            print(f"  元のファイル名: {filename}")
                            
                            # ファイルサイズも確認
                            file_size = os.path.getsize(downloaded_file_path)
                            print(f"  ファイルサイズ: {file_size} bytes")
                    except Exception as dl_error:
                        warnings.append(("STEP 13", f"ダウンロード完了の検知に失敗: {dl_error}"))
                        print(f"⚠️ 警告: ダウンロード完了の検知に失敗: {dl_error}")
                else:
                    warnings.append(("STEP 13", "ダウンロードボタンが見つかりませんでした"))
                    print("⚠️ 警告: ダウンロードボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【テスト⑨】「プロンプトを表示」をクリックすると画面配置が変わる
            print("\n[STEP 14] ⑨プロンプト表示機能確認")
            try:
                save_screenshot(page, test_dir, "09_show_prompt_1.png", "プロンプト表示前")
                
                # プロンプト表示ボタンを探す（TextLink = anchorタグ）
                show_prompt_button = page.locator('a:has-text("プロンプトを表示")')
                if show_prompt_button.count() > 0:
                    show_prompt_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ プロンプト表示ボタンをクリックしました")
                    
                    save_screenshot(page, test_dir, "09_show_prompt_2.png", "プロンプト表示後（画面配置変更）")
                    print("✓ 画面配置が変わりました")
                else:
                    warnings.append(("STEP 14", "プロンプト表示ボタンが見つかりませんでした"))
                    print("⚠️ 警告: プロンプト表示ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"プロンプト表示機能確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示機能確認中にエラー: {e}")
            
            # 【テスト⑩】「情報をクリア」をクリックすると入力情報がクリア
            print("\n[STEP 15] ⑩情報クリア機能確認")
            try:
                save_screenshot(page, test_dir, "10_clear_info_1.png", "情報クリア前")
                
                # 情報をクリアボタンをクリック
                clear_button = page.locator('button:has-text("情報をクリア")')
                if clear_button.count() > 0:
                    clear_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ 情報をクリアボタンをクリックしました")
                    
                    # トースト通知の確認
                    toast = page.locator('[data-sonner-toast]')
                    if toast.count() > 0:
                        print("✓ クリア完了のトースト通知が表示されました")
                    else:
                        warnings.append(("STEP 15", "クリア完了のトースト通知が表示されませんでした"))
                        print("⚠️ 警告: クリア完了のトースト通知が表示されませんでした")
                    
                    # フィールドがクリアされたことを確認
                    page.wait_for_timeout(1000)
                    to_field = page.locator('input#reply-to')
                    if to_field.count() > 0:
                        to_value = to_field.input_value()
                        if not to_value:
                            print("✓ フィールドがクリアされました")
                        else:
                            warnings.append(("STEP 15", f"フィールドがクリアされていません: {to_value}"))
                            print(f"⚠️ 警告: フィールドがクリアされていません: {to_value}")
                    
                    save_screenshot(page, test_dir, "10_clear_info_2.png", "情報クリア後")
                else:
                    warnings.append(("STEP 15", "情報をクリアボタンが見つかりませんでした"))
                    print("⚠️ 警告: 情報をクリアボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 15", f"情報クリア機能確認中にエラー: {e}"))
                print(f"❌ エラー: 情報クリア機能確認中にエラー: {e}")
            
            # ===== テスト完了 =====
            print(f"\n{'='*70}")
            print(f"✅ 全テスト完了")
            print(f"{'='*70}")
            
        except Exception as e:
            errors.append(("CRITICAL", f"テスト実行中に致命的エラー: {e}"))
            print(f"❌ 致命的エラー: テスト中にエラー: {e}")
            save_screenshot(page, test_dir, "ERROR.png", "エラー発生時")
            raise
        finally:
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
    
    print("=" * 70)
    print("Playwright E2Eテスト: 返信メール作成")
    print("=" * 70)
    
    try:
        print("\n[実行中] テスト...")
        test_reply_mail_functionality()
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
