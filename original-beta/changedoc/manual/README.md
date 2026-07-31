# バックエンド概要

動画 (Azure Blob) を入力として、キーフレーム画像（スクリーンショット）・トランスクリプト等を抽出し、LLM により手順説明を生成することで、Excel / Word / Markdown の手順書を出力する。

## 主な処理フロー

1. 「動画 URL（Blob）」 、「閾値」、「LLMによる画像重複削除可否フラグ」をAPI経由にて取得
2. Azure Content Understanding で解析（transcript / keyframe / fields の情報取得）
3. キーフレーム画像取得（Azure Content Understanding）
4. 画像のベクトル化（Azure Computer Vision）
5. 類似画像削除（LLMによる自動削除 or 閾値指定）
6. LLM にて、画像に対する手順を生成（既存出力があれば再利用）
7. Excel / Word / Markdown を生成
8. 生成物と参照画像を Blob へアップロード
9. 一時ファイルクリーンアップ

## 類似画像削除ロジック概要

1. 各キーフレーム画像をベクトル化
2. 閾値以上の類似度の画像を除外
3. ``is_auto_threshold`` が``true``の場合は、LLMにて類似画像削除

---

## 環境準備

### 前提

- Python 3.12 推奨
- 仮想環境利用推奨

### 仮想環境作成

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### ライブラリインストール

```powershell
pip install -r requirements.txt
```

### 環境変数

`.env.sample` をコピーして `.env` を作成し、値を設定してください。

```powershell
cp .env.sample .env
```

---

### APIエンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `ideathon_content_understanding_fn` | 動画 URL 、閾値、LLMによる画像重複削除可否フラグを受け取り手順書生成 |

リクエスト Body (例):

```json
{
	"url": "https://<account>.blob.core.windows.net/<container>/<path>/<video>.mp4",
	"similarity_threshold": -2.0,
	"is_auto_threshold": true
}
```

`similarity_threshold`:

- `0.0未満および1.0より大きい値` 自動判定
- `0.0〜1.0` 固定閾値（大きいほど厳しく画像を絞る）

`is_auto_threshold`:

- `true` LLMによる重複削除（`similarity_threshold`は必ず、`0.0未満および1.0より大きい値`）
- `false` similarity_thresholdで指定した閾値による重複削除（`similarity_threshold`は必ず、`0.0〜1.0`）

出力形式: 

```json
{
	"excelFileURL": excel_url, 
	"wordFileURL": word_url, 
	"markdownFileURL": markdown_url
} 
```

- ``excelFileURL``: excelファイルのblob storage上のURL
- ``wordFileURL``: wordファイルのblob storage上のURL
- ``markdownFileURL``: markdownファイルのblob storage上のURL
---

## テスト

### テスト用インストール

```powershell
pip install pytest pytest-cov
```

### 実行

```powershell
pytest ./tests --cov=modules --cov-report=term-missing --cov-report=html
```

HTML レポート: `htmlcov/index.html`

---

## Linter / Formatter / 型チェック

### インストール

```powershell
pip install black isort flake8 mypy
```

### 一括 (Makefile 利用)

```powershell
make lint
```

### 個別実行

```powershell
black .
isort .
flake8 .
mypy .
```

---

## 出力ファイル (Blob 内配置例)

| 種別 | パス例 |
|------|--------|
| Content Understandingの結果 | `<session-id>/content_understanding-cu-result.json` |
| 全てのキーフレーム | `<session-id>/keyframes` |
| 画像ベクトル | `<session-id>/image_vectors.npz` |
| 画像 & LLMの出力手順 | `<session-id>/output.json` |
| Excel | `<session-id>/excels/<timestamp>-guideline.xlsx` |
| Word | `<session-id>/words/<timestamp>-guideline.docx` |
| Markdown | `<session-id>/markdowns/<timestamp>-guideline.md` |
| 画像 (Markdown 用) | `<session-id>/markdowns/<timestamp>-images/<image>.jpg` |

---

## トラブルシュート

| 症状 | 対応 |
|------|------|
| 類似画像が多すぎる | 閾値を低めに設定 (例: 0.9) |
| 画像が少なすぎる | 閾値を上げる (例: 0.99) または自動判定に戻す (-2.0) |

---

## よく使うコマンド集

```powershell
# 仮想環境
python -m venv .venv; .\.venv\Scripts\Activate.ps1

# 依存関係
pip install -r requirements.txt

# Lint & Test
make lint
pytest ./tests --cov=modules --cov-report=term-missing --cov-report=html
```
