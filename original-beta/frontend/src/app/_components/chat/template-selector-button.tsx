'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/app/_components/ui/label';
import { CATEGORY_VALUES } from '@/app/_constants/prompt-template';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { getPromptTemplates } from '../../(dashboard)/template-register/_actions/getPromptTemplates';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface TemplateSelectorButtonProps {
  input: string;
  setInput: (input: string, templateId: string) => void;
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
      toast.error(getMessage('E_F_00200'));
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
                  setInput(selectedTemplate.content, selectedTemplate.id!);
                  toast.success(getMessage('I_F_00080'));
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
      setInput(selectedTemplate.content, selectedTemplate.id!);
      toast.success(getMessage('I_F_00080'));
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
        variant="tertiary"
        className="mx-auto w-[272px]"
        onClick={() => handleOpenChange(true)}
      >
        他のテンプレートを選択する
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロンプトテンプレートを選択する</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2.5">
            <div className="w-[200px] space-y-1">
              <Label className="text-sm font-bold">カテゴリー</Label>
              <Select
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, category: value.replace('@', '') }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全てのカテゴリー" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="@">全てのカテゴリー</SelectItem>
                    {CATEGORY_VALUES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-sm font-bold">キーワード</Label>
              <Input
                value={filter.search}
                placeholder="例：タイトルまたは内容"
                onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          <div className="h-80 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 z-10 w-1/3 py-1">カテゴリー</TableHead>
                  <TableHead className="sticky top-0 z-10 w-2/3 py-1">タイトル</TableHead>
                </TableRow>
              </TableHeader>
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
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <TableCell
                        className={cn(selectedTemplate?.id === template.id && 'bg-slate-200')}
                      >
                        {template.category}
                      </TableCell>
                      <TableCell
                        className={cn(selectedTemplate?.id === template.id && 'bg-slate-200')}
                      >
                        {template.title}
                      </TableCell>
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

          <DialogFooter>
            <Button variant="tertiary" className="w-[120px]" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="secondary"
              disabled={!selectedTemplate}
              onClick={handleApplyTemplate}
              className="w-[120px]"
            >
              選択する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
