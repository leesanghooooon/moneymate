'use client';

import styles from '../../styles/css/expenses.module.css';
import { CommonCode, Wallet } from '../../lib/api/commonCodes';
import BulkExpenseModal from '../components/BulkExpenseModal';

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

interface TransactionRegistrationSlideProps {
  isOpen: boolean;
  // 공통 코드
  categories: CommonCode[];
  payMethods: CommonCode[];
  banks: CommonCode[];
  cards: CommonCode[];
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
  // 폼 상태
  selectedPayMethod: string;
  selectedTrxType: string;
  selectedWallet: string;
  expenseForm: {
    trx_date: string;
    amount: string;
    category_cd: string;
    memo: string;
    payment_type: PaymentType;
    installment_months: string;
    installment_seq: string;
    is_fixed: string;
  };
  walletForm: {
    usr_id: string;
    wlt_type: string;
    wlt_name: string;
    bank_cd: string;
    is_default: string;
  };
  openWalletModal: boolean;
  openBulkModal: boolean;
  savingWallet: boolean;
  todayExpenses: ExpenseData[];
  loadingExpenses: boolean;
  // 필터링된 지갑 목록
  filteredWallets: Wallet[];
  // 이벤트 핸들러
  onPayMethodChange: (value: string) => void;
  onTrxTypeChange: (value: string) => void;
  onWalletChange: (value: string) => void;
  onExpenseFormChange: (form: Partial<TransactionRegistrationSlideProps['expenseForm']>) => void;
  onWalletFormChange: (form: Partial<TransactionRegistrationSlideProps['walletForm']>) => void;
  onSubmitExpense: (e: React.FormEvent) => void;
  onSubmitWallet: () => void;
  onCloseWalletModal: () => void;
  onOpenWalletModal: () => void;
  onCloseBulkModal: () => void;
  onOpenBulkModal: () => void;
  onBulkModalSuccess: () => void;
  onExcelRegistration: () => void;
  onWalletButtonClick: (wallet: Wallet) => void;
  // 유틸리티 함수
  formatAmountInput: (value: string) => string;
  formatKRW: (amount: number) => string;
  formatDate: (dateString: string) => string;
  renderAmount: (trx_type: string, amount: number) => React.ReactNode;
  // 지갑 관련
  getWalletCardType: 'check' | 'credit' | null;
  isWalletCardSelected: boolean;
  sessionUserId: string;
}

