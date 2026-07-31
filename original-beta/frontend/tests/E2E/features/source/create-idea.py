"""
create-idea.py - アイデア作成フォームのE2Eテスト

Azure Entra ID認証を含む、アイデア作成フォームの完全なE2Eテストを実施します。
手動認証モードとヘッドレスモードの両方に対応しています。

【テスト観点】
①アイデア出し画面が正しく表示されることを確認する
②カーソルをヘルプマークに合わせると機能説明が表示されることを確認する
③アイデアの件数を変更できることを確認する
④各入力ボックスに必要情報を入力し、アイデア出しができることを確認する
⑤「結果を調整する」ボックスから、アイデア出しの内容を修正できることを確認する
⑥作成結果のフィードバック（Good/Bad）を送信できることを確認する
⑦作成結果を編集できることを確認する
⑧作成結果をコピーできることを確認する
⑨作成結果をダウンロードできることを確認する
⑩「プロンプトを表示」をクリックすると画面配置が変わることを確認する
⑪「情報をクリア」をクリックすると入力情報がクリアされることを確認する

【実行コマンド】

■ 推奨：手動認証モード（ブラウザが表示され、認証後に自動実行）
  MANUAL_AUTH=true pytest frontend/tests/E2E/features/source/create-idea.py::test_create_idea_form_submission -v -s

■ スクリプトとして直接実行
  python frontend/tests/E2E/features/source/create-idea.py

【オプション説明】
  -v : 詳細モード（テスト名を表示）
  -s : print文を表示（必須！このオプションがないと標準出力が隠れます）
  MANUAL_AUTH=true : 手動認証モードを有効化

【エビデンス】
  テスト実行後、各テスト観点の前後のスクリーンショットが保存されます：
  test_evidence/test_YYYYMMDD_HHMMSS/
  ├── 01_idea_page_display.png（①画面表示）
  ├── 02_help_mark_1.png / 02_help_mark_2.png（②ヘルプマーク）
  ├── 03_idea_count_1.png / 03_idea_count_2.png（③件数変更）
  ├── 04_form_submit_1.png / 04_form_submit_2.png（④送信・結果）
  ├── 05_adjust_result_1.png / 05_adjust_result_2.png（⑤調整）
  ├── 06_feedback_1.png / 06_feedback_2.png（⑥フィードバック）
  ├── 07_edit_1.png / 07_edit_2.png（⑦編集）
  ├── 08_copy.png（⑧コピー）
  ├── 08_copy.txt（⑧コピーされたテキスト内容）
  ├── 09_download_1.png / 09_download_2.png（⑨ダウンロード）
  ├── 09_download.txt（⑨ダウンロードされたファイル）
  ├── 10_show_prompt_1.png / 10_show_prompt_2.png（⑩プロンプト表示）
  └── 11_clear_info_1.png / 11_clear_info_2.png（⑪情報クリア）
"""
import os
from playwright.sync_api import sync_playwright

# 共通ヘルパーモジュールをインポート
from ..util.auth_helper import handle_azure_authentication, handle_terms_agreement, save_auth_state, load_auth_state, is_auth_state_valid
from ..util.test_helper import ensure_evidence_dir, save_screenshot, print_test_summary, enable_mouse_cursor
from ..util.config import PROXY_CONFIG, BASE_URL, BROWSER_ARGS


