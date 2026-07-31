def get_incident_report_message(
    incident_datetime: str,
    incident_location: str,
    reporter: str,
    years_of_service: str,
    work_experience: str,
    job_description: str,
    disaster_type: str,
    manual_availability: str,
    compliance_status: str,
    manual_last_updated: str,
    equipment_name: str,
    installation_year: str,
    last_inspection_date: str,
    maintenance_history: str,
    equipment_malfunction_history: str
):
    """
    労働災害報告書生成用のプロンプトメッセージを構築する
    
    Returns:
        list: Azure OpenAI に送信するメッセージ配列
    """
    
    messages = [
        {
            "role": "user",
            "content": f"""### 役割
あなたは労働安全衛生の専門家として、労働基準監督署に提出する正式な労働災害報告書を作成する専門家です。

### 目的
労働災害の発生状況を正確に分析し、法的要件を満たした正式な報告書を作成し、効果的な再発防止対策を提案します。

### 指示
労働基準監督署の審査に耐えうる専門的で実用的な労働災害報告書を作成してください。
ただし、余計な説明は不要です。

### 入力情報
- 発生日時: {incident_datetime}
- 災害発生場所: {incident_location}
- 報告者: {reporter}
- 勤続年数: {years_of_service}
- 業務経験: {work_experience}
- 業務内容: {job_description}
- 災害の種類: {disaster_type}
- マニュアルの有無: {manual_availability}
- 遵守状況: {compliance_status}
- マニュアル最終更新日: {manual_last_updated}
- 使用機械/設備名: {equipment_name}
- 導入年: {installation_year}
- 最終点検日: {last_inspection_date}
- メンテナンス履歴: {maintenance_history}
- 機械の不具合歴: {equipment_malfunction_history}

### 流れ
1. 災害発生の概要: 発生日時、場所、災害の種類、被災者の基本情報を明記し、災害の簡潔な概要を記述してください。
2. 災害発生時の状況: 詳細な発生状況の説明、被災者が行っていた作業内容、作業手順と通常の手順との違いを具体的に説明してください。
3. 災害の原因分析: 以下の3つの観点から必ず分析してください。
   - 直接原因: 機械的要因、人的要因など災害に直結した原因を明確に特定
   - 間接原因: 管理面の要因、環境要因など背景となった原因を詳細に分析
   - 根本原因: 直接・間接原因を生み出した組織的・構造的な問題を特定
4. 使用機械・設備の状況: 機械の仕様と導入年、点検・メンテナンス状況の詳細、
   過去の不具合履歴と対応状況、安全装置の有無と動作状況を記述してください。
5. 作業環境と安全管理体制: 作業マニュアルの整備状況と遵守状況、
   安全教育の実施状況、過去の類似災害の有無と対策状況、
   安全管理責任者の配置状況を分析してください。
6. 再発防止対策: 以下の3つの時間軸で具体的な対策を立案してください。
   - 即時対策: 緊急に実施すべき安全措置（応急処置的対応）
   - 短期対策: 1-3ヶ月以内に実施する改善措置（設備改修、手順見直し等）
   - 長期対策: 6ヶ月-1年以内に実施する抜本的改善（システム変更、組織改革等）
   実施スケジュールと責任者の明確化、効果の測定方法も含めてください。
7. 今後の安全管理強化策: 定期点検の見直し、作業マニュアルの改訂、安全教育の充実、類似災害防止のための水平展開を含めた包括的な強化策を示してください。

### 出力形式
- 全体的に統一された番号体系を使用してください
- 報告書全体で一貫した階層番号を使用してください
- 大項目は「1. 2. 3.」形式で記述してください
- 中項目は「(1)(2)(3)」形式で記述してください
- 小項目は「(a)(b)(c)」形式で記述してください
- 客観的で具体的な記述、根拠に基づいた原因分析、実効性のある再発防止対策を含めてテキスト形式で出力してください。
"""
        }
    ]

    return messages
