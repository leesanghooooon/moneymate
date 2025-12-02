# API 공통 함수 가이드

이 디렉토리에는 API 호출을 위한 공통 유틸리티 함수들이 포함되어 있습니다.

## 파일 구조

- `common.ts` - 기본 HTTP 메서드 (GET, POST, PUT, PATCH, DELETE) 및 파일 업로드 지원

## 사용 방법

### 기본 import

```typescript
import { get, post, put, patch, del, upload, ApiError } from '@/lib/api/common';
```

### GET 요청

```typescript
// 기본 GET 요청
const users = await get<User[]>('/users');

// 쿼리 파라미터 포함
const users = await get<User[]>('/users', {
  params: {
    page: 1,
    limit: 10,
    status: 'active'
  }
});

// 커스텀 헤더 포함
const data = await get<Data>('/api/data', {
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value'
  }
});
```

### POST 요청

```typescript
// 기본 POST 요청
const newUser = await post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// POST 요청 with 옵션
const result = await post<Result>('/users', userData, {
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

### PUT 요청

```typescript
// 전체 업데이트
const updatedUser = await put<User>('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

### PATCH 요청

```typescript
// 부분 업데이트
const patchedUser = await patch<User>('/users/1', {
  name: 'Jane Doe'
});
```

### DELETE 요청

```typescript
// 리소스 삭제
await del('/users/1');

// 삭제 후 응답 데이터 받기
const result = await del<{ message: string }>('/users/1');
```

### 파일 업로드

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('description', 'File description');

const result = await upload<{ url: string }>('/upload', formData);
```

### 에러 처리

```typescript
try {
  const data = await get<Data>('/api/data');
  // 성공 처리
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API 에러:', error.message);
    console.error('상태 코드:', error.status);
    console.error('응답 데이터:', error.data);
  } else {
    console.error('네트워크 오류:', error);
  }
}
```

### 요청 취소 (AbortSignal)

```typescript
const controller = new AbortController();

// 취소 타이머 설정 (예: 5초 후 자동 취소)
setTimeout(() => controller.abort(), 5000);

try {
  const data = await get<Data>('/api/data', {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('요청이 취소되었습니다.');
  }
}
```

## 환경 변수 설정

API 기본 URL은 환경 변수로 설정할 수 있습니다:

```env
NEXT_PUBLIC_API_BASE_URL=/api
```

기본값은 `/api`입니다.

## 응답 형식

API 응답은 다음 형식을 지원합니다:

1. 직접 데이터 반환:
   ```json
   { "id": 1, "name": "John" }
   ```

2. 래핑된 응답 (권장):
   ```json
   {
     "data": { "id": 1, "name": "John" },
     "message": "Success",
     "success": true
   }
   ```

함수는 자동으로 `data` 필드를 추출하여 반환합니다.

## 타입 정의

### ApiError

```typescript
class ApiError extends Error {
  status: number;      // HTTP 상태 코드
  data?: any;          // 에러 응답 데이터
}
```

### RequestOptions

```typescript
interface RequestOptions {
  headers?: Record<string, string>;  // 커스텀 헤더
  params?: Record<string, string | number | boolean>;  // 쿼리 파라미터
  signal?: AbortSignal;  // 요청 취소 신호
}
```

## 예제: 완전한 사용 케이스

```typescript
import { get, post, put, del, ApiError } from '@/lib/api/common';

// 사용자 목록 조회
async function fetchUsers(page: number = 1) {
  try {
    const users = await get<User[]>('/users', {
      params: { page, limit: 10 }
    });
    return users;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

// 사용자 생성
async function createUser(userData: CreateUserDto) {
  try {
    const newUser = await post<User>('/users', userData);
    return newUser;
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      // 검증 에러 처리
      console.error('입력 값 오류:', error.data);
    }
    throw error;
  }
}

// 사용자 업데이트
async function updateUser(id: string, userData: UpdateUserDto) {
  const updatedUser = await put<User>(`/users/${id}`, userData);
  return updatedUser;
}

// 사용자 삭제
async function deleteUser(id: string) {
  await del(`/users/${id}`);
}
```


