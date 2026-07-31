使用方法
①Pythonコードが実行できるローカル環境にaisearch_jsonmakerフォルダを置いてください。pip installは不要です。

②replacements.csvファイルを編集し、各inputフォルダに格納してください。
excelで作成を推奨します。
作成するcsvは「replacements.csv」から命名を変更しないでください。
サンプルデータが既に3行はいっているので、参考にして置き換えてください。
1行目は変更しないでください。

各々、以下の値で作成をお願いします。


index

    index_name:インデックス名

    以下は基本的にデフォルト値のままでOK
    vector_profile_name
    semantic_name
    algorithm_name
    vectorizer_name

    aoai_name:エンベディングモデルがデプロイされているAzure OpenAIのリソース名

    deployment_id:エンベディングモデルのデプロイ名


indexer

    indexer_name:インデクサー名
    data_source_name:データソース名
    skillset_name:スキルセット名
    target_index_name:インデックス名


datasource

    data_source_name:データソース名
    storage_account_resource_id:ストレージアカウント＞エンドポイント＞ストレージ アカウント リソース IDにある値
    container_name:４つ目のマークダウンのコンテナ名
    folder_name:フォルダ名（子インデックスの場合）


skillset
    
    skillset_name:スキルセット名
    openai_resource_name:エンベディングモデルがデプロイされているAzure OpenAIのリソース名
    openai_deployment_id:エンベディングモデルのデプロイ名
    index_name:インデックス名


③Pyファイルをそれぞれ実行

④outputにzipファイルが格納される