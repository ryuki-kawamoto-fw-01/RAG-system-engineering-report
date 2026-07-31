type Defalt = {
  model: string;
  inputToken: number;
  outputToken: number;
  embeddingToken: number;
  receivedMainForm: string;
  responseTime: number;
};

export type LLMserviceBackEndLog<T> = T extends 'companyAnalysis'
  ? Defalt & {}
  : T extends 'corporateSurvey'
    ? Defalt & {}
    : T extends 'idea'
      ? Defalt & {}
      : T extends 'mail'
        ? Defalt & {}
        : T extends 'minutes'
          ? Defalt & {}
          : T extends 'qualityReport'
            ? Defalt & {}
            : T extends 'summary'
              ? Defalt & {}
              : T extends 'defectAnalysisReport'
                ? Defalt & {}
                : T extends 'supposedQuestion'
                  ? Defalt & {}
                  : T extends 'talkScript'
                    ? Defalt & {}
                    : T extends 'textCheck'
                      ? Defalt & {}
                      : T extends 'translation'
                        ? Defalt & {}
                        : T extends 'textCorrection'
                          ? Defalt & {}
                          : T extends 'prompt'
                            ? Defalt & {}
                            : T extends 'riskAssessment'
                              ? Defalt & {}
                              : T extends 'codeExplanation'
                                ? Defalt & {}
                                : T extends 'keyPointExtraction'
                                  ? Defalt & {}
                                  : T extends 'errorAnalysis'
                                    ? Defalt & {}
                                    : T extends 'product-aarrr'
                                      ? Defalt & {}
                                      : T extends 'quality-standard-document'
                                        ? Defalt & {}
                                        : T extends 'training'
                                          ? Defalt & {}
                                          : T extends 'techassess'
                                            ? Defalt & {}
                                            : Defalt;
