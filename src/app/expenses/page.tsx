'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/expenses.module.css';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getCategories, getPayMethods, getBanks, getCards, getWallets, getIncome, CommonCode, Wallet } from '../../lib/api/commonCodes';
import BulkExpenseModal from '../components/BulkExpenseModal';
import { get, post, ApiError } from '../../lib/api/common';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../components/Toast';
// import TransactionRegistrationSlide from './TransactionRegistrationSlide';
import FinancialOverviewSlide from './FinancialOverviewSlide';
import ExcelTableSlide from './ExcelTableSlide';

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
  trx_id: string;
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
  const { show } = useToast();

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
  const [incomeCategories, setIncomeCategories] = useState<CommonCode[]>([]);
  const [payMethods, setPayMethods] = useState<CommonCode[]>([]);
  const [banks, setBanks] = useState<CommonCode[]>([]);
  const [cards, setCards] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 수입 등록 모드 상태
  const [isIncomeMode, setIsIncomeMode] = useState<boolean>(false);
  
  // 지갑 타입 필터 (신용카드/체크카드 선택)
  const [walletTypeFilter, setWalletTypeFilter] = useState<string>(''); // '' = 전체, 'CREDIT_CARD' = 신용카드, 'CHECK_CARD' = 체크카드

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

  // 슬라이드 상태 관리
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  // 엑셀 테이블 데이터 상태 관리 (지갑별 30개 행)
  const [excelTableData, setExcelTableData] = useState<Record<string, Array<{
    date: string;
    item: string;
    category: string;
    amount: string;
    trx_id: string;
  }>>>({});
  // 엑셀 테이블에 표시할 지갑 목록 (API 응답 기준)
  const [excelWallets, setExcelWallets] = useState<Array<{ wlt_id: string; wlt_name: string }>>([]);
  // 지갑들 중 가장 많은 행 수 (기본 30)
  const [excelMaxRows, setExcelMaxRows] = useState<number>(30);
  // 월별 표기 기간 (API 응답 기준)
  const [excelPeriod, setExcelPeriod] = useState<{ year: number; month: number } | null>(null);
  // 자동등록 중복 방지 (지갑별/행별)
  const [submittedRows, setSubmittedRows] = useState<Record<string, Record<number, boolean>>>({});
  // 각 행의 기존 trx_id 보관 (지갑별 인덱스 정렬)
  const [excelRowIds, setExcelRowIds] = useState<Record<string, Array<string | null>>>({});

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

  // 월별 지갑별 지출/수입 목록 API 호출하여 엑셀 테이블 데이터 구성
  const fetchMonthlyExpenses = useCallback(async (trxType: 'EXPENSE' | 'INCOME' = 'EXPENSE', wltType?: string) => {
      if (!session?.user?.id) return;
      try {
        const now = new Date();
        const params: Record<string, string> = { 
          usr_id: String(session.user.id), 
          year: String(now.getFullYear()), 
          month: String(now.getMonth() + 1),
          trx_type: trxType
        };
        if (wltType) {
          params.wlt_type = wltType;
        }
        const res = await get('/expenses/monthly-by-wallets', { params });
        const payload = res?.data;
        if (!payload?.success || !Array.isArray(payload?.data)) {
          console.warn('월별 지갑별 거래 API 실패:', payload?.message);
          setExcelWallets([]);
          return;
        }
        const list: Array<{ wlt_id: string; wlt_name: string; transactions: Array<{ date: number; item: string; category_cd: string; amount: number; trx_id?: string }> }> = payload.data || [];

        // 렌더용 지갑 목록
        setExcelWallets(list.map(item => ({ wlt_id: item.wlt_id, wlt_name: item.wlt_name })));
        if (payload?.period?.year && payload?.period?.month) {
          setExcelPeriod({ year: Number(payload.period.year), month: Number(payload.period.month) });
        } else {
          setExcelPeriod({ year: now.getFullYear(), month: now.getMonth() + 1 });
        }

        // 행 수 결정: 카드별 거래내역 중 최대 카운트와 30 중 큰 값
        const maxRows = Math.max(
          30,
          ...list.map(item => (Array.isArray(item.transactions) ? item.transactions.length : 0))
        );
        setExcelMaxRows(maxRows);

        // maxRows로 패딩하여 상태 구성
        const nextData: Record<string, Array<{ date: string; item: string; category: string; amount: string; trx_id: string; }>> = {};
        const nextIds: Record<string, Array<string | null>> = {};
        list.forEach(item => {
          const rows = Array.from({ length: maxRows }, (_, idx) => {
            const t = item.transactions[idx];
            if (t) {
              return {
                date: String(t.date ?? ''),
                item: t.item ?? '',
                // category에는 코드 저장 (레이블은 select 옵션으로 표시)
                category: (t as any).category_cd ? String((t as any).category_cd) : '',
                amount: t.amount != null ? new Intl.NumberFormat('ko-KR').format(Number(t.amount)) : '',
                trx_id: String(t.trx_id)
              };
            }
            return { date: '', item: '', category: '', amount: '', trx_id: '' };
          });
          nextData[item.wlt_id] = rows;
          const ids = Array.from({ length: maxRows }, (_, idx) => {
            const t = item.transactions[idx] as any;
            return t && t.trx_id ? String(t.trx_id) : null;
          });
          nextIds[item.wlt_id] = ids;
        });
        setExcelTableData(nextData);
        setExcelRowIds(nextIds);
      } catch (e) {
        console.error('월별 지갑별 거래 API 호출 오류:', e);
        setExcelWallets([]);
      }
  }, [session?.user?.id]);

  // 지출 모드일 때만 자동으로 데이터 조회
  useEffect(() => {
    if (!isIncomeMode) {
      fetchMonthlyExpenses('EXPENSE', walletTypeFilter || undefined);
    }
  }, [fetchMonthlyExpenses, isIncomeMode, walletTypeFilter]);
  
  // 수입 모드 활성화 및 수입 데이터 조회
  const handleIncomeModeToggle = async () => {
    if (!isIncomeMode) {
      // 수입 모드 활성화
      setIsIncomeMode(true);
      
      // 기존 데이터 초기화
      setExcelTableData({});
      setExcelWallets([]);
      setExcelRowIds({});
      setSubmittedRows({});
      
      // 수입 카테고리 로드
      try {
        const incomeData = await getIncome();
        setIncomeCategories(incomeData);
      } catch (error) {
        console.error('수입 카테고리 조회 실패:', error);
      }
      
      // 수입 데이터 조회 및 ExcelTableData 재구성
      await fetchMonthlyExpenses('INCOME', walletTypeFilter || undefined);
    } else {
      // 지출 모드로 전환
      setIsIncomeMode(false);
      
      // 기존 데이터 초기화
      setExcelTableData({});
      setExcelWallets([]);
      setExcelRowIds({});
      setSubmittedRows({});
      
      // 지출 데이터 조회 및 ExcelTableData 재구성
      await fetchMonthlyExpenses('EXPENSE', walletTypeFilter || undefined);
    }
  };
  
  // 지갑 타입 필터 변경 핸들러
  const handleWalletTypeFilterChange = async (wltType: string) => {
    setWalletTypeFilter(wltType);
    
    // 기존 데이터 초기화
    setExcelTableData({});
    setExcelWallets([]);
    setExcelRowIds({});
    setSubmittedRows({});
    
    // 필터링된 데이터 조회
    const trxType = isIncomeMode ? 'INCOME' : 'EXPENSE';
    await fetchMonthlyExpenses(trxType, wltType || undefined);
  };

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

  // 엑셀간편등록 페이지로 이동하는 함수
  const handleExcelRegistration = () => {
    // 향후 엑셀간편등록 페이지로 이동
    router.push('/expenses/excel');
  };

  // 엑셀 테이블 데이터 업데이트 함수
  const updateExcelTableData = (walletId: string, rowIndex: number, field: 'date' | 'item' | 'category' | 'amount', value: string) => {
    setExcelTableData(prev => {
      const walletData = prev[walletId] || Array.from({ length: 30 }, () => ({ date: '', item: '', category: '', amount: '' }));
      const updated = [...walletData];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return { ...prev, [walletId]: updated };
    });
    // 동일 행 재수정 가능하도록 제출 플래그 해제
    setSubmittedRows(prev => {
      const walletFlags = prev[walletId] ? { ...prev[walletId] } : {};
      if (walletFlags[rowIndex]) {
        walletFlags[rowIndex] = false;
      }
      return { ...prev, [walletId]: walletFlags };
    });
  };

  // 자동 등록: 포커스아웃 시 해당 행 데이터가 모두 채워지면 등록/수정 호출
  // overrides를 통해 blur 시점의 최신 값(예: select의 선택값)을 직접 반영
  const maybeRegisterRow = async (
    walletId: string,
    rowIndex: number,
    trxId: string,
    overrides?: Partial<{ date: string; item: string; category: string; amount: string }>,
    trxType: 'EXPENSE' | 'INCOME' = 'EXPENSE'
  ) => {
    try {
      const userId = session?.user?.id ? String(session.user.id) : '';
      if (!userId) return;
      const rows = excelTableData[walletId] || [];
      const baseRow = rows[rowIndex];
      const row = { ...baseRow, ...(overrides || {}) };
      if (!row) return;
      const day = (row.date || '').trim();
      const memo = (row.item || '').trim();
      const categoryCd = (row.category || '').trim(); // 코드 사용
      const amountStr = (row.amount || '').replace(/,/g, '').trim();
      const amountNum = Number(amountStr);
      if (!day || !memo || !categoryCd || !amountNum || isNaN(amountNum) || amountNum <= 0) {
        return;
      }
      const submittedMap = submittedRows[walletId] || {};
      if (submittedMap[rowIndex]) return;
      const year = excelPeriod?.year ?? new Date().getFullYear();
      const month = excelPeriod?.month ?? (new Date().getMonth() + 1);
      const yyyy = String(year);
      const mm = String(month).padStart(2, '0');
      const dd = String(Number(day)).padStart(2, '0');
      const trx_date = `${yyyy}-${mm}-${dd}`;
      const body = {
        usr_id: userId,
        wlt_id: walletId,
        trx_type: trxType,
        trx_date,
        amount: amountNum,
        category_cd: categoryCd,
        memo
      };
      show(trxId ? '자동 수정 중...' : '자동 등록 중...', { type: 'info' });
      if (trxId) {
        // 수정
        await (await import('../../lib/api/common')).put(`/expenses/${trxId}`, body);
      } else {
        // 신규 등록
        await post('/expenses', body);
      }
      setSubmittedRows(prev => ({
        ...prev,
        [walletId]: { ...(prev[walletId] || {}), [rowIndex]: true }
      }));
      show(trxId ? '수정 완료' : '등록 완료', { type: 'success' });
      // 갱신하여 trx_id 반영
      fetchMonthlyExpenses(trxType, walletTypeFilter || undefined);
    } catch (err) {
      console.error('자동 등록 실패:', err);
      show('등록/수정 실패', { type: 'error' });
    }
  };

  // 엑셀 테이블 행 추가 함수
  const addExcelTableRow = (walletId: string) => {
    setExcelTableData(prev => {
      const walletData = prev[walletId] || [];
      const newRow = { date: '', item: '', category: '', amount: '', trx_id: '' };
      return { ...prev, [walletId]: [...walletData, newRow] };
    });
  };

  return (
      <div className={layoutStyles.dashboard}>
        <main className={layoutStyles.dashboardBody}>
          <div className={styles.slideContainer}>
            {/* 슬라이드 버튼 */}
                      <button
              className={styles.slideButton}
              onClick={() => setIsSlideOpen(!isSlideOpen)}
              aria-label={isSlideOpen ? '슬라이드 닫기' : '슬라이드 열기'}
              style={{
                right: 0
              }}
            >
              {isSlideOpen ? (
                <ChevronLeftIcon className={styles.slideButtonIcon} />
              ) : (
                <ChevronRightIcon className={styles.slideButtonIcon} />
              )}
            </button>

            {/* 첫 번째 슬라이드 페이지: 재무 현황 */}
            <FinancialOverviewSlide
              isOpen={isSlideOpen}
            />

            {/* 첫 번째 슬라이드 페이지: 거래 등록 (주석처리) */}
            {/* <TransactionRegistrationSlide
              isOpen={isSlideOpen}
              categories={categories}
              payMethods={payMethods}
              banks={banks}
              cards={cards}
              wallets={wallets}
              loading={loading}
              error={error}
              selectedPayMethod={selectedPayMethod}
              selectedTrxType={selectedTrxType}
              selectedWallet={selectedWallet}
              expenseForm={expenseForm}
              walletForm={walletForm}
              openWalletModal={openWalletModal}
              openBulkModal={openBulkModal}
              savingWallet={savingWallet}
              todayExpenses={todayExpenses}
              loadingExpenses={loadingExpenses}
              filteredWallets={filteredWallets}
              onPayMethodChange={setSelectedPayMethod}
              onTrxTypeChange={setSelectedTrxType}
              onWalletChange={setSelectedWallet}
              onExpenseFormChange={(updates) => setExpenseForm(prev => ({ ...prev, ...updates }))}
              onWalletFormChange={(updates) => setWalletForm(prev => ({ ...prev, ...updates }))}
              onSubmitExpense={submitExpense}
              onSubmitWallet={submitWallet}
              onCloseWalletModal={() => setOpenWalletModal(false)}
              onOpenWalletModal={() => setOpenWalletModal(true)}
              onCloseBulkModal={() => setOpenBulkModal(false)}
              onOpenBulkModal={() => setOpenBulkModal(true)}
              onBulkModalSuccess={fetchTodayExpenses}
              onExcelRegistration={handleExcelRegistration}
              onWalletButtonClick={(wallet) => {
                      Promise.resolve().then(() => {
                        setSelectedPayMethod(wallet.wlt_type);
                        setSelectedWallet(wallet.wlt_id);
                      });
                    }}
              formatAmountInput={formatAmountInput}
              formatKRW={formatKRW}
              formatDate={formatDate}
              renderAmount={renderAmount}
              getWalletCardType={getWalletCardType}
              isWalletCardSelected={isWalletCardSelected}
              sessionUserId={session?.user?.id || ''}
            /> */}

            {/* 두 번째 슬라이드 페이지: 엑셀 테이블 */}
            <ExcelTableSlide
              isOpen={isSlideOpen}
              excelWallets={excelWallets}
              excelTableData={excelTableData}
              excelMaxRows={excelMaxRows}
              categories={isIncomeMode ? incomeCategories : categories}
              formatAmountInput={formatAmountInput}
              updateExcelTableData={updateExcelTableData}
              maybeRegisterRow={(walletId, rowIndex, trxId, overrides) => 
                maybeRegisterRow(walletId, rowIndex, trxId, overrides, isIncomeMode ? 'INCOME' : 'EXPENSE')
              }
              addExcelTableRow={addExcelTableRow}
              isIncomeMode={isIncomeMode}
              onIncomeModeToggle={handleIncomeModeToggle}
              walletTypeFilter={walletTypeFilter}
              onWalletTypeFilterChange={handleWalletTypeFilterChange}
            />
          </div>
        </main>
      </div>
  );
}
