import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// 환경 변수에서 시크릿 키 가져오기 (운영환경 필수)
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'your-super-secret-key-moneymate-application-secret-key';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// 디버깅: 환경 변수 로깅 (운영환경에서는 제거)
if (process.env.NODE_ENV !== 'production') {
  console.log('[NextAuth] Config:', {
    hasSecret: !!NEXTAUTH_SECRET,
    secretLength: NEXTAUTH_SECRET?.length,
    url: NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}

export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === 'development', // 개발 환경에서만 디버그 모드
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        id: { label: "ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('[NextAuth] authorize called', {
          hasId: !!credentials?.id,
          hasPassword: !!credentials?.password,
          id: credentials?.id,
        });

        if (!credentials?.id || !credentials?.password) {
          console.error('[NextAuth] Missing credentials');
          throw new Error('아이디와 비밀번호를 입력해주세요.');
        }

        try {
          console.log('[NextAuth] Querying user:', credentials.id);
          // 사용자 조회
          const sql = `
            SELECT 
              id,
              uuid,
              email,
              nickname,
              password_hash,
              profile_image_url,
              status
            FROM moneymate.MMT_USR_MST
            WHERE id = ?
              AND status = 'ACTIVE'
          `;

          const users = await query(sql, [credentials.id]);
          console.log('[NextAuth] User query result:', { userCount: users.length });

          if (users.length === 0) {
            console.error('[NextAuth] User not found:', credentials.id);
            throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
          }

          const user = users[0];
          console.log('[NextAuth] User found:', { id: user.id, email: user.email, status: user.status });

          // 비밀번호 검증
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          console.log('[NextAuth] Password validation:', { isValid });

          if (!isValid) {
            console.error('[NextAuth] Invalid password for user:', credentials.id);
            throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
          }

          // 마지막 로그인 시간 업데이트
          const updateSql = `
            UPDATE moneymate.MMT_USR_MST
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          await query(updateSql, [credentials.id]);

          // password_hash 제외하고 반환
          const { password_hash, ...userWithoutPassword } = user;
          console.log('[NextAuth] Login successful for user:', user.id);
          return userWithoutPassword;

        } catch (error: any) {
          console.error('[NextAuth] Authorize error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw new Error(error.message || '로그인 중 오류가 발생했습니다.');
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24시간
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.uuid = user.uuid;
        token.email = user.email;
        token.nickname = user.nickname;
        token.profile_image_url = user.profile_image_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          uuid: token.uuid as string,
          email: token.email as string,
          nickname: token.nickname as string,
          profile_image_url: token.profile_image_url as string | null,
        };
      }
      return session;
    }
  },
  // JWT 설정
  jwt: {
    secret: NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60, // 24시간
  },
  secret: NEXTAUTH_SECRET,
  // NextAuth는 NEXTAUTH_URL 환경 변수를 자동으로 사용합니다
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };