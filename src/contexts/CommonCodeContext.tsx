'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '@/lib/api/axios';

// 공통코드 타입 정의
export interface CommonCode {
  grp_cd: string;
  cd: string;
  cd_nm: string;
  cd_desc?: string;
  sort_order: number;
  use_yn: string;
  created_at?: string;
  updated_at?: string;
}

// Context 타입 정의
interface CommonCodeContextType {
  codes: CommonCode[];
  loading: boolean;
  error: string | null;
  fetchCodes: (grpCd?: string) => Promise<void>;
  getCodesByGroup: (grpCd: string) => CommonCode[];
  getCodeName: (grpCd: string, cd: string) => string;
  refreshCodes: () => Promise<void>;
}

// Context 생성
const CommonCodeContext = createContext<CommonCodeContextType | undefined>(undefined);

// Provider 컴포넌트 Props
interface CommonCodeProviderProps {
  children: ReactNode;
}

// Provider 컴포넌트
export function CommonCodeProvider({ children }: CommonCodeProviderProps) {
  const [codes, setCodes] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 공통코드 조회 함수
  const fetchCodes = useCallback(async (grpCd?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { use_yn: 'Y' };
      if (grpCd) {
        params.grp_cd = grpCd;
      }

      const response = await apiClient.get<CommonCode[]>('/common-codes', { params });
      setCodes(response.data || []);
    } catch (err: any) {
      console.error('공통코드 조회 오류:', err);
      setError(err.response?.data?.message || '공통코드 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 전체 공통코드 조회 (초기 로드)
  const refreshCodes = useCallback(async () => {
    await fetchCodes();
  }, [fetchCodes]);

  // 그룹 코드별 코드 목록 조회
  const getCodesByGroup = useCallback((grpCd: string): CommonCode[] => {
    return codes.filter(code => code.grp_cd === grpCd && code.use_yn === 'Y');
  }, [codes]);

  // 코드 이름 조회
  const getCodeName = useCallback((grpCd: string, cd: string): string => {
    const code = codes.find(c => c.grp_cd === grpCd && c.cd === cd && c.use_yn === 'Y');
    return code?.cd_nm || cd;
  }, [codes]);

  // 초기 로드: 전체 공통코드 조회
  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const value: CommonCodeContextType = {
    codes,
    loading,
    error,
    fetchCodes,
    getCodesByGroup,
    getCodeName,
    refreshCodes,
  };

  return (
    <CommonCodeContext.Provider value={value}>
      {children}
    </CommonCodeContext.Provider>
  );
}

// Hook: Context 사용
export function useCommonCodes() {
  const context = useContext(CommonCodeContext);
  if (context === undefined) {
    throw new Error('useCommonCodes must be used within a CommonCodeProvider');
  }
  return context;
}

