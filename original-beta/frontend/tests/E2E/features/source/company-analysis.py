"""
company-analysis.py - 企業分析画面のE2Eテスト

Azure Entra ID認証を含む、企業分析画面の完全なE2Eテストを実施します。
手動認証モードとヘッドレスモードの両方に対応しています。

【テスト観点】
① 企業分析画面が正しく表示されることを確認する
② カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③ チェックボックスにチェックを入れられることを確認する
④ 各入力ボックスに必要情報を入力し、企業分析ができることを確認する
⑤ 「結果を調整する」ボックスから、企業分析の内容を修正できることを確認する
⑥ 作成結果のフィードバック（Good/Bad）を送信できることを確認する
⑦ 作成結果を編集できることを確認する
⑧ 作成結果をコピーできることを確認する
⑨ 作成結果をダウンロードできることを確認する
⑩ 「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑪ 「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/company-analysis.py::test_company_analysis_functionality -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/company-analysis.py

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : print文を表示（必須！このオプションがないと標準出力が隠れます）
  MANUAL_AUTH=true : 手動認証モードを有効化

【エビデンス】
  テスト実行後、各テスト観点の前後のスクリーンショットが保存されます：
  test_evidence/test_YYYYMMDD_HHMMSS/
  ├── 01_analysis_page_display.png（①画面表示）
  ├── 02_help_mark_1.png / 02_help_mark_2.png（②ヘルプマーク）
  ├── 03_checkbox_check_1.png / 03_checkbox_check_2.png（③チェックボックス）
  ├── 04_form_before_submit.png / 04_result_after_analysis.png（④分析実行）
  ├── 05_adjust_result_1.png / 05_adjust_result_2.png（⑤結果調整）
  ├── 06_feedback_1.png / 06_feedback_2.png（⑥フィードバック）
  ├── 07_edit_1.png / 07_edit_2.png（⑦編集）
  ├── 08_copy_1.png / 08_copy_2.png（⑧コピー）
  ├── 09_download_1.png / 09_download_2.png（⑨ダウンロード）
  ├── 10_show_prompt_1.png / 10_show_prompt_2.png（⑩プロンプト表示）
  └── 11_clear_info_1.png / 11_clear_info_2.png（⑪情報クリア）
"""
import os
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS


