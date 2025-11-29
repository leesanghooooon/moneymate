'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../../styles/css/expenses.module.css';
import { Wallet, getWallets } from '../../lib/api/commonCodes';
import { get } from '../../lib/api/common';
import { CurrencyDollarIcon, BanknotesIcon, WalletIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface FinancialOverviewSlideProps {
  isOpen: boolean;
}

interface FixedTransaction {
  trx_id: string;
  trx_type: string;
  amount: number;
  category_name: string;
  memo: string | null;
  wlt_name: string;
  trx_date: string;
  is_shared?: boolean;
}

interface SharedWallet extends Wallet {
  owner_name?: string;
  is_shared?: boolean;
}

interface MonthlySavings {
  year: number;
  month: number;
  total_amount: number;
}

export default function FinancialOverviewSlide({
  isOpen,
}: FinancialOverviewSlideProps) {
  const { data: session } = useSession();
  const [fixedIncome, setFixedIncome] = useState<FixedTransaction[]>([]);
  const [fixedExpense, setFixedExpense] = useState<FixedTransaction[]>([]);
  const [wallets, setWallets] = useState<SharedWallet[]>([]);
  const [monthlySavings, setMonthlySavings] = useState<MonthlySavings | null>(null);
  
  // 현재 년도와 월 관리
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);

  // 캘린더 API 응답에서 고정수입 추출
  const extractFixedIncome = (calendarData: any[]): FixedTransaction[] => {
    const fixedIncomeList: FixedTransaction[] = [];
    
    calendarData.forEach((day: any) => {
      if (day.trx_list && Array.isArray(day.trx_list)) {
        day.trx_list.forEach((trx: any) => {
          // 고정수입: INCOME 타입이고 category_cd가 SALARY, RENTAL_INCOME
          if (trx.trx_type === 'INCOME' && 
              (trx.category_cd === 'SALARY' || trx.category_cd === 'RENTAL_INCOME')) {
            fixedIncomeList.push({
              trx_id: trx.trx_id,
              trx_type: trx.trx_type,
              amount: Number(trx.amount) || 0,
              category_name: trx.category_cd_nm || trx.category_cd || '',
              memo: trx.memo || null,
              wlt_name: trx.wlt_name || '',
              trx_date: trx.trx_date || day.cal_dt,
              is_shared: trx.is_shared === true || trx.is_shared === 1,
            });
          }
        });
      }
    });
    
    return fixedIncomeList;
  };

  // 캘린더 API 응답에서 고정지출 추출
  const extractFixedExpense = (calendarData: any[]): FixedTransaction[] => {
    const fixedExpenseList: FixedTransaction[] = [];
    
    calendarData.forEach((day: any) => {
      if (day.trx_list && Array.isArray(day.trx_list)) {
        day.trx_list.forEach((trx: any) => {
          // 고정지출: EXPENSE 타입이고 category_cd가 BILL, FINANCE, RENT, SUBSCRIPTION
          if (trx.trx_type === 'EXPENSE' && 
              (trx.category_cd === 'BILL' || trx.category_cd === 'FINANCE' || 
               trx.category_cd === 'RENT' || trx.category_cd === 'SUBSCRIPTION')) {
            fixedExpenseList.push({
              trx_id: trx.trx_id,
              trx_type: trx.trx_type,
              amount: Number(trx.amount) || 0,
              category_name: trx.category_cd_nm || trx.category_cd || '',
              memo: trx.memo || null,
              wlt_name: trx.wlt_name || '',
              trx_date: trx.trx_date || day.cal_dt,
              is_shared: trx.is_shared === true || trx.is_shared === 1,
            });
          }
        });
      }
    });
    
    return fixedExpenseList;
  };

  // 고정수입/고정지출 조회 (캘린더 API 사용)
  const fetchFixedTransactions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // 캘린더 API 호출
      const calendarResponse = await get('/calendar', {
        params: {
          usr_id: session.user.id,
          yyyy: String(currentYear),
          mm: String(currentMonth).padStart(2, '0'),
        },
      });

      // API 응답 구조: common.ts의 get은 { data, status, headers } 반환
      // 실제 API 응답은 { data: [...] }
      if (calendarResponse?.data?.data && Array.isArray(calendarResponse.data.data)) {
        // 고정수입 추출
        const incomeList = extractFixedIncome(calendarResponse.data.data);
        setFixedIncome(incomeList);
        
        // 고정지출 추출
        const expenseList = extractFixedExpense(calendarResponse.data.data);
        setFixedExpense(expenseList);
      } else {
        setFixedIncome([]);
        setFixedExpense([]);
      }
    } catch (error) {
      console.error('고정 거래 조회 오류:', error);
      setFixedIncome([]);
      setFixedExpense([]);
    }
  }, [session?.user?.id, currentYear, currentMonth]);

  // 월별 저축 금액 조회
  const fetchMonthlySavings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      // 해당 월의 첫날과 마지막날 계산
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 저축 납입내역 조회
      const response = await get('/savings-contributions', {
        params: {
          usr_id: session.user.id,
        },
      });

      if (response?.data?.success && Array.isArray(response.data.data)) {
        // 해당 월의 저축 금액 계산
        const monthlyTotal = response.data.data
          .filter((contrib: any) => {
            const contribDate = new Date(contrib.contrib_date);
            return contribDate >= new Date(startDate) && contribDate <= new Date(endDate);
          })
          .reduce((sum: number, contrib: any) => sum + (Number(contrib.amount) || 0), 0);

        setMonthlySavings({
          year,
          month,
          total_amount: monthlyTotal,
        });
      }
    } catch (error) {
      console.error('월별 저축 조회 오류:', error);
      setMonthlySavings(null);
    }
  }, [session?.user?.id]);

  // 지갑 목록 조회 (본인 + 공유 지갑)
  const fetchWallets = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // 본인 지갑 + 공유 지갑 조회 (include_shared=true)
      const allWallets = await getWallets(session.user.id, '', true);
      
      const walletList: SharedWallet[] = allWallets.map(w => ({
        ...w,
        is_shared: w.role === 'PARTNER',
      }));

      setWallets(walletList);
    } catch (error) {
      console.error('지갑 조회 오류:', error);
      setWallets([]);
    }
  }, [session?.user?.id]);

  // 로딩 상태 관리
  const [loading, setLoading] = useState(true);
  const prevIsVisibleRef = useRef<boolean>(false);
  const lastFetchedKeyRef = useRef<string>('');
  
  // 슬라이드가 보일 때만 데이터 조회
  // isOpen이 false일 때 보이므로, !isOpen일 때 API 호출
  useEffect(() => {
    const isVisible = !isOpen; // 슬라이드가 보이는지 여부
    const wasVisible = prevIsVisibleRef.current;
    
    // 세션이 없으면 조회하지 않음
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    // 슬라이드가 보이는 상태가 아니면 조회하지 않음
    if (!isVisible) {
      setLoading(false);
      prevIsVisibleRef.current = isVisible;
      return;
    }

    // 슬라이드가 보이는 상태 (isVisible = true)
    const fetchKey = `${session.user.id}-${currentYear}-${currentMonth}`;
    const keyChanged = lastFetchedKeyRef.current !== fetchKey;
    
    // 호출 조건: 처음 보이게 되었거나 (wasVisible = false -> isVisible = true) OR 연도/월이 변경됨
    const shouldFetch = !wasVisible || keyChanged;
    
    console.log('[FinancialOverviewSlide] API 호출 조건 확인:', {
      isOpen,
      isVisible,
      wasVisible,
      keyChanged,
      shouldFetch,
      fetchKey,
      lastKey: lastFetchedKeyRef.current
    });
    
    if (!shouldFetch) {
      console.log('[FinancialOverviewSlide] API 호출 스킵');
      prevIsVisibleRef.current = isVisible;
      return;
    }

    // 데이터 조회
    const fetchData = async () => {
      console.log('[FinancialOverviewSlide] API 호출 시작');
      setLoading(true);
      lastFetchedKeyRef.current = fetchKey;
      try {
        await Promise.all([
          fetchFixedTransactions(),
          fetchMonthlySavings(),
          fetchWallets()
        ]);
        console.log('[FinancialOverviewSlide] API 호출 완료');
      } catch (error) {
        console.error('[FinancialOverviewSlide] 데이터 로딩 오류:', error);
        // 에러 발생 시 키 리셋하여 재시도 가능하도록
        lastFetchedKeyRef.current = '';
      } finally {
        setLoading(false);
        prevIsVisibleRef.current = isVisible;
      }
    };

    fetchData();
  }, [isOpen, session?.user?.id, currentYear, currentMonth, fetchFixedTransactions, fetchMonthlySavings, fetchWallets]);

  // 금액 포맷팅
  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 지갑 타입 아이콘
  const getWalletIcon = (wlt_type: string) => {
    switch (wlt_type) {
      case 'CASH':
        return '💵';
      case 'CHECK_CARD':
      case 'CREDIT_CARD':
        return '💳';
      default:
        return '💰';
    }
  };

  // 지갑 타입 이름
  const getWalletTypeName = (wlt_type: string) => {
    switch (wlt_type) {
      case 'CASH':
        return '현금';
      case 'CHECK_CARD':
        return '체크카드';
      case 'CREDIT_CARD':
        return '신용카드';
      case 'BANK_ACCOUNT':
        return '은행계좌';
      default:
        return wlt_type;
    }
  };

  // 고정수입/고정지출을 카테고리별로 그룹화
  const groupTransactionsByCategory = (transactions: FixedTransaction[]) => {
    const grouped: Record<string, FixedTransaction[]> = {};
    transactions.forEach(item => {
      const category = item.category_name || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  };

  // 지갑을 타입별로 그룹화
  const groupWalletsByType = (wallets: SharedWallet[]) => {
    const grouped: Record<string, SharedWallet[]> = {};
    wallets.forEach(wallet => {
      const type = wallet.wlt_type || '기타';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(wallet);
    });
    return grouped;
  };

  return (
    <div 
      className={`${styles.slidePage} ${styles.slidePageLeft} ${isOpen ? styles.slidePageLeftOpen : ''}`}
    >
      <div className={styles.expensesPage}>
        <div className="container">
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <h1 className={styles.title}>재무 현황</h1>
                <p className={styles.subtitle}>고정수입/지출과 지갑 현황을 확인하세요.</p>
              </div>
              <div className={styles.headerRight}>
                <div className={styles.currentPeriod}>
                  <span className={styles.periodLabel}>조회 기간:</span>
                  <span className={styles.periodValue}>{currentYear}년 {currentMonth}월</span>
                </div>
              </div>
            </div>
          </header>

          {/* 세 가지 섹션: 2.5/2.5/5 비율 */}
          <div className={styles.financialOverviewContainer}>
            {/* 첫 번째 섹션: 고정수입, 저축 현황 (2.5) */}
            <div className={styles.fixedTransactionsSection}>
              <div className={styles.fixedIncomeSection}>
                <div className={styles.sectionHeader}>
                  <CurrencyDollarIcon className={styles.sectionIcon} style={{ color: '#10b981' }} />
                  <h3 className={styles.sectionTitle}>고정수입</h3>
                </div>
                <div className={styles.sectionContent}>
                  {loading ? (
                    <div className={styles.emptyMessage}>로딩 중...</div>
                  ) : fixedIncome.length === 0 ? (
                    <div className={styles.emptyMessage}>고정수입이 없습니다.</div>
                  ) : (
                    <div className={styles.transactionList}>
                      {Object.entries(groupTransactionsByCategory(fixedIncome)).map(([category, items]) => {
                        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                        return (
                          <div key={category} className={styles.transactionGroup}>
                            <div className={styles.transactionGroupHeader}>
                              <span className={styles.transactionGroupCategory}>{category}</span>
                              <span className={styles.transactionGroupTotal} style={{ color: '#10b981' }}>
                                +{formatKRW(totalAmount)}원
                              </span>
                            </div>
                            {items.map((item) => (
                              <div key={item.trx_id} className={styles.transactionItem}>
                                <div className={styles.transactionInfo}>
                                  <div className={styles.transactionMemoRow}>
                                    <span className={styles.transactionMemo}>{item.memo || '-'}</span>
                                    {item.is_shared && (
                                      <span className={styles.sharedBadge}>공유</span>
                                    )}
                                  </div>
                                </div>
                                <span className={styles.transactionAmount} style={{ color: '#10b981' }}>
                                  +{formatKRW(item.amount)}원
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.savingsSection}>
                <div className={styles.sectionHeader}>
                  <SparklesIcon className={styles.sectionIcon} style={{ color: '#3b82f6' }} />
                  <h3 className={styles.sectionTitle}>저축 현황</h3>
                </div>
                <div className={styles.sectionContent}>
                  {loading ? (
                    <div className={styles.emptyMessage}>로딩 중...</div>
                  ) : !monthlySavings || monthlySavings.total_amount === 0 ? (
                    <div className={styles.emptyMessage}>이번 달 저축 금액이 없습니다.</div>
                  ) : (
                    <div className={styles.savingsSummary}>
                      <div className={styles.savingsPeriod}>
                        {monthlySavings.year}년 {monthlySavings.month}월
                      </div>
                      <div className={styles.savingsAmount} style={{ color: '#3b82f6' }}>
                        {formatKRW(monthlySavings.total_amount)}원
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 두 번째 섹션: 고정지출 (2.5) */}
            <div className={styles.placeholderSection}>
              <div className={styles.sectionHeader}>
                <BanknotesIcon className={styles.sectionIcon} style={{ color: '#ef4444' }} />
                <h3 className={styles.sectionTitle}>고정지출</h3>
              </div>
              <div className={styles.sectionContent}>
                {loading ? (
                  <div className={styles.emptyMessage}>로딩 중...</div>
                ) : fixedExpense.length === 0 ? (
                  <div className={styles.emptyMessage}>고정지출이 없습니다.</div>
                ) : (
                  <div className={styles.transactionList}>
                    {Object.entries(groupTransactionsByCategory(fixedExpense)).map(([category, items]) => {
                      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                      return (
                        <div key={category} className={styles.transactionGroup}>
                          <div className={styles.transactionGroupHeader}>
                            <span className={styles.transactionGroupCategory}>{category}</span>
                            <span className={styles.transactionGroupTotal} style={{ color: '#ef4444' }}>
                              -{formatKRW(totalAmount)}원
                            </span>
                          </div>
                          {items.map((item) => (
                            <div key={item.trx_id} className={styles.transactionItem}>
                              <div className={styles.transactionInfo}>
                                <div className={styles.transactionMemoRow}>
                                  <span className={styles.transactionMemo}>{item.memo || '-'}</span>
                                  {item.is_shared && (
                                    <span className={styles.sharedBadge}>공유</span>
                                  )}
                                </div>
                              </div>
                              <span className={styles.transactionAmount} style={{ color: '#ef4444' }}>
                                -{formatKRW(item.amount)}원
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 세 번째 섹션: 지갑 목록 (5) */}
            <div className={styles.walletsSection}>
              <div className={styles.sectionHeader}>
                <WalletIcon className={styles.sectionIcon} style={{ color: '#8b5cf6' }} />
                <h3 className={styles.sectionTitle}>지갑 현황</h3>
              </div>
              <div className={styles.sectionContent}>
                {loading ? (
                  <div className={styles.emptyMessage}>로딩 중...</div>
                ) : wallets.length === 0 ? (
                  <div className={styles.emptyMessage}>등록된 지갑이 없습니다.</div>
                ) : (() => {
                  // 본인 지갑과 파트너 지갑 분리
                  const myWallets = wallets.filter(w => w.role === 'OWNER' || !w.role);
                  const partnerWallets = wallets.filter(w => w.role === 'PARTNER');
                  const hasPartnerWallets = partnerWallets.length > 0;

                  // 지갑 타입별로 그룹화
                  const myWalletsByType = groupWalletsByType(myWallets);
                  const partnerWalletsByType = groupWalletsByType(partnerWallets);

                  // 파트너 지갑이 있을 경우: 두 컬럼으로 표시
                  // 파트너 지갑이 없을 경우: 본인 지갑을 한 줄에 두 개씩 표시
                  return (
                    <div className={hasPartnerWallets ? styles.walletColumns : styles.walletGrid}>
                      {/* 본인 지갑 */}
                      <div className={styles.walletColumn}>
                        <div className={styles.walletList}>
                          {myWallets.length === 0 ? (
                            <div className={styles.emptyMessage}>등록된 지갑이 없습니다.</div>
                          ) : (
                            Object.entries(myWalletsByType).map(([type, typeWallets]) => (
                              <div key={type} className={styles.walletTypeGroup}>
                                <div className={styles.walletTypeGroupHeader}>
                                  {getWalletTypeName(type)}
                                </div>
                                {typeWallets.map((wallet) => (
                                  <div key={wallet.wlt_id} className={styles.walletListItem}>
                                    <div className={styles.walletItemIcon}>
                                      <span>{getWalletIcon(wallet.wlt_type)}</span>
                                    </div>
                                    <div className={styles.walletItemInfo}>
                                      <div className={styles.walletItemNameRow}>
                                        <span className={styles.walletItemName}>{wallet.wlt_name}</span>
                                        {wallet.is_default === 'Y' && (
                                          <span className={styles.defaultBadge}>기본</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* 파트너 지갑 */}
                      {hasPartnerWallets && (
                        <div className={styles.walletColumn}>
                          <div className={styles.walletList}>
                            {partnerWallets.length === 0 ? (
                              <div className={styles.emptyMessage}>공유 지갑이 없습니다.</div>
                            ) : (
                              Object.entries(partnerWalletsByType).map(([type, typeWallets]) => (
                                <div key={type} className={styles.walletTypeGroup}>
                                  <div className={styles.walletTypeGroupHeader}>
                                    {getWalletTypeName(type)}
                                  </div>
                                  {typeWallets.map((wallet) => (
                                    <div key={wallet.wlt_id} className={styles.walletListItem}>
                                      <div className={styles.walletItemIcon}>
                                        <span>{getWalletIcon(wallet.wlt_type)}</span>
                                      </div>
                                      <div className={styles.walletItemInfo}>
                                        <div className={styles.walletItemNameRow}>
                                          <span className={styles.walletItemName}>{wallet.wlt_name}</span>
                                          <span className={styles.sharedBadge}>공유</span>
                                          {wallet.is_default === 'Y' && (
                                            <span className={styles.defaultBadge}>기본</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
