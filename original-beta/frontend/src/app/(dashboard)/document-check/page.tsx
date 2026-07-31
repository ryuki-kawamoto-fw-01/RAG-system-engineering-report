'use client';
// import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Markdown from '@/app/_components/ui/markdown';
import { Button } from '../../_components/ui/button';
import { ScrollArea } from '../../_components/ui/scroll-area';

import { Textarea } from '../../_components/ui/textarea';
import { CheckCad } from '../../_types/check-candidate';
import { CheckList } from '../../_types/check-list';
import { searchCheckCad } from './_actions/search-check-cad';
import CheckCandidateCountForm from './_components/check-candidate-count-form';
import { CheckCadTable } from './_components/check-candidate-table';
import { CheckListTable } from './_components/check-list-table';

// interface FileItem {
//   label: string;
//   value: string;
// }

export default function Layout() {
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();
  const [checkCad, setCheckCad] = useState<CheckCad[]>([]);
  const [checkList, setCheckList] = useState<CheckList[]>([]);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [checkCandidateCount, setCheckCandidateCount] = useState(2);

  // チェック候補を検索
  async function selectCheckCad() {
    setIsLoading(true);
    const res = await searchCheckCad(searchWord, checkCandidateCount);
    if (res.success) {
      const data = [];
      for (let i = 0; i < checkCandidateCount; i++) {
        data.push({
          id: i.toString(),
          checkDtls: res.answerList[i],
          checkAddFlg: '',
          source: res.sourceList[i],
        });
      }
      setCheckCad(data);
    } else {
      setCheckCad([]);
    }
    setIsLoading(false);
  }

  const [searchWord, setSearchWord] = useState<string>('');

  useEffect(() => {}, []);

  const fetchCheckList = async (checkList: CheckList[]) => {
    setCheckList(checkList);
  };

  const fetchCheckResult = async (checkResult: string) => {
    setCheckResult(checkResult);
  };

  //　検索ワード消去
  const handleDeleteSearchWord = () => {
    setSearchWord('');
  };

  return (
    <div className="h-full">
      <ScrollArea className="top max-h-screen overflow-y-auto p-4">
        <div className="h-full" id="page-top">
          ■検索項目
          <Button
            className="ml-2"
            variant="outline"
            size="sm"
            onClick={selectCheckCad}
            disabled={isLoading}
          >
            {isLoading ? '検索中' : '検索実行'}
          </Button>
          {/* チェック候補の出力件数を設定するスライドバー */}
          <CheckCandidateCountForm
            checkCandidateCount={checkCandidateCount}
            setCheckCandidateCount={setCheckCandidateCount}
          />
          <div className="mt-3">
            <Button
              className="ml-0"
              variant="outline"
              size="sm"
              onClick={handleDeleteSearchWord}
              disabled={searchWord === ''}
            >
              入力値消去
            </Button>
          </div>
          <Textarea
            id="chapterTitle"
            className="mt-2 min-h-[100px] w-[30%] resize-none border-black text-left text-base dark:border-white"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="検索ワードを入力してください"
          />
          <div className="mt-5">
            <CheckCadTable
              data={checkCad}
              existingCheckList={checkList} // 既存のチェック一覧を渡す
              fetchContent={fetchCheckList}
            />
          </div>
          <div className="mt-5">
            <CheckListTable
              data={checkList}
              fetchCheckList={fetchCheckList}
              fetchContent={fetchCheckResult}
            />
          </div>
        </div>
        <div className="mb-10 mt-5 h-full" id="check-result">
          <div>
            <div>■チェック結果一覧</div>
            <div className="border-2 p-4">
              <Markdown>{checkResult || ''}</Markdown>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
