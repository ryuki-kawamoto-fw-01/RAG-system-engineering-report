import { Client } from '@microsoft/microsoft-graph-client';
import type { User } from '@microsoft/microsoft-graph-types';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isDevelopment } from '../../../config';

// 環境変数から許可グループのIDリストを取得（カンマ区切り）
const ALLOWED_GROUPS =
  process.env.ALLOWED_GROUPS?.split(',')
    .map((g) => g.trim())
    .filter(Boolean) ?? [];

// ユーザーが許可されたグループに所属しているかチェック
const checkGroupAccess = (userGroups: string[]): boolean => {
  if (ALLOWED_GROUPS.length === 0) {
    console.error('ALLOWED_GROUPS環境変数が設定されていません');
    return false;
  }

  return userGroups.some((groupId) => ALLOWED_GROUPS.includes(groupId));
};

// プロバイダートークン（X-MS-TOKEN-AAD-EXPIRES-ON）の有効期限をチェック
const isProviderTokenExpired = (expiresOn: string | null): boolean => {
  if (!expiresOn) {
    console.error('[AUTH] プロバイダートークン（X-MS-TOKEN-AAD-EXPIRES-ON）が存在しません');
    return true;
  }

  const bufferTime = 5 * 60 * 1000;
  const currentTime = Date.now();
  const expirationTime = new Date(expiresOn).getTime();

  if (isNaN(expirationTime)) {
    console.error('[AUTH] プロバイダートークンの有効期限が無効な形式です:', expiresOn);
    return true;
  }

  const isExpired = currentTime >= expirationTime - bufferTime;

  if (isExpired) {
    const timeUntilExpiry = expirationTime - currentTime;
    const minutes = Math.floor(timeUntilExpiry / 1000 / 60);
    console.warn('[AUTH] プロバイダートークン期限切れ:', {
      expirationTime: new Date(expirationTime).toISOString(),
      remainingMinutes: minutes,
    });
  }

  return isExpired;
};

export const getCurrentUser = async () => {
  if (isDevelopment) {
    return {
      id: process.env.DEV_USER_ID!,
      name: process.env.DEV_USER_NAME!,
      email: process.env.DEV_USER_EMAIL!,
      departmentName: process.env.DEV_USER_DEPARTMENT_NAME ?? 'テスト部署',
    };
  }

  const user = await buildUserFromHeader();

  if (user === null) {
    redirect('/');
  }

  return user;
};

type Claim = {
  typ: string;
  val: string;
};

export const buildUserFromHeader = async () => {
  const headersList = await headers();

  const clientPrincipal = headersList.get('X-MS-CLIENT-PRINCIPAL');
  const id = headersList.get('X-MS-CLIENT-PRINCIPAL-ID') ?? '';
  const accessToken = headersList.get('X-MS-TOKEN-AAD-ACCESS-TOKEN');
  const expiresOn = headersList.get('X-MS-TOKEN-AAD-EXPIRES-ON');

  if (!clientPrincipal) {
    console.warn('[AUTH] clientPrincipalが存在しないため認証失敗');
    return null;
  }

  const user = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString());
  const claims: Claim[] = user.claims;

  if (isProviderTokenExpired(expiresOn)) {
    console.warn(
      '[AUTH] プロバイダートークンの有効期限が切れています。再ログインにリダイレクトします。',
      {
        expiresOn,
        currentTime: new Date().toISOString(),
      }
    );
    redirect('/.auth/login/aad?post_login_redirect_uri=/');
  }

  let groups: string[] = [];
  if (!isDevelopment) {
    try {
      groups = await getUserGroups(accessToken);
    } catch (error: unknown) {
      console.error('[AUTH] グループ情報の取得に失敗:', error);
      redirect('/403error.html');
    }

    const hasAccess = checkGroupAccess(groups);
    if (!hasAccess) {
      console.error('[AUTH] アクセス拒否:', {
        userId: id,
        userGroups: groups.length > 0 ? groups : '(グループ情報なし)',
        allowedGroups: ALLOWED_GROUPS,
        reason:
          groups.length === 0
            ? 'グループ情報が取得できていません'
            : '許可されたグループに所属していません',
      });
      redirect('/403error.html');
    }
  }

  const { name, email } = claims.reduce(
    (acc, { typ, val }) => {
      if (typ === 'name') acc.name = val;
      if (typ === 'preferred_username') acc.email = val;
      return acc;
    },
    { name: '', email: '' }
  );

  let departmentName: string = '';
  try {
    const userInfo = await getUserInfo(accessToken, ['department']);
    departmentName = userInfo?.department ?? '';
  } catch (reason: unknown) {
    console.error('部署情報の取得に失敗:', reason);
    if (
      typeof reason === 'object' &&
      reason !== null &&
      'statusCode' in reason &&
      (reason as { statusCode: number }).statusCode === 401
    ) {
      console.error('認証トークンが無効です。再ログインにリダイレクトします。');
      redirect('/.auth/login/aad?post_login_redirect_uri=/');
    }
  }

  const userResult = {
    id,
    name,
    email,
    departmentName,
    groups,
  };

  console.log('[AUTH] 認証成功:', {
    userId: id,
    name,
    email,
    department: departmentName,
    groupCount: groups.length,
  });

  return userResult;
};

// Graph APIでユーザーのグループIDを取得（ページネーション対応）
async function getUserGroups(accessToken: string | null): Promise<string[]> {
  if (!accessToken) {
    throw new Error('アクセストークンがありません');
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  try {
    const allGroupIds: string[] = [];
    let nextLink: string | undefined = '/me/memberOf';
    let pageCount = 0;
    const MAX_PAGES = 1000;

    while (nextLink) {
      pageCount++;

      if (pageCount > MAX_PAGES) {
        console.error(
          `[AUTH] グループ取得が最大ページ数(${MAX_PAGES})に達しました。処理を中断します。`
        );
        break;
      }

      const response = await client.api(nextLink).select('id').get();

      if (response.value && Array.isArray(response.value)) {
        const groupIds = response.value.map((group: { id: string }) => group.id);
        allGroupIds.push(...groupIds);
      }

      nextLink = response['@odata.nextLink'] || undefined;
    }

    return allGroupIds;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (('statusCode' in error && (error as { statusCode: number }).statusCode === 401) ||
        ('code' in error && (error as { code: string }).code === 'InvalidAuthenticationToken'))
    ) {
      console.error('[AUTH] トークンが無効または期限切れです');
      redirect('/.auth/login/aad?post_login_redirect_uri=/');
    }
    throw error;
  }
}

// Graph APIでユーザー情報を取得
async function getUserInfo<T extends Array<keyof User>>(
  accessToken: string | null,
  selectKey: T
): Promise<{ [K in T extends Array<infer U> ? U : never]: string } | null> {
  if (!accessToken) return null;

  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  try {
    return await client
      .api('/me')
      .select([...selectKey])
      .get();
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (('statusCode' in error && (error as { statusCode: number }).statusCode === 401) ||
        ('code' in error && (error as { code: string }).code === 'InvalidAuthenticationToken'))
    ) {
      const errorMessage =
        'message' in error ? (error as { message: string }).message : 'Unknown error';
      console.error('トークンが無効または期限切れです:', errorMessage);
      return null;
    }
    throw error;
  }
}
