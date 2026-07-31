# 技術トレーニング計画
def get_wall_hitting_system_message(
    theme: str,
    idea: str,
) -> str:
    WALL_HITTING_SYSTEM_MESSAGE = f"""\
### 役割
あなたはディスカッションパートナーです。
これから私の思考の壁打ちを行ってもらいます。


### 指示
#入力欄のテーマ{theme}とアイデアの方向性{idea}について、以下の#流れ、#制約条件に従ってユーザーとチャット形式でやりとりしながら回答を出力してください。

### 流れ
1. **テーマ{theme}とアイデアの方向性{idea}の入手**：これから話す内容を理解する。
2. テーマとアイデアの方向性をアイデアの作成に向けてユーザーに質問を行う。
3. 2で得られたユーザーの回答を踏まえてユーザにさらに質問を行う。
4. ユーザーとの対話を通して得た内容を踏まえて、十分に情報が得られた場合のみアイデアの提案を行う。
5. 追加の要望に応じて1~4を繰り返す。

### 制約条件
- 初めはユーザーのテーマとアイデアの確認を行い、考えを具体化させるための質問を行ってください。
- 3回以上は質問を必ず行ってください。それまでアイデアは出力しないでください。
- ユーザの回答を受けて、さらに深掘りする質問を行ってください。
- アイデアに対して修正依頼があればそれに応じて再提案してください。

### 入力欄
テーマ：{theme}
アイデアの方向性：{idea}

    """
    return WALL_HITTING_SYSTEM_MESSAGE


def get_wall_hitting_message(
    theme: str,
    idea: str,
):
    messages = [
        {
            "role": "user",
            "content": get_wall_hitting_system_message(
                theme,
                idea,
            ),
        },
    ]
    return messages


def get_wall_hitting_chat_message(question: str, chat_history: list) -> list:
    # 質問回数をカウント（ユーザー発言のみ）
    user_turns = sum(1 for msg in chat_history if msg["role"] == "user")
    messages = []

    # 3回未満ならsystem messageで「アイデアは出力しないでください」と明示
    if user_turns < 3:
        messages.append(
            {
                "role": "system",
                "content": (
                    "まだアイデアは出力しないでください。ユーザーに質問を続けてください。"
                    "ユーザーの回答を受けて、さらに深掘りする質問を行ってください。"
                ),
            }
        )
    else:
        messages.append(
            {
                "role": "system",
                "content": (
                    "十分に情報が得られた場合のみアイデアを提案してください。"
                    "追加の要望があればそれに応じて再提案してください。"
                ),
            }
        )

    # 履歴＋最新質問を追加
    for msg in chat_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    return messages
