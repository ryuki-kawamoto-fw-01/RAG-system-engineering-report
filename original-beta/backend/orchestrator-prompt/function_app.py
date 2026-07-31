import azure.functions as func

from controller.advice_consulting import advice_consulting_bp
from controller.advice_react import advice_react_bp
from controller.brainstorming import brainstorming_bp
from controller.business_plan import business_plan_bp
from controller.catchphrase import catchphrase_bp
from controller.code_explanation import code_explanation_bp
from controller.company_analysis import company_analysis_bp
from controller.corporate_survey import corporate_survey_bp
from controller.crisis_management_scenarios import crisis_management_scenarios_bp
from controller.defect_analysis_report import defect_analysis_report_bp
from controller.design_document import design_document_bp
from controller.design_document_review import design_document_review_bp
from controller.error_analysis import error_analysis_bp
from controller.faq_creation import faq_creation_bp
from controller.flow_designer import flowDesigner_bp
from controller.idea import idea_bp
from controller.image_generation import image_generation_bp
from controller.incident_report import incident_report_bp
from controller.judge_idea import judge_idea_bp
from controller.key_point_extraction import key_point_extraction_bp
from controller.mail import mail_bp
from controller.market_research import market_research_report_bp
from controller.marketing_strategy import marketing_strategy_bp
from controller.minutes import minutes_bp
from controller.needs_survey import needs_survey_bp
from controller.new_product_proposal import new_product_proposal_bp
from controller.problem_solving_advisor import problem_solving_advisor_bp
from controller.product_aarrr import product_aarrr_bp
from controller.product_comparison_controller import product_comparison_bp
from controller.product_idea import product_idea_bp
from controller.product_name import product_name_bp
from controller.product_promotion_strategy import product_promotion_strategy_bp
from controller.product_service_benefit_idea import product_service_benefit_idea_bp
from controller.production_tech import production_tech_bp
from controller.prompt import prompt_bp
from controller.quality_report import quality_report_bp
from controller.quality_standard_document import quality_standard_document_bp
from controller.research_report import research_report_bp
from controller.risk_assessment import risk_assessment_bp
from controller.sales_forecast import sales_forecast_bp
from controller.schedule import schedule_bp
from controller.source_code_creation import source_code_bp
from controller.summary import summary_bp
from controller.supposed_question import supposed_question_bp
from controller.survey_creation_bp import survey_creation_bp
from controller.talk_script import talk_script_bp
from controller.task_breakdown import taskBreakdown_bp
from controller.techassess import techassess_bp
from controller.technology_proposal import technology_proposal_bp
from controller.technology_training import technology_training_bp
from controller.technology_trend_research import technology_trend_research_bp
from controller.term_summary import term_summary_bp
from controller.text_check import text_check_bp
from controller.text_completion_bp import text_completion_bp
from controller.text_correction import text_correction_bp
from controller.transcription_handwritten import transcription_handwritten_bp
from controller.translate import translate_bp
from controller.trouble_shooting_guide import trouble_shooting_guide_bp
from controller.wall_hitting import wall_hitting_bp

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# プロンプトテンプレート
app.register_blueprint(prompt_bp)

# 議事録作成
app.register_blueprint(minutes_bp)

# テキスト添削画面
app.register_blueprint(text_correction_bp)

# 文章補完
app.register_blueprint(text_completion_bp)

# 翻訳
app.register_blueprint(translate_bp)

# トークスクリプト
app.register_blueprint(talk_script_bp)

# 要約画面
app.register_blueprint(summary_bp)

# メール作成
app.register_blueprint(mail_bp)

# 想定質問
app.register_blueprint(supposed_question_bp)

# アンケート作成
app.register_blueprint(survey_creation_bp)

# アドバイス（コンサルティング）
app.register_blueprint(advice_consulting_bp)

# アイデア出し
app.register_blueprint(idea_bp)

# 製品拡販のアイデア出し（AARRRモデル）
app.register_blueprint(product_aarrr_bp)

# 競合企業調査
app.register_blueprint(company_analysis_bp)

# 企業調査
app.register_blueprint(corporate_survey_bp)

# ニーズ調査
app.register_blueprint(needs_survey_bp)

# 設計書レビュー
app.register_blueprint(design_document_review_bp)

# 製品・サービスがユーザーにもたらす利益のアイデア抽出
app.register_blueprint(product_service_benefit_idea_bp)

# 課題解決アドバイザー
app.register_blueprint(problem_solving_advisor_bp)

# 製品比較
app.register_blueprint(product_comparison_bp)

# 製品の販促戦略の作成
app.register_blueprint(product_promotion_strategy_bp)

# FAQ作成
app.register_blueprint(faq_creation_bp)

# 製品ネーミング案
app.register_blueprint(product_name_bp)

# 技術トレンド調査とレポート作成
app.register_blueprint(technology_trend_research_bp)

# 市場アイデア創出
app.register_blueprint(product_idea_bp)

# ブレインストーミング
app.register_blueprint(brainstorming_bp)

# 生産技術の洗い出し
app.register_blueprint(production_tech_bp)

# エラー解析
app.register_blueprint(error_analysis_bp)

# リスクアセスメントシートの作成
app.register_blueprint(risk_assessment_bp)

# 法律準拠判断
app.register_blueprint(judge_idea_bp)

# 要点抽出
app.register_blueprint(key_point_extraction_bp)

# 品質保証レポート
app.register_blueprint(quality_report_bp)

# 危機管理シナリオの作成
app.register_blueprint(crisis_management_scenarios_bp)

# マーケティング戦略の作成
app.register_blueprint(marketing_strategy_bp)

# 事業計画書の作成
app.register_blueprint(business_plan_bp)

# 市場調査のレポート作成
app.register_blueprint(market_research_report_bp)

# コードの解説
app.register_blueprint(code_explanation_bp)

# 手書きメモの文字起こし
app.register_blueprint(transcription_handwritten_bp)

# 業務のタスク分解
app.register_blueprint(taskBreakdown_bp)

# 技術トレーニング計画
app.register_blueprint(technology_training_bp)

# トラブルシューティングガイドの作成
app.register_blueprint(trouble_shooting_guide_bp)

# スケジュール作成
app.register_blueprint(schedule_bp)

# ソースコード作成
app.register_blueprint(source_code_bp)

# インシデントレポート
app.register_blueprint(incident_report_bp)

# 文章の抜け漏れチェック
app.register_blueprint(text_check_bp)

# 販売予測分析
app.register_blueprint(sales_forecast_bp)

# 専門用語の解説と要約画面
app.register_blueprint(term_summary_bp)

# 製品のキャッチコピーの作成
app.register_blueprint(catchphrase_bp)

# 研究報告書作成
app.register_blueprint(research_report_bp)

# 品質基準書作成
app.register_blueprint(quality_standard_document_bp)

# 不具合分析レポート
app.register_blueprint(defect_analysis_report_bp)

# 思考の壁打ち
app.register_blueprint(wall_hitting_bp)

# 新製品企画書の作成
app.register_blueprint(new_product_proposal_bp)

# 新技術導入提案書の作成
app.register_blueprint(technology_proposal_bp)

# 技術調査レポート
app.register_blueprint(techassess_bp)

# アドバイス(ReAct)
app.register_blueprint(advice_react_bp)

# 設計書作成
app.register_blueprint(design_document_bp)

# 工程管理表の作成
app.register_blueprint(flowDesigner_bp)

# 画像生成
app.register_blueprint(image_generation_bp)
