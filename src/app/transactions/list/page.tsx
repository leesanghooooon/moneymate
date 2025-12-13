'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api/axios';
import { formatCurrency, removeCommas } from '@/lib/utils/format';
import { useCommonCodes } from '@/contexts/CommonCodeContext';
import styles from '@/styles/css/transactions-list.module.css';

// 지갑 타입
interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
}

// 거래 타입
interface Transaction {
  trx_id: string;
  wlt_id: string;
  wlt_name: string;
  trx_type: string;
  trx_date: string;
  amount: string; // String 타입으로 변경
  category_cd: string;
  category_name: string;
  memo: string;
  created_at?: string; // 정렬을 위해 추가
}

// 빈 row 입력 데이터 타입
interface NewTransactionInput {
  trx_date: string;
  trx_type: 'EXPENSE' | 'INCOME';
  memo: string;
  category_cd: string;
  amount: string;
}

// 헤더 컴포넌트 Props
interface TransactionsHeaderProps {
  selectedYear: number;
  selectedMonth: number;
  selectedWltType: 'CHECK_CARD' | 'CREDIT_CARD';
  selectedTrxType: 'EXPENSE' | 'INCOME';
  loading: boolean;
  onMonthChange: (delta: number) => void;
  onWltTypeChange: (type: 'CHECK_CARD' | 'CREDIT_CARD') => void;
  onTrxTypeChange: (type: 'EXPENSE' | 'INCOME') => void;
  onBatchSave: () => void;
}

// 헤더 컴포넌트 (React.memo로 최적화)
const TransactionsHeader = memo(function TransactionsHeader({
  selectedYear,
  selectedMonth,
  selectedWltType,
  selectedTrxType,
  loading,
  onMonthChange,
  onWltTypeChange,
  onTrxTypeChange,
  onBatchSave,
}: TransactionsHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.dateSelector}>
          <button
            onClick={() => onMonthChange(-1)}
            className={styles.monthButton}
          >
            ‹
          </button>
          <div className={styles.dateDisplay}>
            <span className={styles.year}>{selectedYear}</span>
            <span className={styles.month}>{selectedMonth}</span>
          </div>
          <button
            onClick={() => onMonthChange(1)}
            className={styles.monthButton}
          >
            ›
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* 지갑 타입 필터 버튼 (세그먼트 컨트롤 스타일) */}
          <div className={styles.transactionTypeSegmentedControl}>
            <button
              onClick={() => onWltTypeChange('CHECK_CARD')}
              className={`${styles.segmentButton} ${styles.segmentLeft} ${selectedWltType === 'CHECK_CARD' ? styles.segmentActive : styles.segmentInactive}`}
            >
              체크카드
            </button>
            <button
              onClick={() => onWltTypeChange('CREDIT_CARD')}
              className={`${styles.segmentButton} ${styles.segmentRight} ${selectedWltType === 'CREDIT_CARD' ? styles.segmentActive : styles.segmentInactive}`}
            >
              신용카드
            </button>
          </div>
          
          {/* 거래 유형 토글 버튼 (세그먼트 컨트롤 스타일) */}
          <div className={styles.transactionTypeSegmentedControl}>
            <button
              onClick={() => onTrxTypeChange('EXPENSE')}
              className={`${styles.segmentButton} ${styles.segmentLeft} ${selectedTrxType === 'EXPENSE' ? styles.segmentActive : styles.segmentInactive}`}
            >
              지출
            </button>
            <button
              onClick={() => onTrxTypeChange('INCOME')}
              className={`${styles.segmentButton} ${styles.segmentRight} ${selectedTrxType === 'INCOME' ? styles.segmentActive : styles.segmentInactive}`}
            >
              수입
            </button>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={onBatchSave}
            className={styles.saveButton}
            disabled={loading}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
});

