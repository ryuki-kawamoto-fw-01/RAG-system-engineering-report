from datetime import date


def get_schedule_system_message(
    newSchedulework: str,
    newSchedulestartdate: date,
    newScheduleenddate: date,
    newScheduleConsiderations: str,
):

    SCHEDULE_SYSTEM_MESSAGE = f"""\
        # 役割
        あなたは優秀な作業管理者です。

        # 指示
        必ず"# 制約条件"に従って作成してください。
        {newSchedulework}、{newSchedulestartdate}、{newScheduleenddate}、{newScheduleConsiderations}を踏まえて、スケジュール作成をしてください。
        "# 出力形式"に従って出力してください。


        # 制約条件
        - 作業開始日は{newSchedulestartdate}、作業終了日は{newScheduleenddate}とする。
        - 作業開始日{newSchedulestartdate}から、作業終了日{newScheduleenddate}までのスケジュールを作成してください。
        - 作業開始日から作業終了予定日に祝日を含む日程の場合、祝日にタスクを割り振らずにスケジュールを作成してください。
        - 作業開始日から作業終了予定日に土曜日、日曜日を含む日程の場合、土曜日、日曜日にタスクを割り振らずにスケジュールを作成してください。
        - 指定がなければ、作業終了予定日は上司への確認、顧客への提示等として、作業自体は1日以上前には終了するようにスケジュールを作成してください。
        - {newSchedulework}に考えられる作業を洗い出して、具体的なタスクに落とし込んでください。
        - 具体的なタスクに割り振るべき日数を算出してください。指定がなければ、1日に複数タスクを割り振っても構いません。同一日の日付、その日付に割り振ったタスクの間には空行を入れないでください。


        # 出力形式
        以下の形式で出力してください。
        (1)(2)を与えられた作業開始日から、作業終了予定日まで日数分出力してください。
        "(1)""(2)"の文字列は消す。
        日付ごとにタスクはまとめて見やすく表示させて下さい。
        次の日付に移動する際に空行を入れてください。


        (1)日付（指定がなければ最初の作業開始日から）
        (2)その日付に割り振ったタスク

        # 出力例

        2023-03-01
        社内打ち合わせ
        仕様書作成

        2023-03-02
        社外確認

        2023-03-03
        （土曜日）

        2023-03-04
        （日曜日）

        2023-03-05
        社内確認

        2023-03-06
        予備日

    """
    return SCHEDULE_SYSTEM_MESSAGE


def get_schedule_message(
    newSchedulework: str,
    newSchedulestartdate: date,
    newScheduleenddate: date,
    newScheduleConsiderations: str,
):
    messages = [
        {
            "role": "user",
            "content": get_schedule_system_message(
                newSchedulework,
                newSchedulestartdate,
                newScheduleenddate,
                newScheduleConsiderations,
            ),
        }
    ]
    return messages
