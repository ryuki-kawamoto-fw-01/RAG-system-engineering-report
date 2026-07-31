'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import feedbackAdviceConsulting from '@/app/(dashboard)/advice-consulting/_actions/feedback';
import feedbackAdviceReact from '@/app/(dashboard)/advice-react/_actions/feedback';
import feedbackBrainstorming from '@/app/(dashboard)/brainstorming/_actions/feedback';
import feedbackBusinessPlan from '@/app/(dashboard)/business-plan/_actions/feedback';
import feedbackCodeExplanation from '@/app/(dashboard)/code-explanation/_actions/feedback';
import feedbackCompanyAnalysis from '@/app/(dashboard)/company-analysis/actions/feedback';
import feedbackJudge from '@/app/(dashboard)/compliance-judge/_actions/feedback';
import feedbackCorporateSurvey from '@/app/(dashboard)/corporate-survey/_actions/feedback';
import feedbackCreateDesignDocument from '@/app/(dashboard)/create-design-document/_actions/feedback';
import feedbackIdea from '@/app/(dashboard)/create-idea/_actions/feedback';
import feedbackMail from '@/app/(dashboard)/create-mail/_actions/feedback';
import feedbackCreateMinutes from '@/app/(dashboard)/create-minutes/_actions/feedback';
import feedbackCreatePrompt from '@/app/(dashboard)/create-prompt/_actions/feedback';
import feedbackSchedule from '@/app/(dashboard)/create-schedule/_actions/feedback';
import feedbackTechnologyProposal from '@/app/(dashboard)/create-technology-proposal/_actions/feedback';
import feedbackCrisisManagementScenarios from '@/app/(dashboard)/crisis-management-scenarios/_actions/feedback';
import feedbackDefectAnalysisReport from '@/app/(dashboard)/defect-analysis-report/actions/feedback';
import feedbackDesignDocumentReview from '@/app/(dashboard)/design-document-review/_actions/feedback';
import feedbackErrorAnalysis from '@/app/(dashboard)/error-analysis/_actions/feedback';
import feedbackFlowDesigner from '@/app/(dashboard)/flow-designer/_actions/feedback';
import feedbackImage from '@/app/(dashboard)/image-generation/_actions/feedback';
import feedbackIncidentReport from '@/app/(dashboard)/incident-report/_actions/feedback';
import feedbackKeyPointExtraction from '@/app/(dashboard)/key-point-extraction/_actions/feedback';
import feedbackMarketResearchReport from '@/app/(dashboard)/market-research-report/_actions/feedback';
import feedbackMarketingStrategy from '@/app/(dashboard)/marketing-strategy/_actions/feedback';
import feedbackNeedsSurvey from '@/app/(dashboard)/needs-survey/_actions/feedback';
import feedbackNewProductProposal from '@/app/(dashboard)/new-product-proposal/_actions/feedback';
import feedbackProductAARRR from '@/app/(dashboard)/product-aarrr/_actions/feedback';
import feedbackCatchphrase from '@/app/(dashboard)/product-catchphrase/_actions/feedback';
import feedbackProductPromotionStrategy from '@/app/(dashboard)/product-promotion-strategy/_actions/feedback';
import feedbackProductServiceBenefitIdea from '@/app/(dashboard)/product-service-benefit-idea/_actions/feedback';
import feedbackProductionTechList from '@/app/(dashboard)/production-tech-list/_actions/feedback';
import feedbackQualityReport from '@/app/(dashboard)/quality-report/_actions/feedbacks';
import feedbackQualityStandardDocument from '@/app/(dashboard)/quality-standard-document/_actions/feedback';
import feedbackResearchReport from '@/app/(dashboard)/research-report/_actions/feedback';
import feedbackRiskAssessment from '@/app/(dashboard)/risk-assessment/_actions/feedback';
import feedbackSalesForecast from '@/app/(dashboard)/sales-forecast/_actions/feedback';
import feedbackSummary from '@/app/(dashboard)/summary/_actions/feedback';
import feedbackSupposedQuestion from '@/app/(dashboard)/supposed-question/_actions/feedback';
import feedbackTalkScript from '@/app/(dashboard)/talk-script/_actions/feedback';
import feedbackTaskBreakdown from '@/app/(dashboard)/task-breakdown/_actions/feedback';
import feedbackTechassess from '@/app/(dashboard)/techassess/_actions/feedback';
import feedbackTechnologyTraining from '@/app/(dashboard)/technology-training/_actions/feedback';
import feedbackTextCheck from '@/app/(dashboard)/text-check/_actions/feedback';
import feedbackTextCorrection from '@/app/(dashboard)/text-correction/_actions/feedback';
import feedbackTranscriptionHandwritten from '@/app/(dashboard)/transcription-handwritten/_actions/feedback';
import feedbackTranslation from '@/app/(dashboard)/translation/actions/feedback';
import feedbackTroubleShootingGuide from '@/app/(dashboard)/trouble-shooting/_actions/feedback';
import SvgDisabledGood from '@/app/_components/icon/button/DisabledGood';
import SvgGood from '@/app/_components/icon/button/Good';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { getMessage } from '@/app/_utils/message';
import { goodFeedbackOptions } from '../../../../config';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import OptionalLabel from '../ui/optional-label';
import RequiredLabel from '../ui/required-label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const MAX_TEXT_LENGTH = 255;
const FeedbackSchema = z.object({
  reasons: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: '少なくとも1つのオプションを選択してください',
  }),
  text: z
    .string()
    .max(MAX_TEXT_LENGTH, { message: `${MAX_TEXT_LENGTH}文字以内で入力してください` }),
});

