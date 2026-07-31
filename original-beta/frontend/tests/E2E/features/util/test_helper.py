"""
test_helper.py - E2Eテスト共通ヘルパー

エビデンス管理、スクリーンショット保存などの共通機能を提供します。
"""
import os
from datetime import datetime
from pathlib import Path


# エビデンス保存用ディレクトリ
# frontend/tests/E2E/features/evidence/ に保存
# このファイル (util/test_helper.py) から見て ../evidence/
EVIDENCE_BASE_DIR = Path(__file__).parent.parent / "evidence"


def ensure_evidence_dir():
    """
    エビデンス保存用ディレクトリを作成
    
    Returns:
        str: タイムスタンプ付きのテストディレクトリパス
    """
    # エビデンスベースディレクトリを作成
    EVIDENCE_BASE_DIR.mkdir(parents=True, exist_ok=True)
    
    # タイムスタンプ付きのサブディレクトリを作成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_dir = EVIDENCE_BASE_DIR / f"test_{timestamp}"
    test_dir.mkdir(parents=True, exist_ok=True)
    
    return str(test_dir)


def save_screenshot(page, test_dir, filename, description=""):
    """
    スクリーンショットを保存し、URLとタイトルをログ出力
    
    Args:
        page: Playwrightのページオブジェクト
        test_dir: エビデンス保存ディレクトリパス
        filename: スクリーンショットのファイル名
        description: スクリーンショットの説明（オプション）
    
    Returns:
        str: 保存したスクリーンショットのファイルパス
    """
    filepath = os.path.join(test_dir, filename)
    page.screenshot(path=filepath, full_page=True)
    print(f"📸 スクリーンショット保存: {filepath}")
    if description:
        print(f"   {description}")
    print(f"   URL: {page.url}")
    print(f"   タイトル: {page.title()}")
    return filepath


def print_test_summary(test_dir):
    """
    テスト完了後のサマリーを表示
    
    Args:
        test_dir: エビデンス保存ディレクトリパス
    """
    print(f"\n{'='*70}")
    print(f"📁 エビデンス保存場所: {test_dir}")
    print(f"\n【テスト観点とエビデンス一覧】")
    print(f"   ①画面表示: 01_idea_page_display.png")
    print(f"   ②ヘルプマーク: 02_help_mark_1_before.png / 02_help_mark_2_after.png")
    print(f"   ③件数変更: 03_idea_count_1_before.png / 03_idea_count_2_after.png")
    print(f"   ④アイデア出し: 04_form_before_submit.png / 04_result_after_creation.png")
    print(f"   ⑤結果調整: 05_adjust_result_1_before.png / 05_adjust_result_2_after.png")
    print(f"   ⑥フィードバック: 06_feedback_1_before.png / 06_feedback_2_after.png")
    print(f"   ⑦編集: 07_edit_1_before.png / 07_edit_2_after.png")
    print(f"   ⑧コピー: 08_copy_1_before.png / 08_copy_2_after.png")
    print(f"   ⑨ダウンロード: 09_download_1_before.png / 09_download_2_after.png")
    print(f"   ⑩プロンプト表示: 10_show_prompt_1_before.png / 10_show_prompt_2_after.png")
    print(f"   ⑪情報クリア: 11_clear_info_1_before.png / 11_clear_info_2_after.png")
    print(f"{'='*70}\n")


def enable_mouse_cursor(page, cursor_size=20, cursor_color="red"):
    """
    マウスカーソルを視覚化する関数
    
    ページにJavaScriptとCSSを注入して、マウスの動きを赤い丸で表示します。
    スクリーンショットやビデオにマウス位置が記録されるようになります。
    
    Args:
        page: Playwrightのページオブジェクト
        cursor_size: カーソルのサイズ（ピクセル、デフォルト: 20）
        cursor_color: カーソルの色（デフォルト: "red"）
    
    Example:
        enable_mouse_cursor(page)  # デフォルト（赤い丸、20px）
        enable_mouse_cursor(page, cursor_size=30, cursor_color="blue")  # 青い丸、30px
    """
    # カスタムカーソル要素を作成するJavaScriptコード
    cursor_script = f"""
    (() => {{
        // 既存のカーソル要素を削除（重複防止）
        const existingCursor = document.getElementById('playwright-mouse-cursor');
        if (existingCursor) {{
            existingCursor.remove();
        }}
        
        // カーソル要素を作成
        const cursor = document.createElement('div');
        cursor.id = 'playwright-mouse-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: {cursor_size}px;
            height: {cursor_size}px;
            border-radius: 50%;
            background-color: {cursor_color};
            opacity: 0.5;
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%);
            transition: opacity 0.15s ease;
        `;
        document.body.appendChild(cursor);
        
        // マウス移動イベントをリスン
        document.addEventListener('mousemove', (e) => {{
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursor.style.opacity = '0.5';
        }});
        
        // クリック時のエフェクト
        document.addEventListener('mousedown', () => {{
            cursor.style.opacity = '0.8';
            cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
        }});
        
        document.addEventListener('mouseup', () => {{
            cursor.style.opacity = '0.5';
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }});
    }})();
    """
    
    try:
        page.evaluate(cursor_script)
        print(f"✓ マウスカーソル表示を有効化しました（サイズ: {cursor_size}px, 色: {cursor_color}）")
    except Exception as e:
        print(f"⚠️  マウスカーソル表示の有効化に失敗: {e}")


def disable_mouse_cursor(page):
    """
    マウスカーソルの視覚化を無効化する関数
    
    Args:
        page: Playwrightのページオブジェクト
    """
    try:
        page.evaluate("""
            (() => {
                const cursor = document.getElementById('playwright-mouse-cursor');
                if (cursor) {
                    cursor.remove();
                }
            })();
        """)
        print("✓ マウスカーソル表示を無効化しました")
    except Exception as e:
        print(f"⚠️  マウスカーソル表示の無効化に失敗: {e}")

