import os
from tkinter import Tk, filedialog, messagebox

import chardet
import pandas as pd
from azure.cosmos import CosmosClient, exceptions
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv

# 実行時は以下のライブラリをインストールする必要がある
# pip install azure-cosmos python-dotenv chardet pandas

# .envファイルの読み込み
load_dotenv()

# Cosmos DBの接続情報
URI = os.getenv("URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
CONTAINER_NAME = "dictionary"

# Azure Cosmos DBへの接続設定
credential = DefaultAzureCredential()
cosmos_client = CosmosClient(URI, credential=credential)
database = cosmos_client.get_database_client(DATABASE_NAME)
container = database.get_container_client(CONTAINER_NAME)
print("辞書機能のCSVファイルをCosmosDBに登録します。")

# ファイル選択ダイアログの表示
print("辞書機能のCSVファイルを選択してください。")
root = Tk()
root.withdraw()
file_path = filedialog.askopenfilename(
    title="辞書機能のCSVファイルを選択してください", filetypes=[("CSV files", "*.csv")]
)

if not file_path:
    messagebox.showerror("エラー", "CSVファイルが選択されていません。")
    exit()

# ファイルのエンコーディングを検出
with open(file_path, "rb") as f:
    result = chardet.detect(f.read())
encoding = result["encoding"]

# CSVファイルの読み込み
df = pd.read_csv(file_path, encoding=encoding)

# 必須項目のチェック
errors = []
for index, row in df.iterrows():
    if pd.isna(row["ID"]):
        errors.append(f"{index + 2}行目：IDの値を入力してください。")
    if pd.isna(row["日付"]):
        errors.append(f"{index + 2}行目：日付の値を入力してください。")
    if pd.isna(row["カテゴリ"]):
        errors.append(f"{index + 2}行目：カテゴリの値を入力してください。")
    if pd.isna(row["用語"]):
        errors.append(f"{index + 2}行目：用語の値を入力してください。")
    if pd.isna(row["統一名称"]):
        errors.append(f"{index + 2}行目：統一名称の値を入力してください。")
    if pd.isna(row["説明"]):
        errors.append(f"{index + 2}行目：説明の値を入力してください。")

if errors:
    messagebox.showerror("エラー", "\n".join(errors))
    exit()

# コンテナ内のすべてのアイテムを削除
print("既存のデータを削除しています...")
for item in container.query_items(query="SELECT * FROM c", enable_cross_partition_query=True):
    container.delete_item(item, partition_key=item["category"])
print("既存のデータを削除しました。")

# データの登録
for index, row in df.iterrows():
    item = {
        "id": str(row["ID"]),
        "date": row["日付"],
        "category": row["カテゴリ"],
        "terms": row["用語"].split(','),  # 用語をカンマで分割してリストに変換
        "uniform_name": row["統一名称"],
        "description": row["説明"],
    }
    try:
        container.create_item(body=item)
        print(f"ID= {row['ID']} のデータを登録しました。")
    except exceptions.CosmosHttpResponseError as e:
        print(f"ID= {row['ID']} のデータの登録に失敗しました: {e.message}")

print("辞書機能のDB登録が完了しました。")

items = list(container.read_all_items())
df2 = pd.DataFrame(items)
print("【DB登録内容】")
print(df2)
print("【DBカラム名一覧】")
print(df2.columns)
print("【DBカラムデータ型】")
print(df2.dtypes)
