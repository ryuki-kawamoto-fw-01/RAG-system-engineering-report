from typing import List


def get_create_production_tech_message(
    category: str,
    focus: str,
    issues: str,
) -> List:
    """
    生産技術の洗い出し用のメッセージを生成する
    """
    system_message = {
        "role": "system",
        "content": (
            "### 役割\nあなたは優秀なエンジニアです。\n"
            "新製品の製造プロセスにおいて考慮すべき生産技術を特定し、洗い出していただきます。\n"
            "### 指示\n以下#入力欄の情報をもとに、新製品の製造に適した生産技術を洗い出し、結果を出力してください。\n\n"
            "### 入力欄"
            "\n新製品が属する分野（電子機器、医療機器など）：\n生産技術に関して特に重視したい点（ コスト削減、生産効率の向上、環境への配慮など）：\n既存の生産技術に対して抱えている課題や問題点："
        ),
    }

    user_message = {
        "role": "user",
        "content": (
            f"以下の条件でアンケートを作成してください：\n\n"
            f"新製品が属する分野：{category}\n"
            f"生産技術に関して特に重視したい点：{focus}\n"
            f"既存の生産技術に対して抱えている課題や問題点：{issues}\n"
        ),
    }

    return [system_message, user_message]
