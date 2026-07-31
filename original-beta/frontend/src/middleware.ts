import { NextRequest, NextResponse } from 'next/server';
import { isRouteDisabled } from './disabledRoutes';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (isRouteDisabled(pathname)) {
    // 存在しないパスを指定して404ページを出す．不都合があればエラーページを用意してそこにリダイレクト
    return NextResponse.redirect(new URL('/404', req.url));
  }
  const cookieName = 'first_visited';
  const visited = req.cookies.get(cookieName);

  if (!visited) {
    const res = NextResponse.redirect(new URL('/check-terms', req.url));
    res.cookies.set(cookieName, 'true', {
      maxAge: 60 * 60 * 24 * 30, // 1カ月有効
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
