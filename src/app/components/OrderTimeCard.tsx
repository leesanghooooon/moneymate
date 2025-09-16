'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardCard from './DashboardCard';
import styles from '../../styles/css/MostOrderedCard.module.css';
import { get } from '@/lib/api/common';

interface Expenditure {
  trx_id: string;
  wlt_name: string;
  amount: number;
  category_name: string;
  memo: string;
  trx_date: string;
}

const OrderTimeCard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);

  useEffect(() => {
    const fetchTopExpenditures = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        // 현재 달의 시작일과 마지막 일을 계산
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString().split('T')[0];
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString().split('T')[0];

        const response = await get('/expenses', {
          params: {
            usr_id: session.user.id,
            trx_type: 'EXPENSE',
            start_date: startDate,
            end_date: endDate
          }
        });

        if (response.data) {
          // 금액 기준 내림차순 정렬 후 상위 5개 선택
          const topFive = response.data.data
            .sort((a: Expenditure, b: Expenditure) => b.amount - a.amount)
            .slice(0, 5);
          setExpenditures(topFive);
        }
      } catch (error) {
        console.error('지출 목록 조회 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopExpenditures();
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
      <DashboardCard title="이번 달 최대 지출 TOP 5" cardSize="card-4">
        <div className={styles.loading}>Loading...</div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="이번 달 최대 지출 TOP 5" cardSize="card-4">
        <div className={styles.error}>{error}</div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="이번 달 최대 지출 TOP 5" cardSize="card-4">
      <div className={styles.foodList}>
        {expenditures.map((item, idx) => (
          <div key={item.trx_id} className={styles.foodItem}>
            <div className={styles.rankBadge} aria-label={`rank-${idx + 1}`}>
              {idx + 1}
            </div>
            <div className={styles.foodContent}>
              <div className={styles.foodHeader}>
                <div className={styles.foodName}>
                  {item.category_name}
                </div>
                <div className={styles.foodPrice}>
                  {formatKRW(item.amount)}
                </div>
              </div>
              <div className={styles.foodMeta}>
                <span>{item.wlt_name}</span>
                {item.memo && <span>| {item.memo}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default OrderTimeCard;