import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // 인증된 사용자가 로그인 페이지에 접근하면 홈으로 리다이렉트
    if (req.nextUrl.pathname === '/login' && req.nextauth.token) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 로그인 페이지는 인증 없이 접근 가능
        if (req.nextUrl.pathname === '/login') {
          return true;
        }
        // 나머지 페이지는 인증 필요
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// 보호할 경로 (로그인 페이지 제외)
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 매칭:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public 폴더
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};

