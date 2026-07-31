# 画像生成
def get_image_system_message(
    image_content: str,
    image_size: str,
    image_format: str,
) -> str:
    IMAGE_SYSTEM_MESSAGE = f"""\
    # 指示
    以下の入力欄をもとに画像を生成してください。

    # 入力欄
    生成したい画像内容:{image_content}


    """
    return IMAGE_SYSTEM_MESSAGE


def get_image_message(
    image_content: str,
    image_size: str,
    image_format: str,
):
    messages = [
        {
            "role": "user",
            "content": get_image_system_message(
                image_content,
                image_size,
                image_format,
            ),
        },
    ]
    return messages
