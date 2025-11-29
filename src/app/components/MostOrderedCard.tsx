'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardCard from './DashboardCard';
import styles from '../../styles/css/MostOrderedCard.module.css';
import { get } from '@/lib/api/common';
import { useFetchOnce } from '@/hooks/useFetchOnce';

interface SavingsGoal {
  sav_goal_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  goal_type_cd_nm: string;
  purpose_cd_nm: string;
  deposit_cycle_cd_nm: string;
  wlt_name: string;
}

const MostOrderedCard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  // 중복 호출 방지를 위한 커스텀 훅 사용
  useFetchOnce({
    dependencies: [session?.user?.id],
    fetchFn: async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await get('/savings-goals', {
          params: {
            usr_id: session.user.id
          }
        });

        if (response.data.success && response.data.data) {
          // 숫자 타입으로 변환 확인
          const processedGoals = response.data.data.map((goal: any) => ({
            ...goal,
            target_amount: Number(goal.target_amount),
            current_amount: Number(goal.current_amount)
          }));
          setGoals(processedGoals);
        }
      } catch (err) {
        console.error('저축목표 조회 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    enabled: !!session?.user?.id,
    manageLoading: false,
    debug: true,
  });

  // KRW 포맷 함수 (3자리 콤마 + '원')
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value) + '원';
  };

  // 진행률 계산
  const calculateProgress = (current: number, target: number) => {
    if (!current || !target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  if (loading) {
    return (
      <DashboardCard title="저축목표 현황" cardSize="card-4">
        <div className={styles.loading}>Loading...</div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="저축목표 현황" cardSize="card-4">
        <div className={styles.error}>{error}</div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="저축목표 현황" cardSize="card-4">
      <div className={styles.description}>
        {goals.length > 0 
          ? "현재 진행 중인 저축목표의 달성 현황을 확인할 수 있어요."
          : "아직 등록된 저축목표가 없어요. 새로운 저축목표를 등록해보세요!"
        }
      </div>

      <div className={styles.goalList}>
        {goals.length === 0 ? (
          <a href="/savings" className={styles.emptyStateButton}>
            <div className={styles.emptyStateContent}>
              <span className={styles.plusIcon}>+</span>
              <span>새로운 저축목표 등록하기</span>
            </div>
          </a>
        ) : (
          goals.slice(0, 2).map((goal) => (
          <div key={goal.sav_goal_id} className={styles.goalItem}>
            {/*<div className={styles.rankBadge}>{goals.indexOf(goal) + 1}</div>*/}
            <div className={styles.goalContent}>
              <div className={styles.goalHeader}>
                <div className={styles.goalName}>{goal.goal_name}</div>
                <div className={styles.goalType}>{goal.purpose_cd_nm}</div>
              </div>

              <div className={styles.goalProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ 
                      width: `${calculateProgress(goal.current_amount, goal.target_amount)}%`,
                    }}
                  />
                </div>
                <div className={styles.progressInfo}>
                  <span className={styles.currentAmount}>
                    {formatKRW(goal.current_amount)}
                  </span>
                  <span className={styles.progressPercent}>
                    {calculateProgress(goal.current_amount, goal.target_amount)}%
                  </span>
                </div>
              </div>

              <div className={styles.goalFooter}>
                <div className={styles.targetAmount}>
                  목표금액: {formatKRW(goal.target_amount)}
                </div>
                <div className={styles.walletName}>{goal.wlt_name}</div>
              </div>
            </div>
          </div>
        )))}

        {goals.length > 2 && (
          <button className={styles.moreButton}>
            <span>더 보기</span>
            <span className={styles.remainCount}>+{goals.length - 2}</span>
            <span className={styles.arrowIcon}>→</span>
          </button>
        )}
      </div>
    </DashboardCard>
  );
};

export default MostOrderedCard;