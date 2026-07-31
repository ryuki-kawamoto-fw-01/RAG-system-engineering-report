# 辞書登録で使用するメソッド群
import logging
import os
import time

import editdistance as ed
import MeCab
import neologdn
import pandas as pd
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

from modules import romkan

myomi = MeCab.Tagger(
    "-r /home/site/wwwroot/.python_packages/lib/site-packages/ipadic/dicdir/mecabrc -d /home/site/wwwroot/.python_packages/lib/site-packages/ipadic/dicdir -Oyomi"
)

# CosmosDBの設定
database_uri = os.environ["AZURE_COSMOSDB_URI"]
database_name = os.environ["AZURE_COSMOSDB_DATABASE_NAME"]
container_name = os.environ["AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME"]


# 辞書登録関数
def dictionary_registration(user_message):
    # CosmosDBから辞書データを読み込む
    start_time = time.time()
    dictionary_df = read_cosmosdb(database_uri, database_name, container_name)
    end_time = time.time()
    # 辞書データの読み込み時間を計算
    read_db_loading_time = round(end_time - start_time, 3)
    logging.info(f"Read CosmosDB time: {read_db_loading_time} seconds")

    terms = "terms"
    uniform_name = "uniform_name"
    description = "description"
    threshold = 0.1
    dict_add_description = True

    # 表記揺れ補正
    # ユーザの質問文対して辞書を用いて表記揺れを補正
    # ひらがな、カタカナ、漢字、半角、全角、スペースなどのわずかな違いを吸収
    start_time = time.time()
    user_message_rev, used_dictionary_ids = inconsistency_collector_robust(
        tar_question=user_message,  # ユーザの質問文
        dictionary=dictionary_df,  # 辞書データを含むPandasのDataFrame
        threshold=threshold,  # 編集距離の閾値
        verbose=True,  # ログ出力の有無
        verbose_detail=False,  # 詳細ログ出力の有無
        is_add_description=dict_add_description,  # 置き換えた表現の説明文を追加
        terms=terms,  # 辞書の用語列名
        uniform_name=uniform_name,  # 辞書の統一表現列名
        description=description,  # 辞書の説明文列名
    )
    end_time = time.time()
    # 表記揺れ補正の処理時間を計算
    dictionary_processing_time = round(end_time - start_time, 3)
    logging.info(f"Dictionary Processing time: {dictionary_processing_time} seconds")

    logging.info(f"user_message: {user_message}")
    logging.info(f"user_message_rev: {user_message_rev}")
    return (
        user_message_rev,
        used_dictionary_ids,
        read_db_loading_time + dictionary_processing_time,
    )


# CosmosDBから辞書データを読み込む関数
def read_cosmosdb(database_uri, database_name, container_name):
    # Cosmos DBクライアントの作成
    credential = DefaultAzureCredential()
    client = CosmosClient(database_uri, credential=credential)
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)
    
    start_time = time.time()
    query = f"SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)"
    end_time = time.time()
    read_db_loading_time = round(end_time - start_time, 3)
    logging.info(f"Read CosmosDB time: {read_db_loading_time} seconds")
    items = list(container.query_items(query=query, enable_cross_partition_query=True))

    df = pd.DataFrame(items)

    # デバッグ情報をログに出力
    logging.info(f"CosmosDBから取得した辞書データ: {len(df)}件")
    if not df.empty:
        logging.info(f"カラム名: {list(df.columns)}")
        logging.info(
            f"最初の行のサンプル: {df.iloc[0].to_dict() if len(df) > 0 else 'データなし'}"
        )

    return df


