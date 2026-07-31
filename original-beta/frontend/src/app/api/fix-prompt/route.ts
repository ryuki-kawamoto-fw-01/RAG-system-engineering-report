import { NextResponse } from 'next/server';

function getUrl(functionName: string): string {
  const endpoint = process.env.ORCHESTRATOR_USE_CASE_API_ENDPOINT;
  const credential = process.env.ORCHESTRATOR_USE_CASE_API_CREDENTIAL;
  if (!endpoint || !credential) {
    throw new Error(
      'ORCHESTRATOR_USE_CASE_API_ENDPOINT and ORCHESTRATOR_USE_CASE_API_CREDENTIAL must be set'
    );
  }
  return `${endpoint}/${functionName}?code=${credential}`;
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.revisionPrompt || body.revisionPrompt.length === 0) {
    return NextResponse.json(
      {
        message: 'プロンプトテンプレートの修正内容を入力してください',
      },
      { status: 400 }
    );
  }

  if (!body.enhancedPrompt || body.enhancedPrompt.length === 0) {
    return NextResponse.json(
      {
        message:
          'プロンプトテンプレートの作成結果がありません。プロンプトテンプレートを作成してから修正してください。',
      },
      { status: 400 }
    );
  }

  const revisionPrompt: string = body.revisionPrompt;
  const enhancedPrompt: string = body.enhancedPrompt;

  try {
    const answerResponse = await fetch(getUrl('fix-prompt'), {
      method: 'POST',
      body: JSON.stringify({
        revisionPrompt,
        enhancedPrompt,
      }),
    });
    if (!answerResponse.ok) {
      throw new Error(
        `failed to get answer. Error: ${answerResponse.status} ${answerResponse.statusText}`
      );
    }
    const responseData = await answerResponse.json();
    const answer = responseData.answer;

    return NextResponse.json({ content: answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: 'プロンプトテンプレートの修正に失敗しました',
      },
      { status: 500 }
    );
  }
}
