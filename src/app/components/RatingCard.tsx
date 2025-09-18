'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardCard from './DashboardCard';
import styles from '../../styles/css/RatingCard.module.css';
import { get } from '@/lib/api/common';
import { getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/date-utils';

interface WalletSummary {
  wlt_id: string;
  wlt_name: string;
  amount: number;
  percentage: number;
}

interface PaymentSummary {
  type: '현금성' | '카드성';
  amount: number;
  percentage: number;
  wallets: WalletSummary[];
}

const RatingCard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<PaymentSummary[]>([]);

  useEffect(() => {
    const fetchPaymentSummary = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        const startDate = getFirstDayOfMonth();
        const endDate = getLastDayOfMonth();

        // 현금성 지출 조회 (CASH, CHECK_CARD)
        const cashResponse = await get('/expenses', {
          params: {
            usr_id: session.user.id,
            trx_type: 'EXPENSE',
            start_date: startDate,
            end_date: endDate,
            wlt_type: 'CASH'
          }
        });

        // 카드성 지출 조회 (CREDIT_CARD)
        const cardResponse = await get('/expenses', {
          params: {
            usr_id: session.user.id,
            trx_type: 'EXPENSE',
            start_date: startDate,
            end_date: endDate,
            wlt_type: 'CREDIT_CARD'
          }
        });

        // 지갑별 금액 집계 함수
        const aggregateWallets = (data: any[]) => {
          const walletMap = new Map<string, { wlt_id: string; wlt_name: string; amount: number }>();
          
          data.forEach(item => {
            const amount = Number(item.amount);
            if (walletMap.has(item.wlt_id)) {
              const wallet = walletMap.get(item.wlt_id)!;
              wallet.amount += amount;
            } else {
              walletMap.set(item.wlt_id, {
                wlt_id: item.wlt_id,
                wlt_name: item.wlt_name,
                amount: amount
              });
            }
          });

          return Array.from(walletMap.values());
        };

        // 현금성 지출 집계
        const cashWallets = aggregateWallets(cashResponse.data.data);
        const cashAmount = cashWallets.reduce((sum, wallet) => sum + wallet.amount, 0);

        // 카드성 지출 집계
        const cardWallets = aggregateWallets(cardResponse.data.data);
        const cardAmount = cardWallets.reduce((sum, wallet) => sum + wallet.amount, 0);

        // 전체 금액
        const totalAmount = cashAmount + cardAmount;

        // 지갑별 비율 계산
        const calculateWalletPercentages = (wallets: any[], totalAmount: number) => {
          return wallets.map(wallet => ({
            ...wallet,
            percentage: totalAmount ? Math.round((wallet.amount / totalAmount) * 100) : 0
          }))
          .sort((a, b) => b.amount - a.amount); // 금액 기준 내림차순 정렬
        };

        // 최종 데이터 구성
        const summary = [
          {
            type: '현금성' as const,
            amount: cashAmount,
            percentage: totalAmount ? Math.round((cashAmount / totalAmount) * 100) : 0,
            wallets: calculateWalletPercentages(cashWallets, cashAmount)
          },
          {
            type: '카드성' as const,
            amount: cardAmount,
            percentage: totalAmount ? Math.round((cardAmount / totalAmount) * 100) : 0,
            wallets: calculateWalletPercentages(cardWallets, cardAmount)
          }
        ];

        setSummaryData(summary);
      } catch (err) {
        console.error('결제수단별 지출 요약 조회 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSummary();
  }, [session?.user?.id]);

  // KRW 포맷 함수 (3자리 콤마 + '원')
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value) + '원';
  };

  if (loading) {
    return (
      <DashboardCard title="결제수단별 지출 요약" cardSize="card-4">
        <div className={styles.loading}>Loading...</div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="결제수단별 지출 요약" cardSize="card-4">
        <div className={styles.error}>{error}</div>
      </DashboardCard>
    );
  }

  const cardWallets = summaryData[1]?.wallets || [];
  const hasMoreWallets = cardWallets.length > 3;

  return (
    <DashboardCard title="결제수단별 지출 요약" cardSize="card-4">
      <div className={styles.description}>
        결제수단과 카드사별 상세 합계를 확인할 수 있어요.
      </div>

      {/* 현금/카드 요약 */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>현금</div>
          <div className={styles.summaryValue}>
            {formatKRW(summaryData[0]?.amount || 0)}
          </div>
        </div>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>카드</div>
          <div className={styles.summaryValue}>
            {formatKRW(summaryData[1]?.amount || 0)}
          </div>
        </div>
      </div>

      {/* 카드사별 지출 합계 */}
      <div className={styles.sectionTitle}>카드사별 지출 합계</div>
      <div className={styles.walletList}>
        {cardWallets.slice(0, 3).map((wallet) => (
          <div key={wallet.wlt_id} className={styles.walletItem}>
            <div className={styles.walletName}>{wallet.wlt_name}</div>
            <div className={styles.walletAmount}>{formatKRW(wallet.amount)}</div>
          </div>
        ))}
        
        {hasMoreWallets && (
          <button className={styles.moreButton}>
            <span>더 보기</span>
            <span className={styles.remainCount}>+{cardWallets.length - 3}</span>
            <span className={styles.arrowIcon}>→</span>
          </button>
        )}
      </div>
    </DashboardCard>
  );
};

export default RatingCard;