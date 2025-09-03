'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/RatingCard.module.css';

const RatingCard = () => {
  // 더미 지출 데이터 (실제에선 API/상태로 대체)
  const transactions = [
    { id: 't1', amount: 52000, paymentType: '현금' as const },
    { id: 't2', amount: 125000, paymentType: '카드' as const, cardBrand: '신한' },
    { id: 't3', amount: 48000, paymentType: '카드' as const, cardBrand: '현대' },
    { id: 't4', amount: 87000, paymentType: '카드' as const, cardBrand: '국민' },
    { id: 't5', amount: 34000, paymentType: '현금' as const },
    { id: 't6', amount: 191000, paymentType: '카드' as const, cardBrand: '신한' },
    { id: 't7', amount: 76000, paymentType: '카드' as const, cardBrand: '현대' },
    { id: 't8', amount: 42000, paymentType: '카드' as const, cardBrand: '롯데' },
  ];

  const formatKRW = (v: number) => `${v.toLocaleString('ko-KR')}원`;

  // 결제수단별 합계
  const totalCash = transactions
    .filter((t) => t.paymentType === '현금')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCard = transactions
    .filter((t) => t.paymentType === '카드')
    .reduce((sum, t) => sum + t.amount, 0);

  // 카드사별 합계 (카드만 집계)
  const cardBrandTotals = transactions
    .filter((t) => t.paymentType === '카드' && t.cardBrand)
    .reduce<Record<string, number>>((acc, t) => {
      const brand = t.cardBrand as string;
      acc[brand] = (acc[brand] || 0) + t.amount;
      return acc;
    }, {});

  const sortedCardBrands = Object.entries(cardBrandTotals)
    .sort((a, b) => b[1] - a[1]);

  return (
    <DashboardCard title="결제수단별 지출 요약" cardSize="card-4">
      <div className={styles.description}>
        결제수단별 합계와 카드사별 상세 합계를 확인할 수 있어요.
      </div>

      <div className={styles.summaryContainer}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>현금</div>
          <div className={styles.summaryAmount}>{formatKRW(totalCash)}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>카드</div>
          <div className={styles.summaryAmount}>{formatKRW(totalCard)}</div>
        </div>
      </div>

      {sortedCardBrands.length > 0 && (
        <div className={styles.brandSection}>
          <div className={styles.brandSectionTitle}>카드사별 지출 합계</div>
          <div className={styles.brandList}>
            {sortedCardBrands.map(([brand, amount]) => (
              <div key={brand} className={styles.brandItem}>
                <div className={styles.brandBadge}>{brand}</div>
                <div className={styles.brandAmount}>{formatKRW(amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  );
};

export default RatingCard; 