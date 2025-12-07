'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/axios';
import styles from '@/styles/css/transactions.module.css';

// 거래 유형
type TrxType = 'INCOME' | 'EXPENSE';

// 지갑 타입
interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 거래 입력 필드
  const [formData, setFormData] = useState({
    wlt_id: '',
    trx_type: 'EXPENSE' as TrxType,
    trx_date: new Date().toISOString().split('T')[0],
    amount: '',
    category_cd: '',
    memo: '',
    is_fixed: 'N',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 지갑 목록 조회
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchWallets();
    }
  }, [status, session]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Wallet[]>('/wallets', {
        params: {
          usr_id: session?.user?.id,
          use_yn: 'Y',
        },
      });
      setWallets(response.data || []);
      
      // 첫 번째 지갑을 기본값으로 설정
      if (response.data && response.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          wlt_id: response.data[0].wlt_id,
        }));
      }
    } catch (err: any) {
      console.error('지갑 목록 조회 오류:', err);
      setError('지갑 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!session?.user?.id) {
        setError('로그인이 필요합니다.');
        return;
      }

      // 유효성 검증
      if (!formData.wlt_id || !formData.trx_date || !formData.amount || !formData.category_cd) {
        setError('필수 항목을 모두 입력해주세요.');
        return;
      }

      await apiClient.post('/transactions', {
        ...formData,
        usr_id: session.user.id,
        amount: parseFloat(formData.amount),
      });

      // 성공 후 폼 초기화
      setFormData({
        wlt_id: wallets.length > 0 ? wallets[0].wlt_id : '',
        trx_type: 'EXPENSE',
        trx_date: new Date().toISOString().split('T')[0],
        amount: '',
        category_cd: '',
        memo: '',
        is_fixed: 'N',
      });

      alert('거래가 등록되었습니다.');
    } catch (err: any) {
      console.error('거래 등록 오류:', err);
      setError(err.response?.data?.message || '거래 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.title}>거래 등록</h1>
          <button
            onClick={() => router.push('/transactions/list')}
            style={{
              padding: '0.5rem 1rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            조회 화면
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          {/* 거래 유형 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>거래 유형</div>
            <div className={styles.inputCell}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="trx_type"
                  value="EXPENSE"
                  checked={formData.trx_type === 'EXPENSE'}
                  onChange={(e) => handleChange('trx_type', e.target.value)}
                />
                <span>지출</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="trx_type"
                  value="INCOME"
                  checked={formData.trx_type === 'INCOME'}
                  onChange={(e) => handleChange('trx_type', e.target.value)}
                />
                <span>수입</span>
              </label>
            </div>
          </div>

          {/* 날짜 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>거래 일자</div>
            <div className={styles.inputCell}>
              <input
                type="date"
                value={formData.trx_date}
                onChange={(e) => handleChange('trx_date', e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* 지갑 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>지갑</div>
            <div className={styles.inputCell}>
              <select
                value={formData.wlt_id}
                onChange={(e) => handleChange('wlt_id', e.target.value)}
                className={styles.select}
                required
              >
                <option value="">선택하세요</option>
                {wallets.map((wallet) => (
                  <option key={wallet.wlt_id} value={wallet.wlt_id}>
                    {wallet.wlt_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 금액 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>금액</div>
            <div className={styles.inputCell}>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className={styles.input}
                placeholder="0"
                min="0"
                step="1"
                required
              />
            </div>
          </div>

          {/* 카테고리 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>카테고리</div>
            <div className={styles.inputCell}>
              <input
                type="text"
                value={formData.category_cd}
                onChange={(e) => handleChange('category_cd', e.target.value)}
                className={styles.input}
                placeholder="카테고리 코드 (예: FOOD)"
                required
              />
            </div>
          </div>

          {/* 메모 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>메모</div>
            <div className={styles.inputCell}>
              <input
                type="text"
                value={formData.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
                className={styles.input}
                placeholder="메모 (선택사항)"
              />
            </div>
          </div>

          {/* 고정 지출 */}
          <div className={styles.row}>
            <div className={styles.labelCell}>고정 지출</div>
            <div className={styles.inputCell}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_fixed === 'Y'}
                  onChange={(e) => handleChange('is_fixed', e.target.checked ? 'Y' : 'N')}
                />
                <span>고정 지출로 등록</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