interface FeedbackButtonProps {
  source?:
    | 'idea'
    | 'corporateSurvey'
    | 'createPrompt'
    | 'corporateSurvey'
    | 'minutes'
    | 'companyAnalysis'
    | 'defectAnalysisReport'
    | 'supposedQuestion'
    | 'talkScript'
    | 'technologyTraining'
    | 'textCorrection'
    | 'translation'
    | 'mail'
    | 'marketresearchReport'
    | 'summary'
    | 'needsSurvey'
    | 'incidentReport'
    | 'design-document-review'
    | 'taskBreakdown'
    | 'adviceConsulting'
    | 'productServiceBenefitIdea'
    | 'codeExplanation'
    | 'brainstorming'
    | 'productionTechList'
    | 'crisisManagementScenarios'
    | 'error-analysis'
    | 'qualityReport'
    | 'keyPointExtraction'
    | 'risk-assessment'
    | 'judge'
    | 'transcriptionHandwritten'
    | 'troubleShooting'
    | 'schedule'
    | 'textCheck'
    | 'salesForecast'
    | 'catchphrase'
    | 'businessPlan'
    | 'researchReport'
    | 'product-aarrr'
    | 'qualityStandardDocument'
    | 'marketingstrategy'
    | 'newproductProposal'
    | 'technologyProposal'
    | 'adviceReact'
    | 'flowDesigner'
    | 'productPromotionStrategy'
    | 'techassess'
    | 'createdesigndocument'
    | 'image';

  messageId: string;
  isSubmitted: boolean;
  handleSubmit?: () => void;
}

