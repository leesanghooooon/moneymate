'use client';

import { useState } from 'react';
import styles from '../styles/css/SavingsContributionModal.module.css';
import { post } from '@/lib/api/common';

interface SavingsContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savingsGoal: {
    sav_goal_id: string;
    goal_name: string;
    target_amount: number;
    current_amount?: number;
    progress_percentage?: number;
    deposit_cycle_cd?: string | null;
    plan_amount?: number | null;
  };
}

export default function SavingsContributionModal({
  isOpen,
  onClose,
  onSuccess,
  savingsGoal
}: SavingsContributionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    contrib_date: new Date().toISOString().split('T')[0],
    amount: savingsGoal.plan_amount?.toString().replace(',','') || '',
    memo: ''
  });

  // KRW 포맷 함수 (3자리 콤마 + '원')
  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 금액 입력 시 콤마 처리를 위한 표시용 상태
  const [displayAmount, setDisplayAmount] = useState(
    savingsGoal.plan_amount ? formatKRW(savingsGoal.plan_amount) : ''
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // 납입일자 검증
    if (!formData.contrib_date) {
      errors.contrib_date = '납입일자를 선택해주세요.';
    }

    // 납입금액 검증 (decimal(14,2))
    const cleanAmount = formData.amount.replace(/,/g, '');
    const integerAmount = Math.floor(Number(cleanAmount));
    if (!cleanAmount || integerAmount <= 0) {
      errors.amount = '유효한 납입금액을 입력해주세요.';
    } else if (integerAmount > 99999999999999) {
      errors.amount = '납입금액이 너무 큽니다. (최대 99,999,999,999,999)';
    }

    // 메모 검증 (varchar(255))
    if (formData.memo && formData.memo.length > 255) {
      errors.memo = '메모는 255자를 초과할 수 없습니다.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // API 호출 전 금액에서 콤마 제거 및 정수로 변환
      const cleanAmount = formData.amount.replace(/,/g, '');
      const integerAmount = Math.floor(Number(cleanAmount));
      
      const response = await post('/savings-contributions', {
        sav_goal_id: savingsGoal.sav_goal_id,
        contrib_date: formData.contrib_date,
        amount: integerAmount,
        memo: formData.memo || null
      });

      if (response.status == 200) {
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.data?.message || '납입 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('납입 처리 오류:', error);
      setError('납입 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // 숫자가 아닌 문자 제거
      const numericValue = value.replace(/[^\d]/g, '');
      
      // 숫자를 정수로 변환
      const numberValue = parseInt(numericValue, 10);
      
      if (!isNaN(numberValue)) {
        // 실제 데이터는 숫자로 저장
        setFormData(prev => ({ ...prev, amount: numberValue.toString() }));
        // 표시용 데이터는 콤마가 포함된 형식으로 저장
        setDisplayAmount(formatKRW(numberValue));
      } else {
        setFormData(prev => ({ ...prev, amount: '' }));
        setDisplayAmount('');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClose = () => {
    const initialAmount = savingsGoal.plan_amount?.toString() || '';
    setFormData({
      contrib_date: new Date().toISOString().split('T')[0],
      amount: initialAmount,
      memo: ''
    });
    setDisplayAmount(initialAmount ? formatKRW(Number(initialAmount)) : '');
    setFieldErrors({});
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>저축 납입하기</h2>
          <button onClick={handleClose} className={styles.closeButton}>&times;</button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>저축목표 정보</h3>
            
            <div className={styles.goalInfo}>
              <div className={styles.goalName}>{savingsGoal.goal_name}</div>
              <div className={styles.goalProgress}>
                <div className={styles.progressText}>
                  <span>현재 저축액: {formatKRW(savingsGoal.current_amount || 0)}원</span>
                  <span>목표액: {formatKRW(savingsGoal.target_amount)}원</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${savingsGoal.progress_percentage || 0}%` }}
                  />
                </div>
                <div className={styles.progressPercentage}>
                  {Math.round(savingsGoal.progress_percentage || 0)}%
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>납입 정보</h3>

            <div className={styles.formGroup}>
              <label htmlFor="contrib_date" className={`${styles.label} ${styles.required}`}>납입일자</label>
              <input
                type="date"
                id="contrib_date"
                name="contrib_date"
                value={formData.contrib_date}
                onChange={handleInputChange}
                className={`${styles.input} ${fieldErrors.contrib_date ? styles.error : ''}`}
              />
              {fieldErrors.contrib_date && (
                <div className={styles.fieldError}>{fieldErrors.contrib_date}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount" className={`${styles.label} ${styles.required}`}>납입금액</label>
                <input
                  type="text"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`${styles.input} ${fieldErrors.amount ? styles.error : ''}`}
                  placeholder="납입할 금액을 입력하세요"
                  inputMode="numeric"
                />
              {/*value={displayAmount}*/}
              {/*pattern="\d*"*/}
              {fieldErrors.amount && (
                <div className={styles.fieldError}>{fieldErrors.amount}</div>
              )}
              {savingsGoal.plan_amount && (
                <div className={styles.planAmount}>
                  계획 납입액: {formatKRW(savingsGoal.plan_amount)}원
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="memo" className={styles.label}>메모</label>
              <textarea
                id="memo"
                name="memo"
                value={formData.memo}
                onChange={handleInputChange}
                className={`${styles.textarea} ${fieldErrors.memo ? styles.error : ''}`}
                placeholder="납입과 관련된 메모를 입력하세요"
              />
              {fieldErrors.memo && (
                <div className={styles.fieldError}>{fieldErrors.memo}</div>
              )}
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
              {loading ? '처리 중...' : '납입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
