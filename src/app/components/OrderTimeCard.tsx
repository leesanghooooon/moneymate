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
          <div key={item.trx_id} className={styles.foodItem} style={{ alignItems: 'center', gap: 12 }}>
            {/* 순위 뱃지 */}
            <div
              aria-label={`rank-${idx + 1}`}
              style={{
                minWidth: 20,
                fontSize: 25,
                fontWeight: 700,
                color: '#000',
                textAlign: 'center',
              }}
            >
              {idx + 1}
            </div>

            {/* 카테고리와 지갑 정보 */}
            <div className={styles.foodInfo} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={styles.foodName} style={{ fontWeight: 600 }}>
                  {item.category_name}
                </div>
                <div className={styles.foodPrice} style={{ 
                  opacity: 0.8,
                  fontWeight: 600,
                  color: '#4F46E5'  // 금액을 보라색으로 강조
                }}>
                  {formatKRW(item.amount)}
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                fontSize: '0.9em', 
                color: '#666',
                marginTop: '2px'  // 간격 추가
              }}>
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