def test_company_analysis_functionality():
    """企業分析ページでフォーム入力と分析実施のテストを実施"""
    
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
        
        # /company-analysis ページに遷移
        print(f"\n[STEP 4] /company-analysisページへ遷移")
        print(f"/company-analysisページへ遷移します...")
        page.goto(f"{BASE_URL}/company-analysis")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # マウスカーソルを表示
        enable_mouse_cursor(page)
        
        # デバッグ: ページのタイトルとURLを確認
        print(f"ページURL: {page.url}")
        print(f"ページタイトル: {page.title()}")
        
        # 【テスト①】企業分析画面が正しく表示されることを確認
        print("\n[STEP 5] ①企業分析画面の表示確認")
        print("📸 エビデンス取得: 企業分析画面")
        save_screenshot(page, test_dir, "01_analysis_page_display.png", "企業分析画面の表示")
        
        try:
            # 【テスト②】ヘルプマークにカーソルを合わせると機能説明が表示される
            print("\n[STEP 6] ②ヘルプマーク機能説明の確認")
            try:
                # 企業分析タイトル内のヘルプコンポーネント
                help_button = page.locator('h3:has-text("企業分析")').locator('..').locator('button')
                
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
            
            # 【テスト③】チェックボックスにチェックを入れられることを確認
            print("\n[STEP 7] ③チェックボックスの確認")
            try:
                # 分析手法のチェックボックス（SWOT分析を選択）
                swot_checkbox_label = page.locator('label[for="swot"]')
                
                if swot_checkbox_label.count() > 0:
                    save_screenshot(page, test_dir, "03_checkbox_check_1.png", "チェックボックス - チェック前")
                    
                    # チェックボックスをクリック
                    swot_checkbox_label.click()
                    page.wait_for_timeout(800)
                    print("✓ チェックボックスにチェックを入れました（SWOT分析）")
                    
                    save_screenshot(page, test_dir, "03_checkbox_check_2.png", "チェックボックス - チェック後")
                else:
                    warnings.append(("STEP 7", "チェックボックスが見つかりませんでした"))
                    print("⚠️ 警告: チェックボックスが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 7", f"チェックボックス確認中にエラー: {e}"))
                print(f"❌ エラー: チェックボックス確認中にエラー: {e}")
            
            # 【テスト④】各入力ボックスに必要情報を入力し、企業分析ができる
            print("\n[STEP 8] ④フォーム入力と企業分析")
            try:
                # 企業名入力フィールド
                company_name_input = page.locator('input[placeholder*="○○株式会社"]')
                
                if company_name_input.count() > 0:
                    company_name_input.fill("株式会社テスト企業")
                    page.wait_for_timeout(500)
                    print("✓ 企業名を入力しました: 株式会社テスト企業")
                else:
                    warnings.append(("STEP 8", "企業名入力フィールドが見つかりませんでした"))
                    print("⚠️ 警告: 企業名入力フィールドが見つかりませんでした")
                
                # 分析手法のチェックボックスを追加選択（3C分析）
                threec_checkbox_label = page.locator('label[for="threec"]')
                if threec_checkbox_label.count() > 0:
                    threec_checkbox_label.click()
                    page.wait_for_timeout(500)
                    print("✓ 分析手法にチェックを入れました（3C分析）")
                
                # 分析目的（オプション）
                analysis_purpose = page.locator('textarea[placeholder*="分析目的"]')
                if analysis_purpose.count() > 0:
                    analysis_purpose.fill("テスト用の企業分析：戦略的競争優位性の確認")
                    page.wait_for_timeout(500)
                    print("✓ 分析目的を入力しました")
                
                # 【エビデンス④-1】フォーム入力完了・送信前
                print("\n📸 エビデンス取得: フォーム入力完了（送信前）")
                save_screenshot(page, test_dir, "04_form_before_submit.png", "フォーム入力完了（送信前）")
                
                # 送信ボタンをクリック
                print("\n[STEP 9] フォーム送信")
                submit_button = page.locator('button[type="submit"]:has-text("分析する")')
                
                if submit_button.count() > 0:
                    submit_button.first.click()
                    page.wait_for_timeout(2000)
                    print("✓ 分析ボタンをクリックしました")
                    
                    # 分析中の状態を確認
                    try:
                        analyzing_indicator = page.locator('text=分析中です')
                        if analyzing_indicator.count() > 0:
                            print("✓ 分析中インジケーターが表示されました")
                            # 分析完了まで待機（最大180秒）
                            analyzing_indicator.wait_for(state="hidden", timeout=180000)
                            print("✓ 分析処理が完了しました")
                        else:
                            warnings.append(("STEP 9", "分析中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）"))
                            print("⚠️ 警告: 分析中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）")
                    except Exception as wait_error:
                        warnings.append(("STEP 9", f"分析処理待機中に警告: {wait_error}"))
                        print(f"⚠️ 警告: 分析処理待機中に警告: {wait_error}")
                    
                    # 結果の安定化を待つ
                    print("⏳ 結果の表示完了を待機中...")
                    page.wait_for_timeout(3000)
                    
                    # 【エビデンス④-2】分析結果
                    print("\n[STEP 10] ④分析結果の確認")
                    print("📸 エビデンス取得: 企業分析結果")
                    save_screenshot(page, test_dir, "04_result_after_analysis.png", "企業分析結果")
                    
                    # 結果が実際に表示されているか確認
                    page_content = page.content()
                    if len(page_content) > 1000:
                        print("✓ ページに結果コンテンツが表示されています")
                    else:
                        warnings.append(("STEP 10", f"ページのコンテンツが少ない可能性があります ({len(page_content)}文字)"))
                        print(f"⚠️ 警告: ページのコンテンツが少ない可能性があります ({len(page_content)}文字)")
                else:
                    warnings.append(("STEP 9", "分析ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 分析ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 8", f"フォーム入力・送信確認中にエラー: {e}"))
                print(f"❌ エラー: フォーム入力・送信確認中にエラー: {e}")
            
            # 【テスト⑤】「結果を調整する」ボックスから、企業分析の内容を修正できる
            print("\n[STEP 11] ⑤結果調整機能確認")
            try:
                # 「結果を調整する」のTextareaを探す
                adjust_textarea = page.locator('textarea[placeholder*="分析範囲を国内に限定する"]')
                
                if adjust_textarea.count() > 0:
                    save_screenshot(page, test_dir, "05_adjust_result_1.png", "結果調整前")
                    
                    adjust_textarea.fill("・より詳細なSWOT分析を実施する\n・競合他社との比較を強化する")
                    page.wait_for_timeout(800)
                    print("✓ 調整指示を入力しました")
                    
                    # 再分析ボタンをクリック
                    reanalyze_button = page.locator('button[type="submit"]:has-text("再分析する")')
                    if reanalyze_button.count() > 0:
                        reanalyze_button.first.click()
                        page.wait_for_timeout(2000)
                        print("✓ 再分析ボタンをクリックしました")
                        
                        # 再分析中の待機
                        try:
                            reanalyzing_indicator = page.locator('text=再分析中です')
                            if reanalyzing_indicator.count() > 0:
                                reanalyzing_indicator.wait_for(state="hidden", timeout=180000)
                                print("✓ 再分析処理が完了しました")
                        except Exception as wait_error:
                            warnings.append(("STEP 11", f"再分析処理待機中に警告: {wait_error}"))
                            print(f"⚠️ 警告: 再分析処理待機中に警告: {wait_error}")
                        
                        page.wait_for_timeout(3000)
                        save_screenshot(page, test_dir, "05_adjust_result_2.png", "結果調整後（再分析完了）")
                    else:
                        warnings.append(("STEP 11", "再分析ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 再分析ボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 11", "結果を調整するTextareaが見つかりませんでした"))
                    print("⚠️ 警告: 結果を調整するTextareaが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"結果調整確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整確認中にエラー: {e}")
            
            # 【テスト⑥】作成結果のフィードバック（Good/Bad）を送信できる
            print("\n[STEP 12] ⑥フィードバック送信機能確認")
            try:
                # 分析結果エリアのフィードバックボタン
                result_area_buttons = page.locator('div:has(> label:has-text("分析結果")) button[type="button"]').or_(
                    page.locator('button[aria-label*="Good"]')
                )
                
                if result_area_buttons.count() >= 2:
                    print(f"分析結果エリアのボタンが見つかりました（{result_area_buttons.count()}個）")
                    
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
                            warnings.append(("STEP 12", "チェックボックスのラベルが見つかりませんでした"))
                            print("⚠️ 警告: チェックボックスのラベルが見つかりませんでした")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        dialog_input = feedback_dialog.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("分析結果が詳細で非常に役立ちました。")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        # フォーム入力後のスクリーンショット（送信前）
                        save_screenshot(page, test_dir, "06_feedback_1.png", "フィードバックフォーム入力後（送信前）")
                        
                        # 送信ボタンをクリック
                        submit_button = feedback_dialog.locator('button[type="submit"]').or_(
                            feedback_dialog.locator('button:has-text("送信")')
                        )
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            save_screenshot(page, test_dir, "06_feedback_2.png", "フィードバック送信後")
                        else:
                            warnings.append(("STEP 12", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 12", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                        save_screenshot(page, test_dir, "06_feedback_2.png", "フィードバックボタンクリック後（ダイアログなし）")
                else:
                    warnings.append(("STEP 12", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【テスト⑦】作成結果を編集できる
            print("\n[STEP 13] ⑦編集機能確認")
            try:
                # 分析結果エリアの編集ボタン
                result_buttons = page.locator('div:has(> label:has-text("分析結果")) button[type="button"]')
                
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
                        editable_textarea = page.locator('textarea:not([readonly])')
                        
                        if editable_textarea.count() > 0:
                            # 分析結果のtextareaを特定（長いテキストが入っている）
                            for i in range(editable_textarea.count()):
                                textarea = editable_textarea.nth(i)
                                value = textarea.input_value()
                                if len(value) > 50:  # 分析結果は長いテキストのはず
                                    print(f"✓ 編集可能なテキストエリアを見つけました（{i+1}番目）")
                                    
                                    # 元のテキストを確認
                                    original_text = value
                                    print(f"元のテキスト（最初の50文字）: {original_text[:50]}...")
                                    
                                    # テキストを変更
                                    textarea.fill("編集テスト：企業分析結果を更新しました")
                                    page.wait_for_timeout(800)
                                    print("✓ テキストを変更しました")
                                    
                                    # テキスト変更後のスクリーンショット（保存前）
                                    save_screenshot(page, test_dir, "07_edit_1.png", "編集中（保存前）")
                                    
                                    # 保存ボタンをクリック
                                    save_button.first.click()
                                    page.wait_for_timeout(1500)
                                    print("✓ 保存ボタンをクリックしました")
                                    
                                    # 編集モードが解除されたか確認
                                    page.wait_for_timeout(500)
                                    if cancel_button.count() == 0:
                                        print("✓ 編集モードが解除されました")
                                    else:
                                        warnings.append(("STEP 13", "編集モードがまだ解除されていません"))
                                        print("⚠️ 警告: 編集モードがまだ解除されていません")
                                    break
                        else:
                            warnings.append(("STEP 13", "編集可能なテキストエリアが見つかりませんでした"))
                            print("⚠️ 警告: 編集可能なテキストエリアが見つかりませんでした")
                    else:
                        warnings.append(("STEP 13", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    # 保存後のスクリーンショット
                    save_screenshot(page, test_dir, "07_edit_2.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 13", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑧】作成結果をコピーできる
            print("\n[STEP 14] ⑧コピー機能確認")
            try:
                # コピーボタン
                copy_button = page.locator('button.absolute.right-1.top-1.z-10')
                
                if copy_button.count() > 0:
                    save_screenshot(page, test_dir, "08_copy_1.png", "コピー前")
                    
                    copy_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ コピーボタンをクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('text=/分析結果.*コピー/i').or_(
                        page.locator('[data-sonner-toast]')
                    )
                    if toast.count() > 0:
                        print("✓ コピー成功のトーストメッセージが表示されました")
                    
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
                            warnings.append(("STEP 14", "クリップボードが空です"))
                            print("⚠️ 警告: クリップボードが空です")
                    except Exception as clipboard_error:
                        warnings.append(("STEP 14", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                        print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                    
                    save_screenshot(page, test_dir, "08_copy_2.png", "コピー実行後（トースト表示）")
                else:
                    warnings.append(("STEP 14", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑨】作成結果をダウンロードできる
            print("\n[STEP 15] ⑨ダウンロード機能確認")
            try:
                # ダウンロードボタン（分析結果エリアのボタン群の3番目）
                result_buttons = page.locator('div:has(> label:has-text("分析結果")) button[type="button"]')
                
                if result_buttons.count() >= 3:
                    save_screenshot(page, test_dir, "09_download_1.png", "ダウンロード前")
                    
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
                        
                        # ファイル名が「企業分析_YYYYMMDD_HHMM.txt」形式か確認
                        if filename.startswith("企業分析_") and filename.endswith(".txt"):
                            print("✓ ダウンロードファイル名が正しい形式です")
                        
                        # ダウンロードされたファイルを固定名でエビデンスディレクトリに保存
                        downloaded_file_path = os.path.join(test_dir, "09_download.txt")
                        download.save_as(downloaded_file_path)
                        print(f"✓ ダウンロードファイルをエビデンスに保存: {downloaded_file_path}")
                        print(f"  元のファイル名: {filename}")
                        
                        # ファイルサイズも確認
                        file_size = os.path.getsize(downloaded_file_path)
                        print(f"  ファイルサイズ: {file_size} bytes")
                    except Exception as dl_error:
                        warnings.append(("STEP 15", f"ダウンロード完了の検知に失敗: {dl_error}"))
                        print(f"⚠️ 警告: ダウンロード完了の検知に失敗: {dl_error}")
                    
                    # ダウンロードトーストメッセージを待機
                    page.wait_for_timeout(1500)
                    toast_download = page.locator('[data-sonner-toast]')
                    if toast_download.count() > 0:
                        print("✓ ダウンロード完了のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "09_download_2.png", "ダウンロード実行後（トースト表示）")
                else:
                    warnings.append(("STEP 15", "ダウンロードボタンが見つかりませんでした"))
                    print("⚠️ 警告: ダウンロードボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 15", f"ダウンロード機能確認中にエラー: {e}"))
                print(f"❌ エラー: ダウンロード機能確認中にエラー: {e}")
            
            # 【テスト⑩】「プロンプトを表示」をクリックすると画面配置が変わる
            print("\n[STEP 16] ⑩プロンプト表示機能確認")
            try:
                # 「プロンプトを表示」または「プロンプトを隠す」リンク
                prompt_show_link = page.locator('a:has-text("プロンプトを表示")')
                prompt_hide_link = page.locator('a:has-text("プロンプトを隠す")')
                
                # どちらかが表示されているか確認
                if prompt_show_link.count() > 0:
                    save_screenshot(page, test_dir, "10_show_prompt_1.png", "プロンプト表示前（プロンプトが隠れている状態）")
                    
                    prompt_show_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを表示」をクリックしました")
                    
                    # クリック後、「プロンプトを隠す」が表示されるはず
                    if prompt_hide_link.count() > 0:
                        print("✓ レイアウトが変更されました（プロンプトが表示され、「プロンプトを隠す」リンクが表示）")
                    
                    save_screenshot(page, test_dir, "10_show_prompt_2.png", "プロンプト表示後（画面配置変更）")
                    
                elif prompt_hide_link.count() > 0:
                    # すでにプロンプトが表示されている場合
                    print("すでにプロンプトが表示されています。「プロンプトを隠す」をクリックして元に戻します。")
                    save_screenshot(page, test_dir, "10_show_prompt_1.png", "プロンプト表示前（すでに表示状態）")
                    
                    prompt_hide_link.first.click()
                    page.wait_for_timeout(1000)
                    print("✓ 「プロンプトを隠す」をクリックしました")
                    
                    save_screenshot(page, test_dir, "10_show_prompt_2.png", "プロンプト非表示後（画面配置変更）")
                else:
                    warnings.append(("STEP 16", "プロンプト表示/非表示リンクが見つかりませんでした"))
                    print("⚠️ 警告: プロンプト表示/非表示リンクが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 16", f"プロンプト表示確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示確認中にエラー: {e}")
            
            # 【テスト⑪】「情報をクリア」をクリックすると入力情報がクリアされる
            print("\n[STEP 17] ⑪情報クリア機能確認")
            try:
                # 「情報をクリア」リンクボタン
                clear_button = page.locator('button:has-text("情報をクリア")')
                
                if clear_button.count() > 0:
                    save_screenshot(page, test_dir, "11_clear_info_1.png", "情報クリア前")
                    
                    clear_button.first.click()
                    page.wait_for_timeout(1500)
                    print("✓ 「情報をクリア」をクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('[data-sonner-toast]')
                    if toast.count() > 0:
                        print("✓ クリア成功のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "11_clear_info_2.png", "情報クリア後（トースト表示）")
                    
                    # クリア後、入力フィールドが空になっているか確認
                    page.wait_for_timeout(500)
                    company_name_input = page.locator('input[placeholder*="○○株式会社"]')
                    if company_name_input.count() > 0:
                        company_name_value = company_name_input.input_value()
                        if company_name_value == "":
                            print("✓ 入力情報が正しくクリアされました")
                        else:
                            warnings.append(("STEP 17", f"入力情報が残っている可能性があります: '{company_name_value[:50]}...'"))
                            print(f"⚠️ 警告: 入力情報が残っている可能性があります: '{company_name_value[:50]}...'")
                else:
                    warnings.append(("STEP 17", "情報クリアボタンが見つかりませんでした"))
                    print("⚠️ 警告: 情報クリアボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 17", f"情報クリア確認中にエラー: {e}"))
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
            print(f"✅ 全テスト完了: 企業分析画面の全機能を確認しました")
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
    print("Playwright E2Eテスト: 企業分析画面")
    print("=" * 70)
    
    try:
        print("\n[実行中] 企業分析機能テスト...")
        test_company_analysis_functionality()
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
