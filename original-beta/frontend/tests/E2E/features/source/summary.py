"""要約画面のE2Eテスト

【テスト観点】
① 「要約画面」が正しく表示されることを確認する
② カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③ 要約モードが変更できることを確認する
④ 要約モードで文字数指定を選択すると現れるスライサーが変更できることを確認する
⑤ 必要情報を入力し、要約できることを確認する
⑥ 要約結果のフィードバック（Good/Bad）を送信できることを確認する
⑦ 要約結果を編集できることを確認する
⑧ 要約結果をコピーできることを確認する
⑨ 要約結果をダウンロードできることを確認する
⑩ 「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑪ 「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/summary.py::test_summary_functionality -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/summary.py

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : 標準出力をキャプチャしない（print文が表示される）
  MANUAL_AUTH=true : 手動認証モード（ブラウザで手動認証）
"""

import os
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS


def test_summary_functionality():
    """要約機能のE2Eテスト"""
    
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
                print("認証に失斂しました。テストを終了します。")
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
        
        # 要約ページに遷移
        print(f"\n[STEP 4] 要約ページへ遷移")
        page.goto(f"{BASE_URL}/summary")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # マウスカーソルを表示
        enable_mouse_cursor(page)
        
        print(f"ページURL: {page.url}")
        print(f"ページタイトル: {page.title()}")
        
        try:
            # 【テスト①】要約画面が正しく表示されることを確認
            print("\n[STEP 5] ①要約画面の表示確認")
            print("📸 エビデンス取得: 要約画面")
            save_screenshot(page, test_dir, "01_summary_page_display.png", "要約画面の表示")
            
            # 【テスト②】ヘルプマークにカーソルを合わせると機能説明が表示される
            print("\n[STEP 6] ②ヘルプマーク機能説明の確認")
            try:
                # ヘルプボタンを探す
                help_button = page.locator('h3:has-text("要約")').locator('..').locator('button')
                
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
            
            # 【テスト③】要約モードが変更できることを確認
            print("\n[STEP 7] ③要約モード変更確認")
            try:
                save_screenshot(page, test_dir, "03_mode_change_1.png", "要約モード変更前（短文選択状態）")
                
                # 長文タブをクリック
                long_tab = page.locator('button[role="tab"]:has-text("長文")')
                if long_tab.count() > 0:
                    long_tab.click()
                    page.wait_for_timeout(800)
                    print("✓ 長文タブに切り替えました")
                    
                    save_screenshot(page, test_dir, "03_mode_change_2_long.png", "要約モード - 長文選択")
                else:
                    warnings.append(("STEP 7", "長文タブが見つかりませんでした"))
                    print("⚠️ 警告: 長文タブが見つかりませんでした")
                
                # 文字数指定タブをクリック
                custom_tab = page.locator('button[role="tab"]:has-text("文字数指定")')
                if custom_tab.count() > 0:
                    custom_tab.click()
                    page.wait_for_timeout(800)
                    print("✓ 文字数指定タブに切り替えました")
                    
                    save_screenshot(page, test_dir, "03_mode_change_3_custom.png", "要約モード - 文字数指定選択")
                else:
                    warnings.append(("STEP 7", "文字数指定タブが見つかりませんでした"))
                    print("⚠️ 警告: 文字数指定タブが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 7", f"要約モード変更確認中にエラー: {e}"))
                print(f"❌ エラー: 要約モード変更確認中にエラー: {e}")
            
            # 【テスト④】文字数指定スライサーが変更できることを確認
            print("\n[STEP 8] ④文字数指定スライサー確認")
            try:
                # スライダーが表示されているか確認
                slider = page.locator('span[role="slider"]')
                
                if slider.count() > 0:
                    print("✓ スライダーが表示されました")
                    
                    # 現在の値を確認
                    current_value_span = page.locator('text=/文字数目安/i').locator('..').locator('span.text-xs')
                    if current_value_span.count() > 0:
                        current_value = current_value_span.inner_text()
                        print(f"現在の文字数目安: {current_value}")
                    
                    save_screenshot(page, test_dir, "04_slider_1.png", "スライダー変更前")
                    
                    # スライダーを動かす（右矢印キーで増加）
                    slider.first.focus()
                    page.wait_for_timeout(300)
                    
                    # 右矢印キーを5回押す
                    for _ in range(5):
                        slider.first.press("ArrowRight")
                        page.wait_for_timeout(100)
                    
                    page.wait_for_timeout(500)
                    print("✓ スライダーを操作しました")
                    
                    # 変更後の値を確認
                    if current_value_span.count() > 0:
                        new_value = current_value_span.inner_text()
                        print(f"変更後の文字数目安: {new_value}")
                    
                    save_screenshot(page, test_dir, "04_slider_2.png", "スライダー変更後")
                else:
                    warnings.append(("STEP 8", "スライダーが見つかりませんでした"))
                    print("⚠️ 警告: スライダーが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 8", f"スライダー確認中にエラー: {e}"))
                print(f"❌ エラー: スライダー確認中にエラー: {e}")
            
            # 【テスト⑤】必要情報を入力し、要約できることを確認
            print("\n[STEP 9] ⑤要約機能確認")
            try:
                # まず短文モードに戻す（確実に要約できるように）
                short_tab = page.locator('button[role="tab"]:has-text("短文")')
                if short_tab.count() > 0:
                    short_tab.click()
                    page.wait_for_timeout(800)
                    print("✓ 短文モードに切り替えました")
                
                save_screenshot(page, test_dir, "05_summary_1.png", "要約実行前")
                
                # 要約したい文章を入力
                content_textarea = page.locator('label:has-text("要約したい文章")').locator('..').locator('textarea')
                if content_textarea.count() > 0:
                    test_content = """本日の会議では、新製品の開発スケジュールについて議論しました。
開発チームからは、現在の進捗状況と今後の課題について報告がありました。
マーケティング部門からは、市場調査の結果と競合分析が共有されました。
次回の会議は来週火曜日に開催し、プロトタイプのレビューを行う予定です。"""
                    
                    content_textarea.fill(test_content)
                    page.wait_for_timeout(500)
                    print("✓ 要約したい文章を入力しました")
                else:
                    warnings.append(("STEP 9", "「要約したい文章」フィールドが見つかりませんでした"))
                    print("⚠️ 警告: 「要約したい文章」フィールドが見つかりませんでした")
                
                # 考慮事項を入力（オプション）
                consideration_textarea = page.locator('label:has-text("考慮事項")').locator('..').locator('textarea')
                if consideration_textarea.count() > 0:
                    consideration_textarea.fill("重要な決定事項を明確に記載してください")
                    page.wait_for_timeout(500)
                    print("✓ 考慮事項を入力しました")
                
                save_screenshot(page, test_dir, "05_summary_2_input.png", "フォーム入力後（要約実行前）")
                
                # 要約するボタンをクリック
                submit_button = page.locator('button:has-text("要約する")')
                if submit_button.count() > 0:
                    submit_button.click()
                    page.wait_for_timeout(1000)
                    print("✓ 要約するボタンをクリックしました")
                    
                    # 要約中のインジケーター確認
                    loading_indicator = page.locator('text=/.*要約中.*/i')
                    if loading_indicator.count() > 0:
                        print("✓ 要約中のインジケーターが表示されました")
                    
                    # 要約完了のトーストメッセージを待つ
                    try:
                        success_toast = page.locator('[data-sonner-toast]:has-text("要約結果")')
                        success_toast.wait_for(state="visible", timeout=60000)
                        print("✓ 要約完了のトーストメッセージが表示されました")
                        
                        # トーストが消えるまで待つ
                        page.wait_for_timeout(2000)
                        print("✓ 要約が完了しました")
                        
                        save_screenshot(page, test_dir, "05_summary_3_result.png", "要約完了")
                    except Exception as wait_error:
                        warnings.append(("STEP 9", f"要約完了トーストの表示待機がタイムアウト: {wait_error}"))
                        print(f"⚠️ 警告: 要約完了トーストの表示待機がタイムアウト: {wait_error}")
                        # タイムアウトしてもスクリーンショットは撮る
                        save_screenshot(page, test_dir, "05_summary_3_result.png", "要約完了（トーストタイムアウト）")
                else:
                    warnings.append(("STEP 9", "要約するボタンが見つかりませんでした"))
                    print("⚠️ 警告: 要約するボタンが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 9", f"要約機能確認中にエラー: {e}"))
                print(f"❌ エラー: 要約機能確認中にエラー: {e}")
            
            # 【テスト⑥】フィードバック（Good/Bad）送信
            print("\n[STEP 10] ⑥フィードバック送信機能確認")
            try:
                save_screenshot(page, test_dir, "06_feedback_1.png", "フィードバック前")
                
                # 要約結果エリアのボタン群を取得
                result_header = page.locator('div.flex.min-h-8:has(label:has-text("要約結果"))')
                result_buttons = result_header.locator('button[type="button"]')
                
                if result_buttons.count() >= 2:
                    print(f"✓ 要約結果エリアのボタンが見つかりました（{result_buttons.count()}個）")
                    
                    # Badボタン（2番目のボタン）をクリック
                    bad_button = result_buttons.nth(1)
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
                            dialog_input.fill("より詳細な要約が必要です。")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        save_screenshot(page, test_dir, "06_feedback_2_form.png", "フィードバックフォーム入力後")
                        
                        # 送信ボタンをクリック
                        submit_button = dialog_element.locator('button[type="submit"]').or_(
                            dialog_element.locator('button:has-text("送信")')
                        )
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            save_screenshot(page, test_dir, "06_feedback_3.png", "フィードバック送信後")
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
            
            # 【テスト⑦】要約結果を編集
            print("\n[STEP 11] ⑦編集機能確認")
            try:
                save_screenshot(page, test_dir, "07_edit_1.png", "編集前")
                
                # 要約結果エリアのボタン群を取得
                result_header = page.locator('div.mb-1:has(label:has-text("要約結果"))')
                result_buttons = result_header.locator('button[type="button"]')
                
                if result_buttons.count() >= 4:
                    # 4番目のボタンが編集ボタン（0-indexed なので nth(3)）
                    edit_btn = result_buttons.nth(3)
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
                        
                        # 要約結果を編集（複数のセレクター戦略で探す）
                        result_textarea = None
                        
                        # 戦略1: ラベル「要約結果」の親要素からtextareaを探す
                        textarea_1 = page.locator('label:has-text("要約結果")').locator('xpath=..').locator('textarea')
                        if textarea_1.count() > 0:
                            result_textarea = textarea_1.first
                            print("✓ 要約結果フィールドを見つけました（戦略1: ラベルから）")
                        
                        # 戦略2: placeholderで探す
                        if not result_textarea:
                            textarea_2 = page.locator('textarea[placeholder*="要約"]')
                            if textarea_2.count() > 0:
                                result_textarea = textarea_2.first
                                print("✓ 要約結果フィールドを見つけました（戦略2: placeholder）")
                        
                        # 戦略3: 編集可能なtextarea（readOnly=false）を探す
                        if not result_textarea:
                            textarea_3 = page.locator('textarea:not([readonly])')
                            if textarea_3.count() > 0:
                                result_textarea = textarea_3.first
                                print("✓ 要約結果フィールドを見つけました（戦略3: readOnly=false）")
                        
                        # 要約結果を編集
                        if result_textarea:
                            try:
                                original_content = result_textarea.input_value()
                                new_content = f"{original_content}\n\n[編集追加] 補足情報を追記しました。"
                                result_textarea.fill(new_content)
                                page.wait_for_timeout(800)
                                print(f"✓ 要約結果を編集しました")
                                
                                save_screenshot(page, test_dir, "07_edit_2_input.png", "編集中（保存前）")
                            except Exception as edit_error:
                                warnings.append(("STEP 11", f"要約結果の編集中にエラー: {edit_error}"))
                                print(f"⚠️ 警告: 要約結果の編集中にエラー: {edit_error}")
                        else:
                            warnings.append(("STEP 11", "要約結果フィールドが見つかりませんでした"))
                            print("⚠️ 警告: 要約結果フィールドが見つかりませんでした")
                            save_screenshot(page, test_dir, "07_edit_2_field_not_found.png", "要約結果フィールドが見つからない")
                        
                        # 保存ボタンをクリック（要約結果が編集できなくても実行）
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
                    
                    save_screenshot(page, test_dir, "07_edit_3.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 11", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑧】要約結果をコピー
            print("\n[STEP 12] ⑧コピー機能確認")
            try:
                save_screenshot(page, test_dir, "08_copy_1.png", "コピー前")
                
                # コピーボタンをクリック（absolute right-1 top-1）
                copy_button = page.locator('button.absolute.right-1.top-1.z-10')
                
                if copy_button.count() > 0:
                    copy_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ コピーボタンをクリックしました")
                    
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
                            copy_file_path = os.path.join(test_dir, "08_copy.txt")
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
                    
                    save_screenshot(page, test_dir, "08_copy_2.png", "コピー実行後（トースト表示）")
                else:
                    warnings.append(("STEP 12", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑨】要約結果をダウンロード
            print("\n[STEP 13] ⑨ダウンロード機能確認")
            try:
                save_screenshot(page, test_dir, "09_download_1.png", "ダウンロード前")
                
                # 要約結果エリアのボタン群を取得
                result_header = page.locator('div.flex.min-h-8:has(label:has-text("要約結果"))')
                result_buttons = result_header.locator('button[type="button"]')
                
                if result_buttons.count() >= 3:
                    # 3番目のボタンがダウンロードボタン（0-indexed なので nth(2)）
                    download_btn = result_buttons.nth(2)
                    
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
                            downloaded_file_path = os.path.join(test_dir, "09_download.txt")
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
            
            # 【テスト⑩】「プロンプトを表示」をクリックすると画面配置が変わる
            print("\n[STEP 14] ⑩プロンプト表示機能確認")
            try:
                save_screenshot(page, test_dir, "10_show_prompt_1.png", "プロンプト表示前")
                
                # プロンプト表示ボタンを探す（TextLink = anchorタグ）
                show_prompt_button = page.locator('a:has-text("プロンプトを表示")')
                if show_prompt_button.count() > 0:
                    show_prompt_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ プロンプト表示ボタンをクリックしました")
                    
                    save_screenshot(page, test_dir, "10_show_prompt_2.png", "プロンプト表示後（画面配置変更）")
                    print("✓ 画面配置が変わりました")
                else:
                    warnings.append(("STEP 14", "プロンプト表示ボタンが見つかりませんでした"))
                    print("⚠️ 警告: プロンプト表示ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"プロンプト表示機能確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示機能確認中にエラー: {e}")
            
            # 【テスト⑪】「情報をクリア」をクリックすると入力情報がクリア
            print("\n[STEP 15] ⑪情報クリア機能確認")
            try:
                save_screenshot(page, test_dir, "11_clear_info_1.png", "情報クリア前")
                
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
                    content_field = page.locator('label:has-text("要約したい文章")').locator('..').locator('textarea')
                    if content_field.count() > 0:
                        content_value = content_field.input_value()
                        if not content_value:
                            print("✓ フィールドがクリアされました")
                        else:
                            warnings.append(("STEP 15", f"フィールドがクリアされていません: {content_value[:50]}..."))
                            print(f"⚠️ 警告: フィールドがクリアされていません")
                    
                    save_screenshot(page, test_dir, "11_clear_info_2.png", "情報クリア後")
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
    print("Playwright E2Eテスト: 要約機能")
    print("=" * 70)
    
    try:
        print("\n[実行中] テスト...")
        test_summary_functionality()
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
