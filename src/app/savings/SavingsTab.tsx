'use client';

import styles from '../../styles/css/savings.module.css';
import { useEffect, useState } from 'react';
import SavingsGoalModal from '@/components/SavingsGoalModal';
import SavingsContributionModal from '@/components/SavingsContributionModal';
import SavingsContributionListModal from '@/components/SavingsContributionListModal';

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
  goal_type_cd_nm?: string;
  purpose_cd_nm?: string;
  deposit_cycle_cd_nm?: string;
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

interface SavingsTabProps {
  userId: string;
}

export default function SavingsTab({ userId }: SavingsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [isContribListModalOpen, setIsContribListModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 저축목표 목록 조회
  const fetchSavingsGoals = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/savings-goals?usr_id=${userId}`);
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
    if (!userId) return;

    try {
      const response = await fetch(`/api/savings-contributions?usr_id=${userId}`);
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
    if (userId) {
      setLoading(true);
      Promise.all([fetchSavingsGoals(), fetchContributions()])
        .finally(() => setLoading(false));
    }
  }, [userId]);

  // 저축목표별 현재 금액 계산
  const calculateCurrentAmounts = () => {
    const goalContributions = contributions.reduce((acc, contrib) => {
      if (!acc[contrib.sav_goal_id]) {
        acc[contrib.sav_goal_id] = 0;
      }
      acc[contrib.sav_goal_id] += Number(contrib.amount);
      return acc;
    }, {} as Record<string, number>);

    return savingsGoals.map(goal => ({
      ...goal,
      current_amount: goalContributions[goal.sav_goal_id] || 0,
      progress_percentage: Math.min(
        ((goalContributions[goal.sav_goal_id] || 0) / Number(goal.target_amount)) * 100,
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
    return `${String(date.getFullYear()).padStart(2, '0')}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
  };

  // 진행률에 따른 색상 반환
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981';
    if (percentage >= 75) return '#3b82f6';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // 목표 달성을 위한 월별 필요 저축액 계산
  const calculateMonthlyRequirement = (goal: SavingsGoal & { current_amount?: number }) => {
    if (!goal.end_date) {
      return null;
    }

    const today = new Date();
    const endDate = new Date(goal.end_date);
    const remainingAmount = Number(goal.target_amount) - (goal.current_amount || 0);
    
    if (remainingAmount <= 0) {
      return {
        isCompleted: true,
        remainingAmount: 0,
        monthsRemaining: 0,
        monthlyRequirement: 0
      };
    }

    const monthsRemaining = (endDate.getFullYear() - today.getFullYear()) * 12 + 
                           (endDate.getMonth() - today.getMonth()) + 1;

    if (monthsRemaining <= 0) {
      return {
        isOverdue: true,
        remainingAmount,
        monthsRemaining: 0,
        monthlyRequirement: remainingAmount
      };
    }

    const monthlyRequirement = Math.ceil(remainingAmount / monthsRemaining);

    return {
      isCompleted: false,
      isOverdue: false,
      remainingAmount,
      monthsRemaining,
      monthlyRequirement
    };
  };

  const goalsWithProgress = calculateCurrentAmounts();

  return (
    <>
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
                    {formatKRW(goalsWithProgress.reduce((sum, goal) => sum + Number(goal.target_amount), 0))}원
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>💰</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>현재 저축액</div>
                  <div className={styles.summaryValue}>
                    {formatKRW(goalsWithProgress.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0))}원
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>📈</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>전체 진행률</div>
                  <div className={styles.summaryValue}>
                    {(() => {
                      const totalTarget = goalsWithProgress.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
                      const totalCurrent = goalsWithProgress.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0);
                      return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>✅</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>완료된 목표</div>
                  <div className={styles.summaryValue}>
                    {goalsWithProgress.filter(goal => goal.is_completed === 'Y' || (goal.progress_percentage || 0) >= 100).length}개
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 저축목표 목록 */}
          <section className={styles.goalsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>저축목표 목록</h2>
              <button className={styles.buttonPrimary} onClick={() => setIsModalOpen(true)}>+ 저축목표 추가</button>
            </div>
            <div className={styles.goalsList}>
              {goalsWithProgress.map((goal) => (
                <div key={goal.sav_goal_id} className={styles.goalCard}>
                  <div className={styles.goalHeader}>
                    <div className={styles.goalInfo}>
                      <h3 className={styles.goalName}>{goal.goal_name}</h3>
                      <div className={styles.goalMeta}>
                        <span className={styles.goalType}>{goal.goal_type_cd_nm || goal.goal_type_cd}</span>
                        {goal.purpose_cd_nm && (
                          <span className={styles.goalPurpose}>{goal.purpose_cd_nm}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.goalStatus}>
                      {(goal.is_completed === 'Y' || (goal.progress_percentage || 0) >= 100) && (
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
                    {goal.deposit_cycle_cd_nm && (
                      <div className={styles.goalDetail}>
                        <span className={styles.detailLabel}>납입주기:</span>
                        <span className={styles.detailValue}>{goal.deposit_cycle_cd_nm}</span>
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

                  {/* 월별 필요 저축액 계산 영역 */}
                  {(() => {
                    const monthlyReq = calculateMonthlyRequirement(goal);
                    if (!monthlyReq) return null;

                    return (
                        <div className={styles.monthlyRequirement}>
                          {monthlyReq.isCompleted ? (
                              <div className={styles.completedMessage}>
                                <span className={styles.completedIcon}>🎉</span>
                                <span className={styles.completedText}>목표 달성 완료!</span>
                              </div>
                          ) : monthlyReq.isOverdue ? (
                              <div className={styles.overdueMessage}>
                                <span className={styles.overdueIcon}>⚠️</span>
                                <div className={styles.overdueContent}>
                                  <span className={styles.overdueText}>목표 기간이 지났습니다</span>
                                  <span className={styles.overdueAmount}>
                                부족 금액: {formatKRW(monthlyReq.remainingAmount)}원
                              </span>
                                </div>
                              </div>
                          ) : (
                              <div className={styles.requirementInfo}>
                                <div className={styles.requirementHeader}>
                                  <span className={styles.requirementTitle}>목표 달성 계획</span>
                                </div>
                                <div className={styles.requirementDetails}>
                                  <div className={styles.requirementItem}>
                                    <span className={styles.requirementLabel}>남은 기간:</span>
                                    <span className={styles.requirementValue}>
                                  {monthlyReq.monthsRemaining}개월
                                </span>
                                  </div>
                                  <div className={styles.requirementItem}>
                                    <span className={styles.requirementLabel}>남은 금액:</span>
                                    <span className={styles.requirementValue}>
                                  {formatKRW(monthlyReq.remainingAmount)}원
                                </span>
                                  </div>
                                  <div className={styles.requirementItem}>
                                    <span className={styles.requirementLabel}>월별 필요 납부 금액:</span>
                                    <span className={`${styles.requirementValue} ${styles.monthlyAmount}`}>
                                  {formatKRW(monthlyReq.monthlyRequirement)}원
                                </span>
                                  </div>
                                </div>
                              </div>
                          )}
                        </div>
                    );
                  })()}

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
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => {
                        setSelectedGoal(goal);
                        setIsContribListModalOpen(true);
                      }}
                    >
                      납입목록
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

      {/* 저축목표 생성 모달 */}
      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSavingsGoals}
        userId={userId}
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

      {/* 저축 납입목록 모달 */}
      {selectedGoal && (
        <SavingsContributionListModal
          isOpen={isContribListModalOpen}
          onClose={() => {
            setIsContribListModalOpen(false);
            setSelectedGoal(null);
          }}
          savingsGoal={selectedGoal}
        />
      )}
    </>
  );
}