# 表記揺れ補正関数
# 表記揺れ自動変換：揺れ吸収（ひらがな・カタカナ・漢字・半角・全角・スペースなどわずかな違い吸収）版
def inconsistency_collector_robust(
    tar_question="",  # ユーザの質問文
    dictionary=pd.DataFrame(),  # 辞書データを含むPandasのDataFrame
    threshold=0.1,  # 編集距離の閾値
    verbose=True,  # ログ出力の有無
    terms="terms",  # 辞書の用語列名
    uniform_name="UniformName",  # 辞書の統一表現列名
    description="Description",  # 辞書の説明文列名
    verbose_detail=False,  # 詳細ログ出力の有無
    is_add_description=True,  # 置き換えた表現の説明文を追加
    id_name="id",  # 辞書のID列名
):
    # 変換後の対象質問文
    conv_question = tar_question
    # 変換結果をまとめたDataFrame
    result_df = pd.DataFrame(
        columns=[
            "検出語句",
            "辞書語句(" + terms + ")",
            "統一語句(" + uniform_name + ")",
        ]
    )
    # 用語の説明文を追加するis_add_descriptionがTrueの場合に使用
    additional_description = ""
    keyword = ""
    # 使用された辞書IDのリストを保存
    used_dictionary_ids = []

    # 辞書データが空でないかチェック
    if dictionary.empty:
        logging.warning("辞書データが空です")
        return tar_question, used_dictionary_ids

    # 真面目に辞書をfor文で回して（統一表現において、一定の揺らぎを吸収した上で）該当する表現があれば置換
    for key, value in dictionary.iterrows():
        # 必要なカラムが存在するかチェック
        if terms not in value or uniform_name not in value:
            if verbose_detail:
                logging.warning(f"辞書データに必要なカラムが不足しています。行: {key}")
            continue

        # 辞書の対象語句
        tar_dict_txt_list = value[terms]
        if not isinstance(tar_dict_txt_list, list):
            tar_dict_txt_list = [tar_dict_txt_list]

        dictionary_used = False
        for tar_dict_txt in tar_dict_txt_list:
            if not isinstance(tar_dict_txt, str):
                tar_dict_txt = str(tar_dict_txt)
            # 対象語句を統一ローマ字表現に変換
            conv_tar_dict_txt = jp2roma(format_text(tar_dict_txt))
            # 置き換えしたい正式名称
            tar_univorm_name_dict_txt = value[uniform_name]
            # 用語の説明文を追加するis_add_descriptionがTrueの場合に使用
            description_is_not_added = True

            # 辞書の対象語句と同じ長さのウィンドウで対象質問文を区切り、ローマ字統一表現において一致を検査
            partial_questions = []
            split_num = len(tar_question) - len(tar_dict_txt)
            if split_num < 0:
                partial_questions.append(tar_question)
            else:
                for i in range(split_num + 1):
                    partial_questions.append(tar_question[i : i + len(tar_dict_txt)])
            if verbose_detail:
                logging.info("◆ tar_dict_txt      :" + tar_dict_txt)
                logging.info("   tar_question      :" + tar_question)
                logging.info("   partial_questions :" + str(partial_questions))

            # 質問文の中に辞書の語句と一致する箇所が存在するかローマ字統一表記を用いて判定
            similar_texts = []
            # 最も類似度の高かった箇所の保存
            (
                most_similar_partial_question,
                most_similar_tar_dict_txt,
                most_similar_dist,
            ) = (
                "",
                "",
                10000,
            )
            most_similar_conv_partial_question, most_similar_conv_tar_dict_txt = "", ""
            for partial_question in partial_questions:
                # 対象部分質問文を統一ローマ字表現に変換
                conv_partial_question = jp2roma(format_text(partial_question))
                # ローマ字統一表現において編集距離を比較し、閾値以内であれば一致を判断
                dist = text_dist(
                    text1=conv_tar_dict_txt,
                    text2=conv_partial_question,
                    is_normalize=True,
                )
                # 欲しい情報は元のテキストにおける該当箇所
                if dist < threshold:
                    similar_texts.append(partial_question)
                if dist < most_similar_dist:
                    most_similar_partial_question = partial_question
                    most_similar_tar_dict_txt = tar_dict_txt
                    most_similar_conv_partial_question = conv_partial_question
                    most_similar_conv_tar_dict_txt = conv_tar_dict_txt
                    most_similar_dist = dist
            if verbose_detail:
                print("partial_question      :" + most_similar_partial_question)
                print("tar_dict_txt          :" + most_similar_tar_dict_txt)
                print("conv_partial_question :" + most_similar_conv_partial_question)
                print("conv_tar_dict_txt     :" + most_similar_conv_tar_dict_txt)
                print("dist                  :" + str(most_similar_dist) + "\n")
            # 置換する際は、元の表現に対して実施  similar_textは、元の文章の部分表現であることが求められる、どうしたものか, 未実装
            for similar_text in similar_texts:
                conv_question = conv_question.replace(
                    similar_text, tar_univorm_name_dict_txt
                )
                # オプション機能：置き換えた表現の説明文も追加
                if is_add_description and description_is_not_added:
                    if description in value and uniform_name in value:
                        additional_description += (
                            value[uniform_name] + "は" + value[description]
                        )
                        keyword = value[terms]
                        description_is_not_added = False
                    else:
                        if verbose_detail:
                            logging.warning(
                                f"説明文カラム '{description}' が存在しません"
                            )
            # 結果テーブルにレコードを追加
            if verbose and len(similar_texts) > 0:
                record = pd.Series(
                    [similar_texts, tar_dict_txt, tar_univorm_name_dict_txt],
                    index=result_df.columns,
                )
                result_df = pd.concat(
                    [result_df, record.to_frame().T], ignore_index=True
                )
            if len(similar_texts) > 0:
                dictionary_used = True
        if dictionary_used:
            if id_name in value:
                used_dictionary_ids.append(str(value[id_name]))
            else:
                if verbose_detail:
                    logging.warning(f"IDカラム '{id_name}' が存在しません")

    if verbose:
        logging.info(result_df)
    # 用語の説明文を追加するis_add_descriptionがTrueの場合に説明文を追記
    user_message_rev = f"""
    
    {conv_question}

    ## キーワード
    {keyword}

    ## 補足情報
    {additional_description}
    """

    return user_message_rev, used_dictionary_ids


# 日本語文字（ひらがな・カタカナ・漢字）をローマ字に統一変換　※同音異義語には注意
def jp2roma(text):
    # 最後の改行コードを除く
    text = myomi.parse(text)[:-1]
    text = romkan.to_roma(text)
    # カナの切れ目に挿入されるアポストロフィを削除
    text = text.replace("'", "")
    # 小文字統一
    text = text.lower()
    text = text.replace("。", ".")
    text = text.replace("、", ",")
    text = text.replace("．", ".")
    text = text.replace("，", ",")
    return text


# 全角ローマ字を半角ローマ字に置換
def format_text(text):
    text = neologdn.normalize(text)
    text = text.lower()
    return text


# text1の長さで規格化した編集距離  ※text1 or text2の文字数が０の場合は固定値（長めの値）を返す
def text_dist(text1, text2, is_normalize=False):
    max_length = max(len(text1), len(text2))
    min_length = min(len(text1), len(text2))
    # 片方、もしくは両方の文字数が0の場合は長い方の文字長をそのまま返す
    if min_length == 0:
        return max_length
    dist = ed.eval(text1, text2)
    if is_normalize:
        return dist / max_length
    else:
        return dist
