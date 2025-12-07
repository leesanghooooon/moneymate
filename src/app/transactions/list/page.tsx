'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/api/axios';
import { formatCurrency, removeCommas } from '@/lib/utils/format';
import styles from '@/styles/css/transactions-list.module.css';

// 지갑 타입
interface Wallet {
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
}

// 거래 타입
interface Transaction {
  trx_id: string;
  wlt_id: string;
  wlt_name: string;
  trx_type: string;
  trx_date: string;
  amount: string; // String 타입으로 변경
  category_cd: string;
  category_name: string;
  memo: string;
  created_at?: string; // 정렬을 위해 추가
}

export default function TransactionsListPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 날짜 선택
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // 지갑 타입 필터 (기본값: 신용카드)
  const [selectedWltType, setSelectedWltType] = useState<'CHECK_CARD' | 'CREDIT_CARD'>('CREDIT_CARD');

  // 지갑 목록 조회
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchWallets();
    }
  }, [status, session]);

  // 거래 목록 조회
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && wallets.length > 0) {
      fetchTransactions();
    }
  }, [status, session, selectedYear, selectedMonth, selectedWltType, wallets.length]);

  const fetchWallets = async () => {
    try {
      const response = await apiClient.get<Wallet[]>('/wallets', {
        params: {
          usr_id: session?.user?.id,
          use_yn: 'Y',
        },
      });
      setWallets(response.data || []);
    } catch (err: any) {
      console.error('지갑 목록 조회 오류:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const response = await apiClient.get<any[]>('/transactions', {
        params: {
          usr_id: session?.user?.id,
          start_date: startDate,
          end_date: endDate,
          use_yn: 'Y',
        },
      });

      // amount를 string으로 변환하고 콤마 처리
      const formattedTransactions: Transaction[] = (response.data || []).map((trx: any) => {
        // API 응답에서 받은 amount 값 (DB에서 number로 올 가능성이 높음)
        const apiAmount = trx.amount;
        
        // formatCurrency 함수로 콤마 처리 (number, string 모두 처리)
        // API 응답의 amount는 number 타입일 가능성이 높으므로 항상 formatCurrency로 처리
        const formattedAmount = formatCurrency(apiAmount);
        
        return {
          trx_id: trx.trx_id,
          wlt_id: trx.wlt_id,
          wlt_name: trx.wlt_name,
          trx_type: trx.trx_type,
          trx_date: trx.trx_date,
          amount: formattedAmount, // 콤마가 포함된 문자열
          category_cd: trx.category_cd || '',
          category_name: trx.category_name || '',
          memo: trx.memo || '',
          created_at: trx.created_at,
        };
      });

      setTransactions(formattedTransactions);
    } catch (err: any) {
      console.error('거래 목록 조회 오류:', err);
      setError('거래 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 월 변경 핸들러
  const handleMonthChange = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // 날짜 포맷팅 (일만 표시)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };


  // 필터링된 지갑 목록
  const filteredWallets = wallets.filter(wallet => {
    return wallet.wlt_type === selectedWltType;
  });

  // 지갑별 거래 개수 확인하여 최대값 구하기
  const getMaxTransactionCount = (): number => {
    let maxCount = 0;
    
    filteredWallets.forEach(wallet => {
      const count = transactions.filter(t => t.wlt_id === wallet.wlt_id).length;
      if (count > maxCount) {
        maxCount = count;
      }
    });
    
    // 최소 30개, 최대값이 30개 이상이면 최대값 사용
    return Math.max(30, maxCount);
  };

  // 동적 Row 개수 계산
  const defaultRowCount = getMaxTransactionCount();

  // 지갑별 거래 필터링 (1일부터 정렬, 동적 row 개수)
  const getWalletTransactions = (wltId: string): (Transaction | null)[] => {
    const filtered = transactions
      .filter(t => t.wlt_id === wltId)
      .sort((a, b) => {
        // 날짜 기준 오름차순 (1일부터)
        if (a.trx_date !== b.trx_date) {
          return a.trx_date.localeCompare(b.trx_date);
        }
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      });

    // 동적으로 계산된 row 개수로 채우기 (부족한 경우 null로 채움)
    const rows: (Transaction | null)[] = [...filtered];
    while (rows.length < defaultRowCount) {
      rows.push(null);
    }
    
    return rows.slice(0, defaultRowCount);
  };

  // 거래 수정 핸들러
  const handleTransactionUpdate = async (
    trxId: string,
    field: 'memo' | 'category_cd' | 'amount',
    value: string
  ) => {
    try {
      // 로컬 상태 먼저 업데이트 (즉시 반영)
      setTransactions(prev => 
        prev.map(t => {
          if (t.trx_id === trxId) {
            // amount 필드인 경우 콤마 제거
            if (field === 'amount') {
              const cleanValue = removeCommas(value);
              return { ...t, [field]: formatCurrency(cleanValue) };
            }
            return { ...t, [field]: value };
          }
          return t;
        })
      );

      // API 호출 (amount는 숫자로 전송)
      const updateData: any = {};
      if (field === 'amount') {
        updateData[field] = parseFloat(removeCommas(value)) || 0;
      } else {
        updateData[field] = value;
      }

      await apiClient.put(`/transactions/${trxId}`, updateData);
    } catch (err: any) {
      console.error('거래 수정 오류:', err);
      // 실패 시 원래대로 복구
      fetchTransactions();
    }
  };

  // 새 거래 추가 핸들러
  const handleAddTransaction = async (wltId: string) => {
    if (!session?.user?.id) return;

    try {
      const today = new Date();
      const todayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      await apiClient.post('/transactions', {
        wlt_id: wltId,
        usr_id: session.user.id,
        trx_type: 'EXPENSE',
        trx_date: todayStr,
        amount: 0,
        category_cd: '',
        memo: '',
        is_fixed: 'N',
      });

      // 새 거래 추가 후 목록 새로고침
      fetchTransactions();
    } catch (err: any) {
      console.error('거래 추가 오류:', err);
      setError('거래 추가에 실패했습니다.');
    }
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
      {/* 헤더 - 년/월 선택 및 지갑 타입 필터 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.dateSelector}>
            <button
              onClick={() => handleMonthChange(-1)}
              className={styles.monthButton}
            >
              ‹
            </button>
            <div className={styles.dateDisplay}>
              <span className={styles.year}>{selectedYear}</span>
              <span className={styles.month}>{selectedMonth}</span>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className={styles.monthButton}
            >
              ›
            </button>
          </div>
          
          {/* 지갑 타입 필터 버튼 */}
          <div className={styles.walletTypeFilter}>
            <button
              onClick={() => setSelectedWltType('CHECK_CARD')}
              className={`${styles.filterButton} ${selectedWltType === 'CHECK_CARD' ? styles.filterButtonActive : ''}`}
            >
              체크카드
            </button>
            <button
              onClick={() => setSelectedWltType('CREDIT_CARD')}
              className={`${styles.filterButton} ${selectedWltType === 'CREDIT_CARD' ? styles.filterButtonActive : ''}`}
            >
              신용카드
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {/* 지갑별 카드 */}
      <div className={styles.walletCards}>
        {filteredWallets.map((wallet) => {
          const walletTransactions = getWalletTransactions(wallet.wlt_id);

          return (
            <div key={wallet.wlt_id} className={styles.walletCard}>
              {/* 지갑명 헤더 */}
              <div className={styles.walletHeader}>
                <h2 className={styles.walletTitle}>{wallet.wlt_name}</h2>
                <button
                  onClick={() => handleAddTransaction(wallet.wlt_id)}
                  className={styles.addButton}
                >
                  + 추가
                </button>
              </div>

              {/* 테이블 */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.headerRow}>
                      <th className={styles.headerCell}>날짜</th>
                      <th className={styles.headerCell}>사용처</th>
                      <th className={styles.headerCell}>카테고리</th>
                      <th className={styles.headerCell}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTransactions.map((transaction, index) => {
                      // 빈 row인 경우
                      if (!transaction) {
                        return (
                          <tr key={`empty-${index}`} className={styles.dataRow}>
                            <td className={styles.dataCell}></td>
                            <td className={styles.dataCell}>
                              <input
                                type="text"
                                className={styles.editableInput}
                                placeholder="사용처"
                                readOnly
                              />
                            </td>
                            <td className={styles.dataCell}>
                              <input
                                type="text"
                                className={styles.editableInput}
                                placeholder="카테고리"
                                readOnly
                              />
                            </td>
                            <td className={styles.dataCell}>
                              <input
                                type="text"
                                className={styles.editableInput}
                                placeholder="0"
                                readOnly
                              />
                            </td>
                          </tr>
                        );
                      }

                      const date = new Date(transaction.trx_date);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <tr
                          key={transaction.trx_id}
                          className={`${styles.dataRow} ${isWeekend ? styles.weekendRow : ''}`}
                        >
                          <td className={styles.dataCell}>
                            {formatDate(transaction.trx_date)}
                          </td>
                          <td className={styles.dataCell}>
                            <input
                              type="text"
                              value={transaction.memo || ''}
                              onChange={(e) => {
                                setTransactions(prev => 
                                  prev.map(t => 
                                    t.trx_id === transaction.trx_id 
                                      ? { ...t, memo: e.target.value }
                                      : t
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== transaction.memo) {
                                  handleTransactionUpdate(transaction.trx_id, 'memo', e.target.value);
                                }
                              }}
                              className={styles.editableInput}
                              placeholder="사용처"
                            />
                          </td>
                          <td className={styles.dataCell}>
                            <input
                              type="text"
                              value={transaction.category_name || ''}
                              onChange={(e) => {
                                setTransactions(prev => 
                                  prev.map(t => 
                                    t.trx_id === transaction.trx_id 
                                      ? { ...t, category_cd: e.target.value }
                                      : t
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== transaction.category_cd) {
                                  handleTransactionUpdate(transaction.trx_id, 'category_cd', e.target.value);
                                }
                              }}
                              className={styles.editableInput}
                              placeholder="카테고리"
                            />
                          </td>
                          <td className={styles.dataCell}>
                            <input
                              type="text"
                              value={transaction.amount || '0'}
                              onChange={(e) => {
                                // 숫자만 입력 허용 (콤마 제거하여 입력)
                                const cleaned = removeCommas(e.target.value);
                                const formatted = cleaned ? formatCurrency(cleaned) : '';
                                setTransactions(prev => 
                                  prev.map(t => 
                                    t.trx_id === transaction.trx_id 
                                      ? { ...t, amount: formatted }
                                      : t
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const cleaned = removeCommas(e.target.value);
                                const formatted = cleaned ? formatCurrency(cleaned) : '0';
                                if (formatted !== transaction.amount) {
                                  handleTransactionUpdate(transaction.trx_id, 'amount', formatted);
                                }
                              }}
                              className={styles.editableInput}
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
