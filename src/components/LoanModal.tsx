'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/css/SavingsGoalModal.module.css'; // 동일한 스타일 사용
import { post } from '@/lib/api/common';
import { getWallets, getGoalType, getSavCycle, Wallet, CommonCode } from '@/lib/api/commonCodes';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function LoanModal({ isOpen, onClose, onSuccess, userId }: LoanModalProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [purposeCodes, setPurposeCodes] = useState<CommonCode[]>([]);
  const [paymentCycles, setPaymentCycles] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 금액 포맷팅 함수 (천 단위 쉼표 추가)
  const formatAmountInput = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    // 빈 문자열이면 그대로 반환
    if (!numbers) return '';
    // 천 단위 쉼표 추가
    return new Intl.NumberFormat('ko-KR').format(Number(numbers));
  };

  // 월 상환액 자동 계산 함수
  const calculateMonthlyPayment = () => {
    if (!formData.loan_amount || !formData.start_date || !formData.end_date || !formData.payment_cycle_cd) {
      return 0;
    }

    const loanAmount = Number(formData.loan_amount.replace(/,/g, ''));
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (loanAmount <= 0 || startDate >= endDate) {
      return 0;
    }

    let periodsCount = 0;
    
    // 상환 주기에 따른 기간 수 계산
    switch (formData.payment_cycle_cd) {
      case 'DAILY':
        periodsCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'WEEKLY':
        periodsCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        break;
      case 'MONTHLY':
        periodsCount = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth()) + 1;
        break;
      case 'QUARTERLY':
        periodsCount = Math.ceil(((endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                 (endDate.getMonth() - startDate.getMonth()) + 1) / 3);
        break;
      case 'YEARLY':
        periodsCount = endDate.getFullYear() - startDate.getFullYear() + 1;
        break;
      default:
        return 0;
    }

    if (periodsCount <= 0) return 0;
    
    return Math.ceil(loanAmount / periodsCount);
  };

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    goal_name: '',
    purpose_cd: '',
    wlt_id: '',
    target_amount: '', // 대출 원금
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    deposit_cycle_cd: '', // 상환 주기
    plan_amount: '', // 월 상환액
    alarm_yn: 'N',
    alarm_day: '',
    memo: ''
  });

  // 공통 코드 및 지갑 정보 로드
  useEffect(() => {
    if (isOpen && userId) {
      loadInitialData();
    }
  }, [isOpen, userId]);

  const loadInitialData = async () => {
    try {
      const [walletList, purposeList, cycleList] = await Promise.all([
        getWallets(userId),
        getGoalType(), // 대출 목적으로 사용
        getSavCycle() // 상환 주기로 사용
      ]);

      setWallets(walletList);
      setPurposeCodes(purposeList);
      setPaymentCycles(cycleList);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError('초기 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // 대출명 검증 (varchar(100))
    if (!formData.goal_name.trim()) {
      errors.goal_name = '대출명을 입력해주세요.';
    } else if (formData.goal_name.length > 100) {
      errors.goal_name = '대출명은 100자를 초과할 수 없습니다.';
    }

    // 대출 원금 검증 (decimal(14,2))
    if (!formData.target_amount || Number(formData.target_amount.replace(/,/g, '')) <= 0) {
      errors.target_amount = '유효한 대출 원금을 입력해주세요.';
    } else if (Number(formData.target_amount.replace(/,/g, '')) > 999999999999.99) {
      errors.target_amount = '대출 원금이 너무 큽니다. (최대 999,999,999,999.99)';
    }

    // 시작일 검증
    if (!formData.start_date) {
      errors.start_date = '대출 시작일을 선택해주세요.';
    }

    // 만료일 검증
    if (formData.end_date) {
      if (formData.end_date <= formData.start_date) {
        errors.end_date = '만료일은 시작일 이후여야 합니다.';
      }
    }

    // 상환 주기 검증 (varchar(20))
    if (formData.deposit_cycle_cd) {
      if (formData.deposit_cycle_cd.length > 20) {
        errors.deposit_cycle_cd = '상환 주기가 유효하지 않습니다.';
      }
      // 상환 주기가 선택된 경우 월 상환액 필수
      if (!formData.plan_amount) {
        errors.plan_amount = '상환 주기 선택 시 월 상환액을 입력해주세요.';
      }
    }

    // 월 상환액 검증 (decimal(14,2))
    if (formData.plan_amount) {
      const planAmountValue = Number(formData.plan_amount.replace(/,/g, ''));
      if (planAmountValue < 0) {
        errors.plan_amount = '유효한 월 상환액을 입력해주세요.';
      } else if (planAmountValue > 999999999999.99) {
        errors.plan_amount = '월 상환액이 너무 큽니다. (최대 999,999,999,999.99)';
      }
    }

    // 알림 설정 검증
    if (formData.alarm_yn === 'Y') {
      if (!formData.alarm_day || Number(formData.alarm_day) < 1 || Number(formData.alarm_day) > 31) {
        errors.alarm_day = '알림일은 1-31 사이의 숫자여야 합니다.';
      }
    }

    // 메모 검증 (varchar(255))
    if (formData.memo && formData.memo.length > 255) {
      errors.memo = '메모는 255자를 초과할 수 없습니다.';
    }

    setFieldErrors(errors);
    console.log(errors)
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!validateForm()) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await post('/loans', {
          ...formData,
          usr_id: userId,
          target_amount: Number(formData.target_amount.replace(/,/g, '')),
          plan_amount: formData.plan_amount ? Number(formData.plan_amount.replace(/,/g, '')) : null,
          alarm_day: formData.alarm_day ? Number(formData.alarm_day) : null
        })

      if (response.status == 200) {
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.data?.message || '대출 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('대출 등록 오류:', error);
      setError('대출 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFieldErrors({});
    setError(null);
    setFormData({
      goal_name: '',
      purpose_cd: '',
      wlt_id: '',
      target_amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      deposit_cycle_cd: '',
      plan_amount: '',
      alarm_yn: 'N',
      alarm_day: '',
      memo: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>새 대출 등록</h2>
          <button onClick={handleClose} className={styles.closeButton}>&times;</button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>기본 정보</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="goal_name" className={`${styles.label} ${styles.required}`}>대출명</label>
              <input
                type="text"
                id="goal_name"
                name="goal_name"
                value={formData.goal_name}
                onChange={handleInputChange}
                className={`${styles.input} ${fieldErrors.goal_name ? styles.error : ''}`}
                placeholder="예: 주택 담보 대출, 자동차 할부, 학자금 대출"
              />
              {fieldErrors.goal_name && (
                <div className={styles.fieldError}>{fieldErrors.goal_name}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="purpose_cd" className={styles.label}>대출 목적</label>
              <select
                id="purpose_cd"
                name="purpose_cd"
                value={formData.purpose_cd}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">선택하세요</option>
                {purposeCodes.map(purpose => (
                  <option key={purpose.cd} value={purpose.cd}>
                    {purpose.cd_nm}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="wlt_id" className={styles.label}>연결할 지갑</label>
              <select
                id="wlt_id"
                name="wlt_id"
                value={formData.wlt_id}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">선택하세요</option>
                {wallets.map(wallet => (
                  <option key={wallet.wlt_id} value={wallet.wlt_id}>
                    {wallet.wlt_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>대출 정보</h3>

            <div className={styles.formGroup}>
              <label htmlFor="target_amount" className={`${styles.label} ${styles.required}`}>대출 원금</label>
              <input
                type="text"
                id="target_amount"
                name="target_amount"
                value={formData.target_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, target_amount: formatAmountInput(e.target.value) }))}
                min="0"
                className={`${styles.input} ${fieldErrors.target_amount ? styles.error : ''}`}
                placeholder="대출 원금을 입력하세요"
              />
              {fieldErrors.target_amount && (
                <div className={styles.fieldError}>{fieldErrors.target_amount}</div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="start_date" className={`${styles.label} ${styles.required}`}>대출 시작일</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.start_date ? styles.error : ''}`}
                />
                {fieldErrors.start_date && (
                  <div className={styles.fieldError}>{fieldErrors.start_date}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="end_date" className={styles.label}>대출 만료일</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="deposit_cycle_cd" className={styles.label}>상환 주기</label>
                <select
                  id="deposit_cycle_cd"
                  name="deposit_cycle_cd"
                  value={formData.deposit_cycle_cd}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">선택하세요</option>
                  {paymentCycles.map(cycle => (
                    <option key={cycle.cd} value={cycle.cd}>
                      {cycle.cd_nm}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="plan_amount" className={styles.label}>월 상환액</label>
                {/* 자동 계산된 금액 표시 */}
                {(() => {
                  const calculatedAmount = calculateMonthlyPayment();
                  return calculatedAmount > 0 && (
                    <div className={styles.calculatedAmount}>
                      권장 금액: {formatAmountInput(calculatedAmount.toString())}원
                      <button
                        type="button"
                        className={styles.applyButton}
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          plan_amount: formatAmountInput(calculatedAmount.toString()) 
                        }))}
                      >
                        적용
                      </button>
                    </div>
                  );
                })()}
                <input
                  type="text"
                  id="plan_amount"
                  name="plan_amount"
                  value={formData.plan_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_amount: formatAmountInput(e.target.value) }))}
                  min="0"
                  className={styles.input}
                  placeholder="주기별 상환 계획 금액"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>알림 설정</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>알림 받기</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radio}>
                    <input
                      type="radio"
                      name="alarm_yn"
                      value="Y"
                      checked={formData.alarm_yn === 'Y'}
                      onChange={handleInputChange}
                    />
                    예
                  </label>
                  <label className={styles.radio}>
                    <input
                      type="radio"
                      name="alarm_yn"
                      value="N"
                      checked={formData.alarm_yn === 'N'}
                      onChange={handleInputChange}
                    />
                    아니오
                  </label>
                </div>
              </div>

              {formData.alarm_yn === 'Y' && (
                <div className={styles.formGroup}>
                  <label htmlFor="alarm_day" className={styles.label}>알림일</label>
                  <input
                    type="number"
                    id="alarm_day"
                    name="alarm_day"
                    value={formData.alarm_day}
                    onChange={handleInputChange}
                    min="1"
                    max="31"
                    className={styles.input}
                    placeholder="1-31"
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>추가 정보</h3>

            <div className={styles.formGroup}>
              <label htmlFor="memo" className={styles.label}>메모</label>
              <textarea
                id="memo"
                name="memo"
                value={formData.memo}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="추가로 기록하고 싶은 내용을 입력하세요"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.buttonSecondary}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.buttonPrimary}
            >
              {loading ? '등록 중...' : '대출 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
