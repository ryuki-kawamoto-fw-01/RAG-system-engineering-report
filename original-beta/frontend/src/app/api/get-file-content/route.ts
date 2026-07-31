import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/_utils/auth';
import { ALLOW_CONTAINER_NAMES } from '../const';

const orchestratorDocumentEndpoint = process.env.ORCHESTRATOR_DOCUMENT_API_ENDPOINT;
const orchestratorDocumentCredential = process.env.ORCHESTRATOR_DOCUMENT_API_CREDENTIAL;
const orchestratorStandardEndpoint = process.env.ORCHESTRATOR_STANDARD_API_ENDPOINT;
const orchestratorStandardCredential = process.env.ORCHESTRATOR_STANDARD_API_CREDENTIAL;
function getUrl(functionName: string, queryParams: Record<string, string> = {}): string {
  if (
    !process.env.ORCHESTRATOR_DOCUMENT_API_ENDPOINT ||
    !process.env.ORCHESTRATOR_DOCUMENT_API_CREDENTIAL
  ) {
    throw new Error(
      'ORCHESTRATOR_DOCUMENT_API_ENDPOINT and ORCHESTRATOR_DOCUMENT_API_CREDENTIAL must be set'
    );
  }
  const baseUrl = `${orchestratorDocumentEndpoint}/${functionName}?code=${orchestratorDocumentCredential}`;
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `&${key}=${encodeURIComponent(value)}`)
    .join('');
  return baseUrl + queryString;
}
function getStdUrl(functionName: string, queryParams: Record<string, string> = {}): string {
  const baseUrl = `${orchestratorStandardEndpoint}/${functionName}?code=${orchestratorStandardCredential}`;
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

  const url = new URL(req.url);
  const filepath = url.searchParams.get('filepath');
  const isSplitFile = url.searchParams.get('is_split_file') ?? 'false';
  const containerName = url.searchParams.get('container_name');
  // 許可されたcontainerName以外は弾く
  if (containerName && !ALLOW_CONTAINER_NAMES.includes(containerName)) {
    return NextResponse.json({ message: '不正なパラメータ指定' }, { status: 400 });
  }

  if (!filepath) {
    return NextResponse.json(
      {
        message: 'filepathは必須です',
      },
      { status: 400 }
    );
  }

  try {
    // Azure Functionsのget-file-contentエンドポイントを呼び出す
    const queryParams: Record<string, string> = { filepath, is_split_file: isSplitFile };
    if (containerName) {
      queryParams.container_name = containerName;
    }

    let fileResponse;
    if (
      containerName === process.env.NEXT_PUBLIC_STANDARD_STORAGE_CONTAINER_NAME ||
      containerName === process.env.NEXT_PUBLIC_STANDARD_PREVIEW_STORAGE_CONTAINER_NAME
    ) {
      fileResponse = await fetch(getStdUrl('get-file-content', queryParams), {
        method: 'GET',
      });
    } else {
      fileResponse = await fetch(getUrl('get-file-content', queryParams), {
        method: 'GET',
      });
    }

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
