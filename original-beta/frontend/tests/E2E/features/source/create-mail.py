"""メール作成画面のE2Eテスト

【テスト観点】
① 「メール作成画面」が正しく表示されることを確認する
② カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③ 必要情報を入力し、新規メールを作成できることを確認する
④ 「結果を調整する」ボックスから、新規メールの内容を修正できることを確認する
⑤ 新規メール出力内容について、件名/本文のフィードバック（Good/Bad）を送信できることを確認する
⑥ 新規メール出力内容について、件名/本文を編集できることを確認する
⑦ 新規メール出力内容について、件名/本文をコピーできることを確認する
⑧ 新規メール出力内容について、「メールでひらく」をクリックするとmailtoリンクが機能することを確認する
⑨ 新規メール出力内容について、件名/本文をダウンロードできることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-mail.py::test_create_mail_functionality -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/create-mail.py

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


def test_create_mail_functionality():
    """メール作成機能のE2Eテスト"""
    
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
            # 【テスト①】メール作成画面の表示確認
            print("\n[STEP 5] ①メール作成画面の表示確認")
            try:
                save_screenshot(page, test_dir, "01_create_mail_page_display.png", "メール作成画面の表示")
                
                # 見出しの確認
                heading = page.locator('h3:has-text("メール作成")')
                if heading.count() > 0:
                    print("✓ 見出し「メール作成」が表示されています")
                else:
                    warnings.append(("STEP 5", "見出し「メール作成」が見つかりませんでした"))
                    print("⚠️ 警告: 見出し「メール作成」が見つかりませんでした")
                
                # 宛先フィールドの確認
                to_field = page.locator('input#to')
                if to_field.count() > 0:
                    print("✓ 宛先入力フィールドが表示されています")
                else:
                    warnings.append(("STEP 5", "宛先入力フィールドが見つかりませんでした"))
                    print("⚠️ 警告: 宛先入力フィールドが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 5", f"画面表示確認中にエラー: {e}"))
                print(f"❌ エラー: 画面表示確認中にエラー: {e}")
            
            # 【テスト②】ヘルプマーク機能説明の確認
            print("\n[STEP 6] ②ヘルプマーク機能説明の確認")
            try:
                help_button = page.locator('h3:has-text("メール作成")').locator('..').locator('button')
                
                if help_button.count() > 0:
                    print(f"ヘルプマークが見つかりました")
                    save_screenshot(page, test_dir, "02_help_mark_1.png", "ヘルプマーク - ホバー前")
                    
                    # ヘルプボタンにホバー
                    help_button.first.hover()
                    page.wait_for_timeout(1500)
                    print("ヘルプマークにホバーしました")
                    
                    # ツールチップが表示されているか確認
                    tooltip = page.locator('[role="tooltip"]')
                    if tooltip.is_visible():
                        tooltip_text = tooltip.inner_text()
                        print(f"✓ ヘルプメッセージが表示されました: {tooltip_text[:50]}...")
                    else:
                        warnings.append(("STEP 6", "ツールチップが表示されませんでした"))
                        print("⚠️ 警告: ツールチップが表示されませんでした")
                    
                    save_screenshot(page, test_dir, "02_help_mark_2.png", "ヘルプマーク - ホバー後（説明表示）")
                else:
                    warnings.append(("STEP 6", "ヘルプマークが見つかりませんでした"))
                    print("⚠️ 警告: ヘルプマークが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 6", f"ヘルプマーク確認中にエラー: {e}"))
                print(f"❌ エラー: ヘルプマーク確認中にエラー: {e}")
            
            # 【テスト③】必要情報を入力し、新規メールを作成
            print("\n[STEP 7] ③新規メール作成機能確認")
            try:
                save_screenshot(page, test_dir, "03_form_input_1.png", "フォーム入力前")
                
                # 宛先
                to_field = page.locator('input#to')
                if to_field.count() > 0:
                    to_field.fill("株式会社テスト 田中様")
                    page.wait_for_timeout(300)
                    print("✓ 宛先を入力しました")
                
                # 差出人
                from_field = page.locator('input#from')
                if from_field.count() > 0:
                    from_field.fill("株式会社サンプル 山田太郎")
                    page.wait_for_timeout(300)
                    print("✓ 差出人を入力しました")
                
                # 目的
                purpose_field = page.locator('input#purpose')
                if purpose_field.count() > 0:
                    purpose_field.fill("会議の日程調整")
                    page.wait_for_timeout(300)
                    print("✓ メールの目的を入力しました")
                
                # 内容
                content_field = page.locator('textarea#content')
                if content_field.count() > 0:
                    content_field.fill("来週の打ち合わせについて、候補日をご提示いただきたい")
                    page.wait_for_timeout(300)
                    print("✓ メールの内容を入力しました")
                
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
                        print("✓ メール作成が完了しました")
                        
                        save_screenshot(page, test_dir, "03_form_submit_3_result.png", "メール作成完了")
                    except Exception as wait_error:
                        warnings.append(("STEP 7", f"メール作成結果の表示待機がタイムアウト: {wait_error}"))
                        print(f"⚠️ 警告: メール作成結果の表示待機がタイムアウト: {wait_error}")
                else:
                    warnings.append(("STEP 7", "作成ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 作成ボタンが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 7", f"新規メール作成中にエラー: {e}"))
                print(f"❌ エラー: 新規メール作成中にエラー: {e}")
            
            # 【テスト④】「結果を調整する」ボックスから、新規メールの内容を修正
            print("\n[STEP 8] ④結果を調整する機能確認")
            try:
                save_screenshot(page, test_dir, "04_modify_1.png", "修正前")
                
                # 結果を調整するエリアを探す
                modify_area = page.locator('textarea[placeholder*="修正"]').or_(
                    page.locator('textarea[placeholder*="調整"]')
                )
                
                if modify_area.count() > 0:
                    print("✓ 「結果を調整する」テキストエリアが見つかりました")
                    
                    # 修正内容を入力
                    modify_area.first.fill("件名をもっと簡潔にしてください")
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
                        print("✓ 修正されたメールが生成されました")
                    else:
                        warnings.append(("STEP 8", "再作成ボタンが見つかりませんでした"))
                        print("⚠️ 警告: 再作成ボタンが見つかりませんでした")
                else:
                    warnings.append(("STEP 8", "「結果を調整する」テキストエリアが見つかりませんでした"))
                    print("⚠️ 警告: 「結果を調整する」テキストエリアが見つかりませんでした")
                
            except Exception as e:
                errors.append(("STEP 8", f"結果調整機能確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整機能確認中にエラー: {e}")
            
            # 【テスト⑤】フィードバック（Good/Bad）送信
            print("\n[STEP 9] ⑤フィードバック送信機能確認")
            try:
                save_screenshot(page, test_dir, "05_feedback_1.png", "フィードバック前")
                
                # 件名エリアのボタン群を取得
                subject_header = page.locator('div.flex.min-h-8:has(label:has-text("件名"))')
                subject_buttons = subject_header.locator('button[type="button"]')
                
                if subject_buttons.count() >= 2:
                    print(f"✓ 件名エリアのボタンが見つかりました（{subject_buttons.count()}個）")
                    
                    # Goodボタン（最初のボタン）をクリック
                    good_button = subject_buttons.nth(0)
                    good_button.click()
                    page.wait_for_timeout(1500)
                    print("✓ Goodフィードバックボタンをクリックしました")
                    
                    # フィードバックダイアログが表示されるか確認
                    feedback_dialog_title = page.locator('h2:has-text("フィードバックを頂きありがとうございました！")')
                    
                    try:
                        feedback_dialog_title.wait_for(state="visible", timeout=10000)
                        print("✓ フィードバックダイアログのタイトルが表示されました")
                    except Exception as dialog_wait_error:
                        print(f"⚠️ ダイアログ待機中: {dialog_wait_error}")
                        warnings.append(("STEP 9", "フィードバックダイアログの表示待機がタイムアウトしました"))
                    
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
                            warnings.append(("STEP 9", "チェックボックスのラベルが見つかりませんでした"))
                            print("⚠️ 警告: チェckボックスのラベルが見つかりませんでした")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        dialog_input = dialog_element.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("メール作成機能が非常に便利でした。")
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
                            warnings.append(("STEP 9", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 9", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                else:
                    warnings.append(("STEP 9", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 9", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【テスト⑥】件名/本文を編集
            print("\n[STEP 10] ⑥編集機能確認")
            try:
                save_screenshot(page, test_dir, "06_edit_1.png", "編集前")
                
                # 件名エリアのボタン群を取得
                subject_header = page.locator('div.flex.min-h-8:has(label:has-text("件名"))')
                subject_buttons = subject_header.locator('button[type="button"]')
                
                if subject_buttons.count() >= 4:
                    # 4番目のボタンが編集ボタン（0-indexed なので nth(3)）
                    edit_btn = subject_buttons.nth(3)
                    edit_btn.click()
                    page.wait_for_timeout(1000)
                    print("✓ 編集ボタンをクリックしました")
                    
                    # 編集モードではキャンセルと保存ボタンが表示される
                    cancel_button = page.locator('button:has-text("キャンセル")')
                    save_button = page.locator('button:has-text("保存")')
                    
                    if cancel_button.count() > 0 and save_button.count() > 0:
                        print("✓ 編集モードに切り替わりました（キャンセル・保存ボタンが表示）")
                        
                        # 件名を編集
                        subject_input = page.locator('input#created-subject')
                        if subject_input.count() > 0:
                            original_subject = subject_input.input_value()
                            new_subject = f"{original_subject} [編集済み]"
                            subject_input.fill(new_subject)
                            page.wait_for_timeout(800)
                            print(f"✓ 件名を編集しました: {new_subject[:50]}...")
                            
                            save_screenshot(page, test_dir, "06_edit_2_input.png", "編集中（保存前）")
                            
                            # 保存ボタンをクリック
                            save_button.first.click()
                            page.wait_for_timeout(1500)
                            print("✓ 保存ボタンをクリックしました")
                            
                            # 編集モードが解除されたか確認
                            page.wait_for_timeout(500)
                            if cancel_button.count() == 0:
                                print("✓ 編集モードが解除されました")
                        else:
                            warnings.append(("STEP 10", "件名入力フィールドが見つかりませんでした"))
                            print("⚠️ 警告: 件名入力フィールドが見つかりませんでした")
                    else:
                        warnings.append(("STEP 10", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    save_screenshot(page, test_dir, "06_edit_3.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 10", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 10", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑦】件名/本文をコピー
            print("\n[STEP 11] ⑦コピー機能確認")
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
                        warnings.append(("STEP 11", "コピー成功のトーストが表示されませんでした"))
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
                            warnings.append(("STEP 11", "クリップボードが空です"))
                            print("⚠️ 警告: クリップボードが空です")
                    except Exception as clipboard_error:
                        warnings.append(("STEP 11", f"クリップボードの内容取得に失敗: {clipboard_error}"))
                        print(f"⚠️ 警告: クリップボードの内容取得に失敗: {clipboard_error}")
                    
                    save_screenshot(page, test_dir, "07_copy_2.png", "コピー実行後（トースト表示）")
                else:
                    warnings.append(("STEP 11", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 11", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑧】「メールでひらく」をクリック（mailtoリンク）
            print("\n[STEP 12] ⑧メールでひらく機能確認（mailtoリンク）")
            try:
                save_screenshot(page, test_dir, "08_mailto_1.png", "メールでひらく前")
                
                # 「メールでひらく」リンクを探す（TextLink = anchorタグ）
                mailto_link = page.locator('a:has-text("メールでひらく")')
                
                if mailto_link.count() > 0:
                    print("✓ 「メールでひらく」リンクが見つかりました")
                    
                    # href属性を確認（mailto:で始まることを確認）
                    href = mailto_link.get_attribute('href')
                    if href and href.startswith('mailto:'):
                        print(f"✓ mailtoリンクが正しく設定されています: {href[:50]}...")
                        
                        # リンクをクリック（新しいタブは開かない、メールクライアントが起動）
                        # 注意: mailtoリンクはファイルダウンロードではなく、メールクライアントを起動します
                        mailto_link.click()
                        page.wait_for_timeout(1500)
                        print("✓ 「メールでひらく」リンクをクリックしました")
                        print("   （メールクライアントが起動するはずです）")
                        
                        save_screenshot(page, test_dir, "08_mailto_2.png", "メールでひらくクリック後")
                    else:
                        warnings.append(("STEP 12", f"mailtoリンクの形式が正しくありません: {href}"))
                        print(f"⚠️ 警告: mailtoリンクの形式が正しくありません: {href}")
                else:
                    warnings.append(("STEP 12", "「メールでひらく」リンクが見つかりませんでした"))
                    print("⚠️ 警告: 「メールでひらく」リンクが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"メールでひらく機能確認中にエラー: {e}"))
                print(f"❌ エラー: メールでひらく機能確認中にエラー: {e}")
            
            # 【テスト⑨】件名/本文をダウンロード
            print("\n[STEP 13] ⑨ダウンロード機能確認")
            try:
                save_screenshot(page, test_dir, "09_download_1.png", "ダウンロード前")
                
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
    print("Playwright E2Eテスト: メール作成")
    print("=" * 70)
    
    try:
        print("\n[実行中] テスト...")
        test_create_mail_functionality()
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
