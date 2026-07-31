import 'server-only';

import { CosmosClient, Database, Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { isDevelopment } from './config';

type CosmosOptions = {
  endpoint: string;
  aadCredentials: DefaultAzureCredential;
  agent?: HttpsProxyAgent<string>;
};

// 遅延初期化のためのクライアントのキャッシュ
let client: CosmosClient | null = null;

// データベース名からDatabaseインスタンスへのキャッシュ
const databaseCache = new Map<string, Database>();

// コンテナのキャッシュ
const containerCache = new Map<string, Container>();

// クライアントの遅延初期化
function getClient(): CosmosClient {
  if (!client) {
    const endpoint = process.env.AZURE_COSMOSDB_URI;
    if (!endpoint) {
      throw new Error('AZURE_COSMOSDB_URI is required but not set');
    }

    const cosmosOptions: CosmosOptions = {
      endpoint,
      aadCredentials: new DefaultAzureCredential(),
    };

    // ローカル開発環境の社内からAzureにアクセスするにはプロキシを経由する必要がある
    if (isDevelopment) {
      const proxyUrl = process.env.PROXY_URL;
      if (proxyUrl) {
        cosmosOptions.agent = new HttpsProxyAgent(proxyUrl);
      }
    }

    client = new CosmosClient(cosmosOptions);
  }
  return client;
}

// 環境変数キーからデータベースを取得
function getDatabaseByEnvKey(databaseEnvKey: string): Database {
  const databaseName = process.env[databaseEnvKey];
  if (!databaseName) {
    throw new Error(
      `環境変数 ${databaseEnvKey} が設定されていません。データベース名が undefined です。`
    );
  }

  // データベース名でキャッシュを確認
  if (!databaseCache.has(databaseName)) {
    databaseCache.set(databaseName, getClient().database(databaseName));
  }

  return databaseCache.get(databaseName)!;
}

// Cosmos DBをProxyパターンでラップして遅延読み込みを実現
// 実装背景:
// コンテナへの接続時に環境変数のチェックを行う
// 既存のコードへの変更を最小限に抑えるための実装
function cosmosDBContainerProxy(containerEnvKey: string, databaseEnvKey: string): Container {
  return new Proxy({} as Container, {
    // 各プロパティ/メソッドへのアクセス時に実際のContainerを取得して値を返す
    get(_target, prop: string | symbol) {
      const containerName = process.env[containerEnvKey];
      if (!containerName) {
        throw new Error(
          `環境変数 ${containerEnvKey} が設定されていません。コンテナ名が undefined です。`
        );
      }
      // 1. キャッシュ確認 - 初回アクセス時のみContainerを作成
      if (!containerCache.has(containerName)) {
        const db = getDatabaseByEnvKey(databaseEnvKey);
        containerCache.set(containerName, db.container(containerName));
      }

      // 2. キャッシュから取得
      const container = containerCache.get(containerName)!;

      // 3. Containerのプロパティ/メソッドにアクセス
      const value = (container as unknown as Record<string, unknown>)[prop as string];

      // 4. メソッドの場合はthisをbindして返す（例: container.items.create()）
      if (typeof value === 'function') {
        return value.bind(container);
      }

      // 5. プロパティの場合はそのまま返す（例: container.id）
      return value;
    },
  });
}

// cosmosDBContainerProxyには環境変数名を渡しください。
// process.envからコンテナ名とデータベース名を取得します。
export const messageContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_MESSAGE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const threadContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_THREAD_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const ragMessageContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_RAG_MESSAGE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const ragThreadContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_RAG_THREAD_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const agentMessageContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_AGENT_MESSAGE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const agentThreadContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_AGENT_THREAD_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const templateContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TEMPLATE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const banWordContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_BAN_WORD_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const dictionaryContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_DICTIONARY_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const qaContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_QA_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const useCaseContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_USE_CASE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const deepMessageContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_DEEP_MESSAGE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const deepThreadContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_DEEP_THREAD_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const voiceThreadContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_VOICE_THREAD_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const voiceMessageContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_VOICE_MESSAGE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);
export const hiyariHatRegisterContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_HIYARI_HAT_REGISTER_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME'
);

// 共通機能ログ
export const promptContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_PROMPT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const createMinutesContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CREATE_MINUTES_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const textCorrectionContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TEXT_CORRECTION_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const translateContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TRANSLATE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const talkScriptContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TALK_SCRIPT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const summaryContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_SUMMARY_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const createNewMailContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CREATE_NEW_MAIL_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const supposedQuestionContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_MODIFY_SUPPOSED_QUESTION_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const createIdeaContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CREATE_IDEA_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const companyAnalysisContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_COMPANY_ANALYSIS_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const corporateSurveyContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CORPORATE_SURVEY_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const qualityReportContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_QUALITY_REPORT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const marketresearchContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_MARKET_RESEARCH_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const codeExplanationContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CODE_EXPLANATION_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const scheduleContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_SCHEDULE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const researchReportContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_RESEARCH_REPORT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const createTechnologyProposalContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CREATE_TECHNOLOGY_PROPOSAL_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const createDesignDocumentContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CREATE_DESIGN_DOCUMENT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);

export const needsSurveyContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_NEEDS_SURVEY_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const productServiceBenefitIdeaContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_PRODUCT_SERVICE_BENEFIT_IDEA_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const brainstormingContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_BRAINSTORMING_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const crisisManagementScenariosContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_CRISIS_MANAGEMENT_SCENARIOS_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const productionTechListContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_PRODUCTION_TECH_LIST_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const riskAssessmentContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_RISK_ASSESSMENT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const judgeIdeaContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_JUDGE_IDEA_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const keyPointExtractionContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_KEY_POINT_EXTRACTION_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const troubleShootingGuideContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TROUBLE_SHOOTING_GUIDE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const transcriptionHandwrittenContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TRANSCRIPTION_HANDWRITTEN_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const taskBreakdownContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TASK_BREAKDOWN_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const designDocumentReviewContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_DESIGN_DOCUMENT_REVIEW_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const technologyTrainingContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TECHNOLOGY_TRAINING_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const incidentReportContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_INCIDENT_REPORT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const textCheckContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TEXT_CHECK_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const salesForecastContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_SALES_FORECAST_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const errorAnalysisContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_ERROR_ANALYSIS_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const businessPlanContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_BUSINESS_PLAN_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const productAARRRContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_PRODUCT_AARRR_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const qualityStandardDocumentContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_QUALITY_STANDARD_DOCUMENT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const defectAnalysisReportContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_DEFECT_ANALYSIS_REPORT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_03'
);
export const newProductProposalContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_NEW_PRODUCT_PROPOSAL_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const adviceReactContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_ADVICE_REACT_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);

export const productCatchphraseContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_PRODUCT_CATCHPHRASE_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_04'
);
export const wallHittingContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_WALL_HITTING_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const marketingstrategyContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_MARKETING_STRATEGY_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_04'
);
export const adviceConsultingContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_ADVICE_CONSULTING_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const productPromotionStrategyContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_PRODUCT_PROMOTION_STRATEGY_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_04'
);
export const flowDesignerContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_FLOW_DESIGNER_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_04'
);
export const imageGenerationContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_IMAGE_GENERATION_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_02'
);
export const techassessContainer = cosmosDBContainerProxy(
  'AZURE_COSMOSDB_TECHASSESS_CONTAINER_NAME',
  'AZURE_COSMOSDB_DATABASE_NAME_04'
);
