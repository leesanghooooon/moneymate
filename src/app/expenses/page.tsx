'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/expenses.module.css';
import { useEffect, useState, useMemo } from 'react';
import { getCategories, getPayMethods, getBanks, getCards, getWallets, getIncome, CommonCode, Wallet } from '../../lib/api/commonCodes';
import BulkExpenseModal from '../components/BulkExpenseModal';
import { post, ApiError } from '../../lib/api/common';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginRequiredModal from '@/components/LoginRequiredModal';

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

interface ExpenseData {
  trx_id: number;
  wlt_name: string;
  trx_date: string;
  amount: number;
  category_name: string;
  memo: string;
  is_installment: string;
  installment_info: string | null;
  trx_type: string;
  trx_type_name: string;
}

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 오늘의 지출 데이터를 가져오는 함수
  const fetchTodayExpenses = async () => {
    // 세션이 없으면 실행하지 않음
    if (!session?.user?.id) return;

    try {
      setLoadingExpenses(true);
      const today = getTodayDate();
      const response = await fetch(`/api/expenses?usr_id=${session.user.id}&start_date=${today}&end_date=${today}`);

      if (!response.ok) {
        throw new Error("지출 데이터 조회 실패");
      }

      const result = await response.json();
      setTodayExpenses(result.data || []);
    } catch (error) {
      console.error("오늘의 지출 조회 오류:", error);
      setTodayExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // 세션이 로드되면 데이터 조회
  useEffect(() => {
    if (session?.user?.id) {
      fetchTodayExpenses();
    }
  }, [session?.user?.id]);

  const [categories, setCategories] = useState<CommonCode[]>([]);
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [cards, setCards] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('');
  const [selectedTrxType, setSelectedTrxType] = useState<string>('EXPENSE');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오는 함수
  const getTodayDate = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // ex) "Asia/Seoul"

    const today = new Date();
    // today.setDate(today.getDate() - 1);

    return today.toLocaleDateString('en-CA', { timeZone: tz });
  };

  // 지출 등록 폼 state
  const [expenseForm, setExpenseForm] = useState({
    trx_date: getTodayDate(),
    amount: '',
    category_cd: '',
    memo: '',
    payment_type: 'ONETIME' as PaymentType,
    installment_months: '',
    installment_seq: '',
    is_fixed: 'N'
  });

  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);  const [savingWallet, setSavingWallet] = useState(false);
  const [walletForm, setWalletForm] = useState({
    usr_id: session?.user?.id || '',
    wlt_type: '',
    wlt_name: '',
    bank_cd: '',
    is_default: 'N',
  });

  // 오늘의 지출 데이터 관련 상태 추가
  const [todayExpenses, setTodayExpenses] = useState<ExpenseData[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

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

  // 공통 코드 조회는 세션이 있을 때만 실행
  useEffect(() => {
    if (!session?.user?.id) return;

    let mounted = true;
    setLoading(true);

    const loadCommonCodes = async () => {
      try {
        // 카테고리는 거래 유형에 따라 별도로 로드하므로 여기서는 제외
        const [pays, bks, crds] = await Promise.all([
          getPayMethods(),
          getBanks(),
          getCards()
        ]);

        if (!mounted) return;
        
        setPayMethods(pays);
        setBanks(bks);
        setCards(crds);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || '공통코드 조회 실패');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCommonCodes();
    return () => { mounted = false; };
  }, [session?.user?.id]);

  // 세션이 있을 때 모든 지갑 목록 조회
  useEffect(() => {
    if (!session?.user?.id) return;

    getWallets(session.user.id)
      .then(walletList => {
        setWallets(walletList);
      })
      .catch(error => {
        console.error('지갑 목록 조회 실패:', error);
        setWallets([]);
      });
  }, [session?.user?.id]);

  // 결제수단이 변경될 때 지갑 목록 필터링
  const filteredWallets = useMemo(() => {
    if (!selectedPayMethod) return wallets;
    return wallets.filter(wallet => wallet.wlt_type === selectedPayMethod);
  }, [wallets, selectedPayMethod]);

  // 거래유형 변경 시 카테고리 다시 로드
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const loadCategories = async () => {
      try {
        const categoryData = selectedTrxType === 'EXPENSE' ? await getCategories() : await getIncome();
        setCategories(categoryData);
        // 카테고리 변경 시 선택된 카테고리 초기화
        setExpenseForm(prev => ({ ...prev, category_cd: '' }));
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
      }
    };
    
    loadCategories();
  }, [selectedTrxType, session?.user?.id]);
  // 오늘의 지출 데이터 로드는 session?.user?.id useEffect에서 처리하므로 제거

  useEffect(() => {
    if (!isWalletCardSelected && walletForm.bank_cd) {
      setWalletForm({ ...walletForm, bank_cd: '' });
    }
  }, [isWalletCardSelected, walletForm.bank_cd]);

  // 세션의 사용자 ID가 변경될 때 지갑 폼 업데이트
  useEffect(() => {
    if (session?.user?.id) {
      setWalletForm(prev => ({ ...prev, usr_id: session.user.id }));
    }
  }, [session?.user?.id]);

  // 비로그인 상태에서는 데이터 로딩하지 않음
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();

    // 금액에서 쉼표 제거하고 숫자로 변환
    const numericAmount = Number(expenseForm.amount.replace(/,/g, ''));

    if (!selectedWallet || !expenseForm.category_cd || !expenseForm.amount || numericAmount <= 0) {
      alert('필수 정보를 모두 입력해주세요. 금액은 0보다 커야 합니다.');
      return;
    }

    try {
      const data = {
        usr_id: session?.user?.id,
        wlt_id: selectedWallet,
        trx_type: selectedTrxType,
        trx_date: expenseForm.trx_date,
        amount: numericAmount,
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

      // 오늘의 지출 내역 다시 조회
      await fetchTodayExpenses();

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
      setSelectedTrxType('EXPENSE');
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
        usr_id: session?.user?.id,
        wlt_type: walletForm.wlt_type,
        wlt_name: walletForm.wlt_name,
        bank_cd: walletForm.bank_cd || null,
        is_default: walletForm.is_default || 'N',
      });
      setOpenWalletModal(false);
      setWalletForm({ usr_id: session?.user?.id || '', wlt_type: '', wlt_name: '', bank_cd: '', is_default: 'N' });
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

  // 금액을 한국 원화 형식으로 포맷하는 함수
  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 날짜를 YYYY-MM-DD에서 MM-DD 형식으로 변환하는 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderAmount = (trx_type: string, amount: number) => {
    const formatted = formatKRW(amount);
    if (trx_type === 'EXPENSE') {
      return <span className={`${styles.ledgerAmount} ${styles.expenseAmount}`}>-{formatted}원</span>;
    } else if (trx_type === 'INCOME') {
      return <span className={`${styles.ledgerAmount} ${styles.incomeAmount}`}>+{formatted}원</span>;
    }
    return <span className={styles.ledgerAmount}>{formatted}원</span>;
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

  return (
      <div className={layoutStyles.dashboard}>
        <main className={layoutStyles.dashboardBody}>
          <div className={styles.expensesPage}>
            <div className="container">
              <header className={styles.header}>
                <div className={styles.headerTop}>
                  <div className={styles.headerLeft}>
                    <h1 className={styles.title}>거래 등록</h1>
                    <p className={styles.subtitle}>수입과 지출을 빠르게 기록하세요.</p>
                  </div>
                  <div className={styles.headerRight}>
                    <button className={styles.buttonSecondary} onClick={() => setOpenWalletModal(true)}>지갑 등록</button>&nbsp;
                    <button className={styles.buttonSecondary} onClick={() => setOpenBulkModal(true)}>다건 등록</button>
                  </div>
                </div>
              </header>

              <section className={styles.formSection}>
                {error && <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>}

                {/* 지갑 바로가기 버튼 */}
                <div className={styles.walletButtons}>
                  {wallets.map((wallet) => (
                      <button
                          key={wallet.wlt_id}
                          className={`${styles.walletButton} ${selectedWallet === wallet.wlt_id ? styles.active : ''}`}
                    onClick={() => {
                      // 상태 업데이트를 배치로 처리
                      Promise.resolve().then(() => {
                        setSelectedPayMethod(wallet.wlt_type);
                        setSelectedWallet(wallet.wlt_id);
                      });
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
                          type="text"
                          className={styles.input}
                          placeholder="0"
                          value={expenseForm.amount}
                          onChange={(e) => {
                            const formattedValue = formatAmountInput(e.target.value);
                            setExpenseForm({ ...expenseForm, amount: formattedValue });
                          }}
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

              {openBulkModal && (
                <BulkExpenseModal
                  isOpen={openBulkModal}
                  onClose={() => setOpenBulkModal(false)}
                  onSuccess={() => {
                    fetchTodayExpenses();
                  }}
                  userId={session?.user?.id || ''}
                />
              )}
              <section className={styles.listSection}>
                <h2 className={styles.sectionTitle}>오늘의 가계부</h2>
                <div className={styles.ledgerList}>
                  {loadingExpenses ? (
                      <div className={styles.ledgerMessage}>
                        지출 데이터를 불러오는 중...
                      </div>
                  ) : todayExpenses.length === 0 ? (
                      <div className={styles.ledgerMessage}>
                        오늘 등록된 지출이 없습니다.
                      </div>
                  ) : (
                      todayExpenses.map((expense) => (
                          <div key={expense.trx_id} className={styles.ledgerItem}>
                            <div className={styles.ledgerLeft}>
                              <div className={styles.ledgerDate}>{formatDate(expense.trx_date)}</div>
                              <div className={styles.ledgerMerchant}>
                                {expense.memo || '메모 없음'}
                                {expense.installment_info && (
                                    <span className={styles.ledgerInstallment}>
                              ({expense.installment_info})
                            </span>
                                )}
                              </div>
                              <div className={styles.ledgerWallet}>{expense.wlt_name}</div>
                            </div>
                            <div className={styles.ledgerRight}>
                              <span className={styles.ledgerCategory}>{expense.category_name}</span>
                              {/*<span className={styles.ledgerAmount}>-{formatKRW(expense.amount)}원</span>*/}
                              {renderAmount(expense.trx_type, expense.amount)}
                            </div>
                          </div>
                      ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
  );
}
