'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../../styles/css/expenses.module.css';
import { useCategories, useIncome } from '../../contexts/CommonCodesContext';
import { get, post } from '../../lib/api/common';
import { useToast } from '../../components/Toast';
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
}

export default function ExcelTableSlide({
  isOpen,
}: ExcelTableSlideProps) {
  const { data: session } = useSession();
  const { show } = useToast();

  // 수입 등록 모드 상태
  const [isIncomeMode, setIsIncomeMode] = useState<boolean>(false);
  
  // 지갑 타입 필터 (신용카드/체크카드 선택)
  const [walletTypeFilter, setWalletTypeFilter] = useState<string>('CREDIT_CARD');

  // 공통 코드는 Context에서 가져오기
  const { categories: allCategories } = useCategories();
  const { income: allIncome } = useIncome();
  
  // 거래 유형에 따른 카테고리 필터링 (지출/수입 모드에 따라)
  const categories = useMemo(() => {
    return isIncomeMode ? allIncome : allCategories;
  }, [isIncomeMode, allCategories, allIncome]);

  // 엑셀 테이블 데이터 상태 관리 (지갑별 30개 행)
  const [excelTableData, setExcelTableData] = useState<Record<string, ExcelTableRow[]>>({});
  // 엑셀 테이블에 표시할 지갑 목록 (API 응답 기준)
  const [excelWallets, setExcelWallets] = useState<ExcelWallet[]>([]);
  // 지갑들 중 가장 많은 행 수 (기본 30)
  const [excelMaxRows, setExcelMaxRows] = useState<number>(30);
  // 월별 표기 기간 (API 응답 기준)
  const [excelPeriod, setExcelPeriod] = useState<{ year: number; month: number } | null>(null);
  // 자동등록 중복 방지 (지갑별/행별)
  const [submittedRows, setSubmittedRows] = useState<Record<string, Record<number, boolean>>>({});
  // 각 행의 기존 trx_id 보관 (지갑별 인덱스 정렬)
  const [excelRowIds, setExcelRowIds] = useState<Record<string, Array<string | null>>>({});

  // 월별 지갑별 지출/수입 목록 API 호출하여 엑셀 테이블 데이터 구성
  const fetchMonthlyExpenses = useCallback(async (trxType: 'EXPENSE' | 'INCOME' = 'EXPENSE', wltType?: string) => {
    if (!session?.user?.id || !isOpen) return;
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
      const nextData: Record<string, ExcelTableRow[]> = {};
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
              trx_id: String(t.trx_id || '')
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
  }, [session?.user?.id, isOpen]);

  // 슬라이드가 열리고 지출 모드일 때만 자동으로 데이터 조회
  useEffect(() => {
    if (isOpen && !isIncomeMode && session?.user?.id) {
      fetchMonthlyExpenses('EXPENSE', walletTypeFilter || undefined);
    }
  }, [isOpen, fetchMonthlyExpenses, isIncomeMode, walletTypeFilter, session?.user?.id]);
  
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

  // 금액 포맷팅 함수 (천 단위 쉼표 추가)
  const formatAmountInput = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    // 빈 문자열이면 그대로 반환
    if (!numbers) return '';
    // 천 단위 쉼표 추가
    return new Intl.NumberFormat('ko-KR').format(Number(numbers));
  };

  // 엑셀 테이블 데이터 업데이트 함수
  const updateExcelTableData = (walletId: string, rowIndex: number, field: 'date' | 'item' | 'category' | 'amount', value: string) => {
    setExcelTableData(prev => {
      const walletData = prev[walletId] || Array.from({ length: 30 }, () => ({ date: '', item: '', category: '', amount: '', trx_id: '' }));
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
    overrides?: Partial<ExcelTableRow>
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
      const trxType = isIncomeMode ? 'INCOME' : 'EXPENSE';
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
      const newRow: ExcelTableRow = { date: '', item: '', category: '', amount: '', trx_id: '' };
      return { ...prev, [walletId]: [...walletData, newRow] };
    });
  };
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
                  onClick={handleIncomeModeToggle}
                >
                  수입 등록
                </button>
                <div className={styles.walletTypeRadioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="walletType"
                      value="CREDIT_CARD"
                      checked={walletTypeFilter === 'CREDIT_CARD'}
                      onChange={(e) => handleWalletTypeFilterChange(e.target.value)}
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
                      onChange={(e) => handleWalletTypeFilterChange(e.target.value)}
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
                  const walletRowIds = excelRowIds[wallet.wlt_id] || [];

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
                            {walletData.map((row, rowIndex) => {
                              const trxId = walletRowIds[rowIndex] || row.trx_id || '';
                              return (
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
                                          maybeRegisterRow(wallet.wlt_id, rowIndex, trxId, { date: v });
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
                                          maybeRegisterRow(wallet.wlt_id, rowIndex, trxId, { item: v });
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
                                          maybeRegisterRow(wallet.wlt_id, rowIndex, trxId, { category: v });
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
                                          maybeRegisterRow(wallet.wlt_id, rowIndex, trxId, { amount: formattedValue });
                                        }
                                      }}
                                      placeholder="0"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
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
