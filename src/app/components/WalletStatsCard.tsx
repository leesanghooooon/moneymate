'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { get } from '@/lib/api/common';
import { WalletIcon, CreditCardIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import styles from '../../styles/css/WalletStatsCard.module.css';

interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
  is_shared: string | number;
  total_amount: number;
  transaction_count: number;
}

interface WalletGroup {
  wallets: Wallet[];
  totalAmount: number;
  totalTransactions: number;
}

interface WalletStatsData {
  period: {
    year: number;
    month: number;
    display: string;
  };
  myWallets: WalletGroup;
  sharedWallets: WalletGroup;
  grandTotal: number;
}

const WalletStatsCard = () => {
  const { data: session } = useSession();
  const [statsData, setStatsData] = useState<WalletStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchWalletStats = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);
      console.log('API 호출 시작:', { usr_id: session.user.id, year: selectedYear, month: selectedMonth });
      
      const response = await get('/stats/wallet-expenses', {
        params: {
          usr_id: session.user.id,
          year: selectedYear.toString(),
          month: selectedMonth.toString()
        }
      });

      console.log('API 응답:', response);

      if (response.data && response.data.success) {
        console.log('응답 데이터:', response.data.data);
        setStatsData(response.data.data);
      } else {
        console.error('API 응답 실패:', response.data);
        setError(response.data?.message || '통계 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('지갑별 통계 조회 오류:', error);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    fetchWalletStats();
  };

  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const renderWalletList = (wallets: Wallet[], title: string, icon: React.ReactNode) => (
    <div className={styles.walletGroup}>
      <div className={styles.groupHeader}>
        <div className={styles.groupTitle}>
          {icon}
          <span>{title}</span>
        </div>
        <div className={styles.groupTotal}>
          {formatKRW(wallets.reduce((sum, wallet) => sum + wallet.total_amount, 0))}
        </div>
      </div>
      
      {wallets.length > 0 ? (
        <div className={styles.walletList}>
          {wallets.map((wallet) => (
            <div key={wallet.wlt_id} className={styles.walletItem}>
              <div className={styles.walletInfo}>
                <div className={styles.walletName}>{wallet.wlt_name}</div>
                <div className={styles.walletDetails}>
                  <span className={styles.transactionCount}>{wallet.transaction_count}건</span>
                </div>
              </div>
              <div className={styles.walletAmount}>
                {formatKRW(wallet.total_amount)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <WalletIcon className={styles.emptyIcon} />
          <span>카드 지출 내역이 없습니다</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>지갑별 카드지출 통계</h3>
          <div className={styles.dateSelector}>
            <div className={styles.dateInputGroup}>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={styles.dateSelect}
                disabled
              >
                {generateYearOptions().map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={styles.dateSelect}
                disabled
              >
                {generateMonthOptions().map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
              <button className={styles.searchButton} disabled>
                <MagnifyingGlassIcon className={styles.searchIcon} />
              </button>
            </div>
          </div>
        </div>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>통계를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>지갑별 카드지출 통계</h3>
          <div className={styles.dateSelector}>
            <div className={styles.dateInputGroup}>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={styles.dateSelect}
              >
                {generateYearOptions().map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={styles.dateSelect}
              >
                {generateMonthOptions().map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
              <button className={styles.searchButton} onClick={handleSearch}>
                <MagnifyingGlassIcon className={styles.searchIcon} />
              </button>
            </div>
          </div>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => fetchWalletStats()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>지갑별 카드지출 통계</h3>
        <div className={styles.dateSelector}>
          <div className={styles.dateInputGroup}>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={styles.dateSelect}
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={styles.dateSelect}
            >
              {generateMonthOptions().map(month => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
            <button className={styles.searchButton} onClick={handleSearch}>
              <MagnifyingGlassIcon className={styles.searchIcon} />
            </button>
          </div>
        </div>
      </div>

      {statsData ? (
        <>
          <div className={styles.summarySection}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>총 지출</div>
              <div className={styles.summaryAmount}>
                {formatKRW(statsData.grandTotal)}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>기간</div>
              <div className={styles.summaryPeriod}>
                {statsData.period.display}
              </div>
            </div>
          </div>

          <div className={styles.statsSection}>
            {renderWalletList(
              statsData.myWallets.wallets,
              `내 지갑 (${statsData.myWallets.totalTransactions}건)`,
              <CreditCardIcon className={styles.groupIcon} />
            )}
            
            {renderWalletList(
              statsData.sharedWallets.wallets,
              `공유 지갑 (${statsData.sharedWallets.totalTransactions}건)`,
              <UsersIcon className={styles.groupIcon} />
            )}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
          </div>
          <p>날짜를 선택하고 검색 버튼을 클릭하여 통계를 조회하세요</p>
        </div>
      )}
    </div>
  );
};

export default WalletStatsCard;
