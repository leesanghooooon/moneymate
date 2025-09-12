'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/css/SavingsGoalModal.module.css';
import { post } from '@/lib/api/common';
import { getWallets, getGoalType, getTrxType, getSavCycle, Wallet, CommonCode } from '@/lib/api/commonCodes';

// 인터페이스는 commonCodes.ts에서 import

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function SavingsGoalModal({ isOpen, onClose, onSuccess, userId }: SavingsGoalModalProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goalTypes, setGoalTypes] = useState<CommonCode[]>([]);
  const [purposeCodes, setPurposeCodes] = useState<CommonCode[]>([]);
  const [depositCycles, setDepositCycles] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    goal_name: '',
    goal_type_cd: 'SAVINGS',
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

  // 공통 코드 및 지갑 정보 로드
  useEffect(() => {
    if (isOpen && userId) {
      loadInitialData();
    }
  }, [isOpen, userId]);

  const loadInitialData = async () => {
    try {
      const [walletList, goalTypeList, purposeList, cycleList] = await Promise.all([
        getWallets(userId),
        getGoalType(),
        getTrxType(),
        getSavCycle()
      ]);

      setWallets(walletList);
      setGoalTypes(goalTypeList);
      // setPurposeCodes(purposeList);
      setPurposeCodes(goalTypeList);
      setDepositCycles(cycleList);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError('초기 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // 목표 이름 검증 (varchar(100))
    if (!formData.goal_name.trim()) {
      errors.goal_name = '목표 이름을 입력해주세요.';
    } else if (formData.goal_name.length > 100) {
      errors.goal_name = '목표 이름은 100자를 초과할 수 없습니다.';
    }

    // 목표 유형 검증 (varchar(50))
    if (!formData.goal_type_cd) {
      errors.goal_type_cd = '목표 유형을 선택해주세요.';
    }

    // 목적 코드 검증 (varchar(50))
    if (formData.purpose_cd && formData.purpose_cd.length > 50) {
      errors.purpose_cd = '목적 코드가 유효하지 않습니다.';
    }

    // 목표 금액 검증 (decimal(14,2))
    if (!formData.target_amount || Number(formData.target_amount) <= 0) {
      errors.target_amount = '유효한 목표 금액을 입력해주세요.';
    } else if (Number(formData.target_amount) > 999999999999.99) {
      errors.target_amount = '목표 금액이 너무 큽니다. (최대 999,999,999,999.99)';
    }

    // 시작일 검증
    if (!formData.start_date) {
      errors.start_date = '시작일을 선택해주세요.';
    }

    // 목표일 검증
    if (formData.end_date) {
      if (formData.end_date <= formData.start_date) {
        errors.end_date = '목표일은 시작일 이후여야 합니다.';
      }
    }

    // 납입 주기 검증 (varchar(20))
    if (formData.deposit_cycle_cd) {
      if (formData.deposit_cycle_cd.length > 20) {
        errors.deposit_cycle_cd = '납입 주기가 유효하지 않습니다.';
      }
      // 납입 주기가 선택된 경우 계획 금액 필수
      if (!formData.plan_amount) {
        errors.plan_amount = '납입 주기 선택 시 계획 금액을 입력해주세요.';
      }
    }

    // 계획 금액 검증 (decimal(14,2))
    if (formData.plan_amount) {
      if (Number(formData.plan_amount) <= 0) {
        errors.plan_amount = '유효한 계획 금액을 입력해주세요.';
      } else if (Number(formData.plan_amount) > 999999999999.99) {
        errors.plan_amount = '계획 금액이 너무 큽니다. (최대 999,999,999,999.99)';
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
      const response = await post('/savings-goals', {
          ...formData,
          usr_id: userId,
          target_amount: Number(formData.target_amount),
          plan_amount: formData.plan_amount ? Number(formData.plan_amount) : null,
          alarm_day: formData.alarm_day ? Number(formData.alarm_day) : null
        })

      if (response.status == 200) {
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.data?.message || '저축목표 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('저축목표 생성 오류:', error);
      setError('저축목표 생성 중 오류가 발생했습니다.');
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
      goal_type_cd: 'SAVINGS',
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
          <h2 className={styles.modalTitle}>새 저축목표 만들기</h2>
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
              <label htmlFor="goal_name" className={`${styles.label} ${styles.required}`}>목표 이름</label>
              <input
                type="text"
                id="goal_name"
                name="goal_name"
                value={formData.goal_name}
                onChange={handleInputChange}
                className={`${styles.input} ${fieldErrors.goal_name ? styles.error : ''}`}
                placeholder="예: 결혼자금, 주택청약, 여행자금"
              />
              {fieldErrors.goal_name && (
                <div className={styles.fieldError}>{fieldErrors.goal_name}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="goal_type_cd" className={`${styles.label} ${styles.required}`}>목표 유형</label>
                <select
                id="goal_type_cd"
                name="goal_type_cd"
                value="SAVINGS"
                disabled
                className={`${styles.select} ${styles.disabled}`}
              >
              {fieldErrors.goal_type_cd && (
                <div className={styles.fieldError}>{fieldErrors.goal_type_cd}</div>
              )}
                {goalTypes.map(type => (
                  <option key={type.cd} value={type.cd}>
                    {type.cd_nm}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="purpose_cd" className={styles.label}>저축 목적</label>
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
            <h3 className={styles.sectionTitle}>목표 설정</h3>

            <div className={styles.formGroup}>
              <label htmlFor="target_amount" className={`${styles.label} ${styles.required}`}>목표 금액</label>
              <input
                type="number"
                id="target_amount"
                name="target_amount"
                value={formData.target_amount}
                onChange={handleInputChange}
                min="0"
                className={`${styles.input} ${fieldErrors.target_amount ? styles.error : ''}`}
                placeholder="목표 금액을 입력하세요"
              />
              {fieldErrors.target_amount && (
                <div className={styles.fieldError}>{fieldErrors.target_amount}</div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="start_date" className={`${styles.label} ${styles.required}`}>시작일</label>
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
                <label htmlFor="end_date" className={styles.label}>목표일</label>
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
                <label htmlFor="deposit_cycle_cd" className={styles.label}>납입 주기</label>
                <select
                  id="deposit_cycle_cd"
                  name="deposit_cycle_cd"
                  value={formData.deposit_cycle_cd}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">선택하세요</option>
                  {depositCycles.map(cycle => (
                    <option key={cycle.cd} value={cycle.cd}>
                      {cycle.cd_nm}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="plan_amount" className={styles.label}>계획 금액</label>
                <input
                  type="number"
                  id="plan_amount"
                  name="plan_amount"
                  value={formData.plan_amount}
                  onChange={handleInputChange}
                  min="0"
                  className={styles.input}
                  placeholder="주기별 납입 계획 금액"
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
              {loading ? '생성 중...' : '저축목표 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
