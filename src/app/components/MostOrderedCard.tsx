'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/MostOrderedCard.module.css';

const MostOrderedCard = () => {
  // 더미 데이터 (실제 연동 시 교체)
  const monthlyBudget = 2000000; // 이번 달 예산
  const spentAmount = 1250000; // 이번 달 지출
  const remainingBudget = Math.max(monthlyBudget - spentAmount, 0);
  const budgetSpentPercent = Math.min(
    Math.round((spentAmount / monthlyBudget) * 100),
    100
  );

  const savedAmount = 450000; // 이번 달 저축액
  const consumptionAmount = spentAmount; // 소비액을 지출액으로 동일하게 사용
  const savingVsSpendingTotal = savedAmount + consumptionAmount;
  const savingPercent = Math.round((savedAmount / savingVsSpendingTotal) * 100);
  const spendingPercent = 100 - savingPercent;

  // 지출 형태(구독/할부/일시불) 더미 값
  const subscriptionAmount = 180000; // 구독(정기결제)
  const installmentAmount = 320000; // 할부 결제 합계(이번 달 납부액)
  const oneTimeAmount = Math.max(consumptionAmount - subscriptionAmount - installmentAmount, 0);
  const spendingTypeTotal = subscriptionAmount + installmentAmount + oneTimeAmount || 1;
  const subscriptionPercent = Math.round((subscriptionAmount / spendingTypeTotal) * 100);
  const installmentPercent = Math.round((installmentAmount / spendingTypeTotal) * 100);
  const oneTimePercent = Math.max(0, 100 - subscriptionPercent - installmentPercent);

  const formatKRW = (v: number) => `${v.toLocaleString('ko-KR')}원`;

  const CIRC_R = 36; // 반지름
  const CIRC_C = 2 * Math.PI * CIRC_R; // 둘레

  return (
    <DashboardCard title="예산 소진율 & 저축/소비 비율" cardSize="card-4">
      <div className={styles.description}>
        이번 달 예산 소진율과 저축 대비 소비 비율을 한눈에 확인해요.
      </div>

      <div className={styles.chartsRow}>
        {/* 예산 소진율 도넛 */}
        <div className={styles.donutCard}>
          <div className={styles.sectionTitle}>예산 소진율</div>
          <div className={styles.donut}>
            <svg className={styles.donutSvg} viewBox="0 0 100 100" aria-label="예산 소진율">
              <circle cx="50" cy="50" r={CIRC_R} fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r={CIRC_R}
                fill="none"
                stroke="#f97316" /* 소비색 */
                strokeWidth="10"
                strokeDasharray={`${CIRC_C}`}
                strokeDashoffset={`${CIRC_C * (1 - budgetSpentPercent / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className={styles.donutText}>
              <div className={styles.donutPrimary}>{budgetSpentPercent}%</div>
              <div className={styles.donutSecondary}>{formatKRW(spentAmount)}</div>
            </div>
          </div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ background: '#f97316' }} />
              <span>소진 {formatKRW(spentAmount)}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ background: '#d1d5db' }} />
              <span>잔여 {formatKRW(remainingBudget)}</span>
            </div>
          </div>
        </div>

        {/* 저축 vs 소비: 가로 스택 바 */}
        <div className={styles.donutCard}>
          <div className={styles.sectionTitle}>저축 vs 소비</div>
          <div className={styles.stackedBar} aria-label="저축과 소비 비율 진행바">
            <div
              className={`${styles.barSegment} ${styles.barSaving}`}
              style={{ width: `${savingPercent}%` }}
            >
              <span className={styles.barText}>{savingPercent}%</span>
            </div>
            <div
              className={`${styles.barSegment} ${styles.barSpending}`}
              style={{ width: `${spendingPercent}%` }}
            >
              <span className={styles.barText}>{spendingPercent}%</span>
            </div>
          </div>
          <div className={styles.barTotals}>
            <div className={styles.totalItem}>
              <span className={styles.legendColor} style={{ background: '#22c55e' }} />
              <span>저축 {formatKRW(savedAmount)}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.legendColor} style={{ background: '#ef4444' }} />
              <span>소비 {formatKRW(consumptionAmount)}</span>
            </div>
          </div>

          {/* 지출 형태: 구독 vs 할부 vs 일시불 */}
          <div className={styles.subSection}>
            <div className={styles.subSectionTitle}>지출 형태 비율</div>
            <div className={styles.stackedBar} aria-label="구독/할부/일시불 비율 진행바">
              <div
                className={`${styles.barSegment} ${styles.barSubscription}`}
                style={{ width: `${subscriptionPercent}%` }}
                title={`구독 ${subscriptionPercent}%`}
              >
                <span className={styles.barText}>{subscriptionPercent}%</span>
              </div>
              <div
                className={`${styles.barSegment} ${styles.barInstallment}`}
                style={{ width: `${installmentPercent}%` }}
                title={`할부 ${installmentPercent}%`}
              >
                <span className={styles.barText}>{installmentPercent}%</span>
              </div>
              <div
                className={`${styles.barSegment} ${styles.barOneTime}`}
                style={{ width: `${oneTimePercent}%` }}
                title={`일시불 ${oneTimePercent}%`}
              >
                <span className={styles.barText}>{oneTimePercent}%</span>
              </div>
            </div>
            <div className={styles.barTotals}>
              <div className={styles.totalItem}>
                <span className={styles.legendColor} style={{ background: '#3b82f6' }} />
                <span>구독 {formatKRW(subscriptionAmount)}</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.legendColor} style={{ background: '#8b5cf6' }} />
                <span>할부 {formatKRW(installmentAmount)}</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.legendColor} style={{ background: '#9ca3af' }} />
                <span>일시불 {formatKRW(oneTimeAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default MostOrderedCard; 