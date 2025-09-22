'use client';

import styles from '../../styles/css/savings.module.css';
import { useEffect, useState } from 'react';
import { get } from '../../lib/api/common';
import LoanModal from '../../components/LoanModal';

interface Loan {
  loan_id: string;
  usr_id: string;
  wlt_id: string | null;
  loan_name: string;
  loan_type_cd: string;
  purpose_cd: string | null;
  loan_amount: number;
  interest_rate: number;
  start_date: string;
  end_date: string | null;
  payment_cycle_cd: string | null;
  monthly_payment: number | null;
  alarm_yn: string;
  alarm_day: number | null;
  is_paused: string;
  is_completed: string;
  memo: string | null;
  use_yn: string;
  created_at: string;
  updated_at: string;
  wlt_name?: string;
  current_balance?: number;
  progress_percentage?: number;
  loan_type_cd_nm?: string;
  purpose_cd_nm?: string;
  payment_cycle_cd_nm?: string;
}

interface LoanPayment {
  payment_id: string;
  loan_id: string;
  trx_id: string | null;
  payment_date: string;
  amount: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

interface LoansTabProps {
  userId: string;
}

export default function LoansTab({ userId }: LoansTabProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  // 대출 목록 조회
  const fetchLoans = async () => {
    if (!userId) return;

    try {
      const response = await get('/loans', {
        params: { usr_id: userId }
      });
      
      // API 응답을 Loan 인터페이스에 맞게 변환
      const loansData: Loan[] = (response.data.data || []).map((loan: any) => ({
        loan_id: loan.sav_goal_id,
        usr_id: loan.usr_id,
        wlt_id: loan.wlt_id,
        loan_name: loan.goal_name,
        loan_type_cd: loan.goal_type_cd,
        purpose_cd: loan.purpose_cd,
        loan_amount: loan.target_amount,
        interest_rate: 0, // API에서 제공하지 않음
        start_date: loan.start_date,
        end_date: loan.end_date,
        payment_cycle_cd: loan.deposit_cycle_cd,
        monthly_payment: loan.plan_amount,
        alarm_yn: loan.alarm_yn,
        alarm_day: loan.alarm_day,
        is_paused: loan.is_paused,
        is_completed: loan.is_completed,
        memo: loan.memo,
        use_yn: loan.use_yn,
        created_at: loan.created_at,
        updated_at: loan.updated_at,
        wlt_name: loan.wlt_name,
        loan_type_cd_nm: loan.goal_type_cd_nm,
        purpose_cd_nm: loan.purpose_cd_nm,
        payment_cycle_cd_nm: loan.deposit_cycle_cd_nm,
        current_balance: loan.target_amount - (loan.current_amount || 0),
      }));
      
      setLoans(loansData);
    } catch (error) {
      console.error('대출 조회 오류:', error);
      setError('대출 조회 중 오류가 발생했습니다.');
    }
  };

  // 대출 상환내역 조회 (현재는 저축 납입내역 API 사용)
  const fetchPayments = async () => {
    if (!userId) return;

    try {
      // 현재 대출 상환내역 전용 API가 없으므로 저축 납입내역 API를 사용
      // 추후 대출 상환내역 전용 API가 생성되면 변경 예정
      const response = await get('/savings-contributions', {
        params: { usr_id: userId }
      });
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('상환내역 조회 오류:', error);
      // 상환내역 조회 실패는 전체 기능에 영향을 주지 않도록 에러를 설정하지 않음
    }
  };

  // 대출 추가 성공 시 데이터 다시 불러오기
  const handleLoanSuccess = () => {
    fetchLoans();
    fetchPayments();
  };

  // 데이터 로드
  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([fetchLoans(), fetchPayments()])
        .finally(() => setLoading(false));
    }
  }, [userId]);

  // 대출별 현재 잔액 계산
  const calculateCurrentBalances = () => {
    const loanPayments = payments.reduce((acc, payment) => {
      if (!acc[payment.loan_id]) {
        acc[payment.loan_id] = 0;
      }
      acc[payment.loan_id] += Number(payment.amount);
      return acc;
    }, {} as Record<string, number>);

    return loans.map(loan => ({
      ...loan,
      current_balance: Number(loan.loan_amount) - (loanPayments[loan.loan_id] || 0),
      progress_percentage: Math.min(
        ((loanPayments[loan.loan_id] || 0) / Number(loan.loan_amount)) * 100,
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

  // 상환률에 따른 색상 반환
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // 완료 - 초록
    if (percentage >= 75) return '#3b82f6'; // 75% 이상 - 파랑
    if (percentage >= 50) return '#f59e0b'; // 50% 이상 - 주황
    return '#ef4444'; // 50% 미만 - 빨강
  };

  // 목표 상환을 위한 월별 필요 상환액 계산
  const calculateMonthlyRequirement = (loan: Loan & { current_balance?: number }) => {
    if (!loan.end_date) {
      return null;
    }

    const today = new Date();
    const endDate = new Date(loan.end_date);
    const remainingAmount = loan.current_balance || Number(loan.loan_amount);
    
    // 이미 상환이 완료된 경우
    if (remainingAmount <= 0) {
      return {
        isCompleted: true,
        remainingAmount: 0,
        monthsRemaining: 0,
        monthlyRequirement: 0
      };
    }

    // 남은 개월 수 계산
    const monthsRemaining = (endDate.getFullYear() - today.getFullYear()) * 12 + 
                           (endDate.getMonth() - today.getMonth()) + 1;

    // 목표일이 이미 지났거나 이번 달까지인 경우
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

  const loansWithProgress = calculateCurrentBalances();

  return (
    <>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingMessage}>
          대출 데이터를 불러오는 중...
        </div>
      ) : loansWithProgress.length === 0 ? (
        <div className={styles.emptyMessage}>
          <div className={styles.emptyIcon}>🏦</div>
          <h3>대출이 없습니다</h3>
          <p>등록된 대출이 없습니다.</p>
          <button className={styles.buttonPrimary} onClick={() => setIsLoanModalOpen(true)}>대출 추가</button>
        </div>
      ) : (
        <>
          {/* 전체 현황 요약 */}
          <section className={styles.summarySection}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>🏦</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>총 대출 금액</div>
                  <div className={styles.summaryValue}>
                    {formatKRW(loansWithProgress.reduce((sum, loan) => sum + Number(loan.loan_amount), 0))}원
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>💰</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>현재 잔액</div>
                  <div className={styles.summaryValue}>
                    {formatKRW(loansWithProgress.reduce((sum, loan) => sum + Number(loan.current_balance || 0), 0))}원
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>📈</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>전체 상환률</div>
                  <div className={styles.summaryValue}>
                    {(() => {
                      const totalLoan = loansWithProgress.reduce((sum, loan) => sum + Number(loan.loan_amount), 0);
                      const totalPaid = loansWithProgress.reduce((sum, loan) => sum + (Number(loan.loan_amount) - Number(loan.current_balance || 0)), 0);
                      return totalLoan > 0 ? Math.round((totalPaid / totalLoan) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>✅</div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryLabel}>완료된 대출</div>
                  <div className={styles.summaryValue}>
                    {loansWithProgress.filter(loan => loan.is_completed === 'Y' || (loan.progress_percentage || 0) >= 100).length}개
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 대출 목록 */}
          <section className={styles.goalsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>대출 목록</h2>
              <button className={styles.buttonPrimary} onClick={() => setIsLoanModalOpen(true)}>+ 대출 추가</button>
            </div>
            <div className={styles.goalsList}>
              {loansWithProgress.map((loan) => (
                <div key={loan.loan_id} className={styles.goalCard}>
                  <div className={styles.goalHeader}>
                    <div className={styles.goalInfo}>
                      <h3 className={styles.goalName}>{loan.loan_name}</h3>
                      <div className={styles.goalMeta}>
                        <span className={styles.goalType}>{loan.loan_type_cd_nm || loan.loan_type_cd}</span>
                        {loan.purpose_cd_nm && (
                          <span className={styles.goalPurpose}>{loan.purpose_cd_nm}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.goalStatus}>
                      {(loan.is_completed === 'Y' || (loan.progress_percentage || 0) >= 100) && (
                        <span className={styles.completedBadge}>완료</span>
                      )}
                      {loan.is_paused === 'Y' && (
                        <span className={styles.pausedBadge}>일시중지</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.goalProgress}>
                    <div className={styles.progressHeader}>
                      <div className={styles.progressAmounts}>
                        <span className={styles.currentAmount}>
                          {formatKRW(loan.current_balance || 0)}원
                        </span>
                        <span className={styles.targetAmount}>
                          / {formatKRW(loan.loan_amount)}원
                        </span>
                      </div>
                      <div className={styles.progressPercentage}>
                        {Math.round(loan.progress_percentage || 0)}%
                      </div>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{
                          width: `${loan.progress_percentage || 0}%`,
                          backgroundColor: getProgressColor(loan.progress_percentage || 0)
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.goalDetails}>
                    <div className={styles.goalDetail}>
                      <span className={styles.detailLabel}>시작일:</span>
                      <span className={styles.detailValue}>{formatDate(loan.start_date)}</span>
                    </div>
                    {loan.end_date && (
                      <div className={styles.goalDetail}>
                        <span className={styles.detailLabel}>만료일:</span>
                        <span className={styles.detailValue}>{formatDate(loan.end_date)}</span>
                      </div>
                    )}
                    <div className={styles.goalDetail}>
                      <span className={styles.detailLabel}>금리:</span>
                      <span className={styles.detailValue}>{loan.interest_rate}%</span>
                    </div>
                    {loan.payment_cycle_cd_nm && (
                      <div className={styles.goalDetail}>
                        <span className={styles.detailLabel}>상환주기:</span>
                        <span className={styles.detailValue}>{loan.payment_cycle_cd_nm}</span>
                      </div>
                    )}
                    {loan.monthly_payment && (
                      <div className={styles.goalDetail}>
                        <span className={styles.detailLabel}>월 상환액:</span>
                        <span className={styles.detailValue}>{formatKRW(loan.monthly_payment)}원</span>
                      </div>
                    )}
                    {loan.wlt_name && (
                      <div className={styles.goalDetail}>
                        <span className={styles.detailLabel}>연결지갑:</span>
                        <span className={styles.detailValue}>{loan.wlt_name}</span>
                      </div>
                    )}
                  </div>

                  {/* 월별 필요 상환액 계산 영역 */}
                  {(() => {
                    const monthlyReq = calculateMonthlyRequirement(loan);
                    if (!monthlyReq) return null;

                    return (
                        <div className={styles.monthlyRequirement}>
                          {monthlyReq.isCompleted ? (
                              <div className={styles.completedMessage}>
                                <span className={styles.completedIcon}>🎉</span>
                                <span className={styles.completedText}>상환 완료!</span>
                              </div>
                          ) : monthlyReq.isOverdue ? (
                              <div className={styles.overdueMessage}>
                                <span className={styles.overdueIcon}>⚠️</span>
                                <div className={styles.overdueContent}>
                                  <span className={styles.overdueText}>만료일이 지났습니다</span>
                                  <span className={styles.overdueAmount}>
                                남은 금액: {formatKRW(monthlyReq.remainingAmount)}원
                              </span>
                                </div>
                              </div>
                          ) : (
                              <div className={styles.requirementInfo}>
                                <div className={styles.requirementHeader}>
                                  <span className={styles.requirementTitle}>상환 계획</span>
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
                                    <span className={styles.requirementLabel}>월별 필요 상환 금액:</span>
                                    <span className={`${styles.requirementValue} ${styles.monthlyAmount}`}>
                                  {formatKRW(monthlyReq.monthlyRequirement)}원/월
                                </span>
                                  </div>
                                </div>
                              </div>
                          )}
                        </div>
                    );
                  })()}

                  {loan.memo && (
                    <div className={styles.goalMemo}>
                      <span className={styles.memoLabel}>메모:</span>
                      <span className={styles.memoValue}>{loan.memo}</span>
                    </div>
                  )}

                  <div className={styles.goalActions}>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => {/* 상환 모달 */}}
                    >
                      상환하기
                    </button>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => {/* 상환목록 모달 */}}
                    >
                      상환목록
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

      {/* 대출 추가 모달 */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSuccess={handleLoanSuccess}
        userId={userId}
      />
    </>
  );
}
