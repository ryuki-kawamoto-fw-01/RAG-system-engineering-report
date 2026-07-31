// ユースケース名とURLのマッピング
export const getUseCaseUrl = (useCaseName: string): string | null => {
  const useCaseMapping: Record<string, string | null> = {
    // 文書問い合わせ関連
    文書検索: '/rag-chat',
    文書登録: '/document-register',
    辞書登録: '/dictionary',
    'Q&A登録': '/qa',

    // プロンプト関連
    プロンプト作成: '/create-prompt',
    プロンプト登録: '/template-register',

    // 共通機能
    アイデア出し: '/create-idea',
    企業調査: '/corporate-survey',
    議事録: '/create-minutes',
    企業分析: '/company-analysis',
    想定質問: '/supposed-question',
    トークスクリプト: '/talk-script',
    文章校正: '/text-correction',
    翻訳: '/translation',
    メール作成: '/create-mail',
    要約: '/summary',

    // 各種登録
    禁止ワード登録: '/ban-word',

    // その他
    CVE情報検索: null,
    規格検索: null,
    データ分析: null,
  };

  return useCaseMapping[useCaseName] || null;
};

// ユースケースが実装済みかどうかを判定
export const isUseCaseImplemented = (useCaseName: string): boolean => {
  const url = getUseCaseUrl(useCaseName);
  return url !== null;
};
