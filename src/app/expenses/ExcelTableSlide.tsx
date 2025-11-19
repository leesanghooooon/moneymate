'use client';

import styles from '../../styles/css/expenses.module.css';
import { CommonCode } from '../../lib/api/commonCodes';
import { PlusIcon } from '@heroicons/react/24/outline';

interface ExcelTableRow {
  date: string;
  item: string;
  category: string;
  amount: string;
  trx_id: string;
}

interface ExcelWallet {
  wlt_id: string;
  wlt_name: string;
}

interface ExcelTableSlideProps {
  isOpen: boolean;
  excelWallets: ExcelWallet[];
  excelTableData: Record<string, ExcelTableRow[]>;
  excelMaxRows: number;
  categories: CommonCode[];
  formatAmountInput: (value: string) => string;
  updateExcelTableData: (walletId: string, rowIndex: number, field: 'date' | 'item' | 'category' | 'amount', value: string) => void;
  maybeRegisterRow: (walletId: string, rowIndex: number, trxId: string, overrides?: Partial<ExcelTableRow>) => Promise<void>;
  addExcelTableRow: (walletId: string) => void;
  isIncomeMode?: boolean;
  onIncomeModeToggle?: () => void;
  walletTypeFilter?: string;
  onWalletTypeFilterChange?: (wltType: string) => void;
}

