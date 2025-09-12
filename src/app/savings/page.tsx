'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/savings.module.css';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoginRequiredModal from '@/components/LoginRequiredModal';

interface SavingsGoal {
  sav_goal_id: string;
  usr_id: string;
  wlt_id: string | null;
  goal_name: string;
  goal_type_cd: string;
  purpose_cd: string | null;
  target_amount: number;
  start_date: string;
  end_date: string | null;
  deposit_cycle_cd: string | null;
  plan_amount: number | null;
  alarm_yn: string;
  alarm_day: number | null;
  is_paused: string;
  is_completed: string;
  memo: string | null;
  use_yn: string;
  created_at: string;
  updated_at: string;
  wlt_name?: string;
  current_amount?: number;
  progress_percentage?: number;
}

interface Contribution {
  contrib_id: string;
  sav_goal_id: string;
  trx_id: string | null;
  contrib_date: string;
  amount: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

import SavingsGoalModal from '@/components/SavingsGoalModal';

import SavingsContributionModal from '@/components/SavingsContributionModal';

export default function SavingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const { data: session, status } = useSession();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 저축목표 목록 조회
  const fetchSavingsGoals = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/savings-goals?usr_id=${session.user.id}`);
      if (!response.ok) {
        throw new Error('저축목표 조회 실패');
      }
      const result = await response.json();
      setSavingsGoals(result.data || []);
    } catch (error) {
      console.error('저축목표 조회 오류:', error);
      setError('저축목표 조회 중 오류가 발생했습니다.');
    }
  };

  // 저축 납입내역 조회
  const fetchContributions = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/savings-contributions?usr_id=${session.user.id}`);
      if (!response.ok) {
        throw new Error('납입내역 조회 실패');
      }
      const result = await response.json();
      setContributions(result.data || []);
    } catch (error) {
      console.error('납입내역 조회 오류:', error);
    }
  };

  // 데이터 로드
  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      Promise.all([fetchSavingsGoals(), fetchContributions()])
        .finally(() => setLoading(false));
    }
  }, [session?.user?.id]);

  // 저축목표별 현재 금액 계산
  const calculateCurrentAmounts = () => {
    const goalContributions = contributions.reduce((acc, contrib) => {
      if (!acc[contrib.sav_goal_id]) {
        acc[contrib.sav_goal_id] = 0;
      }
      acc[contrib.sav_goal_id] += contrib.amount;
      return acc;
    }, {} as Record<string, number>);

    return savingsGoals.map(goal => ({
      ...goal,
      current_amount: goalContributions[goal.sav_goal_id] || 0,
      progress_percentage: Math.min(
        ((goalContributions[goal.sav_goal_id] || 0) / goal.target_amount) * 100,
        100
      )
    }));
  };

  // 금액을 한국 원화 형식으로 포맷하는 함수
  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 날짜를 YYYY-MM-DD에서 MM-DD 형식으로 변환하는 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 진행률에 따른 색상 반환
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // 완료 - 초록
    if (percentage >= 75) return '#3b82f6'; // 75% 이상 - 파랑
    if (percentage >= 50) return '#f59e0b'; // 50% 이상 - 주황
    return '#ef4444'; // 50% 미만 - 빨강
  };

  // 비로그인 상태에서는 데이터 로딩하지 않음
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  const goalsWithProgress = calculateCurrentAmounts();

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.savingsPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>저축 현황</h1>
                  <p className={styles.subtitle}>나의 저축목표와 진행상황을 확인하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <button className={styles.buttonPrimary} onClick={() => setIsModalOpen(true)}>+ 저축목표 추가</button>
                </div>
              </div>
            </header>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {loading ? (
              <div className={styles.loadingMessage}>
                저축목표 데이터를 불러오는 중...
              </div>
            ) : goalsWithProgress.length === 0 ? (
              <div className={styles.emptyMessage}>
                <div className={styles.emptyIcon}>💰</div>
                <h3>저축목표가 없습니다</h3>
                <p>첫 번째 저축목표를 만들어보세요!</p>
                <button className={styles.buttonPrimary} onClick={() => setIsModalOpen(true)}>저축목표 만들기</button>
              </div>
            ) : (
              <>
                {/* 전체 현황 요약 */}
                <section className={styles.summarySection}>
                  <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryIcon}>🎯</div>
                      <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>총 목표 금액</div>
                        <div className={styles.summaryValue}>
                          {formatKRW(goalsWithProgress.reduce((sum, goal) => sum + goal.target_amount, 0))}원
                        </div>
                      </div>
                    </div>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryIcon}>💰</div>
                      <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>현재 저축액</div>
                        <div className={styles.summaryValue}>
                          {formatKRW(goalsWithProgress.reduce((sum, goal) => sum + (goal.current_amount || 0), 0))}원
                        </div>
                      </div>
                    </div>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryIcon}>📈</div>
                      <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>전체 진행률</div>
                        <div className={styles.summaryValue}>
                          {Math.round(
                            (goalsWithProgress.reduce((sum, goal) => sum + (goal.current_amount || 0), 0) /
                             goalsWithProgress.reduce((sum, goal) => sum + goal.target_amount, 0)) * 100
                          )}%
                        </div>
                      </div>
                    </div>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryIcon}>✅</div>
                      <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>완료된 목표</div>
                        <div className={styles.summaryValue}>
                          {goalsWithProgress.filter(goal => goal.is_completed === 'Y').length}개
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 저축목표 목록 */}
                <section className={styles.goalsSection}>
                  <h2 className={styles.sectionTitle}>저축목표 목록</h2>
                  <div className={styles.goalsList}>
                    {goalsWithProgress.map((goal) => (
                      <div key={goal.sav_goal_id} className={styles.goalCard}>
                        <div className={styles.goalHeader}>
                          <div className={styles.goalInfo}>
                            <h3 className={styles.goalName}>{goal.goal_name}</h3>
                            <div className={styles.goalMeta}>
                              <span className={styles.goalType}>{goal.goal_type_cd}</span>
                              {goal.purpose_cd && (
                                <span className={styles.goalPurpose}>{goal.purpose_cd}</span>
                              )}
                            </div>
                          </div>
                          <div className={styles.goalStatus}>
                            {goal.is_completed === 'Y' && (
                              <span className={styles.completedBadge}>완료</span>
                            )}
                            {goal.is_paused === 'Y' && (
                              <span className={styles.pausedBadge}>일시중지</span>
                            )}
                          </div>
                        </div>

                        <div className={styles.goalProgress}>
                          <div className={styles.progressHeader}>
                            <div className={styles.progressAmounts}>
                              <span className={styles.currentAmount}>
                                {formatKRW(goal.current_amount || 0)}원
                              </span>
                              <span className={styles.targetAmount}>
                                / {formatKRW(goal.target_amount)}원
                              </span>
                            </div>
                            <div className={styles.progressPercentage}>
                              {Math.round(goal.progress_percentage || 0)}%
                            </div>
                          </div>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill}
                              style={{
                                width: `${goal.progress_percentage || 0}%`,
                                backgroundColor: getProgressColor(goal.progress_percentage || 0)
                              }}
                            />
                          </div>
                        </div>

                        <div className={styles.goalDetails}>
                          <div className={styles.goalDetail}>
                            <span className={styles.detailLabel}>시작일:</span>
                            <span className={styles.detailValue}>{formatDate(goal.start_date)}</span>
                          </div>
                          {goal.end_date && (
                            <div className={styles.goalDetail}>
                              <span className={styles.detailLabel}>목표일:</span>
                              <span className={styles.detailValue}>{formatDate(goal.end_date)}</span>
                            </div>
                          )}
                          {goal.deposit_cycle_cd && (
                            <div className={styles.goalDetail}>
                              <span className={styles.detailLabel}>납입주기:</span>
                              <span className={styles.detailValue}>{goal.deposit_cycle_cd}</span>
                            </div>
                          )}
                          {goal.plan_amount && (
                            <div className={styles.goalDetail}>
                              <span className={styles.detailLabel}>계획금액:</span>
                              <span className={styles.detailValue}>{formatKRW(goal.plan_amount)}원</span>
                            </div>
                          )}
                          {goal.wlt_name && (
                            <div className={styles.goalDetail}>
                              <span className={styles.detailLabel}>연결지갑:</span>
                              <span className={styles.detailValue}>{goal.wlt_name}</span>
                            </div>
                          )}
                        </div>

                        {goal.memo && (
                          <div className={styles.goalMemo}>
                            <span className={styles.memoLabel}>메모:</span>
                            <span className={styles.memoValue}>{goal.memo}</span>
                          </div>
                        )}

                        <div className={styles.goalActions}>
                          <button
                            className={styles.buttonSecondary}
                            onClick={() => {
                              setSelectedGoal(goal);
                              setIsContribModalOpen(true);
                            }}
                          >
                            납입하기
                          </button>
                          <button className={styles.buttonGhost}>수정</button>
                          <button className={styles.buttonGhost}>삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 저축목표 생성 모달 */}
      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSavingsGoals}
        userId={session?.user?.id || ''}
      />

      {/* 저축 납입 모달 */}
      {selectedGoal && (
        <SavingsContributionModal
          isOpen={isContribModalOpen}
          onClose={() => {
            setIsContribModalOpen(false);
            setSelectedGoal(null);
          }}
          onSuccess={() => {
            Promise.all([fetchSavingsGoals(), fetchContributions()]);
          }}
          savingsGoal={selectedGoal}
        />
      )}
    </div>
  );
}