export default function TransactionRegistrationSlide({
  isOpen,
  categories,
  payMethods,
  banks,
  cards,
  wallets,
  loading,
  error,
  selectedPayMethod,
  selectedTrxType,
  selectedWallet,
  expenseForm,
  walletForm,
  openWalletModal,
  openBulkModal,
  savingWallet,
  todayExpenses,
  loadingExpenses,
  filteredWallets,
  onPayMethodChange,
  onTrxTypeChange,
  onWalletChange,
  onExpenseFormChange,
  onWalletFormChange,
  onSubmitExpense,
  onSubmitWallet,
  onCloseWalletModal,
  onOpenWalletModal,
  onCloseBulkModal,
  onOpenBulkModal,
  onBulkModalSuccess,
  onExcelRegistration,
  onWalletButtonClick,
  formatAmountInput,
  formatKRW,
  formatDate,
  renderAmount,
  getWalletCardType,
  isWalletCardSelected,
  sessionUserId,
}: TransactionRegistrationSlideProps) {
  return (
    <div 
      className={`${styles.slidePage} ${styles.slidePageLeft} ${isOpen ? styles.slidePageLeftOpen : ''}`}
      style={{
        position: isOpen ? 'absolute' : 'relative',
        transform: isOpen ? 'translateX(-100%)' : 'translateX(0)',
        zIndex: isOpen ? 1 : 10,
        top: isOpen ? 0 : 'auto',
        left: isOpen ? 0 : 'auto'
      }}
    >
      <div className={styles.expensesPage}>
        <div className="container">
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <h1 className={styles.title}>거래 등록</h1>
                <p className={styles.subtitle}>수입과 지출을 빠르게 기록하세요.</p>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.buttonSecondary} onClick={onOpenWalletModal}>지갑 등록</button>&nbsp;
                <button className={styles.buttonSecondary} onClick={onOpenBulkModal}>다건 등록</button>
              </div>
            </div>
          </header>

          {/* 엑셀 간편등록 콜투액션 카드 */}
          <div
            className={styles.excelCallout}
            onClick={onExcelRegistration}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExcelRegistration(); }}
          >
            <div className={styles.excelCalloutIcon}>📊</div>
            <div className={styles.excelCalloutContent}>
              <div className={styles.excelCalloutTitle}>엑셀 간편등록으로 빠르게 등록</div>
              <div className={styles.excelCalloutDesc}>엑셀 파일을 업로드하여 여러 거래를 한 번에 등록할 수 있어요.</div>
            </div>
            <div className={styles.excelCalloutCta}>바로가기 →</div>
          </div>

          <section className={styles.formSection}>
            {error && <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>}

            {/* 지갑 바로가기 버튼 */}
            <div className={styles.walletButtons}>
              {wallets.map((wallet) => (
                  <button
                      key={wallet.wlt_id}
                      className={`${styles.walletButton} ${selectedWallet === wallet.wlt_id ? styles.active : ''}`}
                onClick={() => onWalletButtonClick(wallet)}
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

            <form className={styles.form} onSubmit={onSubmitExpense}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>날짜</label>
                  <input
                      type="date"
                      className={styles.input}
                      value={expenseForm.trx_date}
                      onChange={(e) => onExpenseFormChange({ trx_date: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>거래유형</label>
                  <select
                      className={styles.select}
                      value={selectedTrxType}
                      disabled={loading}
                      onChange={(e) => onTrxTypeChange(e.target.value)}
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
                      onChange={(e) => onPayMethodChange(e.target.value)}
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
                      onChange={(e) => onWalletChange(e.target.value)}
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
                      onChange={(e) => onExpenseFormChange({ category_cd: e.target.value })}
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
                        onExpenseFormChange({ amount: formattedValue });
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
                      onChange={(e) => onExpenseFormChange({ memo: e.target.value })}
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
                              onChange={() => onExpenseFormChange({
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
                            onChange={(e) => onExpenseFormChange({ installment_months: e.target.value })}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>할부 회차</label>
                        <input
                            type="number"
                            className={styles.input}
                            min={1}
                            max={Number(expenseForm.installment_months) || 60}
                            placeholder="0"
                            value={expenseForm.installment_seq}
                            onChange={(e) => onExpenseFormChange({ installment_seq: e.target.value })}
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
                    <button className={styles.modalClose} onClick={onCloseWalletModal}>✕</button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.modalForm}>
                      <div className={styles.modalRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>지갑 이름</label>
                          <input
                              className={styles.input}
                              value={walletForm.wlt_name}
                              onChange={(e) => onWalletFormChange({ wlt_name: e.target.value })}
                              placeholder="예: 국민은행 통장, 현대카드"
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>지갑 유형</label>
                          <select
                              className={styles.select}
                              value={walletForm.wlt_type}
                              disabled={loading}
                              onChange={(e) => onWalletFormChange({ wlt_type: e.target.value })}
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
                              onChange={(e) => onWalletFormChange({ bank_cd: e.target.value })}
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
                              onChange={(e) => onWalletFormChange({ is_default: e.target.value })}
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
                    <button className={styles.buttonGhost} onClick={onCloseWalletModal}>취소</button>
                    <button className={styles.buttonPrimary} onClick={onSubmitWallet} disabled={savingWallet}>
                      {savingWallet ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {openBulkModal && (
            <BulkExpenseModal
              isOpen={openBulkModal}
              onClose={onCloseBulkModal}
              onSuccess={onBulkModalSuccess}
              userId={sessionUserId}
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
                          {renderAmount(expense.trx_type, expense.amount)}
                        </div>
                      </div>
                  ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
