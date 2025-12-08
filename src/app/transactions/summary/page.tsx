'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api/axios';
import { formatCurrency, removeCommas } from '@/lib/utils/format';
import styles from '@/styles/css/transactions-summary.module.css';

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
  amount: number;
  category_cd: string;
  category_name: string;
  memo: string;
}

// 지갑별 통계 타입
interface WalletSummary {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
  income: number; // 수입 합계
  expense: number; // 지출 합계
  balance: number; // 합계 (지출 - 수입)
}

export default function TransactionsSummaryPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 날짜 선택
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // 이미 로드된지 확인하기 위한 ref (중복 호출 방지)
  const walletsLoadedRef = useRef<string>('');
  const transactionsLoadedRef = useRef<string>('');
  const initialLoadRef = useRef<boolean>(false);

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
        params: { usr_id: session.user.id, use_yn: 'Y' },
      });
      setWallets(response.data || []);
      walletsLoadedRef.current = currentKey;
      return response.data || [];
    } catch (err: any) {
      console.error('지갑 목록 조회 오류:', err);
      return [];
    }
  }, [status, session?.user?.id]);

  // 거래 목록 조회 (수입, 지출 모두)
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
        // trx_type은 필터링하지 않음 (수입, 지출 모두 조회)
      };

      const response = await apiClient.get<any[]>('/transactions', { params });

      // amount를 number로 변환
      const formattedTransactions: Transaction[] = (response.data || []).map((trx: any) => {
        const apiAmount = trx.amount;
        const numAmount = typeof apiAmount === 'string' 
          ? parseFloat(removeCommas(apiAmount)) 
          : (typeof apiAmount === 'number' ? apiAmount : 0);
        
        return {
          trx_id: trx.trx_id,
          wlt_id: trx.wlt_id,
          wlt_name: trx.wlt_name,
          trx_type: trx.trx_type,
          trx_date: trx.trx_date,
          amount: numAmount,
          category_cd: trx.category_cd || '',
          category_name: trx.category_name || '',
          memo: trx.memo || '',
        };
      });

      setTransactions(formattedTransactions);
    } catch (err: any) {
      console.error('거래 목록 조회 오류:', err);
      setError('거래 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, selectedYear, selectedMonth]);

  // 초기 로드: 지갑 조회 후 거래 조회 (순차 처리, 한 번만 실행)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !initialLoadRef.current) {
      initialLoadRef.current = true;
      const loadData = async () => {
        // 지갑 조회 (한 번만)
        await fetchWallets();
        // 지갑이 있거나 없어도 거래 조회는 진행 (지갑이 없어도 통계는 0으로 표시)
        // 거래 조회 키 생성
        const transactionsKey = `${status}-${session.user.id}-${selectedYear}-${selectedMonth}`;
        
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

  // 월 변경 시 거래만 다시 조회
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && wallets.length > 0) {
      // 거래 조회 키 생성
      const transactionsKey = `${status}-${session.user.id}-${selectedYear}-${selectedMonth}`;
      
      // 같은 키로 이미 로드했다면 스킵
      if (transactionsLoadedRef.current === transactionsKey) {
        return;
      }
      
      transactionsLoadedRef.current = transactionsKey;
      fetchTransactions();
    }
  }, [selectedYear, selectedMonth, fetchTransactions, status, session?.user?.id, wallets.length]);

  // 월 변경 핸들러
  const handleMonthChange = useCallback((delta: number) => {
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
  }, [selectedMonth, selectedYear]);

  // 월별 전체 통계 계산
  const monthlySummary = useMemo(() => {
    const income = transactions
      .filter(t => t.trx_type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.trx_type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = expense - income; // 지출 - 수입
    
    return { income, expense, balance };
  }, [transactions]);

  // 지갑별 통계 계산
  const walletSummaries = useMemo(() => {
    const summaries: WalletSummary[] = wallets.map(wallet => {
      const walletTransactions = transactions.filter(t => t.wlt_id === wallet.wlt_id);
      
      const income = walletTransactions
        .filter(t => t.trx_type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = walletTransactions
        .filter(t => t.trx_type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const balance = expense - income; // 지출 - 수입
      
      return {
        wlt_id: wallet.wlt_id,
        wlt_name: wallet.wlt_name,
        wlt_type: wallet.wlt_type,
        income,
        expense,
        balance,
      };
    });

    return summaries;
  }, [wallets, transactions]);

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
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.dateSelector}>
            <button
              onClick={() => handleMonthChange(-1)}
              className={styles.monthButton}
            >
              ‹
            </button>
            <div className={styles.dateDisplay}>
              <span className={styles.year}>{selectedYear}</span>
              <span className={styles.month}>{selectedMonth}</span>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className={styles.monthButton}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {/* 월별 전체 통계 */}
      <div className={styles.monthlySummary}>
        <h2 className={styles.summaryTitle}>월별 전체 통계</h2>
        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} ${styles.incomeCard}`}>
            <div className={styles.cardLabel}>수입</div>
            <div className={styles.cardValue}>{formatCurrency(monthlySummary.income)}원</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.expenseCard}`}>
            <div className={styles.cardLabel}>지출</div>
            <div className={styles.cardValue}>{formatCurrency(monthlySummary.expense)}원</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.balanceCard} ${monthlySummary.balance >= 0 ? styles.positive : styles.negative}`}>
            <div className={styles.cardLabel}>합계</div>
            <div className={styles.cardValue}>
              {monthlySummary.balance >= 0 ? '-' : ''}{formatCurrency(monthlySummary.balance)}원
            </div>
          </div>
        </div>
      </div>

      {/* 지갑별 통계 */}
      <div className={styles.walletSummaries}>
        <h2 className={styles.summaryTitle}>지갑별 통계</h2>
        <div className={styles.walletCards}>
          {walletSummaries.map((wallet) => (
            <div key={wallet.wlt_id} className={styles.walletCard}>
              <div className={styles.walletHeader}>
                <h3 className={styles.walletName}>{wallet.wlt_name}</h3>
                <span className={styles.walletType}>
                  {wallet.wlt_type === 'CHECK_CARD' ? '체크카드' : '신용카드'}
                </span>
              </div>
              <div className={styles.walletStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>수입</span>
                  <span className={`${styles.statValue} ${styles.incomeValue}`}>
                    {formatCurrency(wallet.income)}원
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>지출</span>
                  <span className={`${styles.statValue} ${styles.expenseValue}`}>
                    {formatCurrency(wallet.expense)}원
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>합계</span>
                  <span className={`${styles.statValue} ${wallet.balance >= 0 ? styles.positiveValue : styles.negativeValue}`}>
                    {wallet.balance >= 0 ? '-' : ''}{formatCurrency(wallet.balance)}원
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