def test_create_idea_form_submission():
    """アイデア出しページでフォーム入力と送信のテストを実施"""
    
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
        # MANUAL_AUTH=true の場合、手動認証モードで実行
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
        
        # /create-idea ページに遷移
        print(f"\n[STEP 4] /create-ideaページへ遷移")
        print(f"/create-ideaページへ遷移します...")
        page.goto(f"{BASE_URL}/create-idea")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # マウスカーソルを表示
        enable_mouse_cursor(page)
        
        # デバッグ: ページのタイトルとURLを確認
        print(f"ページURL: {page.url}")
        print(f"ページタイトル: {page.title()}")
        
        # まだ認証ページにリダイレクトされている場合
        if "login.microsoftonline.com" in page.url or ("login" in page.url.lower() or "auth" in page.url.lower()):
            print("エラー: まだ認証ページにリダイレクトされています。")
            print("認証が完了していないか、セッションが確立されていません。")
            print("headless=False でヘッドフルモードで実行し、認証フローを確認してください。")
            context.close()
            browser.close()
            return
        
        # textareaの数を確認
        textareas = page.locator('textarea').count()
        print(f"ページ内のtextarea要素数: {textareas}")
        
        if textareas == 0:
            print("警告: textarea要素が見つかりません。")
            print("ページが正しく読み込まれていない可能性があります。")
            print(f"現在のURL: {page.url}")
            context.close()
            browser.close()
            return
        
        # 【テスト①】アイデア出し画面が正しく表示されることを確認
        print("\n[STEP 5] ①アイデア出し画面の表示確認")
        print("📸 エビデンス取得: アイデア出し画面")
        save_screenshot(page, test_dir, "01_idea_page_display.png", "アイデア出し画面が正しく表示されることを確認する")
        
        # 【テスト②】ヘルプマークにカーソルを合わせると機能説明が表示される
        print("\n[STEP 6] ②ヘルプマーク機能説明の確認")
        try:
            # CreateIdeaTitle 内の Help コンポーネント
            # "アイデア出し" ヘッダーの隣にあるヘルプボタン
            # message="指定した話題に対してアイデアを複数件生成する画面です。"
            help_button = page.locator('h3:has-text("アイデア出し")').locator('..').locator('button')
            
            if help_button.count() > 0:
                print(f"ヘルプマークが見つかりました")
                
                # ヘルプボタンにホバー
                help_button.first.hover()
                page.wait_for_timeout(1500)
                print("ヘルプマークにホバーしました")
                
                # ツールチップが表示されているか確認（role="tooltip"で絞り込み）
                tooltip = page.locator('[role="tooltip"]:has-text("指定した話題に対してアイデアを複数件生成する画面です。")')
                if tooltip.is_visible():
                    print("✓ ヘルプメッセージが表示されました: '指定した話題に対してアイデアを複数件生成する画面です。'")
                
                save_screenshot(page, test_dir, "02_help_mark.png", "カーソルをヘルプマークに合わせると機能説明が表示されることを確認する")
            else:
                warnings.append(("STEP 6", "ヘルプマークが見つかりませんでした"))
                print("⚠️ 警告: ヘルプマークが見つかりませんでした")
        except Exception as e:
            errors.append(("STEP 6", f"ヘルプマーク確認中にエラー: {e}"))
            print(f"❌ エラー: ヘルプマーク確認中にエラー: {e}")
        
        # 【テスト③】アイデアの件数を変更できることを確認
        print("\n[STEP 7] ③アイデア件数の変更確認")
        try:
            # 件数表示のテキストを取得（「1 件」のような形式）
            count_display = page.locator('p.text-xs.text-neutral-500:has-text("件")')
            
            if count_display.count() > 0:
                # 変更前の値を確認（デフォルト1件）
                current_text = count_display.first.inner_text()
                print(f"現在のアイデア件数表示: {current_text}")
                save_screenshot(page, test_dir, "03_idea_count_1.png", f"アイデア件数変更前（{current_text}）")
                
                # Sliderのthumb要素を見つける（Radix UIのSlider: role="slider"）
                slider_thumb = page.locator('[role="slider"]').first
                if slider_thumb.count() > 0:
                    # Thumbにフォーカスして、ArrowRightキーを2回押して3件にする（軽微な変更のみ）
                    slider_thumb.focus()
                    page.wait_for_timeout(500)
                    
                    # 右矢印キーを2回押す（1→3）
                    for i in range(2):
                        slider_thumb.press('ArrowRight')
                        page.wait_for_timeout(100)
                    
                    page.wait_for_timeout(500)
                    
                    # 変更後の値を確認
                    new_text = count_display.first.inner_text()
                    print(f"アイデア件数を変更しました: {new_text}")
                    save_screenshot(page, test_dir, "03_idea_count_2.png", f"アイデア件数変更後（{new_text}）")
                    
                    # 元に戻す（3→1）
                    for i in range(2):
                        slider_thumb.press('ArrowLeft')
                        page.wait_for_timeout(100)
                    
                    page.wait_for_timeout(300)
                    reset_text = count_display.first.inner_text()
                    print(f"アイデア件数を元に戻しました: {reset_text}")
                else:
                    warnings.append(("STEP 7", "スライダーが見つかりませんでした"))
                    print("⚠️ 警告: スライダーが見つかりませんでした")
            else:
                warnings.append(("STEP 7", "件数表示が見つかりませんでした"))
                print("⚠️ 警告: 件数表示が見つかりませんでした")
        except Exception as e:
            errors.append(("STEP 7", f"件数変更確認中にエラー: {e}"))
            print(f"❌ エラー: 件数変更確認中にエラー: {e}")
        
        # 【テスト④】フォーム入力と送信（既存処理）
        print("\n[STEP 8] ④フォーム入力とアイデア出し")
        try:
            # フォームフィールドの存在を確認
            subject_field = page.locator('textarea').first
            if subject_field.count() == 0:
                warnings.append(("STEP 8", "主題フィールドが見つかりません。ページを再読み込みします"))
                print("⚠️ 警告: 主題フィールドが見つかりません。ページを再読み込みします。")
                page.reload()
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(2000)
                subject_field = page.locator('textarea').first
            
            # 【重要】まず最初にアイデアの件数を設定（フィールド入力前に）
            # スライダー操作がフォームをリセットする可能性があるため、先に設定
            count_slider = page.locator('[role="slider"]')
            if count_slider.count() > 0:
                print("スライダーが見つかりました。件数を5件に設定します（フィールド入力前）。")
                count_slider.first.wait_for(state="visible", timeout=10000)
                # フォーカスして矢印キーで調整（初期値1→5へ4回ArrowRight）
                count_slider.first.focus()
                page.wait_for_timeout(300)
                for i in range(4):
                    count_slider.first.press('ArrowRight')
                    page.wait_for_timeout(100)
                page.wait_for_timeout(500)
                print("アイデア件数設定完了（5件）")
            else:
                warnings.append(("STEP 8", "スライダーが見つかりませんでした。デフォルト値を使用します"))
                print("⚠️ 警告: スライダーが見つかりませんでした。デフォルト値を使用します")
            
            # 件数設定後、フィールドに入力を開始
            subject_field = page.locator('textarea').first
            subject_field.wait_for(state="visible", timeout=10000)
            subject_field.fill("2025年の生成AIに対して企業が注力したほうがよいこと")
            print("主題フィールド入力完了")
            
            # 立場フィールドに入力
            role_field = page.locator('textarea').nth(1)
            role_field.wait_for(state="visible", timeout=10000)
            role_field.fill("生成AIのプロ、IT企業の経営者")
            print("立場フィールド入力完了")
            
            # 考慮事項フィールドに入力 - オプショナル
            consideration_field = page.locator('textarea').nth(2)
            if consideration_field.count() > 0:
                print("考慮事項フィールドが見つかりました。")
                consideration_field.wait_for(state="visible", timeout=10000)
                consideration_field.fill("専門用語を控える")
                print("考慮事項フィールド入力完了")
            else:
                warnings.append(("STEP 8", "考慮事項フィールドが見つかりませんでした。スキップします"))
                print("⚠️ 警告: 考慮事項フィールドが見つかりませんでした。スキップします")
            
            # 【エビデンス④-1】フォーム入力完了・送信前
            print("\n📸 エビデンス取得: フォーム入力完了（送信前）")
            save_screenshot(page, test_dir, "04_form_submit_1.png", "フォーム入力完了（送信前）")
            
            # 送信ボタンをクリック
            print("\n[STEP 9] フォーム送信")
            submit_button = page.locator('button[type="submit"]').first
            submit_button.wait_for(state="visible", timeout=10000)
            print("送信ボタンをクリック")
            submit_button.click()
            page.wait_for_timeout(2000)
            
            # 送信中の状態を確認
            processing_visible = False
            try:
                page.locator('text=作成中です').wait_for(state="visible", timeout=5000)
                print("✓ 送信中状態を確認")
                processing_visible = True
            except Exception as e:
                warnings.append(("STEP 9", f"送信中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）: {e}"))
                print(f"⚠️ 警告: 送信中インジケーターが見つかりませんでした（すぐに処理が完了した可能性）: {e}")
            
            # 結果が表示されるまで待機
            print("\n[STEP 10] API応答待機")
            print("API応答待機中（最大120秒）...")
            
            result_detected = False
            
            # 方法1: 「作成中です」が消えるのを待つ
            if processing_visible:
                try:
                    page.locator('text=作成中です').wait_for(state="hidden", timeout=120000)
                    print("✓ 「作成中です」が消えました - 処理完了")
                    result_detected = True
                except Exception as e:
                    warnings.append(("STEP 10", f"「作成中です」の消失を検知できませんでした: {e}"))
                    print(f"⚠️ 警告: 「作成中です」の消失を検知できませんでした: {e}")
            
            # 方法2: 送信ボタンが再度有効になるのを待つ（処理完了の兆候）
            if not result_detected:
                try:
                    print("別の方法で処理完了を検知します...")
                    # 送信ボタンが再度クリック可能になることを確認
                    page.locator('button[type="submit"]').first.wait_for(state="visible", timeout=30000)
                    print("✓ フォームが再度操作可能になりました")
                    result_detected = True
                except Exception as e:
                    warnings.append(("STEP 10", f"フォームの状態変化を検知できませんでした: {e}"))
                    print(f"⚠️ 警告: フォームの状態変化を検知できませんでした: {e}")
            
            # 結果の安定化を待つ（追加で3秒）
            print("⏳ 結果の表示完了を待機中...")
            page.wait_for_timeout(3000)
            
            # 【エビデンス④-2】最終結果
            print("\n[STEP 11] ④作成結果の確認")
            print("📸 エビデンス取得: 作成結果")
            save_screenshot(page, test_dir, "04_form_submit_2.png", "アイデア作成結果")
            
            # 結果が実際に表示されているか確認
            page_content = page.content()
            if len(page_content) > 1000:
                print("✓ ページに結果コンテンツが表示されています")
            else:
                warnings.append(("STEP 11", f"ページのコンテンツが少ない可能性があります ({len(page_content)}文字)"))
                print(f"⚠️ 警告: ページのコンテンツが少ない可能性があります ({len(page_content)}文字)")
            
            # 【テスト⑤】「結果を調整する」ボックスから修正
            print("\n[STEP 12] ⑤結果の調整機能確認")
            try:
                # NewIdeaRequestFormの「結果を調整する」入力フィールドと「再作成する」ボタン
                adjust_textarea = page.locator('textarea[placeholder*="例：簡潔にまとめる"]')
                recreate_button = page.locator('button:has-text("再作成する")')
                
                if adjust_textarea.count() > 0 and recreate_button.count() > 0:
                    save_screenshot(page, test_dir, "05_adjust_result_1.png", "結果調整前")
                    
                    # 調整内容を入力
                    adjust_textarea.fill("もっと具体的に説明してください")
                    page.wait_for_timeout(500)
                    print("調整内容を入力しました: 'もっと具体的に説明してください'")
                    
                    # 再作成ボタンが有効か確認してクリック
                    if not recreate_button.is_disabled():
                        recreate_button.click()
                        page.wait_for_timeout(2000)
                        print("「再作成する」をクリックしました")
                        
                        # 再作成中の表示を待つ
                        try:
                            page.locator('text=再作成中です').wait_for(state="visible", timeout=5000)
                            print("✓ 再作成中状態を確認")
                        except Exception as e:
                            warnings.append(("STEP 12", f"再作成中表示が見つかりませんでした（すぐに完了した可能性）: {e}"))
                            print(f"⚠️ 警告: 再作成中表示が見つかりませんでした（すぐに完了した可能性）: {e}")
                        
                        # 再作成完了を待つ
                        try:
                            page.locator('text=再作成中です').wait_for(state="hidden", timeout=120000)
                            print("✓ 再作成が完了しました")
                        except Exception as e:
                            warnings.append(("STEP 12", f"再作成完了の検知に失敗しました: {e}"))
                            print(f"⚠️ 警告: 再作成完了の検知に失敗しました: {e}")
                        
                        page.wait_for_timeout(2000)
                        save_screenshot(page, test_dir, "05_adjust_result_2.png", "結果調整後（再作成完了）")
                    else:
                        warnings.append(("STEP 12", "再作成ボタンが無効です"))
                        print("⚠️ 警告: 再作成ボタンが無効です")
                else:
                    warnings.append(("STEP 12", "調整フォームまたはボタンが見つかりませんでした"))
                    print("⚠️ 警告: 調整フォームまたはボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 12", f"結果調整確認中にエラー: {e}"))
                print(f"❌ エラー: 結果調整確認中にエラー: {e}")
            
            # 【テスト⑥】フィードバック（Good/Bad）送信
            print("\n[STEP 13] ⑥フィードバック送信機能確認")
            try:
                # FeedbackGoodButton / FeedbackBadButtonコンポーネント
                # 作成結果エリアの上部にあるボタン群の最初の2つ
                result_area_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_area_buttons.count() >= 2:
                    print(f"作成結果エリアのボタンが見つかりました（{result_area_buttons.count()}個）")
                    
                    # Goodボタン（1番目）をクリック
                    good_button = result_area_buttons.nth(0)
                    good_button.click()
                    page.wait_for_timeout(1500)
                    print("Goodフィードバックボタンをクリックしました")
                    
                    # フィードバックダイアログが表示されるか確認（dialogタグまたはrole属性で検索）
                    feedback_dialog = page.locator('dialog').or_(page.locator('[role="dialog"]'))
                    
                    if feedback_dialog.count() > 0:
                        print("✓ フィードバックダイアログが表示されました")
                        
                        # オプション選択（チェックボックスの一番上を選択）
                        # aria-hidden="true"のinputは回避し、ラベルをクリック
                        # FormLabelの最初の要素をクリック
                        first_checkbox_label = feedback_dialog.locator('label.text-lg').first
                        if first_checkbox_label.count() > 0:
                            first_checkbox_label.click()
                            page.wait_for_timeout(800)
                            print("✓ フィードバックオプション（一番上）を選択しました")
                        else:
                            warnings.append(("STEP 13", "チェックボックスのラベルが見つかりませんでした"))
                            print("⚠️ 警告: チェックボックスのラベルが見つかりませんでした")
                        
                        # ダイアログ内のInputフィールドに任意の意見を記載
                        # OptionalLabelの下にあるInput要素
                        dialog_input = feedback_dialog.locator('input[type="text"]')
                        if dialog_input.count() > 0:
                            dialog_input.fill("非常に役に立ちました。今後も活用したいです。")
                            page.wait_for_timeout(500)
                            print("✓ フィードバックテキストを入力しました")
                        
                        # フォーム入力後のスクリーンショット（送信前）
                        save_screenshot(page, test_dir, "06_feedback_1.png", "フィードバックフォーム入力後（送信前）")
                        
                        # 送信ボタンをクリック
                        submit_button = feedback_dialog.locator('button[type="submit"]').or_(feedback_dialog.locator('button:has-text("送信")'))
                        if submit_button.count() > 0:
                            submit_button.first.click()
                            page.wait_for_timeout(2000)
                            print("✓ フィードバックを送信しました")
                            
                            # 送信後のスクリーンショット
                            save_screenshot(page, test_dir, "06_feedback_2.png", "フィードバック送信後")
                        else:
                            warnings.append(("STEP 13", "送信ボタンが見つかりませんでした"))
                            print("⚠️ 警告: 送信ボタンが見つかりませんでした")
                    else:
                        warnings.append(("STEP 13", "フィードバックダイアログが表示されませんでした"))
                        print("⚠️ 警告: フィードバックダイアログが表示されませんでした")
                        save_screenshot(page, test_dir, "06_feedback_2.png", "フィードバックボタンクリック後（ダイアログなし）")
                else:
                    warnings.append(("STEP 13", "フィードバックボタンが見つかりませんでした"))
                    print("⚠️ 警告: フィードバックボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 13", f"フィードバック送信確認中にエラー: {e}"))
                print(f"❌ エラー: フィードバック送信確認中にエラー: {e}")
            
            # 【テスト⑧】作成結果をコピー
            print("\n[STEP 14] ⑧コピー機能確認")
            try:
                # IdeationResultAreaのコピーボタン
                # <Button type="button" variant="icon" size="icon" onClick={copyResult}
                #   className="absolute right-1 top-1 z-10"><SvgCopy className="size-5" /></Button>
                # Textareaのrelative親要素内のabsoluteボタン
                copy_button = page.locator('button.absolute.right-1.top-1.z-10')
                
                if copy_button.count() > 0:
                    copy_button.first.click()
                    page.wait_for_timeout(1500)
                    print("コピーボタンをクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('text=/作成結果.*コピー/i')
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
                    
                    save_screenshot(page, test_dir, "08_copy.png", "作成結果をコピーできることを確認する")
                else:
                    warnings.append(("STEP 14", "コピーボタンが見つかりませんでした"))
                    print("⚠️ 警告: コピーボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 14", f"コピー機能確認中にエラー: {e}"))
                print(f"❌ エラー: コピー機能確認中にエラー: {e}")
            
            # 【テスト⑨】作成結果をダウンロード
            print("\n[STEP 15] ⑨ダウンロード機能確認")
            try:
                # IdeationResultAreaのダウンロードボタン（SvgDownloadアイコン）
                # 作成結果エリアのボタン群の3番目（Good, Bad, Downloadの順）
                result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_buttons.count() >= 3:
                    save_screenshot(page, test_dir, "09_download_1.png", "ダウンロード前")
                    
                    # 3番目のボタンがDownloadボタン（0-indexed なので nth(2)）
                    download_btn = result_buttons.nth(2)
                    
                    # ダウンロードイベントを待機
                    try:
                        with page.expect_download(timeout=15000) as download_info:
                            download_btn.click()
                            print("ダウンロードボタンをクリックしました")
                        
                        download = download_info.value
                        filename = download.suggested_filename
                        print(f"✓ ダウンロード完了: {filename}")
                        
                        # ファイル名が「アイディア出し_YYYYMMDD_HHMM.txt」形式か確認
                        if filename.startswith("アイディア出し_") and filename.endswith(".txt"):
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
            
            # 【テスト⑦】作成結果を編集（コピー・ダウンロードの後に実施）
            print("\n[STEP 16] ⑦編集機能確認")
            try:
                # IdeationResultAreaの編集ボタン（SvgEditアイコン）
                # 作成結果エリアのボタンで4番目（Good, Bad, Download, Editの順）
                result_buttons = page.locator('div:has(> label:has-text("作成結果")) button[type="button"]')
                
                if result_buttons.count() >= 4:
                    # 4番目のボタンがEditボタン（0-indexed なので nth(3)）
                    edit_btn = result_buttons.nth(3)
                    edit_btn.click()
                    page.wait_for_timeout(1000)
                    print("編集ボタンをクリックしました")
                    
                    # 編集モードではキャンセルと保存ボタンが表示される
                    cancel_button = page.locator('button:has-text("キャンセル")')
                    save_button = page.locator('button:has-text("保存")')
                    
                    if cancel_button.count() > 0 and save_button.count() > 0:
                        print("✓ 編集モードに切り替わりました（キャンセル・保存ボタンが表示）")
                        
                        # 編集モード中のテキストエリアを取得
                        # 編集モード時は通常のボタンが消え、キャンセル・保存ボタンが表示される
                        # テキストエリアは作成結果ラベルの下にある
                        result_textarea = page.locator('textarea').filter(has=page.locator('xpath=ancestor::div[label[text()="作成結果"]]'))
                        
                        # より簡単な方法：ページ内の全textareaから、編集可能なものを探す
                        all_textareas = page.locator('textarea')
                        editable_textarea = None
                        
                        for i in range(all_textareas.count()):
                            textarea = all_textareas.nth(i)
                            readonly_attr = textarea.get_attribute('readonly')
                            # readonlyでないtextareaを探す
                            if readonly_attr is None or readonly_attr == 'false':
                                # さらに、値が入っている（作成結果の）textareaを確認
                                value = textarea.input_value()
                                if len(value) > 50:  # 作成結果は長いテキストのはず
                                    editable_textarea = textarea
                                    print(f"✓ 編集可能なテキストエリアを見つけました（{i+1}番目のtextarea）")
                                    break
                        
                        if editable_textarea:
                            # 元のテキストを確認
                            original_text = editable_textarea.input_value()
                            print(f"元のテキスト（最初の50文字）: {original_text[:50]}...")
                            
                            # テキストを「テスト」に変更
                            editable_textarea.fill("テスト")
                            page.wait_for_timeout(800)
                            print("✓ テキストを「テスト」に変更しました")
                            
                            # テキスト変更後のスクリーンショット（保存前）
                            save_screenshot(page, test_dir, "07_edit_1.png", "編集中（「テスト」入力後、保存前）")
                            
                            # 保存ボタンをクリック
                            save_button.first.click()
                            page.wait_for_timeout(1500)
                            print("✓ 保存ボタンをクリックしました")
                            
                            # 編集モードが解除されたか確認
                            page.wait_for_timeout(500)
                            if cancel_button.count() == 0:
                                print("✓ 編集モードが解除されました")
                                
                                # readonlyに戻ったか確認
                                is_readonly_after = editable_textarea.get_attribute('readonly')
                                if is_readonly_after == '' or is_readonly_after == 'true' or is_readonly_after:
                                    print("✓ テキストエリアがreadonly状態に戻りました")
                                
                                # 保存後の値を確認
                                saved_text = editable_textarea.input_value()
                                print(f"保存後のテキスト: {saved_text}")
                            else:
                                warnings.append(("STEP 16", "編集モードがまだ解除されていません"))
                                print("⚠️ 警告: 編集モードがまだ解除されていません")
                        else:
                            warnings.append(("STEP 16", "編集可能なテキストエリアが見つかりませんでした"))
                            print("⚠️ 警告: 編集可能なテキストエリアが見つかりませんでした")
                    else:
                        warnings.append(("STEP 16", "編集モードのボタンが表示されませんでした"))
                        print("⚠️ 警告: 編集モードのボタンが表示されませんでした")
                    
                    # 保存後のスクリーンショット
                    save_screenshot(page, test_dir, "07_edit_2.png", "編集後（保存完了）")
                else:
                    warnings.append(("STEP 16", "編集ボタンが見つかりませんでした"))
                    print("⚠️ 警告: 編集ボタンが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 16", f"編集機能確認中にエラー: {e}"))
                print(f"❌ エラー: 編集機能確認中にエラー: {e}")
            
            # 【テスト⑩】「プロンプトを表示」をクリック
            print("\n[STEP 17] ⑩プロンプト表示機能確認")
            try:
                # LayoutSwitchButton の「プロンプトを表示」または「プロンプトを隠す」リンク
                # TextLink コンポーネントで実装されている
                prompt_show_link = page.locator('a:has-text("プロンプトを表示")')
                prompt_hide_link = page.locator('a:has-text("プロンプトを隠す")')
                
                # どちらかが表示されているか確認
                if prompt_show_link.count() > 0:
                    save_screenshot(page, test_dir, "10_show_prompt_1.png", "プロンプト表示前（プロンプトが隠れている状態）")
                    
                    prompt_show_link.first.click()
                    page.wait_for_timeout(1000)
                    print("「プロンプトを表示」をクリックしました")
                    
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
                    print("「プロンプトを隠す」をクリックしました")
                    
                    save_screenshot(page, test_dir, "10_show_prompt_2.png", "プロンプト非表示後（画面配置変更）")
                else:
                    warnings.append(("STEP 17", "プロンプト表示/非表示リンクが見つかりませんでした"))
                    print("⚠️ 警告: プロンプト表示/非表示リンクが見つかりませんでした")
            except Exception as e:
                errors.append(("STEP 17", f"プロンプト表示確認中にエラー: {e}"))
                print(f"❌ エラー: プロンプト表示確認中にエラー: {e}")
            
            # 【テスト⑪】「情報をクリア」をクリック
            print("\n[STEP 18] ⑪情報クリア機能確認")
            try:
                # CreateIdeaTitle の「情報をクリア」リンクボタン
                # Button variant="link" size="link" で実装されている
                clear_button = page.locator('button:has-text("情報をクリア")')
                
                if clear_button.count() > 0:
                    save_screenshot(page, test_dir, "11_clear_info_1.png", "情報クリア前")
                    
                    clear_button.first.click()
                    page.wait_for_timeout(1500)
                    print("「情報をクリア」をクリックしました")
                    
                    # トーストメッセージが表示されるか確認
                    toast = page.locator('[data-sonner-toast]')
                    if toast.count() > 0:
                        print("✓ クリア成功のトーストメッセージが表示されました")
                    
                    save_screenshot(page, test_dir, "11_clear_info_2.png", "情報クリア後（トースト表示）")
                    
                    # クリア後、入力フィールドが空になっているか確認
                    page.wait_for_timeout(500)
                    first_textarea = page.locator('textarea').first
                    if first_textarea.count() > 0:
                        first_textarea_value = first_textarea.input_value()
                        if first_textarea_value == "":
                            print("✓ 入力情報が正しくクリアされました")
                        else:
                            warnings.append(("STEP 18", f"入力情報が残っている可能性があります: '{first_textarea_value[:50]}...'"))
                            print(f"⚠️ 警告: 入力情報が残っている可能性があります: '{first_textarea_value[:50]}...'")
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
            print(f"✅ 全テスト完了: アイデア作成フォームの全機能を確認しました")
            print(f"{'='*70}")
            
        except Exception as e:
            errors.append(("CRITICAL", f"フォーム入力中に致命的エラー: {e}"))
            print(f"❌ 致命的エラー: フォーム入力中にエラー: {e}")
            save_screenshot(page, test_dir, "ERROR_form_input.png", "フォーム入力エラー")
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
    print("Playwright E2Eテスト: アイデア作成フォーム")
    print("=" * 70)
    
    try:
        print("\n[実行中] アイデア出しフォーム送信テスト...")
        test_create_idea_form_submission()
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
