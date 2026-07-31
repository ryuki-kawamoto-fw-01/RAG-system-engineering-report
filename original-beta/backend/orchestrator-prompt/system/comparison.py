from typing import List, Optional


def get_comparison_message(
    products: List[str], purpose: str, considerations: Optional[str] = None
) -> list:
    """製品比較用のメッセージを生成する（出力は表形式のJSONデータとして整形するよう指示）"""
    system_message = {
        "role": "system",
        "content": (
            "あなたは製品比較の専門家です。"
            "与えられた製品を目的に応じて客観的に比較し、"
            "出力は必ず**説明や補足なしで**、以下の形式のJSONのみを返してください：\n"
            "{\n"
            '  "headers": ["比較項目", "製品A", "製品B", ...],\n'
            '  "rows": [\n'
            '    ["項目1", "製品Aの値", "製品Bの値", ...],\n'
            '    ["項目2", "製品Aの値", "製品Bの値", ...],\n'
            "    ...\n"
            "  ]\n"
            "}\n"
            "絶対に説明文や補足、コードブロック記号（```）などは付けず、"
            "JSONデータのみを返してください。"
        ),
    }

    products_str = "、".join(products)
    considerations_text = f"\n\n考慮事項：{considerations}" if considerations else ""

    user_message = {
        "role": "user",
        "content": (
            f"以下の製品を比較してください：\n\n"
            f"製品：{products_str}\n"
            f"用途・目的：{purpose}{considerations_text}\n"
        ),
    }

    return [system_message, user_message]