export default function ExcelTableSlide({
  isOpen,
  excelWallets,
  excelTableData,
  excelMaxRows,
  categories,
  formatAmountInput,
  updateExcelTableData,
  maybeRegisterRow,
  addExcelTableRow,
  isIncomeMode = false,
  onIncomeModeToggle,
  walletTypeFilter = 'CREDIT_CARD',
  onWalletTypeFilterChange,
}: ExcelTableSlideProps) {
  return (
    <div 
      className={`${styles.slidePage} ${styles.slidePageRight} ${isOpen ? styles.slidePageRightOpen : ''}`}
    >
      <div className={styles.expensesPage}>
        <div className="container">
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <h1 className={styles.title}>{isIncomeMode ? '수입 등록' : '추가 기능'}</h1>
                <p className={styles.subtitle}>{isIncomeMode ? '수입 내역을 등록하고 관리하세요.' : '다양한 기능을 확인하고 활용하세요.'}</p>
              </div>
              <div className={styles.headerRight}>
                <button 
                  className={`${styles.buttonSecondary} ${isIncomeMode ? styles.buttonActive : ''}`}
                  onClick={onIncomeModeToggle}
                >
                  수입 등록
                </button>
                <div className={styles.walletTypeRadioGroup}>
                  {/*<label className={styles.radioLabel}>*/}
                  {/*  <input*/}
                  {/*    type="radio"*/}
                  {/*    name="walletType"*/}
                  {/*    value=""*/}
                  {/*    checked={walletTypeFilter === ''}*/}
                  {/*    onChange={(e) => onWalletTypeFilterChange?.(e.target.value)}*/}
                  {/*    className={styles.radioInput}*/}
                  {/*  />*/}
                  {/*  <span className={styles.radioText}>전체</span>*/}
                  {/*</label>*/}
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="walletType"
                      value="CREDIT_CARD"
                      checked={walletTypeFilter === 'CREDIT_CARD'}
                      onChange={(e) => onWalletTypeFilterChange?.(e.target.value)}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioText}>신용카드</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="walletType"
                      value="CHECK_CARD"
                      checked={walletTypeFilter === 'CHECK_CARD'}
                      onChange={(e) => onWalletTypeFilterChange?.(e.target.value)}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioText}>체크카드</span>
                  </label>
                </div>
              </div>
            </div>
          </header>

          {/* 정보 카드 */}
          {!isIncomeMode && (
            <div className={styles.excelCallout}>
              <div className={styles.excelCalloutIcon}>📋</div>
              <div className={styles.excelCalloutContent}>
                <div className={styles.excelCalloutTitle}>새로운 기능을 준비 중입니다</div>
                <div className={styles.excelCalloutDesc}>곧 더 많은 유용한 기능들을 만나보실 수 있어요.</div>
              </div>
              <div className={styles.excelCalloutCta}>준비중 →</div>
            </div>
          )}

          <section className={styles.formSection}>
            <div 
              className={styles.excelTableContainer}
              style={{
                '--grid-columns': String(excelWallets.length > 0 ? Math.min(excelWallets.length, 4) : 1)
              } as React.CSSProperties}
            >
              {excelWallets.length > 0 ? (
                excelWallets.map((wallet) => {
                  const walletData = excelTableData[wallet.wlt_id] || Array.from({ length: excelMaxRows }, () => ({ date: '', item: '', category: '', amount: '', trx_id: '' }));

                  return (
                    <div key={wallet.wlt_id} className={styles.excelCardSection}>
                      <div className={styles.excelCardHeader}>
                        <span className={styles.excelCardName}>{wallet.wlt_name}</span>
                      </div>
                      <div className={styles.excelTableWrapper}>
                        <table className={styles.excelTable}>
                          <thead>
                            <tr>
                              <th className={styles.excelTh}></th>
                              <th className={styles.excelTh}>항목</th>
                              <th className={styles.excelTh}>분류</th>
                              <th className={styles.excelTh}>금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {walletData.map((row, rowIndex) => (
                              <tr key={rowIndex} className={styles.excelTr}>
                                <td className={styles.excelTd}>
                                  <input
                                    type="text"
                                    className={styles.excelInput}
                                    defaultValue={row.date}
                                    onBlur={(e) => {
                                      const v = e.target.value;
                                      const prev = (excelTableData[wallet.wlt_id] || [])[rowIndex]?.date || '';
                                      if (prev !== v) {
                                        updateExcelTableData(wallet.wlt_id, rowIndex, 'date', v);
                                        maybeRegisterRow(wallet.wlt_id, rowIndex, row.trx_id, { date: v });
                                      }
                                    }}
                                    placeholder="일"
                                  />
                                </td>
                                <td className={styles.excelTd}>
                                  <input
                                    type="text"
                                    className={styles.excelInput}
                                    defaultValue={row.item}
                                    onBlur={(e) => {
                                      const v = e.target.value;
                                      const prev = (excelTableData[wallet.wlt_id] || [])[rowIndex]?.item || '';
                                      if (prev !== v) {
                                        updateExcelTableData(wallet.wlt_id, rowIndex, 'item', v);
                                        maybeRegisterRow(wallet.wlt_id, rowIndex, row.trx_id, { item: v });
                                      }
                                    }}
                                    placeholder="항목명"
                                  />
                                </td>
                                <td className={styles.excelTd}>
                                  <select
                                    className={styles.excelSelect}
                                    defaultValue={row.category}
                                    onChange={(e) => updateExcelTableData(wallet.wlt_id, rowIndex, 'category', e.target.value)}
                                    onBlur={(e) => {
                                      const v = (e.target as HTMLSelectElement).value;
                                      const prev = (excelTableData[wallet.wlt_id] || [])[rowIndex]?.category || '';
                                      // onChange로 이미 상태 반영되지만, 최종 비교 후 변경시에만 저장
                                      if (prev !== v) {
                                        maybeRegisterRow(wallet.wlt_id, rowIndex, row.trx_id, { category: v });
                                      }
                                    }}
                                  >
                                    <option value="">선택</option>
                                    {categories.map((cat) => (
                                      <option key={cat.cd} value={cat.cd}>{cat.cd_nm}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className={styles.excelTd}>
                                  <input
                                    type="text"
                                    className={styles.excelInput}
                                    defaultValue={row.amount}
                                    onBlur={(e) => {
                                      const formattedValue = formatAmountInput(e.target.value);
                                      const prev = (excelTableData[wallet.wlt_id] || [])[rowIndex]?.amount || '';
                                      if (prev !== formattedValue) {
                                        e.target.value = formattedValue;
                                        updateExcelTableData(wallet.wlt_id, rowIndex, 'amount', formattedValue);
                                        maybeRegisterRow(wallet.wlt_id, rowIndex, row.trx_id, { amount: formattedValue });
                                      }
                                    }}
                                    placeholder="0"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        className={styles.excelAddRowButton}
                        onClick={() => addExcelTableRow(wallet.wlt_id)}
                      >
                        <PlusIcon className={styles.excelAddRowIcon} />
                        <span>행 추가</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                    등록된 지갑이 없습니다.<br/>
                    지갑을 등록하면 거래 내역을 확인할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className={styles.listSection}>
            <h2 className={styles.sectionTitle}>샘플 리스트</h2>
            <div className={styles.ledgerList}>
              <div className={styles.ledgerMessage}>
                샘플 데이터가 표시됩니다.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
