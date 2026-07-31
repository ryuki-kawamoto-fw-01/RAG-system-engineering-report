import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/_components/ui/accordion';
import { Form } from '@/app/_components/ui/form';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectNewProductIdea } from '@/app/_store/selectors/new-product-idea';
import {
  ChatHistory,
  FileReference,
  setChatHistory as setChatHistorySlice,
  setIsSubmitted as setIsSubmittedSlice,
  setIsSubmitting as setIsSubmittingSlice,
  setFilePlainList as setFilePlainListSlice,
  setFormAccordionValue as setFormAccordionSlice,
} from '@/app/_store/slice/new-product-idea';
import { newProIdea } from '../_actions/newProIdea';
import {
  NewProductIdeaSchema,
  newProductIdeaSchema,
  newProductIdeaFileSchema,
} from '../_utils/schema';
import AdditionalConsiderationsForm from './additional-considerations-form';
import IdeaDirectionForm from './idea-direction-form';
import { NewProductIdeaChat } from './new-product-idea-chat';
import NewProductIdeaInputForm, { SelectTab } from './new-product-idea-input-form';
import SubmitButton from './submit-button';

export default function NewProductIdeaFormArea() {
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState<SelectTab>('direct-input');
  // チャットのAccordionの開閉状態
  const [chatAccordionValue, setChatAccordionValue] = useState<string | undefined>('chat');

  const defaultValues = useAppSelector(selectNewProductIdea);
  const form = useFormRedux<NewProductIdeaSchema>({
    resolver: zodResolver(
      selectedTab === 'file-upload' ? newProductIdeaFileSchema : newProductIdeaSchema
    ),
    values: defaultValues as NewProductIdeaSchema,
  });

  const selector = useAppSelector((state) => state.newProductIdea);
  const { chatHistory, isSubmitted, isSubmitting, formAccordionValue } = selector;

  const setIsSubmitted = useCallback(
    (isSubmitted: boolean) => dispatch(setIsSubmittedSlice(isSubmitted)),
    [dispatch]
  );

  const setIsSubmitting = useCallback(
    (isSubmitting: boolean) => dispatch(setIsSubmittingSlice(isSubmitting)),
    [dispatch]
  );

  const setChatHistory = useCallback(
    (chatHistory: ChatHistory[]) => dispatch(setChatHistorySlice(chatHistory)),
    [dispatch]
  );

  const setFilePlainList = useCallback(
    (fileList: FileReference[]) => dispatch(setFilePlainListSlice(fileList)),
    [dispatch]
  );

  const setFormAccordionValue = useCallback(
    (formAccordionValue: string | undefined) => dispatch(setFormAccordionSlice(formAccordionValue)),
    [dispatch]
  );

  useEffect(() => {
    if (chatHistory && chatHistory.length === 1) setFormAccordionValue(undefined); // 初回送信時はフォームのアコーディオンを閉じる
  }, [chatHistory, setFormAccordionValue]);

  const onSubmit = async (e: NewProductIdeaSchema) => {
    const formData = new FormData();

    if (selectedTab === 'file-upload') {
      if (e.fileList instanceof FileList) {
        for (const file of e.fileList) {
          formData.append('fileList', file);
        }
      } else if (Array.isArray(e.fileList) && e.fileList.length > 0) {
        const jsonString = JSON.stringify(e.fileList);
        formData.append('fileList', jsonString);
      }
    }
    if (selectedTab === 'direct-input' && e.text) {
      formData.append('text', e.text);
    }

    formData.append('ideaDirection', e.ideaDirection || '');
    formData.append('additionalConsiderations', e.additionalConsiderations || '');

    if (chatHistory && chatHistory.length > 0) {
      formData.append('chatHistory', JSON.stringify(chatHistory));
    }

    const response = await newProIdea(formData);

    if (response.success) {
      const chat = response.chat;
      setChatHistory([...(chatHistory ?? []), { role: 'assistant', chat }]);
      setIsSubmitting(true);
      setIsSubmitted(false);
      if (e.fileList) {
        const fileReferences: FileReference[] =
          e.fileList instanceof FileList
            ? Array.from(e.fileList).map((file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
              }))
            : e.fileList;
        setFilePlainList(fileReferences);
      }
      if (chatHistory && chatHistory.length === 1) {
        setFormAccordionValue(undefined);
      }
    } else {
      toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
    }
  };
  return (
    <div className="relative w-1/3 overflow-y-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={`flex flex-col overflow-hidden  ${!isSubmitting && 'h-full'} `}
        >
          <div className="overflow-y-auto">
            <Accordion
              type="single"
              collapsible
              value={formAccordionValue}
              onValueChange={setFormAccordionValue}
            >
              <AccordionItem value="form">
                <AccordionTrigger>
                  <span>初期入力項目</span>
                </AccordionTrigger>
                <AccordionContent>
                  <NewProductIdeaInputForm onTabClick={(v) => setSelectedTab(v)} />
                  <IdeaDirectionForm />
                  <AdditionalConsiderationsForm />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          {isSubmitted && (
            <SubmitButton
              selectedTab={selectedTab}
              className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
            />
          )}
        </form>
      </Form>
      {isSubmitting && (
        <Accordion
          type="single"
          collapsible
          value={chatAccordionValue}
          onValueChange={setChatAccordionValue}
        >
          <AccordionItem value="chat">
            <AccordionTrigger>
              <span>チャット</span>
            </AccordionTrigger>
            <AccordionContent>
              <NewProductIdeaChat />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
