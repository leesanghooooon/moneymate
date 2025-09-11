import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// 임시 시크릿 키 (실제 운영환경에서는 환경변수 사용 필요)
const TEMP_SECRET = 'your-super-secret-key-moneymate-application-secret-key';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        id: { label: "ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.id || !credentials?.password) {
          throw new Error('아이디와 비밀번호를 입력해주세요.');
        }

        try {
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
            FROM MMT_USR_MST
            WHERE id = ?
              AND status = 'ACTIVE'
          `;

          const users = await query(sql, [credentials.id]);

          if (users.length === 0) {
            throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
          }

          const user = users[0];

          // 비밀번호 검증
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValid) {
            throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
          }

          // 마지막 로그인 시간 업데이트
          const updateSql = `
            UPDATE MMT_USR_MST
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          await query(updateSql, [credentials.id]);

          // password_hash 제외하고 반환
          const { password_hash, ...userWithoutPassword } = user;
          return userWithoutPassword;

        } catch (error: any) {
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
    secret: TEMP_SECRET,
    maxAge: 24 * 60 * 60, // 24시간
  },
  secret: TEMP_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };