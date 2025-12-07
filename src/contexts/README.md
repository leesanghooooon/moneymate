# 공통코드 Context 사용 가이드

Vue의 스토어와 유사하게 공통코드를 중앙에서 관리하는 React Context API 사용 방법입니다.

## 사용 방법

### 1. Context Provider 설정
`CommonCodeProvider`가 이미 `src/app/client-layout.tsx`에서 설정되어 있습니다.

### 2. 컴포넌트에서 사용

```typescript
'use client';

import { useCommonCodes } from '@/contexts/CommonCodeContext';

export default function MyComponent() {
  const { 
    codes,           // 전체 공통코드 배열
    loading,         // 로딩 상태
    error,           // 에러 메시지
    getCodesByGroup, // 그룹 코드별 코드 목록 조회
    getCodeName,     // 코드 이름 조회
    refreshCodes,    // 전체 코드 새로고침
  } = useCommonCodes();

  // 그룹 코드별 코드 목록 조회
  const bankCodes = getCodesByGroup('BANK');
  const categoryCodes = getCodesByGroup('CATEGORY');

  // 코드 이름 조회
  const bankName = getCodeName('BANK', '004');

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {bankCodes.map(code => (
        <div key={code.cd}>{code.cd_nm}</div>
      ))}
    </div>
  );
}
```
