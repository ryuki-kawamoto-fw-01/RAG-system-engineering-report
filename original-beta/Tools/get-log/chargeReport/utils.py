import os
from datetime import datetime, timedelta
from tkinter import Tk, simpledialog, messagebox
from dotenv import load_dotenv
import re

def load_env():
    load_dotenv()
    uri = os.getenv("URI")
    database_name = os.getenv("DATABASE_NAME")
    database_name_prompt = os.getenv("DATABASE_NAME_PROMPT")
    return uri, database_name , database_name_prompt

def get_strict_date_input(prompt):
    pattern = r"^\d{4}-\d{2}-\d{2}$"
    root = Tk()
    root.withdraw()
    while True:
        date_str = simpledialog.askstring(prompt, f"{prompt}を入力してください（例: 2025-08-01）")
        if not date_str:
            return None
        if not re.match(pattern, date_str):
            messagebox.showerror("入力エラー", "日付の形式が正しくありません。\n例: 2025-08-01 のように入力してください。")
            continue
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt
        except ValueError:
            messagebox.showerror("入力エラー", "存在しない日付です。\n例: 2025-08-01 のように入力してください。")
            continue

def to_iso8601(dt):
    if not dt:
        return None
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")

def get_date_range():
    start_dt = get_strict_date_input("開始日")
    end_dt = get_strict_date_input("終了日")
    start_iso = to_iso8601(start_dt)
    if end_dt:
        end_dt_ = end_dt + timedelta(days=1) - timedelta(milliseconds=1)
        end_iso = end_dt_.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    else:
        end_iso = None
    return start_iso, end_iso
