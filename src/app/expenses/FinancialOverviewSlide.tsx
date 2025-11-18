'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  
  // 현재 년도와 월 관리
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);

  // 고정수입/고정지출 조회
  const fetchFixedTransactions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // 해당 월의 첫날과 마지막날 계산
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 고정수입 조회
      const incomeResponse = await get('/expenses', {
        params: {
          usr_id: session.user.id,
          trx_type: 'INCOME',
          is_fixed: 'Y',
          start_date: startDate,
          end_date: endDate,
        },
      });

      // 고정지출 조회
      const expenseResponse = await get('/expenses', {
        params: {
          usr_id: session.user.id,
          trx_type: 'EXPENSE',
          is_fixed: 'Y',
          start_date: startDate,
          end_date: endDate,
        },
      });

      // API 응답 구조: common.ts의 get은 { data, status, headers } 반환
      // 실제 API 응답은 { data: [...] }
      if (incomeResponse?.data?.data) {
        setFixedIncome(Array.isArray(incomeResponse.data.data) ? incomeResponse.data.data : []);
      }
      if (expenseResponse?.data?.data) {
        setFixedExpense(Array.isArray(expenseResponse.data.data) ? expenseResponse.data.data : []);
      }
    } catch (error) {
      console.error('고정 거래 조회 오류:', error);
    }
  }, [session?.user?.id, currentYear, currentMonth]);

  // 월별 저축 금액 조회
  const fetchMonthlySavings = async () => {
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
  };

  // 지갑 목록 조회 (본인 + 공유 지갑)
  const fetchWallets = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      Promise.all([fetchFixedTransactions(), fetchMonthlySavings(), fetchWallets()]).finally(() => {
        setLoading(false);
      });
    }
  }, [session?.user?.id, fetchFixedTransactions]);

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
                    <ul className={styles.transactionList}>
                      {fixedIncome.map((item) => (
                        <li key={item.trx_id} className={styles.transactionItem}>
                          <div className={styles.transactionInfo}>
                            <span className={styles.transactionCategory}>{item.category_name}</span>
                            <span className={styles.transactionMemo}>{item.memo || '-'}</span>
                          </div>
                          <span className={styles.transactionAmount} style={{ color: '#10b981' }}>
                            +{formatKRW(item.amount)}원
                          </span>
                        </li>
                      ))}
                    </ul>
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
                  <ul className={styles.transactionList}>
                    {fixedExpense.map((item) => (
                      <li key={item.trx_id} className={styles.transactionItem}>
                        <div className={styles.transactionInfo}>
                          <span className={styles.transactionCategory}>{item.category_name}</span>
                          <span className={styles.transactionMemo}>{item.memo || '-'}</span>
                        </div>
                        <span className={styles.transactionAmount} style={{ color: '#ef4444' }}>
                          -{formatKRW(item.amount)}원
                        </span>
                      </li>
                    ))}
                  </ul>
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

                  // 파트너 지갑이 있을 경우: 두 컬럼으로 표시
                  // 파트너 지갑이 없을 경우: 본인 지갑을 한 줄에 두 개씩 표시
                  return (
                    <div className={hasPartnerWallets ? styles.walletColumns : styles.walletGrid}>
                      {/* 본인 지갑 */}
                      <div className={styles.walletColumn}>
                        {hasPartnerWallets && (
                          <div className={styles.walletColumnTitle}>내 지갑</div>
                        )}
                        <div className={styles.walletList}>
                          {myWallets.length === 0 ? (
                            <div className={styles.emptyMessage}>등록된 지갑이 없습니다.</div>
                          ) : (
                            myWallets.map((wallet) => (
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
                                  <span className={styles.walletItemType}>{getWalletTypeName(wallet.wlt_type)}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* 파트너 지갑 */}
                      {hasPartnerWallets && (
                        <div className={styles.walletColumn}>
                          <div className={styles.walletColumnTitle}>공유 지갑</div>
                          <div className={styles.walletList}>
                            {partnerWallets.length === 0 ? (
                              <div className={styles.emptyMessage}>공유 지갑이 없습니다.</div>
                            ) : (
                              partnerWallets.map((wallet) => (
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
                                    <span className={styles.walletItemType}>{getWalletTypeName(wallet.wlt_type)}</span>
                                  </div>
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
