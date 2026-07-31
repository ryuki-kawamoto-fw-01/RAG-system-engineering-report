import storageSession from 'redux-persist/lib/storage/session';
import compress from 'redux-persist-transform-compress';

export const persistConfig = {
  key: 'root',
  storage: storageSession,
  transforms: [compress()],
  whitelist: [
    'createMinutes',
    'companyAnalysis',
    'createIdea',
    'supposedQuestion',
    'textCorrection',
    'translation',
    'talkScript',
    'summary',
    'createMail',
    'cveSearch',
    'analysis',
    'corporateSurvey',
    'createPrompt',
    'incidentReport',
    'pagination',
    'techassess', // 追加
    'manual',
  ],
};
