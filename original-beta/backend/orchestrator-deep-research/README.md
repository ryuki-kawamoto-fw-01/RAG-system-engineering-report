`.env` などは適宜設定

## ローカルでの実行方法 (FastAPI)

以下でFastAPIサーバを立ち上げる。

```
fastapi run main.py
```

ブラウザから deep research を実行する場合、

http://localhost:8000/docs#/query/process_query_query__post

にアクセスし、Try it out からクエリを投げて、結果を得ることができる。

```
{
  "query": "string"
}
```

のstringの部分を聞きたい内容に変えてExecute

curlの場合は、以下のコマンドを実行

```
curl -X POST http://localhost:8000/query/ -H "Content-Type: application/json" -d '{"query": "聞きたい内容"}'
```

※curlでエンコーディングの問題が出る場合は Postman などを使う

## ローカルでの実行方法 (Azure Functions)

```
py -3.12 -m venv .venv_functions
.venv_functions\scripts\activate
pip install -r .\requirements.txt
```

```
func start --port 7071
```

```
curl -X POST http://localhost:7071/api/query -H "Content-Type: application/json" -d '{"query": "聞きたい内容"}'
```

※curlでエンコーディングの問題が出る場合は Postman などを使う

### Durable Functions

local.settings.json の Values に以下を入れる

```
  {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "Storage": "UseDevelopmentStorage=true",
  }
```

Azure Storage をローカルでエミュレートするため、azurite をインストール

```
npm install -g azurite
```

func start の前に起動しておく

```
azurite
```

POST実行

```
curl -X POST http://localhost:7071/api/startOrchestrator -H "Content-Type: application/json" -d '{"query":"聞きたい内容"}' -i
```

結果取得

```
curl -X GET http://localhost:7071/api/getResult?instance_id={instance_id}
```

ここで `instance_id` は POST したときに返ってきた id