export default function TransactionsListPage() {
  const { data: session, status } = useSession();
  const { getCodesByGroup, getCodeName } = useCommonCodes();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 원본 거래 데이터 저장 (수정 전 데이터, 수정 여부 비교용)
  const [originalTransactions, setOriginalTransactions] = useState<Transaction[]>([]);
  
  // 날짜 선택
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // 지갑 타입 필터 (기본값: 신용카드)
  const [selectedWltType, setSelectedWltType] = useState<'CHECK_CARD' | 'CREDIT_CARD'>('CREDIT_CARD');
  
  // 거래 유형 필터 (기본값: 지출)
  const [selectedTrxType, setSelectedTrxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  
  // 빈 row 입력 데이터 관리 (wallet별, row별로 관리)
  const [newTransactionInputs, setNewTransactionInputs] = useState<Record<string, Record<number, NewTransactionInput>>>({});
  
  // 지갑별 추가 row 개수 관리 (행추가 버튼으로 추가된 빈 row 개수)
  const [additionalRowCounts, setAdditionalRowCounts] = useState<Record<string, number>>({});

  // 포커스된 입력 필드의 원본 값 저장 (포맷팅 제거용)
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<string, string>>({});
  
  // 이미 로드된지 확인하기 위한 ref (중복 호출 방지)
  const walletsLoadedRef = useRef<string>('');
  const transactionsLoadedRef = useRef<string>('');
  const initialLoadRef = useRef<boolean>(false);
  
  // 거래 유형에 따른 카테고리 조회 함수
  // grp_cd='CATEGORY' → 지출 카테고리
  // grp_cd='INCOME' → 수입 카테고리
  const getCategoriesByTrxType = useCallback((trxType: 'EXPENSE' | 'INCOME') => {
    const grpCd = trxType === 'EXPENSE' ? 'CATEGORY' : 'INCOME';
    const categories = getCodesByGroup(grpCd);
    return categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [getCodesByGroup]);

  // 헤더에서 선택한 거래 유형에 따른 카테고리 (빈 row용)
  const filteredCategories = useMemo(() => {
    return getCategoriesByTrxType(selectedTrxType);
  }, [getCategoriesByTrxType, selectedTrxType]);

  // 거래 목록 조회
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const params: any = {
        usr_id: session?.user?.id,
        start_date: startDate,
        end_date: endDate,
        use_yn: 'Y',
        trx_type: selectedTrxType, // 항상 선택된 거래 유형으로 필터링
      };

      const response = await apiClient.get<any[]>('/transactions', { params });

      // amount를 string으로 변환하고 콤마 처리
      const formattedTransactions: Transaction[] = (response.data || []).map((trx: any) => {
        const apiAmount = trx.amount;
        const formattedAmount = formatCurrency(apiAmount);
        
        return {
          trx_id: trx.trx_id,
          wlt_id: trx.wlt_id,
          wlt_name: trx.wlt_name,
          trx_type: trx.trx_type,
          trx_date: trx.trx_date,
          amount: formattedAmount,
          category_cd: trx.category_cd || '',
          category_name: trx.category_name || '',
          memo: trx.memo || '',
          created_at: trx.created_at,
        };
      });

      setTransactions(formattedTransactions);
      // 원본 거래 데이터 저장 (수정 여부 비교용)
      setOriginalTransactions(formattedTransactions.map(t => ({ ...t })));
    } catch (err: any) {
      console.error('거래 목록 조회 오류:', err);
      // 네트워크 에러 처리
      if (err.isNetworkError || !err.response) {
        setError(err.message || '네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.');
      } else {
        setError('거래 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, selectedYear, selectedMonth, selectedTrxType]);

  // 지갑 목록 조회
  const fetchWallets = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return [];
    }

    // 현재 키 생성 (중복 호출 방지)
    const currentKey = `${status}-${session.user.id}`;
    
    // 같은 키로 이미 로드했다면 스킵
    if (walletsLoadedRef.current === currentKey) {
      return [];
    }

    try {
      const response = await apiClient.get<Wallet[]>('/wallets', {
        params: {
          usr_id: session.user.id,
          use_yn: 'Y',
        },
      });
      setWallets(response.data || []);
      walletsLoadedRef.current = currentKey;
      return response.data || [];
    } catch (err: any) {
      console.error('지갑 목록 조회 오류:', err);
      return [];
    }
  }, [status, session?.user?.id]);

  // 초기 로드: 지갑 조회 후 거래 조회 (순차 처리, 한 번만 실행)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !initialLoadRef.current) {
      initialLoadRef.current = true;
      const loadData = async () => {
        // 지갑 조회 (한 번만)
        await fetchWallets();
        // 지갑이 있거나 없어도 거래 조회는 진행
        // 거래 조회 키 생성
        const transactionsKey = `${status}-${session.user.id}-${selectedYear}-${selectedMonth}-${selectedTrxType}`;
        
        // 같은 키로 이미 로드했다면 스킵
        if (transactionsLoadedRef.current !== transactionsKey) {
          transactionsLoadedRef.current = transactionsKey;
          await fetchTransactions();
        }
      };
      loadData();
    }
    // 초기 로드는 status와 user.id만 의존 (필터 변경 시 재실행되지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  // 필터 변경 시 거래만 다시 조회
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && wallets.length > 0) {
      // 거래 조회 키 생성
      const transactionsKey = `${status}-${session.user.id}-${selectedYear}-${selectedMonth}-${selectedTrxType}`;
      
      // 같은 키로 이미 로드했다면 스킵
      if (transactionsLoadedRef.current === transactionsKey) {
        return;
      }
      
      transactionsLoadedRef.current = transactionsKey;
      fetchTransactions();
    }
  }, [selectedYear, selectedMonth, selectedWltType, selectedTrxType, fetchTransactions, status, session?.user?.id, wallets.length]);

  // 월 변경 핸들러
  const handleMonthChange = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // 날짜 포맷팅 (일만 표시)
  // 날짜 포맷팅 함수 (메모이제이션으로 최적화)
  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    // 간단한 문자열 파싱 (Date 객체 생성 최소화)
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      return parseInt(parts[2]) || '';
    }
    return '';
  }, []);

  // 필터링된 지갑 목록
  const filteredWallets = wallets.filter(wallet => {
    return wallet.wlt_type === selectedWltType;
  });

  // 지갑별 거래 개수 확인하여 최대값 구하기
  const getMaxTransactionCount = (): number => {
    let maxCount = 0;
    
    filteredWallets.forEach(wallet => {
      const count = transactions.filter(t => t.wlt_id === wallet.wlt_id).length;
      if (count > maxCount) {
        maxCount = count;
      }
    });
    
    // 최소 30개, 최대값이 30개 이상이면 최대값 사용
    return Math.max(30, maxCount);
  };

  // 동적 Row 개수 계산
  const defaultRowCount = getMaxTransactionCount();

  // 지갑별 거래 필터링 (1일부터 정렬, 동적 row 개수, useCallback으로 최적화)
  const getWalletTransactions = useCallback((wltId: string): (Transaction | null)[] => {
    const filtered = transactions
      .filter(t => t.wlt_id === wltId)
      .sort((a, b) => {
        // 날짜 기준 오름차순 (1일부터)
        if (a.trx_date !== b.trx_date) {
          return a.trx_date.localeCompare(b.trx_date);
        }
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      });

    // 기본 row 개수 + 추가 row 개수
    const additionalRows = additionalRowCounts[wltId] || 0;
    const totalRowCount = defaultRowCount + additionalRows;

    // 동적으로 계산된 row 개수로 채우기 (부족한 경우 null로 채움)
    const rows: (Transaction | null)[] = [...filtered];
    while (rows.length < totalRowCount) {
      rows.push(null);
    }
    
    return rows.slice(0, totalRowCount);
  }, [transactions, additionalRowCounts, defaultRowCount]);

  // 거래 수정 핸들러 (로컬 상태만 업데이트, API 호출 없음, useCallback으로 최적화)
  // 입력 중에는 포맷팅을 하지 않아 즉시 반응하도록 최적화
  const handleTransactionUpdate = useCallback((
    trxId: string,
    field: 'memo' | 'category_cd' | 'amount' | 'trx_type' | 'trx_date',
    value: string
  ) => {
    // 로컬 상태만 업데이트 (저장 버튼 클릭 시 일괄 저장, 최적화)
    setTransactions(prev => {
      // 변경이 없는 경우 같은 배열 반환 (불필요한 리렌더링 방지)
      const targetTrx = prev.find(t => t.trx_id === trxId);
      if (!targetTrx || targetTrx[field] === value) {
        return prev;
      }

      return prev.map(t => {
        if (t.trx_id === trxId) {
          if (field === 'amount') {
            // 입력 중에는 포맷팅 하지 않고 원본 값만 저장 (즉시 반응)
            return { ...t, [field]: value };
          }
          if (field === 'trx_date') {
            return { ...t, trx_date: value };
          }
          // category_cd 변경 시 category_name도 업데이트
          if (field === 'category_cd') {
            const trxType = t.trx_type as 'EXPENSE' | 'INCOME';
            const grpCd = trxType === 'EXPENSE' ? 'CATEGORY' : 'INCOME';
            return { 
              ...t, 
              [field]: value,
              category_name: getCodeName(grpCd, value) || '',
            };
          }
          return { ...t, [field]: value };
        }
        return t;
      });
    });
  }, [getCodeName]);
  
  // 거래가 수정되었는지 확인
  const isTransactionModified = (transaction: Transaction): boolean => {
    const original = originalTransactions.find(t => t.trx_id === transaction.trx_id);
    if (!original) return false;
    
    return (
      transaction.memo !== original.memo ||
      transaction.category_cd !== original.category_cd ||
      transaction.amount !== original.amount ||
      transaction.trx_date !== original.trx_date ||
      transaction.trx_type !== original.trx_type
    );
  };

  // 일괄 저장 핸들러 (신규/수정 거래만 처리, useCallback으로 최적화)
  const handleBatchSave = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError('');

      const newTransactions: Array<{ wltId: string; input: NewTransactionInput }> = [];
      const modifiedTransactions: Transaction[] = [];

      // 신규 거래 수집
      Object.keys(newTransactionInputs).forEach(wltId => {
        Object.keys(newTransactionInputs[wltId]).forEach(rowIndexStr => {
          const rowIndex = parseInt(rowIndexStr);
          const input = newTransactionInputs[wltId][rowIndex];
          
          // 금액이 있는 경우만 신규 거래로 추가
          if (input && input.amount) {
            const cleanedAmount = removeCommas(input.amount);
            const numAmount = parseFloat(cleanedAmount) || 0;
            if (numAmount > 0) {
              newTransactions.push({ wltId, input });
            }
          }
        });
      });

      // 수정된 거래 수집
      transactions.forEach(transaction => {
        if (isTransactionModified(transaction)) {
          modifiedTransactions.push(transaction);
        }
      });

      // 유효한 수정 거래 필터링
      const validUpdateOperations = modifiedTransactions.filter(transaction => {
        if (!transaction.trx_date) {
          console.warn(`거래 ${transaction.trx_id}의 날짜가 없어 업데이트를 건너뜁니다.`);
          return false;
        }
        
        const cleanedAmount = removeCommas(transaction.amount);
        const numAmount = parseFloat(cleanedAmount);
        
        if (isNaN(numAmount) || numAmount <= 0) {
          console.warn(`거래 ${transaction.trx_id}의 금액이 유효하지 않아 업데이트를 건너뜁니다.`);
          return false;
        }
        return true;
      });

      // 모든 작업 수집 (신규 + 수정)
      const allOperations: Array<{ type: 'create' | 'update'; operation: () => Promise<any> }> = [];
      
      // 신규 거래 작업 추가
      newTransactions.forEach(({ wltId, input }) => {
        allOperations.push({
          type: 'create',
          operation: async () => {
            const cleanedAmount = removeCommas(input.amount);
            const numAmount = parseFloat(cleanedAmount) || 0;
            
            return await apiClient.post('/transactions', {
              wlt_id: wltId,
              usr_id: session.user.id,
              trx_type: input.trx_type || selectedTrxType,
              trx_date: input.trx_date || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
              amount: numAmount,
              category_cd: input.category_cd || '',
              memo: input.memo || '',
              is_fixed: 'N',
            });
          }
        });
      });

      // 수정된 거래 작업 추가
      validUpdateOperations.forEach(transaction => {
        allOperations.push({
          type: 'update',
          operation: async () => {
            const cleanedAmount = removeCommas(transaction.amount);
            const numAmount = parseFloat(cleanedAmount);
            
            const updateData: any = {
              trx_date: transaction.trx_date,
              amount: numAmount,
              memo: transaction.memo !== undefined ? transaction.memo : '',
              category_cd: transaction.category_cd || '',
            };
            return await apiClient.put(`/transactions/${transaction.trx_id}`, updateData);
          }
        });
      });
      
      if (allOperations.length === 0) {
        setError('저장할 데이터가 없습니다.');
        setLoading(false);
        return;
      }

      // 순차적으로 하나씩 실행
      const errors: string[] = [];
      let successCount = 0;

      for (const { type, operation } of allOperations) {
        try {
          await operation();
          successCount++;
        } catch (err: any) {
          // 네트워크 에러 처리
          const errorMessage = err.isNetworkError || !err.response
            ? (err.message || '네트워크 오류가 발생했습니다.')
            : (err.response?.data?.message || `${type === 'create' ? '등록' : '수정'} 중 오류가 발생했습니다.`);
          errors.push(errorMessage);
          console.error(`${type === 'create' ? '거래 등록' : '거래 수정'} 오류:`, err);
        }
      }
      
      // 에러가 발생한 경우
      if (errors.length > 0) {
        if (errors.length === allOperations.length) {
          // 모두 실패
          setError(`저장에 실패했습니다: ${errors.join(', ')}`);
        } else {
          // 일부 실패
          setError(`${successCount}건 저장 성공, ${errors.length}건 실패: ${errors.join(', ')}`);
        }
        
        // 일부라도 성공한 경우 목록 새로고침
        if (successCount > 0) {
          await fetchTransactions();
        }
        setLoading(false);
        return;
      }

      // 입력 데이터 초기화
      setNewTransactionInputs({});
      setAdditionalRowCounts({});

      // 목록 새로고침
      await fetchTransactions();
      
      setError('');
    } catch (err: any) {
      console.error('일괄 저장 오류:', err);
      // 네트워크 에러 처리
      if (err.isNetworkError || !err.response) {
        setError(err.message || '네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.');
      } else {
        setError(err.response?.data?.message || err.message || '저장에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, selectedTrxType, selectedYear, selectedMonth, newTransactionInputs, transactions, isTransactionModified, fetchTransactions]);

  // 거래 삭제 핸들러
  const handleDeleteTransaction = useCallback(async (trxId: string) => {
    if (!session?.user?.id) return;
    
    if (!confirm('정말 이 거래를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await apiClient.delete(`/transactions/${trxId}`);
      
      // 목록 새로고침
      await fetchTransactions();
      
      setError('');
    } catch (err: any) {
      console.error('거래 삭제 오류:', err);
      // 네트워크 에러 처리
      if (err.isNetworkError || !err.response) {
        setError(err.message || '네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.');
      } else {
        setError(err.response?.data?.message || err.message || '거래 삭제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, fetchTransactions]);

  // 빈 row 입력 핸들러 (단순하게 입력값만 저장, 최적화)
  const handleNewTransactionInput = useCallback((wltId: string, rowIndex: number, field: keyof NewTransactionInput, value: string) => {
    setNewTransactionInputs(prev => {
      const walletInputs = prev[wltId];
      const current = walletInputs?.[rowIndex];
      
      // 값이 변경되지 않았으면 같은 객체 반환 (불필요한 리렌더링 방지)
      if (current?.[field] === value) {
        return prev;
      }
      
      // 입력값만 그대로 저장 (로직 없이 단순하게)
      return { 
        ...prev, 
        [wltId]: { 
          ...(walletInputs || {}), 
          [rowIndex]: { ...(current || {} as NewTransactionInput), [field]: value } 
        } 
      };
    });
  }, []);


  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 - 년/월 선택 및 지갑 타입 필터 (React.memo로 최적화) */}
      <TransactionsHeader
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedWltType={selectedWltType}
        selectedTrxType={selectedTrxType}
        loading={loading}
        onMonthChange={handleMonthChange}
        onWltTypeChange={setSelectedWltType}
        onTrxTypeChange={setSelectedTrxType}
        onBatchSave={handleBatchSave}
      />

      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {/* 지갑별 카드 */}
      <div className={styles.walletCards}>
        {filteredWallets.map((wallet) => {
          const walletTransactions = getWalletTransactions(wallet.wlt_id);
          const today = new Date();

          return (
            <div key={wallet.wlt_id} className={styles.walletCard}>
              {/* 지갑명 헤더 */}
              <div className={styles.walletHeader}>
                <h2 className={styles.walletTitle}>{wallet.wlt_name}</h2>
              </div>

              {/* 테이블 */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.headerRow}>
                      <th className={styles.headerCell}>날짜</th>
                      <th className={styles.headerCell}>사용처</th>
                      <th className={styles.headerCell}>카테고리</th>
                      <th className={styles.headerCell}>금액</th>
                      <th className={styles.headerCell} style={{ width: '24px', padding: '0' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTransactions.map((transaction, index) => {
                      // 빈 row인 경우 - 모든 빈 row에서 입력 가능
                      if (!transaction) {
                        const rowInput = newTransactionInputs[wallet.wlt_id]?.[index];
                        
                        return (
                          <tr key={`empty-${index}`} className={styles.dataRow}>
                            <td className={styles.dataCell}>
                              <input
                                type="text"
                                className={styles.editableInput}
                                placeholder="일자"
                                defaultValue={rowInput?.trx_date ? formatDate(rowInput.trx_date) : ''}
                                onBlur={(e) => {
                                  // 일자만 입력받고 포커스 해제 시 반영
                                  const dayValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                  if (dayValue) {
                                    const day = parseInt(dayValue) || 1;
                                    // 날짜 문자열 생성 (최소 연산)
                                    const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                    handleNewTransactionInput(wallet.wlt_id, index, 'trx_date', dateStr);
                                  } else {
                                    handleNewTransactionInput(wallet.wlt_id, index, 'trx_date', '');
                                  }
                                }}
                              />
                            </td>
                            <td className={styles.dataCell}>
                              <input
                                type="text"
                                className={styles.editableInput}
                                placeholder="사용처"
                                defaultValue={rowInput?.memo || ''}
                                onBlur={(e) => handleNewTransactionInput(wallet.wlt_id, index, 'memo', e.target.value)}
                              />
                            </td>
                            <td className={styles.dataCell}>
                              <select
                                className={styles.editableSelect}
                                defaultValue={rowInput?.category_cd || ''}
                                onChange={(e) => handleNewTransactionInput(wallet.wlt_id, index, 'category_cd', e.target.value)}
                              >
                                <option value="">선택하세요</option>
                                {filteredCategories.map((category) => (
                                  <option key={category.cd} value={category.cd}>
                                    {category.cd_nm}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className={styles.dataCell}>
                              <input
                                type="text"
                                className={styles.editableInput}
                                placeholder="0"
                                defaultValue={rowInput?.amount || ''}
                                onBlur={(e) => {
                                  // 포커스 해제 시 반영
                                  handleNewTransactionInput(wallet.wlt_id, index, 'amount', e.target.value);
                                }}
                              />
                            </td>
                            <td className={styles.dataCell}></td>
                          </tr>
                        );
                      }

                      const date = new Date(transaction.trx_date);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <tr
                          key={transaction.trx_id}
                          className={`${styles.dataRow} ${isWeekend ? styles.weekendRow : ''} ${
                            transaction.trx_type === 'EXPENSE' ? styles.expenseRow : styles.incomeRow
                          }`}
                        >
                          <td className={styles.dataCell}>
                            <input
                              type="text"
                              className={styles.editableInput}
                              defaultValue={formatDate(transaction.trx_date)}
                              onBlur={(e) => {
                                // 일자만 입력받고 포커스 해제 시 반영
                                const inputValue = e.target.value;
                                // 숫자만 허용하고 최대 2자리
                                const dayValue = inputValue.replace(/[^0-9]/g, '').slice(0, 2);
                                // 날짜 문자열 생성 (간단한 버전)
                                const day = dayValue ? parseInt(dayValue) : 1;
                                const month = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
                                const dayStr = day < 10 ? `0${day}` : `${day}`;
                                const dateStr = `${selectedYear}-${month}-${dayStr}`;
                                handleTransactionUpdate(transaction.trx_id, 'trx_date', dateStr);
                              }}
                              style={{ textAlign: 'center', width: '2rem' }}
                            />
                          </td>
                          <td className={styles.dataCell}>
                            <input
                              type="text"
                              defaultValue={transaction.memo || ''}
                              onBlur={(e) => {
                                handleTransactionUpdate(transaction.trx_id, 'memo', e.target.value);
                              }}
                              className={styles.editableInput}
                              placeholder="사용처"
                            />
                          </td>
                          <td className={styles.dataCell}>
                            <select
                              className={styles.editableSelect}
                              defaultValue={transaction.category_cd || ''}
                              onChange={(e) => {
                                handleTransactionUpdate(transaction.trx_id, 'category_cd', e.target.value);
                              }}
                            >
                              <option value="">선택하세요</option>
                              {getCategoriesByTrxType(transaction.trx_type as 'EXPENSE' | 'INCOME').map((category) => (
                                <option key={category.cd} value={category.cd}>
                                  {category.cd_nm}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={styles.dataCell}>
                            <input
                              type="text"
                              defaultValue={transaction.amount || '0'}
                              onBlur={(e) => {
                                // 포커스 해제 시 반영
                                handleTransactionUpdate(transaction.trx_id, 'amount', e.target.value);
                              }}
                              className={`${styles.editableInput} ${
                                transaction.trx_type === 'EXPENSE' 
                                  ? styles.amountExpense 
                                  : styles.amountIncome
                              }`}
                              placeholder="0"
                            />
                          </td>
                          <td className={styles.dataCell} style={{ width: '24px', padding: '0', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTransaction(transaction.trx_id)}
                              className={styles.deleteButton}
                              title="삭제"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* 행추가 버튼 */}
                <div className={styles.addRowButtonContainer}>
                  <button
                    onClick={() => {
                      setAdditionalRowCounts(prev => ({
                        ...prev,
                        [wallet.wlt_id]: (prev[wallet.wlt_id] || 0) + 1
                      }));
                    }}
                    className={styles.addRowButton}
                  >
                    + 행 추가
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
