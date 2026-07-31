# 業務のタスク分解(新規作成)
def get_system_message(
    task: str,
    consideration: str,
) -> str:
    TASK_BREAKDOWN_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優れたマネージャーです。

    # 指示
    以下#入力欄に示された{task}を、#流れに従ってstep-by-stepで複数のタスクに分解してください。
    その際に#制限条件に従ってください。

    # 流れ
    1. {task}を構成する主要な要素を記述してください。
    2. 1で記述した主要な要素ごとに、必要なタスクを記述してください。
    3. 2で記述した必要なタスクを優先順位ごとに並び替えてください。
    4. 各タスクごとに、具体的なアクションや手順を記述してください。
    5. 4を踏まえ、最終的なタスクのリストと順序を示してください。

    # 制限条件
    - ステップが変わるごとに2行開けて出力してください。

    # 入力欄
    業務：{task}
    考慮事項：{consideration}
"""
    return TASK_BREAKDOWN_SYSTEM_MESSAGE


def get_user_message(
    task: str,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_system_message(
                task,
                consideration,
            ),
        },
    ]
    return messages


# 業務のタスク分解（結果調整）
def get_fix_system_message(result: str, revisionPrompt: str) -> str:
    FIX_TASK_BREAKDOWN_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優れたマネージャーです。

    # 指示
    "{result}"に対して、ユーザから結果調整の依頼があります。
    以下の"#流れ"に従って、結果を調整してください。

    #流れ
    1. "以下#入力欄に示された{result}"を確認し、内容を理解する。
    2. "{revisionPrompt}"を理解する。
    3. "{revisionPrompt}"に基づいて"{result}"をブラッシュアップする。
    4. ブラッシュアップした結果を出力する。

    # 制約条件
    - 調整後の結果のみ出力し、余計な説明は出力しないこと。

    #入力欄
    作成結果：{result}
    結果調整プロンプト：{revisionPrompt}
    """
    return FIX_TASK_BREAKDOWN_SYSTEM_MESSAGE


def get_fix_user_message(
    result: str,
    revisionPrompt: str,
):
    messages = [
        {
            "role": "user",
            "content": get_fix_system_message(result, revisionPrompt),
        },
    ]
    return messages
