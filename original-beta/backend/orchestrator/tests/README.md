# オーケストレーター テスト README

このディレクトリには、オーケストレーターのバックエンド向け Python テストが含まれています。

## 必要要件

- Python 3.12.12
- `backend/orchestrator/tests/.venv` の仮想環境

## セットアップ

仮想環境を作成し、依存関係をインストールします。

```bash
# リポジトリのルートから実行
/home/soma_suzuki/.pyenv/versions/3.12.12/bin/python -m venv backend/orchestrator/tests/.venv
backend/orchestrator/tests/.venv/bin/python -m pip install -r backend/orchestrator/requirements.txt
```

## テスト実行

```bash
backend/orchestrator/tests/.venv/bin/python -m pytest backend/orchestrator/tests/code
```

## 補足

- Pytest 設定: `backend/orchestrator/pytest.ini`
- テストファイルの配置: `backend/orchestrator/tests/code`
