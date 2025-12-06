# MoneyMate BackOffice

가계부 관리 시스템 백오피스 애플리케이션

## 📋 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 변수 설정](#환경-변수-설정)
- [API 개발 가이드](#api-개발-가이드)
  - [Swagger를 사용한 API 문서화](#swagger를-사용한-api-문서화)
  - [API 라우트 생성](#api-라우트-생성)
- [프론트엔드 개발 가이드](#프론트엔드-개발-가이드)
  - [Axios를 사용한 API 호출](#axios를-사용한-api-호출)
  - [CSS Modules 사용](#css-modules-사용)
  - [페이지 생성](#페이지-생성)
- [인증 및 보안](#인증-및-보안)
- [데이터베이스](#데이터베이스)
- [빌드 및 배포](#빌드-및-배포)

## 🛠 기술 스택

### Frontend
- **Next.js 15.4.6** - React 프레임워크 (App Router)
- **React 19.1.0** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS 3.4.18** - 유틸리티 CSS 프레임워크
- **CSS Modules** - 컴포넌트 스코프 스타일링
- **Axios 1.13.2** - HTTP 클라이언트
- **NextAuth.js 4.24.11** - 인증 라이브러리

### Backend
- **Next.js API Routes** - 서버리스 API
- **MySQL2** - 데이터베이스 드라이버
- **bcryptjs** - 비밀번호 해싱
- **Swagger JSDoc** - API 문서화

### 개발 도구
- **ESLint** - 코드 린팅
- **PostCSS** - CSS 처리
- **Autoprefixer** - CSS 벤더 프리픽스

## 📁 프로젝트 구조

```
moneymate/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API 라우트
│   │   │   ├── auth/                 # 인증 API
│   │   │   │   └── [...nextauth]/    # NextAuth 핸들러
│   │   │   └── wallets/              # 지갑 API
│   │   │       ├── [id]/             # 동적 라우트 (상세, 수정, 삭제)
│   │   │       └── route.ts          # 목록 조회, 생성
│   │   ├── login/                    # 로그인 페이지
│   │   ├── wallets/                  # 지갑 관리 페이지
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── client-layout.tsx         # 클라이언트 레이아웃 (SessionProvider)
│   │   └── page.tsx                  # 홈 페이지
│   ├── components/                   # 재사용 가능한 컴포넌트
│   │   └── layout/                   # 레이아웃 컴포넌트
│   │       ├── BackOfficeLayout.tsx  # 메인 레이아웃
│   │       ├── Header.tsx            # 헤더 컴포넌트
│   │       └── Sidebar.tsx           # 사이드바 컴포넌트
│   ├── lib/                          # 유틸리티 및 설정
│   │   ├── api/
│   │   │   ├── axios.ts              # Axios 인스턴스
│   │   │   └── common.ts             # 공통 API 유틸리티 (fetch 기반)
│   │   └── db.ts                     # 데이터베이스 연결
│   ├── styles/                       # 스타일 파일
│   │   └── css/                      # CSS Modules
│   │       ├── globals.css           # 전역 스타일
│   │       ├── *.module.css          # 컴포넌트별 CSS Modules
│   └── types/                        # TypeScript 타입 정의
│       └── next-auth.d.ts            # NextAuth 타입 확장
├── middleware.ts                     # Next.js 미들웨어 (인증 보호)
├── next.config.ts                    # Next.js 설정
├── postcss.config.js                 # PostCSS 설정
├── tailwind.config.js                # Tailwind CSS 설정
└── package.json                      # 프로젝트 의존성
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=moneymate

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# API Base URL (선택사항, 기본값: /api)
NEXT_PUBLIC_API_BASE_URL=/api
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 빌드

```bash
npm run build
npm start
```

## 📝 환경 변수 설정

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| `DB_HOST` | 데이터베이스 호스트 | ✅ | - |
| `DB_PORT` | 데이터베이스 포트 | ❌ | 3306 |
| `DB_USER` | 데이터베이스 사용자 | ✅ | - |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | ✅ | - |
| `DB_DATABASE` | 데이터베이스 이름 | ✅ | - |
| `NEXTAUTH_URL` | NextAuth 기본 URL | ✅ | - |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 키 | ✅ | - |
| `NEXT_PUBLIC_API_BASE_URL` | API 기본 URL | ❌ | `/api` |

## 🔌 API 개발 가이드

### Swagger를 사용한 API 문서화

이 프로젝트는 **swagger-jsdoc**을 사용하여 주석 기반으로 API 문서를 관리합니다.

#### Swagger 주석 작성 방법

API 라우트 파일에 JSDoc 형식의 Swagger 주석을 추가합니다:

```typescript
/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: 지갑 목록 조회
 *     description: 사용자의 지갑 목록을 조회합니다.
 *     tags: [Wallets]
 *     parameters:
 *       - in: query
 *         name: usr_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 지갑 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wallet'
 */
export async function GET(request: NextRequest) {
  // API 로직
}
```

#### Swagger 문서 확인

Swagger 문서는 다음 엔드포인트에서 확인할 수 있습니다:

- **Swagger JSON**: `/api/docs/swagger.json`
- **Swagger UI**: `/api/docs` (구현 예정)

> **참고**: Swagger UI 페이지가 구현되지 않은 경우, `src/app/api/docs/route.ts`를 생성하여 Swagger UI를 추가할 수 있습니다.

#### 주요 Swagger 태그

- `@swagger` - Swagger 주석 시작
- `summary` - API 요약
- `description` - 상세 설명
- `tags` - API 그룹화
- `parameters` - 파라미터 정의
- `requestBody` - 요청 본문 정의
- `responses` - 응답 정의
- `$ref` - 스키마 참조

### API 라우트 생성

#### 1. API 라우트 파일 생성

`src/app/api/[resource]/route.ts` 경로에 파일을 생성합니다:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: 리소스 목록 조회
 *     tags: [Resource]
 */
export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 쿼리
    const rows = await query('SELECT * FROM table');
    
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/resource:
 *   post:
 *     summary: 리소스 생성
 *     tags: [Resource]
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 데이터베이스 삽입
    // ...
    
    return NextResponse.json(
      { message: '생성되었습니다.', data: result },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
```

#### 2. 동적 라우트 (ID 기반)

`src/app/api/[resource]/[id]/route.ts` 경로에 파일을 생성합니다:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /api/resource/{id}:
 *   get:
 *     summary: 리소스 상세 조회
 *     tags: [Resource]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15에서는 params가 Promise일 수 있음
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    // 데이터베이스 쿼리
    const [row] = await query('SELECT * FROM table WHERE id = ?', [id]);
    
    if (!row) {
      return NextResponse.json(
        { message: '리소스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: row });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
```

#### 3. 데이터베이스 쿼리 사용

```typescript
import { query } from '@/lib/db';

// SELECT
const rows = await query('SELECT * FROM table WHERE condition = ?', [value]);

// INSERT
const insertSql = 'INSERT INTO table (col1, col2) VALUES (?, ?)';
await query(insertSql, [value1, value2]);

// UPDATE
const updateSql = 'UPDATE table SET col1 = ? WHERE id = ?';
await query(updateSql, [newValue, id]);

// DELETE (실제 삭제 대신 use_yn 업데이트)
const deleteSql = "UPDATE table SET use_yn = 'N' WHERE id = ?";
await query(deleteSql, [id]);
```

## 🎨 프론트엔드 개발 가이드

### Axios를 사용한 API 호출

#### 1. Axios 인스턴스 사용

프로젝트는 공통 Axios 인스턴스를 제공합니다:

```typescript
import apiClient from '@/lib/api/axios';

// GET 요청
const response = await apiClient.get('/wallets', {
  params: {
    usr_id: 'shlee',
    use_yn: 'Y'
  }
});
console.log(response.data); // 자동으로 data 언래핑됨

// POST 요청
const response = await apiClient.post('/wallets', {
  usr_id: 'shlee',
  wlt_type: 'CARD',
  wlt_name: '현대카드'
});

// PUT 요청
const response = await apiClient.put(`/wallets/${wlt_id}`, {
  wlt_name: '수정된 이름'
});

// DELETE 요청
const response = await apiClient.delete(`/wallets/${wlt_id}`);
```

#### 2. 에러 처리

Axios 인터셉터가 자동으로 에러를 처리하며, `ApiError`를 throw합니다:

```typescript
try {
  const wallets = await apiClient.get('/wallets');
} catch (error: any) {
  if (error.response) {
    // 서버 응답 에러
    console.error('Status:', error.response.status);
    console.error('Message:', error.response.data.message);
  } else if (error.request) {
    // 요청 전송 실패
    console.error('Network Error');
  } else {
    // 기타 에러
    console.error('Error:', error.message);
  }
}
```

#### 3. Axios 인스턴스 특징

- **자동 baseURL**: `/api`가 자동으로 추가됨
- **타임아웃**: 30초
- **응답 언래핑**: `{ data: ... }` 형태의 응답에서 `data` 자동 추출
- **에러 처리**: 통일된 에러 처리

### CSS Modules 사용

프로젝트는 **CSS Modules**를 사용하여 컴포넌트별 스타일을 관리합니다.

#### 1. CSS 파일 생성

`src/styles/css/[ComponentName].module.css` 경로에 CSS 파일을 생성합니다:

```css
/* src/styles/css/MyComponent.module.css */
.container {
  padding: 1rem;
  background-color: white;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}
```

#### 2. CSS Modules 사용

컴포넌트에서 CSS Modules를 import하여 사용합니다:

```typescript
import styles from '@/styles/css/MyComponent.module.css';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>제목</h1>
      <button className={styles.button}>버튼</button>
    </div>
  );
}
```

#### 3. 전역 스타일

전역 스타일은 `src/styles/css/globals.css`에 정의합니다:

```css
/* src/styles/css/globals.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-geist-sans);
  font-size: 0.9rem;
  line-height: 1.5;
}
```

#### 4. Tailwind CSS와 함께 사용

프로젝트는 Tailwind CSS와 CSS Modules를 함께 사용합니다. 필요에 따라 Tailwind 클래스를 직접 사용할 수 있습니다:

```typescript
<div className={`${styles.container} flex items-center gap-4`}>
  {/* Tailwind 클래스와 CSS Modules 클래스를 함께 사용 */}
</div>
```

### 페이지 생성

#### 1. 페이지 파일 생성

`src/app/[pageName]/page.tsx` 경로에 페이지 파일을 생성합니다:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api/axios';
import styles from '@/styles/css/MyPage.module.css';

export default function MyPage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/resource');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>페이지 제목</h1>
      {/* 페이지 내용 */}
    </div>
  );
}
```

#### 2. 레이아웃 사용

페이지는 자동으로 `BackOfficeLayout`으로 감싸집니다. 로그인 페이지처럼 별도 레이아웃이 필요한 경우:

```typescript
// src/app/login/layout.tsx
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 레이아웃 없이 렌더링
  return <>{children}</>;
}
```

## 🔐 인증 및 보안

### NextAuth.js 사용

프로젝트는 NextAuth.js를 사용하여 인증을 처리합니다.

#### 1. 세션 사용

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>로딩 중...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>로그인이 필요합니다.</div>;
  }

  return <div>안녕하세요, {session?.user?.nickname}님!</div>;
}
```

#### 2. 서버 컴포넌트에서 세션 사용

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>로그인이 필요합니다.</div>;
  }

  return <div>안녕하세요, {session.user.nickname}님!</div>;
}
```

#### 3. 로그인/로그아웃

```typescript
import { signIn, signOut } from 'next-auth/react';

// 로그인
await signIn('credentials', {
  id: 'username',
  password: 'password',
  redirect: false,
});

// 로그아웃
await signOut({ callbackUrl: '/login' });
```

### 인증 보호 (Middleware)

`middleware.ts`를 통해 인증되지 않은 사용자를 자동으로 로그인 페이지로 리다이렉트합니다:

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});
```

## 💾 데이터베이스

### 데이터베이스 연결

프로젝트는 MySQL2를 사용하여 데이터베이스에 연결합니다:

```typescript
// src/lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+09:00',
  dateStrings: true,
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
```

### 쿼리 사용 예시

```typescript
import { query } from '@/lib/db';

// SELECT
const users = await query('SELECT * FROM MMT_USR_MST WHERE status = ?', ['ACTIVE']);

// INSERT
const insertSql = 'INSERT INTO MMT_WLT_MST (wlt_id, usr_id, wlt_name) VALUES (UUID(), ?, ?)';
await query(insertSql, [usrId, walletName]);

// UPDATE
const updateSql = 'UPDATE MMT_WLT_MST SET wlt_name = ? WHERE wlt_id = ?';
await query(updateSql, [newName, walletId]);

// 트랜잭션 (필요시)
import pool from '@/lib/db';
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  await connection.query(sql1, params1);
  await connection.query(sql2, params2);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## 🏗 빌드 및 배포

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npm start
```

### Docker를 사용한 배포

프로젝트는 Docker를 지원합니다:

```bash
# Docker 이미지 빌드
docker build -t moneymate-backoffice .

# Docker 컨테이너 실행
docker run -p 3000:3000 \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e DB_DATABASE=moneymate \
  -e NEXTAUTH_SECRET=your_secret \
  moneymate-backoffice
```

## 📚 참고 자료

### 주요 라이브러리 문서

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Axios Documentation](https://axios-http.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)

### 프로젝트 내 문서

- `src/lib/api/README.md` - API 유틸리티 가이드 (fetch 기반)

## 🤝 개발 가이드

### 코드 스타일

- **TypeScript**: 모든 파일은 TypeScript로 작성
- **컴포넌트**: 함수형 컴포넌트 사용
- **스타일**: CSS Modules 우선, 필요시 Tailwind CSS
- **API 호출**: Axios 인스턴스 사용 (`@/lib/api/axios`)

### 파일 명명 규칙

- **컴포넌트**: `PascalCase.tsx` (예: `MyComponent.tsx`)
- **페이지**: `page.tsx` (Next.js App Router 규칙)
- **API 라우트**: `route.ts` (Next.js App Router 규칙)
- **CSS Modules**: `[ComponentName].module.css`
- **유틸리티**: `camelCase.ts`

### API 응답 형식

표준 API 응답 형식:

```typescript
// 성공 응답
{
  data: T,           // 실제 데이터
  message?: string,  // 성공 메시지 (선택)
  success?: boolean  // 성공 여부 (선택)
}

// 에러 응답
{
  message: string,   // 에러 메시지
  error?: any        // 추가 에러 정보 (선택)
}
```

### 에러 처리

- **API 라우트**: `try-catch`로 에러 처리, 적절한 HTTP 상태 코드 반환
- **프론트엔드**: Axios 인터셉터가 자동 처리, 필요시 `catch` 블록에서 추가 처리

## 📝 기타 참고사항

### Next.js 15 변경사항

- **동적 라우트 params**: `params`가 Promise일 수 있으므로 `await Promise.resolve(params)`로 처리
- **swcMinify**: Next.js 15에서는 기본적으로 활성화되어 있어 설정 불필요

### 데이터베이스 스키마

- 데이터베이스 이름: `moneymate`
- 모든 테이블은 `moneymate` 스키마 하위에 있음
- 쿼리 시 스키마 명시: `moneymate.MMT_WLT_MST`

### 환경 변수

- `.env.local` 파일에 환경 변수 저장 (Git에 커밋하지 않음)
- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능

---

**문의사항이나 개선 제안이 있으시면 이슈를 등록해주세요!** 🚀
