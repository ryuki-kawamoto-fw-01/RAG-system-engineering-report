import tkinter as tk
from tkinter import filedialog, simpledialog
from datetime import datetime
import pandas as pd
import urllib.request
import json

from utils import load_env, get_date_range
from modules.ChatLog import get_chat_log_df
from modules.RagChatLog import get_rag_log_df
from modules.CompanyAnalysisLog import get_company_analysis_df
from modules.CorporateSurveyLog import get_corporate_survey_df
from modules.CreateIdeaLog import get_create_idea_df
from modules.CreateMailLog import get_create_mail_df
from modules.CreateMinuteLog import get_create_minute_df
from modules.CreatePromptLog import get_create_prompt_df
from modules.SummaryLog import get_summary_df
from modules.SupposedQuestionLog import get_supposed_question_df
from modules.TalkScriptLog import get_talk_script_df
from modules.TextCorrectionLog import get_text_correction_df
from modules.TranslationLog import get_translation_df
from modules.Thread import get_thread_df
from modules.ThreadRag import get_threadrag_df

# Cosmos の NotFound などを個別処理するため
try:
    from azure.cosmos import exceptions as cosmos_exceptions
except Exception:
    cosmos_exceptions = None

"""
モデルが更新されるたびに、モデルと入力トークン、出力トークンの価格を追加する。
参考URL
https://azure.microsoft.com/ja-jp/pricing/details/cognitive-services/openai-service/
"""
PRICE_TABLE_USD = {
    "gpt-5": {"input": 1.25, "output": 10.00},
    "gpt-5-reasoning": {"input": 1.25, "output": 10.00},
    "gpt-5-nano": {"input": 0.05, "output": 0.4},
    "gpt-5-mini": {"input": 0.25, "output": 2.0},
    "o3": {"input": 2.0, "output": 8.0},
    "o4-mini": {"input": 1.1, "output": 4.4},
    "gpt-4.1": {"input": 2.0, "output": 8.0},
    "gpt-4.1-mini": {"input": 0.4, "output": 1.6},
    "gpt-4.1-nano": {"input": 0.1, "output": 0.4},
}

def select_log_types():
    """
    チェックボックスでログ種別を複数選択するダイアログを表示。
    正常時: 複数キーのリストを返す（例: ["chat","thread","rag",...]）
    キャンセル時: None を返す。
    """
    # まずはチェックボックスUIを試みる
    try:
        root = tk.Tk()
        root.withdraw()
        win = tk.Toplevel(root)
        win.title("ログ種別選択")
        win.resizable(False, False)
        # 最前面に出して中央配置
        win.lift()
        win.attributes("-topmost", True)
        win.update_idletasks()
        try:
            root.eval(f'tk::PlaceWindow {str(win)} center')
        except Exception:
            pass
        win.after(200, lambda: win.attributes("-topmost", False))

        frame = tk.Frame(win, padx=12, pady=12)
        frame.pack(fill="both", expand=True)

        label = tk.Label(frame, text="取得したいログを選択してください（複数選択可）")
        label.pack(anchor="w", pady=(0, 8))

        v_chat = tk.BooleanVar(value=False)
        v_thread = tk.BooleanVar(value=False)
        v_threadrag = tk.BooleanVar(value=False)
        v_rag = tk.BooleanVar(value=False)
        v_company = tk.BooleanVar(value=False)
        v_corporate = tk.BooleanVar(value=False)
        v_idea = tk.BooleanVar(value=False)
        v_mail = tk.BooleanVar(value=False)
        v_minute = tk.BooleanVar(value=False)
        v_prompt = tk.BooleanVar(value=False)
        v_summary = tk.BooleanVar(value=False)
        v_supposedQuetion = tk.BooleanVar(value=False)
        v_talkScript = tk.BooleanVar(value=False)
        v_textCorrection = tk.BooleanVar(value=False)
        v_translation = tk.BooleanVar(value=False)

        cb1 = tk.Checkbutton(frame, text="チャット（thread/message）", variable=v_chat)
        cb1b = tk.Checkbutton(frame, text="スレッド（thread）", variable=v_thread)
        cb2 = tk.Checkbutton(frame, text="文書検索（thread-rag/message-rag）", variable=v_rag)
        cb2b = tk.Checkbutton(frame, text="文書検索スレッド（threadrag）", variable=v_threadrag)
        cb3 = tk.Checkbutton(frame, text="企業分析（company-analysis）", variable=v_company)
        cb4 = tk.Checkbutton(frame, text="企業調査（corporate-survey）", variable=v_corporate)
        cb5 = tk.Checkbutton(frame, text="アイデア出し（create-idea）", variable=v_idea)
        cb6 = tk.Checkbutton(frame, text="メール作成（create-mail）", variable=v_mail)
        cb7 = tk.Checkbutton(frame, text="議事録作成（create-minute）", variable=v_minute)
        cb8 = tk.Checkbutton(frame, text="プロンプト作成（create-prompt）", variable=v_prompt)
        cb9 = tk.Checkbutton(frame, text="要約（summary）", variable=v_summary)
        cb10 = tk.Checkbutton(frame, text="想定質問（supposed-question）", variable=v_supposedQuetion)
        cb11 = tk.Checkbutton(frame, text="トークスクリプト（talk-script）", variable=v_talkScript)
        cb12 = tk.Checkbutton(frame, text="文章校正（text-correction）", variable=v_textCorrection)
        cb13 = tk.Checkbutton(frame, text="翻訳（translation）", variable=v_translation)

        cb1.pack(anchor="w")
        cb1b.pack(anchor="w")
        cb2.pack(anchor="w")
        cb2b.pack(anchor="w")
        cb3.pack(anchor="w")
        cb4.pack(anchor="w")
        cb5.pack(anchor="w")
        cb6.pack(anchor="w")
        cb7.pack(anchor="w")
        cb8.pack(anchor="w")
        cb9.pack(anchor="w")
        cb10.pack(anchor="w")
        cb11.pack(anchor="w")
        cb12.pack(anchor="w")
        cb13.pack(anchor="w")

        btn_frame = tk.Frame(frame)
        btn_frame.pack(fill="x", pady=(10, 0))

        result = {"selected": None}

        def on_ok():
            sel = []
            if v_chat.get():
                sel.append("chat")
            if v_thread.get():
                sel.append("thread")
            if v_rag.get():
                sel.append("rag")
            if v_threadrag.get():
                sel.append("threadrag")
            if v_company.get():
                sel.append("company")
            if v_corporate.get():
                sel.append("corporate")
            if v_idea.get():
                sel.append("idea")
            if v_mail.get():
                sel.append("mail")
            if v_minute.get():
                sel.append("minute")
            if v_prompt.get():
                sel.append("prompt")
            if v_summary.get():
                sel.append("summary")
            if v_supposedQuetion.get():
                sel.append("supposed_question")
            if v_talkScript.get():
                sel.append("talk_script")
            if v_textCorrection.get():
                sel.append("text_correction")
            if v_translation.get():
                sel.append("translation")
            result["selected"] = sel
            win.destroy()

        def on_cancel():
            result["selected"] = None
            win.destroy()

        ok_btn = tk.Button(btn_frame, text="OK", width=10, command=on_ok)
        cancel_btn = tk.Button(btn_frame, text="キャンセル", width=10, command=on_cancel)
        ok_btn.pack(side="left", padx=(0, 6))
        cancel_btn.pack(side="left")

        win.protocol("WM_DELETE_WINDOW", on_cancel)
        win.transient(root)
        win.grab_set()
        win.focus_force()
        win.deiconify()
        # ダイアログが閉じるまで待機
        win.wait_window()
        root.destroy()

        if result["selected"] is not None:
            return result["selected"]

    except Exception:
        # UI生成で例外が出た場合はフォールバックへ
        pass

    # フォールバック：カンマ区切り入力（GUIが弱い環境・リモートなど）
    try:
        root2 = tk.Tk()
        root2.withdraw()
        text = (
            "取得したいログを選択してください（カンマ区切り、番号）\n"
            "1:チャット 2:文書検索 3:企業分析 4:企業調査 5:アイデア出し 6:メール作成 7:議事録作成\n"
            "8:プロンプト作成 9:要約 10:想定質問 11:トークスクリプト 12:文章校正 13:翻訳 14:スレッド\n"
            "例: 1,3,5"
        )
        ans = simpledialog.askstring("ログ種別入力", text, parent=root2)
        root2.destroy()
        if ans is None:
            return None
        mapping = {
            "1": "chat",
            "2": "rag",
            "3": "company",
            "4": "corporate",
            "5": "idea",
            "6": "mail",
            "7": "minute",
            "8": "prompt",
            "9": "summary",
            "10": "supposed_question",
            "11": "talk_script",
            "12": "text_correction",
            "13": "translation",
            "14": "thread",
            "15": "threadrag",
        }
        sels = []
        for token in ans.replace("、", ",").split(","):
            t = token.strip()
            if t in mapping and mapping[t] not in sels:
                sels.append(mapping[t])
        return sels
    except Exception:
        return None

def main():
    print("start.py: ログ種別選択ダイアログを表示します…")
    selections = select_log_types()
    if selections is None:
        print("キャンセルされました。処理を終了します。")
        return
    if len(selections) == 0:
        print("何も選択されていません。処理を終了します。")
        return

    print(f"選択: {selections}")
    # .env は (URI, DB_MAIN, DB_PROMPT) の3つを返す想定
    uri, database_name, database_name_prompt = load_env()
    if not uri or not database_name or not database_name_prompt:
        print("環境変数の取得に失敗しました。utils.load_env と .env を確認してください。")
        return

    print("日付範囲の入力ダイアログを表示します…")
    start_iso, end_iso = get_date_range()
    if not start_iso and not end_iso:
        print("日付の入力がキャンセルされました。処理を終了します。")
        return

    current_time = datetime.now().strftime("%Y%m%d%H%M")
    name_map = {
        "chat": "ChatToken",
        "thread": "ThreadTitleToken",
        "rag": "RagChatToken",
        "threadrag": "ThreadRagTitleToken",
        "company": "CompanyAnalysisToken",
        "corporate": "CorporateSurveyToken",
        "idea": "CreateIdeaToken",
        "mail": "CreateMailToken",
        "minute": "CreateMinuteToken",
        "prompt": "CreatePromptToken",
        "summary": "SummaryToken",
        "supposed_question": "SupposedQuestionToken",
        "talk_script": "TalkScriptToken",
        "text_correction": "TextCorrectionToken",
        "translation": "TranslationToken",
    }
    if len(selections) == 1:
        key = selections[0]
        default_filename = f"{name_map.get(key, 'Token')}_{current_time}.xlsx"
    else:
        default_filename = f"CombinedToken_{current_time}.xlsx"

    print("保存先の選択ダイアログを表示します…")
    root3 = tk.Tk()
    root3.withdraw()
    root3.lift()
    root3.attributes("-topmost", True)
    save_path = filedialog.asksaveasfilename(
        parent=root3,
        defaultextension=".xlsx",
        initialfile=default_filename,
        filetypes=[("Excel file", "*.xlsx")],
        title="保存先を選択してください"
    )
    try:
        root3.after(1, lambda: root3.attributes("-topmost", False))
    except Exception:
        pass
    root3.destroy()

    if not save_path:
        print("保存がキャンセルされました。処理を終了します。")
        return

    print("データ取得を開始します…")
    dfs = {}
    errors = []

    # ログ種別ごとに優先DBを定義（不明なものは prompt → main の順でフォールバック）
    def db_try_order(key: str):
        if key in ("chat", "rag", "thread", "thread-rag"):
            return [database_name]
        if key in ("company", "corporate", "idea", "mail", "minute", "prompt",
                   "summary", "supposed_question", "talk_script", "text_correction", "translation"):
            return [database_name_prompt, database_name]
        return [database_name, database_name_prompt]

    # 取得ヘルパー（DBフォールバックと NotFound 吸収）
    def fetch_with_db_fallback(key, label, sheet_name, func):
        tried = []
        for dbname in db_try_order(key):
            tried.append(dbname)
            try:
                df = func(uri, dbname, start_iso, end_iso)
                if df is not None and not df.empty:
                    dfs[sheet_name] = df
                return
            except Exception as e:
                if cosmos_exceptions and isinstance(e, cosmos_exceptions.CosmosResourceNotFoundError):
                    # 次の DB を試す
                    continue
                else:
                    msg = f"{label} 取得中にエラー: {e}"
                    print(msg)
                    errors.append(msg)
                    return
        # ここまで来たら両DBで見つからず
        msg = f"{label} のコンテナ/DB が見つかりませんでした。試行DB: {tried}"
        print(msg)
        errors.append(msg)

    try:
        if "chat" in selections:
            fetch_with_db_fallback("chat", "Chat", "ChatLog", get_chat_log_df)
        if "thread" in selections:
            fetch_with_db_fallback("thread", "Thread", "Thread", get_thread_df)
        if "rag" in selections:
            fetch_with_db_fallback("rag", "RAG", "RagChatLog", get_rag_log_df)
        if "threadrag" in selections:
            fetch_with_db_fallback("thread-rag", "Thread-Rag", "Thread_Rag", get_threadrag_df)
        if "company" in selections:
            fetch_with_db_fallback("company", "CompanyAnalysis", "CompanyAnalysis", get_company_analysis_df)
        if "corporate" in selections:
            fetch_with_db_fallback("corporate", "CorporateSurvey", "CorporateSurvey", get_corporate_survey_df)
        if "idea" in selections:
            fetch_with_db_fallback("idea", "CreateIdea", "CreateIdea", get_create_idea_df)
        if "mail" in selections:
            fetch_with_db_fallback("mail", "CreateMail", "CreateMail", get_create_mail_df)
        if "minute" in selections:
            fetch_with_db_fallback("minute", "CreateMinute", "CreateMinute", get_create_minute_df)
        if "prompt" in selections:
            fetch_with_db_fallback("prompt", "CreatePrompt", "CreatePrompt", get_create_prompt_df)
        if "summary" in selections:
            fetch_with_db_fallback("summary", "Summary", "Summary", get_summary_df)
        if "supposed_question" in selections:
            fetch_with_db_fallback("supposed_question", "SupposedQuestion", "SupposedQuestion", get_supposed_question_df)
        if "talk_script" in selections:
            fetch_with_db_fallback("talk_script", "TalkScript", "TalkScript", get_talk_script_df)
        if "text_correction" in selections:
            fetch_with_db_fallback("text_correction", "TextCorrection", "TextCorrection", get_text_correction_df)
        if "translation" in selections:
            fetch_with_db_fallback("translation", "Translation", "Translation", get_translation_df)
    except Exception:
        import traceback
        print("データ取得中にエラーが発生しました。")
        traceback.print_exc()
        return

    # トークン集計（ユーザー名×モデル）
    def normalize_for_token_agg(df):
        cols = df.columns.tolist()
        # 必須: ユーザー名
        user_col = None
        for c in ["ユーザー名"]:
            if c in cols:
                user_col = c
                break
        if not user_col:
            return None
        # モデル列の推定
        model_col = None
        for c in ["モデル"]:
            if c in cols:
                model_col = c
                break
        if not model_col:
            return None
        # トークン列の推定
        in_col = None
        for c in ["入力トークン"]:
            if c in cols:
                in_col = c
                break
        out_col = None
        for c in ["出力トークン"]:
            if c in cols:
                out_col = c
                break

        if not in_col and not out_col:
            return None

        use_cols = [user_col, model_col]
        if in_col:
            use_cols.append(in_col)
        if out_col:
            use_cols.append(out_col)

        sub = df[use_cols].copy()
        rename_map = {user_col: "ユーザー名", model_col: "モデル"}
        if in_col:
            rename_map[in_col] = "入力トークン"
        if out_col:
            rename_map[out_col] = "出力トークン"
        sub = sub.rename(columns=rename_map)
        # 列が存在しない場合は作成
        for c in ["入力トークン", "出力トークン"]:
            if c not in sub.columns:
                sub[c] = pd.NA
        # 数値化（非数は NaN）
        for c in ["入力トークン", "出力トークン"]:
            sub[c] = pd.to_numeric(sub[c], errors="coerce")

        # 集計キーの欠損は空文字で統一
        sub["ユーザー名"] = sub["ユーザー名"].fillna("")
        sub["モデル"] = sub["モデル"].fillna("")

        return sub[["ユーザー名", "モデル", "入力トークン", "出力トークン"]]

    token_parts = []
    for sheet_name, df in dfs.items():
        norm = normalize_for_token_agg(df)
        if norm is not None and not norm.empty:
            token_parts.append(norm)

    if token_parts:
        all_tokens = pd.concat(token_parts, ignore_index=True)
        token_summary = (
            all_tokens
            .groupby(["ユーザー名", "モデル"], dropna=False)[["入力トークン", "出力トークン"]]
            .sum(min_count=1)
            .reset_index()
            .sort_values(["ユーザー名", "モデル"], kind="stable")
        )

        token_summary["入力トークン"] = token_summary["入力トークン"].fillna(0)
        token_summary["出力トークン"] = token_summary["出力トークン"].fillna(0)

        price_df = (
            pd.DataFrame.from_dict(PRICE_TABLE_USD, orient="index")
            .reset_index()
            .rename(columns={"index": "モデル", "input": "単価_入力($/100万t)", "output": "単価_出力($/100万t)"})
        )

        token_summary = token_summary.merge(price_df, on="モデル", how="left")

        token_summary["単価_入力($/100万t)"] = token_summary["単価_入力($/100万t)"].fillna(0.0)
        token_summary["単価_出力($/100万t)"] = token_summary["単価_出力($/100万t)"].fillna(0.0)

        # 追加計算: 入力/出力金額($)、合計金額($)
        token_summary["入力金額($)"] = (token_summary["入力トークン"] / 1_000_000.0) * token_summary["単価_入力($/100万t)"]
        token_summary["出力金額($)"] = (token_summary["出力トークン"] / 1_000_000.0) * token_summary["単価_出力($/100万t)"]
        token_summary["合計金額($)"] = token_summary["入力金額($)"] + token_summary["出力金額($)"]

        # 為替レート（USD->JPY）をAPIから取得（失敗時は150.0でフォールバック）
        def fetch_usd_jpy_rate(default_rate=150.0, timeout=5):
            try:
                # 無料枠のAPIのため、前日時点のレートを取得
                url = "https://api.frankfurter.app/latest?from=USD&to=JPY"
                with urllib.request.urlopen(url, timeout=timeout) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                rate = data.get("rates", {}).get("JPY", None)
                if isinstance(rate, (int, float)) and rate > 0:
                    print("取得した為替相場は",float(rate))
                    return float(rate)
            except Exception:
                pass
            print("為替取得失敗したため、デフォルトの為替金額で計算します。ドル→円の為替は：",float(default_rate))
            return float(default_rate)

        USD_TO_JPY = fetch_usd_jpy_rate()

        # 円建て金額を追加
        token_summary["入力金額(￥)"] = token_summary["入力金額($)"] * USD_TO_JPY
        token_summary["出力金額(￥)"] = token_summary["出力金額($)"] * USD_TO_JPY
        token_summary["合計金額(￥)"] = token_summary["合計金額($)"] * USD_TO_JPY

        # 列順: 単価の右に金額列（$ と ￥）を配置
        token_summary = token_summary[
            [
                "ユーザー名",
                "モデル",
                "入力トークン",
                "出力トークン",
                "単価_入力($/100万t)",
                "単価_出力($/100万t)",
                "入力金額($)",
                "出力金額($)",
                "合計金額($)",
                "入力金額(￥)",
                "出力金額(￥)",
                "合計金額(￥)",
            ]
        ]

        dfs["TokenSummary"] = token_summary

    if len(dfs) == 0:
        if len(errors) > 0:
            print("取得に失敗したログがあります。上記エラーメッセージをご確認ください。")
        else:
            print("指定した日付範囲に該当するデータはありません。")
        return

    print("Excel 出力を開始します…")
    try:
        with pd.ExcelWriter(save_path, engine="xlsxwriter") as writer:
            for sheet_name, df in dfs.items():
                df.to_excel(writer, index=False, sheet_name=sheet_name)
        print(f"Excelファイルを出力しました: {save_path}")
    except Exception:
        import traceback
        print("Excel 出力中にエラーが発生しました。")
        traceback.print_exc()

if __name__ == "__main__":
    try:
        print("start.py: main() を起動します")
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        try:
            input("エラーが発生しました。Enter キーで終了します…")
        except Exception:
            pass
