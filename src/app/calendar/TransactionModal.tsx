import { Transaction } from './types';
import styles from '../../styles/css/TransactionModal.module.css';

interface TransactionModalProps {
  date: string;
  transactions: Transaction[];
  onClose: () => void;
}

export default function TransactionModal({ date, transactions, onClose }: TransactionModalProps) {
  // 금액 포맷팅 함수
  const formatAmount = (amount: number, type: 'INCOME' | 'EXPENSE') => {
    const formatted = new Intl.NumberFormat('ko-KR').format(Math.abs(amount));
    return type === 'INCOME' ? `+${formatted}원` : `-${formatted}원`;
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 시간 포맷팅
  const formatTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 수입/지출 합계 계산
  const totals = transactions.reduce(
    (acc, trx) => {
      if (trx.trx_type === 'INCOME') {
        acc.income += trx.amount;
      } else {
        acc.expense += trx.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{formatDate(date)} 거래 내역</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>수입</span>
            <span className={`${styles.summaryAmount} ${styles.income}`}>
              {formatAmount(totals.income, 'INCOME')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>지출</span>
            <span className={`${styles.summaryAmount} ${styles.expense}`}>
              {formatAmount(totals.expense, 'EXPENSE')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>합계</span>
            <span className={`${styles.summaryAmount} ${totals.income - totals.expense >= 0 ? styles.income : styles.expense}`}>
              {formatAmount(Math.abs(totals.income - totals.expense), totals.income - totals.expense >= 0 ? 'INCOME' : 'EXPENSE')}
            </span>
          </div>
        </div>

        <div className={styles.transactionList}>
          {transactions
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((trx) => (
              <div 
                key={trx.trx_id} 
                className={`${styles.transactionItem} ${trx.trx_type === 'INCOME' ? styles.income : styles.expense}`}
              >
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionTime}>
                    {formatTime(trx.created_at)}
                  </span>
                  <span className={styles.transactionAmount}>
                    {formatAmount(trx.amount, trx.trx_type)}
                  </span>
                </div>
                <div className={styles.transactionDetails}>
                  <span className={styles.transactionCategory}>
                    {trx.category_cd}
                  </span>
                  {trx.memo && (
                    <span className={styles.transactionMemo}>
                      {trx.memo}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
