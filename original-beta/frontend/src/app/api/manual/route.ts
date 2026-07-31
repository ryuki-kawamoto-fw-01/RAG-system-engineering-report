import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/_utils/auth';

function getUrl(functionName: string, queryParams: Record<string, string> = {}): string {
  const endpoint = process.env.ORCHESTRATOR_MANUAL_API_ENDPOINT;
  const credential = process.env.ORCHESTRATOR_MANUAL_API_CREDENTIAL;
  if (!endpoint || !credential) {
    throw new Error(
      'ORCHESTRATOR_MANUAL_API_ENDPOINT and ORCHESTRATOR_MANUAL_API_CREDENTIAL must be set'
    );
  }
  const baseUrl = `${endpoint}/${functionName}?code=${credential}`;
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `&${key}=${encodeURIComponent(value)}`)
    .join('');
  return baseUrl + queryString;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        message: 'ログインしてください',
      },
      { status: 401 }
    );
  }

  const urlReq = new URL(req.url);
  const url = urlReq.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      {
        message: 'urlは必須です',
      },
      { status: 400 }
    );
  }

  try {
    // Azure Functionsのget-preview-file-contentエンドポイントを呼び出す
    const fileResponse = await fetch(getUrl('manual', { url }), {
      method: 'GET',
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      throw new Error(
        `ファイル取得に失敗しました。Error: ${fileResponse.status} ${fileResponse.statusText}. ${errorText}`
      );
    }

    // コンテンツタイプを取得
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    // レスポンスデータを取得
    const data = await fileResponse.arrayBuffer();

    // 同じContent-Typeでレスポンスを返す
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('ファイル取得中にエラーが発生しました:', error);
    return NextResponse.json(
      {
        message: 'ファイルの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