export default function FeedbackGoodButton({
  source,
  messageId,
  isSubmitted,
  handleSubmit,
}: FeedbackButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof FeedbackSchema>>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      reasons: [],
      text: '',
    },
  });
  const { isLoading } = form.formState;

  const onSubmit = async (data: z.infer<typeof FeedbackSchema>) => {
    let res = { success: false };
    if (source === 'createPrompt') {
      res = await feedbackCreatePrompt(messageId, 1, data.reasons, data.text);
    } else if (source === 'idea') {
      res = await feedbackIdea(messageId, 1, data.reasons, data.text);
    } else if (source === 'corporateSurvey') {
      res = await feedbackCorporateSurvey(messageId, 1, data.reasons, data.text);
    } else if (source === 'minutes') {
      res = await feedbackCreateMinutes(messageId, 1, data.reasons, data.text);
    } else if (source === 'companyAnalysis') {
      res = await feedbackCompanyAnalysis(messageId, 1, data.reasons, data.text);
    } else if (source === 'defectAnalysisReport') {
      res = await feedbackDefectAnalysisReport(messageId, 1, data.reasons, data.text);
    } else if (source === 'supposedQuestion') {
      res = await feedbackSupposedQuestion(messageId, 1, data.reasons, data.text);
    } else if (source === 'talkScript') {
      res = await feedbackTalkScript(messageId, 1, data.reasons, data.text);
    } else if (source === 'technologyTraining') {
      res = await feedbackTechnologyTraining(messageId, 1, data.reasons, data.text);
    } else if (source === 'textCorrection') {
      res = await feedbackTextCorrection(messageId, 1, data.reasons, data.text);
    } else if (source === 'translation') {
      res = await feedbackTranslation(messageId, 1, data.reasons, data.text);
    } else if (source === 'mail') {
      res = await feedbackMail(messageId, 1, data.reasons, data.text);
    } else if (source === 'marketresearchReport') {
      res = await feedbackMarketResearchReport(messageId, 1, data.reasons, data.text);
    } else if (source === 'catchphrase') {
      res = await feedbackCatchphrase(messageId, 1, data.reasons, data.text);
    } else if (source === 'summary') {
      res = await feedbackSummary(messageId, 1, data.reasons, data.text);
    } else if (source === 'needsSurvey') {
      res = await feedbackNeedsSurvey(messageId, 1, data.reasons, data.text);
    } else if (source === 'productServiceBenefitIdea') {
      res = await feedbackProductServiceBenefitIdea(messageId, 1, data.reasons, data.text);
    } else if (source === 'brainstorming') {
      res = await feedbackBrainstorming(messageId, 1, data.reasons, data.text);
    } else if (source === 'productionTechList') {
      res = await feedbackProductionTechList(messageId, 1, data.reasons, data.text);
    } else if (source === 'crisisManagementScenarios') {
      res = await feedbackCrisisManagementScenarios(messageId, 1, data.reasons, data.text);
    } else if (source === 'qualityReport') {
      res = await feedbackQualityReport(messageId, 1, data.reasons, data.text);
    } else if (source === 'keyPointExtraction') {
      res = await feedbackKeyPointExtraction(messageId, 1, data.reasons, data.text);
    } else if (source === 'risk-assessment') {
      res = await feedbackRiskAssessment(messageId, 1, data.reasons, data.text);
    } else if (source === 'judge') {
      res = await feedbackJudge(messageId, 1, data.reasons, data.text);
    } else if (source === 'troubleShooting') {
      res = await feedbackTroubleShootingGuide(messageId, 1, data.reasons, data.text);
    } else if (source === 'codeExplanation') {
      res = await feedbackCodeExplanation(messageId, 1, data.reasons, data.text);
    } else if (source === 'transcriptionHandwritten') {
      res = await feedbackTranscriptionHandwritten(messageId, 1, data.reasons, data.text);
    } else if (source === 'taskBreakdown') {
      res = await feedbackTaskBreakdown(messageId, 1, data.reasons, data.text);
    } else if (source === 'schedule') {
      res = await feedbackSchedule(messageId, 1, data.reasons, data.text);
    } else if (source === 'incidentReport') {
      res = await feedbackIncidentReport(messageId, 1, data.reasons, data.text);
    } else if (source === 'textCheck') {
      res = await feedbackTextCheck(messageId, 1, data.reasons, data.text);
    } else if (source === 'salesForecast') {
      res = await feedbackSalesForecast(messageId, 1, data.reasons, data.text);
    } else if (source === 'error-analysis') {
      res = await feedbackErrorAnalysis(messageId, 1, data.reasons, data.text);
    } else if (source === 'businessPlan') {
      res = await feedbackBusinessPlan(messageId, 1, data.reasons, data.text);
    } else if (source === 'researchReport') {
      res = await feedbackResearchReport(messageId, 1, data.reasons, data.text);
    } else if (source === 'product-aarrr') {
      res = await feedbackProductAARRR(messageId, 1, data.reasons, data.text);
    } else if (source === 'qualityStandardDocument') {
      res = await feedbackQualityStandardDocument(messageId, 1, data.reasons, data.text);
    } else if (source === 'marketingstrategy') {
      res = await feedbackMarketingStrategy(messageId, 1, data.reasons, data.text);
    } else if (source === 'newproductProposal') {
      res = await feedbackNewProductProposal(messageId, 1, data.reasons, data.text);
    } else if (source === 'technologyProposal') {
      res = await feedbackTechnologyProposal(messageId, 0, data.reasons, data.text);
    } else if (source === 'adviceConsulting') {
      res = await feedbackAdviceConsulting(messageId, 0, data.reasons, data.text);
    } else if (source === 'adviceReact') {
      res = await feedbackAdviceReact(messageId, 0, data.reasons, data.text);
    } else if (source === 'productPromotionStrategy') {
      res = await feedbackProductPromotionStrategy(messageId, 1, data.reasons, data.text);
    } else if (source === 'flowDesigner') {
      res = await feedbackFlowDesigner(messageId, 1, data.reasons, data.text);
    } else if (source === 'techassess') {
      res = await feedbackTechassess(messageId, 1, data.reasons, data.text);
    } else if (source === 'createdesigndocument') {
      res = await feedbackCreateDesignDocument(messageId, 1, data.reasons, data.text);
    } else if (source === 'image') {
      res = await feedbackImage(messageId, 1, data.reasons, data.text);
    } else if (source === 'design-document-review') {
      res = await feedbackDesignDocumentReview(messageId, 1, data.reasons, data.text);
    }

    if (res.success) {
      toast.success(getMessage('I_F_00070'));
      form.reset();
      if (handleSubmit) {
        handleSubmit();
      }
      setIsOpen(false);
    } else {
      toast.error(getMessage('E_F_00190'));
    }
  };

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="icon"
              size="icon"
              disabled={isSubmitted}
              onClick={() => setIsOpen(true)}
            >
              {isSubmitted ? (
                <SvgDisabledGood className="size-5" />
              ) : (
                <SvgGood className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>この回答は役立ちました</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フィードバックを頂きありがとうございました！</DialogTitle>
          </DialogHeader>
          <div>
            <p>回答の評価をいただきありがとうございます！</p>
            <p>サービス向上のため、具体的なご意見をお聞かせください。</p>
            <Form {...form}>
              <form className="mt-6">
                <FormField
                  control={form.control}
                  name="reasons"
                  render={() => (
                    <FormItem>
                      <div className="mb-2.5">
                        <RequiredLabel>
                          評価の理由として当てはまるものを1つ以上選択してください。
                        </RequiredLabel>
                      </div>
                      {goodFeedbackOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="reasons"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex items-center space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value!, item.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== item.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-lg">{item.label}</FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <OptionalLabel>
                        特に気に入った点・もっとこうしてほしい点があれば教えてください。
                      </OptionalLabel>
                      <FormControl>
                        <Input placeholder="例：より詳細な情報を提供してほしい。" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DialogFooter>
            <Button variant="tertiary" className="w-[120px]" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => form.handleSubmit(onSubmit)()}
              className="w-[120px]"
            >
              送信する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
