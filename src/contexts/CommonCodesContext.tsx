'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getCommonCodes, CommonCode } from '../lib/api/commonCodes';

interface CommonCodesContextType {
  // 공통 코드 그룹별 캐시
  categories: CommonCode[];
  payMethods: CommonCode[];
  banks: CommonCode[];
  cards: CommonCode[];
  income: CommonCode[];
  
  // 로딩 및 에러 상태
  loading: boolean;
  error: string | null;
  
  // 수동으로 리프레시하는 함수
  refresh: () => Promise<void>;
  
  // 특정 그룹 코드 가져오기
  getCodesByGroup: (groupCode: string) => CommonCode[];
}

const CommonCodesContext = createContext<CommonCodesContextType | undefined>(undefined);

export function CommonCodesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [cards, setCards] = useState<CommonCode[]>([]);
  const [income, setIncome] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 모든 공통 코드 로드
  const loadCommonCodes = useCallback(async () => {
    if (loading) return; // 이미 로딩 중이면 스킵
    
    try {
      setLoading(true);
      setError(null);

      // 모든 공통 코드를 병렬로 로드
      const [categoriesData, payMethodsData, banksData, cardsData, incomeData] = await Promise.all([
        getCommonCodes('CATEGORY'),
        getCommonCodes('PAY_METHOD'),
        getCommonCodes('BANK'),
        getCommonCodes('CARD'),
        getCommonCodes('INCOME'),
      ]);

      setCategories(categoriesData);
      setPayMethods(payMethodsData);
      setBanks(banksData);
      setCards(cardsData);
      setIncome(incomeData);
      setIsInitialized(true);
      
      console.log('[CommonCodesContext] 모든 공통 코드 로드 완료');
    } catch (err: any) {
      console.error('[CommonCodesContext] 공통 코드 로드 오류:', err);
      setError(err?.message || '공통 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // 수동 리프레시
  const refresh = useCallback(async () => {
    setIsInitialized(false);
    await loadCommonCodes();
  }, [loadCommonCodes]);

  // 특정 그룹 코드 가져오기
  const getCodesByGroup = useCallback((groupCode: string): CommonCode[] => {
    switch (groupCode.toUpperCase()) {
      case 'CATEGORY':
        return categories;
      case 'PAY_METHOD':
        return payMethods;
      case 'BANK':
        return banks;
      case 'CARD':
        return cards;
      case 'INCOME':
        return income;
      default:
        return [];
    }
  }, [categories, payMethods, banks, cards, income]);

  // 세션이 로드되면 공통 코드 로드 (한 번만)
  useEffect(() => {
    if (session?.user?.id && !isInitialized && !loading) {
      loadCommonCodes();
    }
  }, [session?.user?.id, isInitialized, loading, loadCommonCodes]);

  const value: CommonCodesContextType = {
    categories,
    payMethods,
    banks,
    cards,
    income,
    loading,
    error,
    refresh,
    getCodesByGroup,
  };

  return (
    <CommonCodesContext.Provider value={value}>
      {children}
    </CommonCodesContext.Provider>
  );
}

// 커스텀 훅: 공통 코드 Context 사용
export function useCommonCodes(): CommonCodesContextType {
  const context = useContext(CommonCodesContext);
  if (context === undefined) {
    throw new Error('useCommonCodes must be used within a CommonCodesProvider');
  }
  return context;
}

// 개별 공통 코드 그룹을 위한 편의 훅들
export function useCategories() {
  const { categories, loading } = useCommonCodes();
  return { categories, loading };
}

export function usePayMethods() {
  const { payMethods, loading } = useCommonCodes();
  return { payMethods, loading };
}

export function useBanks() {
  const { banks, loading } = useCommonCodes();
  return { banks, loading };
}

export function useCards() {
  const { cards, loading } = useCommonCodes();
  return { cards, loading };
}

export function useIncome() {
  const { income, loading } = useCommonCodes();
  return { income, loading };
}

