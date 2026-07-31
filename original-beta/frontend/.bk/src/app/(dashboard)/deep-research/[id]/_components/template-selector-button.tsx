'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CATEGORY_VALUES } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { Button } from '../../../../_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../_components/ui/dialog';
import { Input } from '../../../../_components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../_components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../_components/ui/table';
import { getPromptTemplates } from '../../../template-register/_actions/getPromptTemplates';

interface TemplateSelectorButtonProps {
  input: string;
  setInput: (input: string) => void;
}

// CosmosDBからテンプレート一覧を取得
const fetchTemplates = async (): Promise<PromptTemplate[]> => {
  const response = await getPromptTemplates();
  return response.templates.map((template) => ({
    id: template.id,
    category: template.category,
    title: template.title,
    content: template.content,
  }));
};

// 日本語文字列を正規化する関数
function normalizeJapanese(str: string): string {
  return str
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60))
    .toLowerCase();
}

export default function ParameterSettingsButton({
  input,
  setInput,
}: TemplateSelectorButtonProps): JSX.Element {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState({ category: '', search: '' });

  const handleTemplateSelect = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);
      setFilteredTemplates(fetchedTemplates);
    } catch (error) {
      console.error('テンプレートの取得に失敗しました:', error);
      toast.error('テンプレートの読み込みに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApplyTemplate = () => {
    setIsDialogOpen(false);
    if (!selectedTemplate) {
      toast.error('テンプレートが選択されていません。');
      return;
    }
    if (input.trim() !== '') {
      toast.custom(
        (t) => (
          <div className="dark:bg-background-dark rounded-md bg-white p-4 text-black shadow-md dark:text-white">
            <p className="mb-4">現在のメッセージを消去してテンプレートを適用しますか？</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => toast.dismiss(t)}>
                キャンセル
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInput(selectedTemplate.content);
                  toast.success('テンプレートが適用されました。');
                  toast.dismiss(t);
                }}
              >
                適用
              </Button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    } else {
      setInput(selectedTemplate.content);
      toast.success('テンプレートが適用されました。');
    }
  };

  useEffect(() => {
    handleTemplateSelect();
  }, [handleTemplateSelect]);

  useEffect(() => {
    const filtered = templates.filter(
      (template) =>
        (filter.category === '' || template.category === filter.category) &&
        (filter.search === '' ||
          normalizeJapanese(template.title).includes(normalizeJapanese(filter.search)) ||
          normalizeJapanese(template.content).includes(normalizeJapanese(filter.search)))
    );
    setFilteredTemplates(filtered);
  }, [templates, filter]);

  const handleOpenChange = useCallback((open: boolean): void => {
    setIsDialogOpen(open);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="bg-dark-gray mx-auto w-1/2 min-w-[240px] text-white hover:bg-gray-800"
        onClick={() => handleOpenChange(true)}
      >
        テンプレートを使用して開始する
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="dark:bg-background-dark h-[550px] bg-white text-black dark:text-white sm:max-h-[550px]">
          <DialogHeader>
            <DialogTitle>プロンプトテンプレート</DialogTitle>
            <DialogDescription>
              プロンプトテンプレートを使用して、チャットを開始します。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Select
              onValueChange={(value) =>
                setFilter((prev) => ({ ...prev, category: value.replace('@', '') }))
              }
            >
              <SelectTrigger className="w-[180px] border-black dark:border-white">
                <SelectValue placeholder="カテゴリー" />
              </SelectTrigger>
              <SelectContent className="dark:bg-dark-gray max-h-[200px] overflow-y-auto bg-gray-100 text-black dark:text-white">
                <SelectGroup>
                  <SelectItem
                    value="@"
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700"
                  >
                    全てのカテゴリー
                  </SelectItem>
                  {CATEGORY_VALUES.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              placeholder="タイトルまたは内容で検索"
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="grow"
            />
          </div>
          <div className="flex grow flex-col overflow-hidden rounded-md border">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 z-10 w-1/3 py-1">カテゴリー</TableHead>
                    <TableHead className="sticky top-0 z-10 w-2/3 py-1">タイトル</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
            <div className="h-[300px] grow overflow-auto">
              <Table>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        テンプレートを読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => (
                      <TableRow
                        key={template.id}
                        className={`cursor-pointer transition-colors hover:bg-blue-100 dark:hover:bg-blue-700 ${
                          selectedTemplate?.id === template.id ? 'bg-blue-200 dark:bg-blue-800' : ''
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <TableCell className="w-1/3 py-2">{template.category}</TableCell>
                        <TableCell className="w-2/3 py-2">{template.title}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        該当するテンプレートが見つかりません。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            variant="outline"
            className="mt-6 w-full gap-x-1 border-black text-black shadow-md hover:bg-gray-200 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-gray-800"
          >
            テンプレートを適用
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
