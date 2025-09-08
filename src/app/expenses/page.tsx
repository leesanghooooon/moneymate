'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/expenses.module.css';
import { useEffect, useState } from 'react';
import { getCategories, getPayMethods, getBanks, getCards, getWallets, CommonCode, Wallet } from '../../lib/api/commonCodes';
import { post, ApiError } from '../../lib/api/common';

type PaymentType = 'ONETIME' | 'INSTALLMENT' | 'SUBSCRIPTION';

const PAYMENT_TYPES: Record<PaymentType, { code: PaymentType; label: string }> = {
  ONETIME: { code: 'ONETIME', label: '일시불' },
  INSTALLMENT: { code: 'INSTALLMENT', label: '할부' },
  SUBSCRIPTION: { code: 'SUBSCRIPTION', label: '구독' }
};

export default function ExpensesPage() {
  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [cards, setCards] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // 지출 등록 폼 state
  const [expenseForm, setExpenseForm] = useState({
    trx_date: new Date().toISOString().slice(0, 10),
    amount: '',
    category_cd: '',
    memo: '',
    payment_type: 'ONETIME' as PaymentType,
    installment_months: '',
    installment_seq: '',
    is_fixed: 'N'
  });

  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletForm, setWalletForm] = useState({
    usr_id: 'tester01', // 테스트용 사용자 ID (실제 DB에 존재하는 ID로 변경 필요)
    wlt_type: '',
    wlt_name: '',
    bank_cd: '',
    is_default: 'N',
  });

  const isCardSelected = (() => {
    const v = (selectedPayMethod || '').toLowerCase();
    return v === 'card' || v === '카드';
  })();

  const getWalletCardType = (() => {
    const v = walletForm.wlt_type;
    if (v === 'CHECK_CARD') return 'check';
    if (v === 'CREDIT_CARD') return 'credit';
    return null;
  })();

  const isWalletCardSelected = getWalletCardType !== null;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getCategories(), getPayMethods(), getBanks(), getCards()])
      .then(([cats, pays, bks, crds]) => {
        if (!mounted) return;
        setCategories(cats);
        setPayMethods(pays);
        setBanks(bks);
        setCards(crds);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || '공통코드 조회 실패');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // 지출수단 변경 시 해당하는 지갑 목록 조회
  useEffect(() => {
    if (!selectedPayMethod) {
      setWallets([]);
      setSelectedWallet('');
      return;
    }

    let wlt_type: string | undefined;
    switch (selectedPayMethod.toUpperCase()) {
      case 'CASH':
        wlt_type = 'CASH';
        break;
      case 'CHECK_CARD':
        wlt_type = 'CHECK_CARD';
        break;
      case 'CREDIT_CARD':
        wlt_type = 'CREDIT_CARD';
        break;
      default:
        setWallets([]);
        setSelectedWallet('');
        return;
    }

    getWallets(walletForm.usr_id, wlt_type)
      .then(walletList => {
        setWallets(walletList);
        setSelectedWallet('');
      })
      .catch(error => {
        console.error('지갑 목록 조회 실패:', error);
        setWallets([]);
        setSelectedWallet('');
      });
  }, [selectedPayMethod, walletForm.usr_id]);

  useEffect(() => {
    if (!isWalletCardSelected && walletForm.bank_cd) {
      setWalletForm({ ...walletForm, bank_cd: '' });
    }
  }, [isWalletCardSelected, walletForm.bank_cd]);

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedWallet || !expenseForm.category_cd || !expenseForm.amount) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      const data = {
        usr_id: walletForm.usr_id, // 현재 테스트용 ID 사용
        wlt_id: selectedWallet,
        trx_type: 'EXPENSE',
        trx_date: expenseForm.trx_date,
        amount: Number(expenseForm.amount),
        category_cd: expenseForm.category_cd,
        memo: expenseForm.memo || null,
        is_fixed: expenseForm.is_fixed,
        is_installment: expenseForm.payment_type === PAYMENT_TYPES.INSTALLMENT.code ? 'Y' : 'N'
      };

      // 할부 정보 추가
      if (expenseForm.payment_type === PAYMENT_TYPES.INSTALLMENT.code) {
        Object.assign(data, {
          installment_months: Number(expenseForm.installment_months),
          installment_seq: Number(expenseForm.installment_seq)
        });
      }

      const response = await post('/expenses', data);
      alert('지출이 등록되었습니다.');
      
      // 폼 초기화
      setExpenseForm({
        trx_date: new Date().toISOString().slice(0, 10),
        amount: '',
        category_cd: '',
        memo: '',
        payment_type: 'ONETIME' as PaymentType,
        installment_months: '',
        installment_seq: '',
        is_fixed: 'N'
      });
      setSelectedPayMethod('');
      setSelectedWallet('');
      
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('지출 등록 중 오류가 발생했습니다.');
      }
    }
  }

  async function submitWallet() {
    try {
      setSavingWallet(true);
      await post('/wallets', {
        usr_id: walletForm.usr_id,
        wlt_type: walletForm.wlt_type,
        wlt_name: walletForm.wlt_name,
        bank_cd: walletForm.bank_cd || null,
        is_default: walletForm.is_default || 'N',
      });
      setOpenWalletModal(false);
      setWalletForm({ usr_id: 'tester01', wlt_type: '', wlt_name: '', bank_cd: '', is_default: 'N' });
      alert('지갑이 등록되었습니다.');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('지갑 등록 실패');
      }
    } finally {
      setSavingWallet(false);
    }
  }

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.expensesPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>지출 등록</h1>
                  <p className={styles.subtitle}>가계부 스타일로 지출을 빠르게 기록하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <button className={styles.buttonSecondary} onClick={() => setOpenWalletModal(true)}>+ 지갑 등록</button>
                </div>
              </div>
            </header>

            <section className={styles.formSection}>
              {error && <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>}
              <form className={styles.form} onSubmit={submitExpense}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>날짜</label>
                    <input 
                      type="date" 
                      className={styles.input} 
                      value={expenseForm.trx_date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, trx_date: e.target.value })}
                    />
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
                      {wallets.map((w) => (
                        <option key={w.wlt_id} value={w.wlt_id}>{w.wlt_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>카테고리</label>
                    <select 
                      className={styles.select} 
                      value={expenseForm.category_cd} 
                      disabled={loading}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category_cd: e.target.value })}
                    >
                      <option value="" disabled>선택하세요</option>
                      {categories.map((c) => (
                        <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>금액</label>
                    <input 
                      type="number" 
                      className={styles.input} 
                      min={0} 
                      step={100} 
                      placeholder="0"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>가맹점/메모</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="예: 스타벅스, 점심"
                      value={expenseForm.memo}
                      onChange={(e) => setExpenseForm({ ...expenseForm, memo: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>지출 형태</label>
                    <div className={styles.segmented}>
                      {Object.values(PAYMENT_TYPES).map((type) => (
                        <label key={type.code} className={styles.segmentedItem}>
                          <input 
                            type="radio" 
                            name="paymentType"
                            checked={expenseForm.payment_type === type.code}
                            onChange={() => setExpenseForm({
                              ...expenseForm,
                              payment_type: type.code,
                              // 할부가 아닐 때는 할부 관련 필드 초기화
                              ...(type.code !== 'INSTALLMENT' && {
                                installment_months: '',
                                installment_seq: ''
                              })
                            })}
                          />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {expenseForm.payment_type === 'INSTALLMENT' ? (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>할부 개월수</label>
                        <input 
                          type="number" 
                          className={styles.input} 
                          min={2} 
                          max={60} 
                          placeholder="0"
                          value={expenseForm.installment_months}
                          onChange={(e) => setExpenseForm({ ...expenseForm, installment_months: e.target.value })}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>할부 회차</label>
                        <input 
                          type="number" 
                          className={styles.input} 
                          min={1} 
                          max={expenseForm.installment_months || 60}
                          placeholder="0"
                          value={expenseForm.installment_seq}
                          onChange={(e) => setExpenseForm({ ...expenseForm, installment_seq: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.field} />
                      <div className={styles.field} />
                    </>
                  )}
                </div>

                <div className={styles.actions}>
                  <button className={styles.buttonPrimary} type="submit" disabled={loading}>등록</button>
                  <button className={styles.buttonGhost} type="reset">초기화</button>
                </div>
              </form>
            </section>

            {openWalletModal && (
              <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                <div className={styles.modalPanel}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>지갑 등록</div>
                    <button className={styles.modalClose} onClick={() => setOpenWalletModal(false)}>✕</button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.modalForm}>
                      <div className={styles.modalRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>지갑 이름</label>
                          <input
                            className={styles.input}
                            value={walletForm.wlt_name}
                            onChange={(e) => setWalletForm({ ...walletForm, wlt_name: e.target.value })}
                            placeholder="예: 국민은행 통장, 현대카드"
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>지갑 유형</label>
                          <select
                            className={styles.select}
                            value={walletForm.wlt_type}
                            disabled={loading}
                            onChange={(e) => setWalletForm({ ...walletForm, wlt_type: e.target.value })}
                          >
                            <option value="" disabled>선택</option>
                            {payMethods.map((m) => (
                              <option key={m.cd} value={m.cd}>{m.cd_nm}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>
                            {getWalletCardType === 'check' ? '은행 코드' : 
                             getWalletCardType === 'credit' ? '카드사 코드' : 
                             '은행/카드사 코드'}
                          </label>
                          <select
                            className={styles.select}
                            value={walletForm.bank_cd}
                            disabled={loading || !isWalletCardSelected}
                            onChange={(e) => setWalletForm({ ...walletForm, bank_cd: e.target.value })}
                          >
                            <option value="">선택 없음</option>
                            {getWalletCardType === 'check' && banks.map((b) => (
                              <option key={b.cd} value={b.cd}>{b.cd_nm}</option>
                            ))}
                            {getWalletCardType === 'credit' && cards.map((c) => (
                              <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>기본 지갑</label>
                          <select
                            className={styles.select}
                            value={walletForm.is_default}
                            onChange={(e) => setWalletForm({ ...walletForm, is_default: e.target.value })}
                          >
                            <option value="N">아니오</option>
                            <option value="Y">예</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.modalRow}>
                        <div className={styles.field}>
                          {/* 빈 공간을 위한 placeholder */}
                        </div>
                        <div className={styles.field}>
                          {/* 빈 공간을 위한 placeholder */}
                        </div>
                        <div className={styles.field}>
                          {/* 빈 공간을 위한 placeholder */}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button className={styles.buttonGhost} onClick={() => setOpenWalletModal(false)}>취소</button>
                    <button className={styles.buttonPrimary} onClick={submitWallet} disabled={savingWallet}>
                      {savingWallet ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <section className={styles.listSection}>
              <h2 className={styles.sectionTitle}>오늘의 지출</h2>
              <div className={styles.ledgerList}>
                {[1,2,3].map((i) => (
                  <div key={i} className={styles.ledgerItem}>
                    <div className={styles.ledgerLeft}>
                      <div className={styles.ledgerDate}>2024-09-0{i}</div>
                      <div className={styles.ledgerMerchant}>스타벅스</div>
                    </div>
                    <div className={styles.ledgerRight}>
                      <span className={styles.ledgerCategory}>식비</span>
                      <span className={styles.ledgerAmount}>-5,200원</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
