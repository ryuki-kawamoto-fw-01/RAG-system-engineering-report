import re

def remove_markdown_links(text: str) -> str:
    """
    Markdownリンク形式のテキストからURL部分を削除し、リンクテキストのみを残します。
    例:
    "Check out [Google](https://www.google.com) for search."
    →"Check out Google for search."
    
    Args:
        text (str): 処理対象のテキスト。Markdownリンクが含まれていても含まれていなくても可。
        
    Returns:
        str: URL部分が削除され、リンクテキストのみが残ったテキスト。    
    """
    pattern = r'\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]\([^\)]+\)'
    return re.sub(pattern, r'\1', text)