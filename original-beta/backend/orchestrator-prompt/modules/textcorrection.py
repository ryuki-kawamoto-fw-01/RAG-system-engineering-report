import os

from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential


def judge_document_type(document_type):
    # 文章用途を補正
    if document_type == "customer_email":
        document_type = "顧客宛てのメールを想定している。ビジネスマナーを守り、丁寧な記述が求められる。"
    elif document_type == "customer_proposal":
        document_type = "顧客に提出する提案書を想定している。論理的な記述や正確な記述、分かりやすい記述が求められる。"
    elif document_type == "customer_brochure":
        document_type = "顧客に提示するパンフレットを想定している。少しでも顧客に興味を持ってもらえるような内容が求められる。"
    elif document_type == "contract":
        document_type = "顧客に提出する契約書を想定している。サービス責任範囲を決める大事な資料なので、正確な記述が求められる。"
    elif document_type == "report":
        document_type = "社内外に提出する報告書を想定している。状況の正確な記述と論理的な記述が求められる。"
    elif document_type == "minutes":
        document_type = "社内外に提出する議事録を想定している。会議の内容が簡単に理解できるよう、分かりやすい記述が求められる。"
    elif document_type == "presentation_material":
        document_type = "社内外の発表資料を想定している。専門的な内容を正確かつ分かりやすく伝えるための論理的な構成と視覚的な工夫が求められる。"
    elif document_type == "internal_email":
        document_type = "社内の人宛てのメールを想定している。顧客向けのメールと比べると多少フランクな記述でも問題ない。"
    elif document_type == "internal_document":
        document_type = "社内向けの会議で利用する資料を想定している。ある程度社内用語があっても問題ない。"

    return document_type


def judge_check_points(check_points):
    # チェック観点を補正
    if "誤字脱字" in check_points:
        check_points = check_points.replace(
            "誤字脱字", "誤字脱字：漢字の表記ミスや送り仮名の抜けをチェックする。"
        )
    if "文法間違い" in check_points:
        check_points = check_points.replace(
            "文法間違い",
            "文法間違い：主語と述語がつながっていないなど文法的なミスがないかチェックする。",
        )
    if "同音異義語の表記ミス" in check_points:
        check_points = check_points.replace(
            "同音異義語の表記ミス",
            "同音異義語の表記ミス：同音異義語の漢字表記があっているのかチェックする。",
        )
    if "助詞の選択ミス" in check_points:
        check_points = check_points.replace(
            "助詞の選択ミス",
            "格助詞、接続助詞、副助詞が適切に使用されているのかチェックする。",
        )
    if "文体の統一" in check_points:
        check_points = check_points.replace(
            "文体の統一",
            "文体の統一：「です、ます」調と「だ、である」調が混在されていないかチェックする。文書の用途に応じてどちらかに統一する。",
        )
    if "一文の長さ" in check_points:
        check_points = check_points.replace(
            "一文の長さ",
            "一文の長さ：一文の長さが適切かをチェックする。一文が長すぎたら二文に分割したり、表現を変えて短縮するようにする。",
        )
    if "段落構成" in check_points:
        check_points = check_points.replace(
            "段落構成", "段落構成：段落構成が適切かチェックし、修正する。"
        )
    if "半角、全角の統一" in check_points:
        check_points = check_points.replace(
            "半角、全角の統一",
            "半角、全角の統一：英数字や句読点、かっこ類、感嘆符について表記が統一されているかチェックする。半角、全角どちらかに統一する。",
        )
    if "文書の用途に適した記述" in check_points:
        check_points = check_points.replace(
            "文書の用途に適した記述",
            "文書の用途に適した記述：文書の用途に適したトーン、記載がされているのかチェックする。",
        )
    if "論理的な記述" in check_points:
        check_points = check_points.replace(
            "論理的な記述", "論理的な記述：論理の飛躍がないかチェックする。"
        )
    if "読みやすさ" in check_points:
        check_points = check_points.replace(
            "読みやすさ",
            "読みやすさ：回りくどい表現など読みにくい文章になっていないかチェックする。",
        )
    if "文章のトーンの統一" in check_points:
        check_points = check_points.replace(
            "文章のトーンの統一",
            "文章のトーンの統一：文章のトーン（語り口）が統一されているかチェックする。硬い文面とフランクな文面が混在しているような場合には、文章全体でどちらかに統一する。",
        )
    if "表記ゆれ" in check_points:
        check_points = check_points.replace(
            "表記ゆれ",
            "表記ゆれ：同じ意味で異なる表現や用語の不統一を検出して統一する。",
        )
    if "差別語、不快語の使用" in check_points:
        check_points = check_points.replace(
            "差別語、不快語の使用",
            "差別語、不快語の使用：文中で意図せず差別語や不快語を使っていないかチェックする。使用されていたら是正する。",
        )

    # check_pointsの,を改行に変換
    check_points = check_points.replace(",", "\n")

    return check_points


def convert_term_into_uniform_name(text):
    database_uri = os.environ["AZURE_COSMOSDB_URI"]
    database_name = os.environ["AZURE_COSMOSDB_DATABASE_NAME"]
    container_name = os.environ["AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME"]

    credential = DefaultAzureCredential()
    client = CosmosClient(database_uri, credential=credential)
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)
    dictionaries = list(container.read_all_items())

    converted_text = text

    for dictionary in dictionaries:
        # 論理削除データは処理をスキップ
        if dictionary.get("deletedAt"):
            continue

        # 略称を統一名称に置換する
        if "terms" in dictionary and isinstance(dictionary["terms"], list):
            for term in dictionary["terms"]:
                converted_text = converted_text.replace(
                    term, dictionary["uniform_name"]
                )

    return converted_text