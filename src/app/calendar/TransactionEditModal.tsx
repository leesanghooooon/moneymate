'use client';

import { useState, useEffect } from 'react';
import { Transaction } from './types';
import { getCategories, getIncome, getWallets, CommonCode, Wallet } from '@/lib/api/commonCodes';
import { put } from '@/lib/api/common';
import styles from '../../styles/css/TransactionEditModal.module.css';

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSuccess: () => void;
  userId: string;
}

export default function TransactionEditModal({ 
  isOpen, 
  onClose, 
  transaction, 
  onSuccess,
  userId 
}: TransactionEditModalProps) {
  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    trx_date: '',
    amount: '',
    category_cd: '',
    memo: '',
    wlt_id: ''
  });

  // 금액 포맷팅 함수 (천 단위 쉼표 추가)
  const formatAmountInput = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('ko-KR').format(Number(numbers));
  };

  // 금액을 한국 원화 형식으로 포맷하는 함수
  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen && transaction && userId) {
      loadInitialData();
      setFormData({
        trx_date: transaction.trx_date.split(' ')[0],
        amount: formatAmountInput(transaction.amount.toString()),
        category_cd: transaction.category_cd,
        memo: transaction.memo || '',
        wlt_id: transaction.wlt_id
      });
    }
  }, [isOpen, transaction, userId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [categoryData, walletList] = await Promise.all([
        transaction?.trx_type === 'EXPENSE' ? getCategories() : getIncome(),
        getWallets(userId)
      ]);
      
      setCategories(categoryData);
      setWallets(walletList);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;

    const numericAmount = Number(formData.amount.replace(/,/g, ''));
    
    if (!formData.category_cd || !formData.amount || numericAmount <= 0) {
      alert('필수 정보를 모두 입력해주세요. 금액은 0보다 커야 합니다.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = {
        trx_date: formData.trx_date,
        amount: numericAmount,
        category_cd: formData.category_cd,
        memo: formData.memo || null,
        wlt_id: formData.wlt_id
      };

      await put(`/expenses/${transaction.trx_id}`, data);
      alert('거래가 수정되었습니다.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('거래 수정 오류:', error);
      setError(error.message || '거래 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      trx_date: '',
      amount: '',
      category_cd: '',
      memo: '',
      wlt_id: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>거래 수정</h2>
          <button onClick={handleClose} className={styles.closeButton}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* 거래 정보 표시 */}
          <div className={styles.transactionInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>거래 유형:</span>
              <span className={styles.infoValue}>
                {transaction.trx_type === 'INCOME' ? '수입' : '지출'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>금액:</span>
              <span className={styles.infoValue}>
                {formatKRW(transaction.amount)}원
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>거래 일자:</span>
              <span className={styles.infoValue}>
                {formatDate(transaction.trx_date)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>거래일</label>
              <input
                type="date"
                className={styles.input}
                value={formData.trx_date}
                onChange={(e) => setFormData(prev => ({ ...prev, trx_date: e.target.value }))}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>금액</label>
              <input
                type="text"
                className={styles.input}
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: formatAmountInput(e.target.value) 
                }))}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>카테고리</label>
              <select
                className={styles.select}
                value={formData.category_cd}
                onChange={(e) => setFormData(prev => ({ ...prev, category_cd: e.target.value }))}
                disabled={loading}
                required
              >
                <option value="" disabled>선택하세요</option>
                {categories.map((c) => (
                  <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>지갑</label>
              <select
                className={styles.select}
                value={formData.wlt_id}
                onChange={(e) => setFormData(prev => ({ ...prev, wlt_id: e.target.value }))}
                disabled={loading}
                required
              >
                <option value="" disabled>선택하세요</option>
                {wallets.map((w) => (
                  <option key={w.wlt_id} value={w.wlt_id}>{w.wlt_name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>메모</label>
              <input
                type="text"
                className={styles.input}
                placeholder="메모를 입력하세요"
                value={formData.memo}
                onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.buttonSecondary}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className={styles.buttonPrimary}
              >
                {saving ? '수정 중...' : '수정'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
