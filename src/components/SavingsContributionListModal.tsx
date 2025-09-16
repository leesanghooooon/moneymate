'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../styles/css/SavingsContributionListModal.module.css';
import { get } from '@/lib/api/common';


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

interface SavingsGoal {
  sav_goal_id: string;
  goal_name: string;
  target_amount: number;
  current_amount?: number;
}

interface SavingsContributionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsGoal: SavingsGoal;
}

export default function SavingsContributionListModal({ 
  isOpen, 
  onClose, 
  savingsGoal 
}: SavingsContributionListModalProps) {
  const { data: session, status } = useSession();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false); // API 호출 중복 방지를 위한 ref

  // 금액을 한국 원화 형식으로 포맷하는 함수
  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
  };

  // 납입내역 조회
  const fetchContributions = async () => {
    if (!savingsGoal?.sav_goal_id || !session?.user?.id || status !== 'authenticated') return;
    
    // 이미 API 호출 중이면 중단
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await get(`/savings-contributions?sav_goal_id=${savingsGoal.sav_goal_id}&usr_id=${session.user.id}`);
      
      if (response.status === 200) {
        const responseData = response.data.data || [];
        setContributions(Array.isArray(responseData) ? responseData : []);
      } else {
        throw new Error(response.data?.message || '납입내역 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('납입내역 조회 오류:', error);
      setError(error.message || '납입내역 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // 모달이 열릴 때 데이터 조회
  useEffect(() => {
    if (isOpen && savingsGoal?.sav_goal_id) {
      fetchContributions();
    } else if (!isOpen) {
      // 모달이 닫힐 때 상태 초기화
      setContributions([]);
      setError(null);
      fetchingRef.current = false;
    }
  }, [isOpen, savingsGoal?.sav_goal_id]);

  // 총 납입 금액 계산
  const totalContributed = Array.isArray(contributions) 
    ? contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0)
    : 0;

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {savingsGoal.goal_name} - 납입내역
          </h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        {/* 요약 정보 */}
        <div className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>목표 금액</span>
              <span className={styles.summaryValue}>
                {formatKRW(savingsGoal.target_amount)}원
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>현재 저축액</span>
              <span className={styles.summaryValue}>
                {formatKRW(savingsGoal.current_amount || 0)}원
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>납입 횟수</span>
              <span className={styles.summaryValue}>
                {Array.isArray(contributions) ? contributions.length : 0}회
              </span>
            </div>
          </div>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loadingMessage}>
              납입내역을 불러오는 중...
            </div>
          ) : !Array.isArray(contributions) || contributions.length === 0 ? (
            <div className={styles.emptyMessage}>
              <div className={styles.emptyIcon}>💰</div>
              <h3>납입내역이 없습니다</h3>
              <p>아직 납입한 기록이 없습니다.</p>
            </div>
          ) : (
            <div className={styles.contributionList}>
              <div className={styles.listHeader}>
                <h3>납입내역 ({contributions.length}건)</h3>
              </div>
              
              {contributions.map((contribution) => (
                <div key={contribution.contrib_id} className={styles.contributionItem}>
                  <div className={styles.contributionLeft}>
                    <div className={styles.contributionDate}>
                      {formatDate(contribution.contrib_date)}
                    </div>
                    {contribution.memo && (
                      <div className={styles.contributionMemo}>
                        {contribution.memo}
                      </div>
                    )}
                  </div>
                  <div className={styles.contributionRight}>
                    <div className={styles.contributionAmount}>
                      +{formatKRW(contribution.amount)}원
                    </div>
                    <div className={styles.contributionTime}>
                      {new Date(contribution.created_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.buttonPrimary}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
} 