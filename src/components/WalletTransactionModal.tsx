'use client';

import { useState, useEffect } from 'react';
import { Wallet } from '@/lib/api/wallets';
import { getExpenses, updateExpense, deleteExpense, Transaction, ExpenseUpdateRequest } from '@/lib/api/expenses';
import { getCategories, getCommonCodes, CommonCode } from '@/lib/api/commonCodes';
import styles from '../styles/css/WalletTransactionModal.module.css';
import { getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/date-utils';

interface WalletTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  userId: string;
}

export default function WalletTransactionModal({ 
  isOpen, 
  onClose, 
  wallet, 
  userId 
}: WalletTransactionModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    category_cd: '',
    memo: '',
    trx_date: ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CommonCode[]>([]);

  // KRW 포맷 함수 (3자리 콤마 + '원')
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value) + '원';
  };

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [expenseCats, incomeCats] = await Promise.all([
          getCategories(),
          getCommonCodes('INCOME')
        ]);
        setCategories(expenseCats);
        setIncomeCategories(incomeCats);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // 당월 기본값 설정 (1일부터 말일까지 고정)
  useEffect(() => {
    if (isOpen) {
       setStartDate(getFirstDayOfMonth());
      setEndDate(getLastDayOfMonth());
      setSelectedType('ALL');
      setTransactions([]);
      setError(null);
      setEditingTransaction(null);
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  // 거래 내역 조회
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isOpen || !wallet || !userId || !startDate || !endDate) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const queryParams: any = {
          usr_id: userId,
          wlt_id: wallet.wlt_id,
          start_date: startDate,
          end_date: endDate
        };
        
        if (selectedType !== 'ALL') {
          queryParams.trx_type = selectedType;
        }
        
        const data = await getExpenses(queryParams);
        setTransactions(data);
      } catch (err) {
        console.error('거래 내역 조회 실패:', err);
        setError('거래 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isOpen, wallet, userId, startDate, endDate, selectedType]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('수정 중인 내용이 있습니다. 정말 닫으시겠습니까?')) {
        setEditingTransaction(null);
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const formatAmount = (amount: number, type: string) => {
    // const formatted = amount.toLocaleString();
    const formatted = formatKRW(amount);
    return type === 'INCOME' ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getTotalAmount = () => {
    return transactions.reduce((total, transaction) => {
      const amount = Number(transaction.amount);
      return transaction.trx_type === 'INCOME' 
        ? total + amount 
        : total - amount;
    }, 0);
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'INCOME' ? '#10B981' : '#EF4444';
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'CASH':
        return '현금';
      case 'BANK':
        return '은행';
      case 'CARD':
        return '카드';
      case 'INVESTMENT':
        return '투자';
      default:
        return type;
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction.trx_id);
    setEditForm({
      amount: transaction.amount.toString(),
      category_cd: transaction.category_cd,
      memo: transaction.memo || '',
      trx_date: transaction.trx_date
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async (transactionId: string) => {
    if (!confirm('수정사항을 저장하시겠습니까?')) return;
    
    try {
      // 금액에서 쉼표 제거하여 숫자로 변환
      const amount = Number(editForm.amount.replace(/,/g, ''));
      
      // API 호출을 위한 데이터 준비
      const updateData: ExpenseUpdateRequest = {
        trx_date: editForm.trx_date,
        amount: amount,
        category_cd: editForm.category_cd,
        wlt_id: wallet!.wlt_id,
        memo: editForm.memo || undefined
      };
      
      // API 호출로 거래 수정
      await updateExpense(transactionId, updateData);
      
      // 성공 시 로컬 상태 업데이트
      setTransactions(prev => 
        prev.map(t => 
          t.trx_id === transactionId 
            ? { 
                ...t, 
                amount: amount,
                memo: editForm.memo,
                trx_date: editForm.trx_date,
                category_cd: editForm.category_cd
              }
            : t
        )
      );
      
      setEditingTransaction(null);
      setHasUnsavedChanges(false);
      alert('수정이 완료되었습니다.');
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    // if (confirm('수정을 취소하시겠습니까?')) {
      setEditingTransaction(null);
      setHasUnsavedChanges(false);
    // }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('정말로 이 거래를 삭제하시겠습니까?')) return;
    
    try {
      // API 호출로 거래 삭제
      await deleteExpense(transactionId);
      
      // 성공 시 로컬 상태에서 제거
      setTransactions(prev => prev.filter(t => t.trx_id !== transactionId));
      alert('삭제가 완료되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 금액 포맷팅 함수 (천 단위 쉼표 추가)
  const formatAmountInput = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    // 빈 문자열이면 그대로 반환
    if (!numbers) return '';
    // 천 단위 쉼표 추가
    return new Intl.NumberFormat('ko-KR').format(Number(numbers));
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  if (!isOpen || !wallet) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>{wallet.wlt_name}</h2>
            <div className={styles.walletInfo}>
              <span className={styles.walletType}>{getWalletTypeLabel(wallet.wlt_type)}</span>
              {wallet.is_default === 'Y' && (
                <span className={styles.defaultBadge}>기본</span>
              )}
              {wallet.share_yn === 'Y' && (
                  <span className={styles.shareBadge}>공유</span>
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 필터 영역 */}
          <div className={styles.filterSection}>
            <div className={styles.dateFilter}>
              <div className={styles.dateInputGroup}>
                <label>시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label>종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
            
            <div className={styles.typeFilter}>
              <button
                className={`${styles.typeButton} ${selectedType === 'ALL' ? styles.active : ''}`}
                onClick={() => setSelectedType('ALL')}
              >
                전체
              </button>
              <button
                className={`${styles.typeButton} ${selectedType === 'INCOME' ? styles.active : ''}`}
                onClick={() => setSelectedType('INCOME')}
              >
                수입
              </button>
              <button
                className={`${styles.typeButton} ${selectedType === 'EXPENSE' ? styles.active : ''}`}
                onClick={() => setSelectedType('EXPENSE')}
              >
                지출
              </button>
            </div>
          </div>

          {/* 요약 정보 */}
          {transactions.length > 0 && (
            <div className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>총 거래 건수</span>
                <span className={styles.summaryValue}>{transactions.length}건</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>총 금액</span>
                <span 
                  className={styles.summaryValue}
                  style={{ color: getTotalAmount() >= 0 ? '#10B981' : '#EF4444' }}
                >
                  {getTotalAmount().toLocaleString()}원
                </span>
              </div>
            </div>
          )}

          {/* 거래 내역 */}
          <div className={styles.transactionSection}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>거래 내역을 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className={styles.error}>
                <p>{error}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  다시 시도
                </button>
              </div>
            ) : transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>선택한 기간에 거래 내역이 없습니다.</p>
              </div>
            ) : (
              <div className={styles.transactionList}>
                {transactions.map((transaction) => (
                  <div key={transaction.trx_id} className={styles.transactionItem}>
                    <div className={styles.transactionMain}>
                      {editingTransaction === transaction.trx_id ? (
                        // 수정 모드 - 전체 영역 사용
                        <div className={styles.editModeContainer}>
                          <div className={styles.editForm}>
                            <div className={styles.editRow}>
                              <label>카테고리</label>
                              <select
                                value={editForm.category_cd}
                                onChange={(e) => handleInputChange('category_cd', e.target.value)}
                                className={styles.editSelect}
                              >
                                <option value="">카테고리 선택</option>
                                {transactions.find(t => t.trx_id === editingTransaction)?.trx_type === 'INCOME'
                                  ? incomeCategories.map((category) => (
                                      <option key={category.cd} value={category.cd}>
                                        {category.cd_nm}
                                      </option>
                                    ))
                                  : categories.map((category) => (
                                      <option key={category.cd} value={category.cd}>
                                        {category.cd_nm}
                                      </option>
                                    ))
                                }
                              </select>
                            </div>
                            <div className={styles.editRow}>
                              <label>메모</label>
                              <input
                                type="text"
                                value={editForm.memo}
                                onChange={(e) => handleInputChange('memo', e.target.value)}
                                className={styles.editInput}
                                placeholder="메모"
                              />
                            </div>
                            <div className={styles.editRow}>
                              <label>날짜</label>
                              <input
                                type="date"
                                value={editForm.trx_date}
                                onChange={(e) => handleInputChange('trx_date', e.target.value)}
                                className={styles.editInput}
                              />
                            </div>
                            <div className={styles.editRow}>
                              <label>금액</label>
                              <input
                                type="text"
                                value={formatAmountInput(editForm.amount)}
                                placeholder="0"
                                onChange={(e) => {
                                  const formattedValue = formatAmountInput(e.target.value);
                                  handleInputChange('amount', formattedValue);
                                }}
                                className={styles.editInput}
                              />
                            </div>
                          </div>
                          <div className={styles.editActionButtons}>
                            <button 
                              className={styles.saveButton}
                              onClick={() => handleSave(transaction.trx_id)}
                            >
                              저장
                            </button>
                            <button 
                              className={styles.cancelButton}
                              onClick={handleCancel}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 일반 보기 모드
                        <>
                          <div className={`${styles.transactionInfo} ${wallet.share_yn === 'Y' ? styles.noActions : ''}`}>
                            <div className={styles.categoryInfo}>
                              <span className={styles.categoryName}>{transaction.category_name}</span>
                              {transaction.is_installment === 'Y' && (
                                <span className={styles.installmentBadge}>
                                  할부 {transaction.installment_info}
                                </span>
                              )}
                            </div>
                            <div className={styles.memoInfo}>
                              <span className={styles.transactionMemo}>
                                {transaction.memo || '-'}
                              </span>
                            </div>
                            <div className={styles.dateInfo}>
                              <span className={styles.transactionDate}>
                                {formatDate(transaction.trx_date)}
                              </span>
                            </div>
                            <div className={styles.amountInfo}>
                              <span 
                                className={styles.transactionAmount}
                                style={{ color: getTransactionTypeColor(transaction.trx_type) }}
                              >
                                {formatAmount(transaction.amount, transaction.trx_type)}
                              </span>
                            </div>
                          </div>
                          {wallet.share_yn !== 'Y' && (
                            <div className={styles.actionButtons}>
                              <button 
                                className={styles.editButton}
                                onClick={() => handleEdit(transaction)}
                                disabled={editingTransaction !== null}
                              >
                                수정
                              </button>
                              <button 
                                className={styles.deleteButton}
                                onClick={() => handleDelete(transaction.trx_id)}
                                disabled={editingTransaction !== null}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
