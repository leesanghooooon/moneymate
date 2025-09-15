'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCategories, getPayMethods, getBanks, getCards, getWallets, getIncome, CommonCode, Wallet } from '../../lib/api/commonCodes';
import { post, ApiError } from '../../lib/api/common';
import styles from '../../styles/css/expenses.module.css';

type PaymentType = 'ONETIME' | 'INSTALLMENT' | 'SUBSCRIPTION';

const TRX_TYPES = [
  { code: 'EXPENSE', label: '지출' },
  { code: 'INCOME', label: '수입' }
];

const PAYMENT_TYPES: Record<PaymentType, { code: PaymentType; label: string }> = {
  ONETIME: { code: 'ONETIME', label: '일시불' },
  INSTALLMENT: { code: 'INSTALLMENT', label: '할부' },
  SUBSCRIPTION: { code: 'SUBSCRIPTION', label: '구독' }
};

interface BulkExpenseItem {
  id: string;
  trx_date: string;
  trx_type: string;
  amount: string;
  category_cd: string;
  memo: string;
  payment_type: PaymentType;
  installment_months: string;
  installment_seq: string;
  is_fixed: string;
}

interface BulkExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function BulkExpenseModal({ isOpen, onClose, onSuccess, userId }: BulkExpenseModalProps) {
  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [cards, setCards] = useState<CommonCode[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('');
  const [selectedTrxType, setSelectedTrxType] = useState<string>('EXPENSE');
  const [selectedWallet, setSelectedWallet] = useState<string>('');

  // 다건 등록 아이템들
  const [expenseItems, setExpenseItems] = useState<BulkExpenseItem[]>([
    {
      id: '1',
      trx_date: new Date().toISOString().slice(0, 10),
      trx_type: 'EXPENSE',
      amount: '',
      category_cd: '',
      memo: '',
      payment_type: 'ONETIME',
      installment_months: '',
      installment_seq: '',
      is_fixed: 'N'
    }
  ]);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오는 함수
  const getTodayDate = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = new Date();
    return today.toLocaleDateString('en-CA', { timeZone: tz });
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

  // 공통 코드 조회
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    setLoading(true);

    const loadCommonCodes = async () => {
      try {
        const [cats, pays, bks, crds] = await Promise.all([
          getCategories(),
          getPayMethods(),
          getBanks(),
          getCards()
        ]);

        if (!mounted) return;
        
        setCategories(cats);
        setPayMethods(pays);
        setBanks(bks);
        setCards(crds);
      } catch (e) {
        if (!mounted) return;
        setError((e as Error)?.message || '공통코드 조회 실패');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCommonCodes();
    return () => { mounted = false; };
  }, [userId]);

  // 지갑 목록 조회
  useEffect(() => {
    if (!userId) return;

    getWallets(userId)
      .then(walletList => {
        setWallets(walletList);
      })
      .catch(error => {
        console.error('지갑 목록 조회 실패:', error);
        setWallets([]);
      });
  }, [userId]);

  // 결제수단이 변경될 때 지갑 목록 필터링
  const filteredWallets = useMemo(() => {
    if (!selectedPayMethod) return wallets;
    return wallets.filter(wallet => wallet.wlt_type === selectedPayMethod);
  }, [wallets, selectedPayMethod]);

  // 거래유형 변경 시 카테고리 다시 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = selectedTrxType === 'EXPENSE' ? await getCategories() : await getIncome();
        setCategories(categoryData);
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
      }
    };
    loadCategories();
  }, [selectedTrxType]);

  // 새 행 추가
  const addNewRow = () => {
    const newId = (expenseItems.length + 1).toString();
    const newItem: BulkExpenseItem = {
      id: newId,
      trx_date: getTodayDate(),
      trx_type: selectedTrxType,
      amount: '',
      category_cd: '',
      memo: '',
      payment_type: 'ONETIME',
      installment_months: '',
      installment_seq: '',
      is_fixed: 'N'
    };
    setExpenseItems([...expenseItems, newItem]);
  };

  // 행 삭제
  const removeRow = (id: string) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter(item => item.id !== id));
    }
  };

  // 아이템 업데이트
  const updateItem = (id: string, field: keyof BulkExpenseItem, value: string) => {
    setExpenseItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWallet) {
      alert('지갑을 선택해주세요.');
      return;
    }

    // 유효성 검사 - 금액과 카테고리가 있고, 금액이 0보다 큰 항목들만 필터링
    const validItems = expenseItems.filter(item => {
      const numericAmount = Number(item.amount.replace(/,/g, ''));
      return item.amount && item.category_cd && numericAmount > 0;
    });

    if (validItems.length === 0) {
      alert('최소 하나의 유효한 거래를 입력해주세요. (금액은 0보다 커야 합니다)');
      return;
    }

    try {
      setSaving(true);
      
      // 각 아이템을 순차적으로 등록
      for (const item of validItems) {
        const numericAmount = Number(item.amount.replace(/,/g, ''));
        
        const data = {
          usr_id: userId,
          wlt_id: selectedWallet,
          trx_type: item.trx_type,
          trx_date: item.trx_date,
          amount: numericAmount,
          category_cd: item.category_cd,
          memo: item.memo || null,
          is_fixed: item.is_fixed,
          is_installment: item.payment_type === 'INSTALLMENT' ? 'Y' : 'N'
        };

        // 할부 정보 추가
        if (item.payment_type === 'INSTALLMENT') {
          Object.assign(data, {
            installment_months: Number(item.installment_months),
            installment_seq: Number(item.installment_seq)
          });
        }

        await post('/expenses', data);
      }

      alert(`${validItems.length}건의 거래가 등록되었습니다.`);
      onSuccess();
      onClose();
      
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('거래 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalPanel} style={{ maxWidth: '1200px', width: '95vw' }}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>다건 거래 등록</div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.modalBody}>
          {error && <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>}
          
          {/* 지갑 바로가기 버튼 */}
          <div className={styles.walletButtons}>
            {wallets.map((wallet) => (
              <button
                key={wallet.wlt_id}
                className={`${styles.walletButton} ${selectedWallet === wallet.wlt_id ? styles.active : ''}`}
                onClick={() => {
                  setSelectedPayMethod(wallet.wlt_type);
                  setSelectedWallet(wallet.wlt_id);
                }}
                type="button"
              >
                <span className={styles.walletIcon}>
                  {wallet.wlt_type === 'CASH' ? '💵' :
                   wallet.wlt_type === 'CHECK_CARD' ? '💳' :
                   wallet.wlt_type === 'CREDIT_CARD' ? '💳' : '💰'}
                </span>
                <span className={styles.walletName}>{wallet.wlt_name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* 공통 설정 */}
            <div className={styles.bulkCommonSettings}>
              <div className={styles.field}>
                <label className={styles.label}>거래유형</label>
                <select
                  className={styles.select}
                  value={selectedTrxType}
                  disabled={loading}
                  onChange={(e) => setSelectedTrxType(e.target.value)}
                >
                  {TRX_TYPES.map((type) => (
                    <option key={type.code} value={type.code}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>결제수단</label>
                <select
                  className={styles.select}
                  value={selectedPayMethod}
                  disabled={loading}
                  onChange={(e) => setSelectedPayMethod(e.target.value)}
                >
                  <option value="" disabled>선택하세요</option>
                  {payMethods.map((m) => (
                    <option key={m.cd} value={m.cd}>{m.cd_nm}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>지갑 선택</label>
                <select
                  className={styles.select}
                  value={selectedWallet}
                  disabled={loading || !selectedPayMethod || wallets.length === 0}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                >
                  <option value="" disabled>선택하세요</option>
                  {filteredWallets.map((w) => (
                    <option key={w.wlt_id} value={w.wlt_id}>{w.wlt_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 거래 목록 */}
            <div className={styles.bulkExpenseList}>
              <div className={styles.bulkListHeader}>
                <h3>거래 목록</h3>
                <button 
                  type="button" 
                  className={styles.buttonSecondary}
                  onClick={addNewRow}
                >
                  + 행 추가
                </button>
              </div>
              
              <div className={styles.bulkTable}>
                <div className={styles.bulkTableHeader}>
                  <div>날짜</div>
                  <div>금액</div>
                  <div>카테고리</div>
                  <div>메모</div>
                  <div>지출형태</div>
                  <div>액션</div>
                </div>
                
                {expenseItems.map((item, index) => (
                  <div key={item.id} className={styles.bulkTableRow}>
                    <div>
                      <input
                        type="date"
                        className={styles.input}
                        value={item.trx_date}
                        onChange={(e) => updateItem(item.id, 'trx_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, 'amount', formatAmountInput(e.target.value))}
                      />
                    </div>
                    <div>
                      <select
                        className={styles.select}
                        value={item.category_cd}
                        disabled={loading}
                        onChange={(e) => updateItem(item.id, 'category_cd', e.target.value)}
                      >
                        <option value="" disabled>선택하세요</option>
                        {categories.map((c) => (
                          <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="메모"
                        value={item.memo}
                        onChange={(e) => updateItem(item.id, 'memo', e.target.value)}
                      />
                    </div>
                    <div>
                      <select
                        className={styles.select}
                        value={item.payment_type}
                        onChange={(e) => updateItem(item.id, 'payment_type', e.target.value as PaymentType)}
                      >
                        {Object.values(PAYMENT_TYPES).map((type) => (
                          <option key={type.code} value={type.code}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => removeRow(item.id)}
                        disabled={expenseItems.length === 1}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.buttonGhost} onClick={onClose}>취소</button>
              <button className={styles.buttonPrimary} type="submit" disabled={saving || loading}>
                {saving ? '저장 중...' : '다건 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
