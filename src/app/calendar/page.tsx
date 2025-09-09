'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/calendar.module.css';
import { useEffect, useState } from 'react';
import TransactionModal from './TransactionModal';
import { Transaction, CalendarDay } from './types';

interface ModalState {
  isOpen: boolean;
  date: string;
  transactions: Transaction[];
}

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    date: '',
    transactions: []
  });
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  // 날짜 이동 함수
  const moveMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.year, prev.month - 1);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1
      };
    });
  };

  // 금액 포맷팅 함수
  const formatAmount = (amount: number, type: 'INCOME' | 'EXPENSE') => {
    const formatted = new Intl.NumberFormat('ko-KR').format(Math.abs(amount));
    return type === 'INCOME' ? `+${formatted}원` : `-${formatted}원`;
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const yyyy = currentDate.year.toString();
        const mm = currentDate.month.toString().padStart(2, '0');
        
        const response = await fetch(
          `/api/calendar?usr_id=tester01&yyyy=${yyyy}&mm=${mm}`
        );

        if (!response.ok) {
          throw new Error('데이터 로딩 실패');
        }

        const result = await response.json();
        
        if (!mounted) return;
        setCalendarData(result.data);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || '데이터 로딩 실패');
        setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [currentDate]);

  // 달력 그리드 생성을 위한 계산
  const getCalendarDays = () => {
    const firstDay = new Date(currentDate.year, currentDate.month - 1, 1);
    const lastDay = new Date(currentDate.year, currentDate.month, 0);
    const startOffset = firstDay.getDay(); // 0 (일요일) ~ 6 (토요일)
    const totalDays = lastDay.getDate();
    
    return Array.from({ length: 35 }, (_, i) => {
      const dayNumber = i - startOffset + 1;
      const currentDayData = calendarData.find(
        day => day.cal_dt === `${currentDate.year}-${currentDate.month.toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`
      );

      return {
        dayNumber,
        isCurrentMonth: dayNumber > 0 && dayNumber <= totalDays,
        data: currentDayData
      };
    });
  };

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.calendarPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>캘린더</h1>
                  <p className={styles.subtitle}>달력으로 지출/수입 내역을 확인하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <div className={styles.dateNavigation}>
                    <button 
                      className={styles.buttonGhost}
                      onClick={() => moveMonth('prev')}
                    >
                      &lt;
                    </button>
                    <span className={styles.currentDate}>
                      {currentDate.year}년 {currentDate.month}월
                    </span>
                    <button 
                      className={styles.buttonGhost}
                      onClick={() => moveMonth('next')}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <section className={styles.calendarSection}>
              {error && (
                <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>
              )}
              {loading ? (
                <div className={styles.loading}>로딩 중...</div>
              ) : (
                <div className={styles.calendarGrid}>
                  <div className={styles.weekdayHeader}>
                    {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                      <div key={day} className={styles.weekday}>{day}</div>
                    ))}
                  </div>
                  <div className={styles.daysGrid}>
                    {getCalendarDays().map((day, i) => (
                      <div 
                        key={i} 
                        className={`${styles.dayCell} ${
                          day.isCurrentMonth ? styles.currentMonth : styles.otherMonth
                        } ${day.data?.is_holiday === 'Y' ? styles.holiday : ''}`}
                      >
                        {day.isCurrentMonth && (
                          <>
                            <div className={styles.dayNumber}>
                              {day.dayNumber}
                              {day.data?.holiday_name && (
                                <span className={styles.holidayName}>
                                  {day.data.holiday_name}
                                </span>
                              )}
                            </div>
                            {day.data && (
                              <div className={styles.transactions}>
                                {/*{day.data.income_sum > 0 && (*/}
                                {/*  <div className={`${styles.transaction} ${styles.income}`}>*/}
                                {/*    <span className={styles.amount}>*/}
                                {/*      {formatAmount(day.data.income_sum, 'INCOME')}*/}
                                {/*    </span>*/}
                                {/*  </div>*/}
                                {/*)}*/}
                                {/*{day.data.expense_sum > 0 && (*/}
                                {/*  <div className={`${styles.transaction} ${styles.expense}`}>*/}
                                {/*    <span className={styles.amount}>*/}
                                {/*      {formatAmount(day.data.expense_sum, 'EXPENSE')}*/}
                                {/*    </span>*/}
                                {/*  </div>*/}
                                {/*)}*/}
                                {day.data.trx_list.slice(0, 2).map((trx) => (
                                  <div 
                                    key={trx.trx_id}
                                    className={`${styles.transaction} ${
                                      trx.trx_type === 'INCOME' ? styles.income : styles.expense
                                    }`}
                                  >
                                    <span className={styles.amount}>
                                      {formatAmount(trx.amount, trx.trx_type)}
                                    </span>
                                    <span className={styles.category}>
                                      {trx.memo || trx.category_cd}
                                    </span>
                                  </div>
                                ))}
                                {day.data.trx_list.length > 2 && (
                                  <div 
                                    className={styles.moreTransactions}
                                    onClick={() => setModal({
                                      isOpen: true,
                                      date: day.data?.cal_dt || '',
                                      transactions: day.data?.trx_list || []
                                    })}
                                  >
                                    +{day.data.trx_list.length - 2}건 더보기
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      {modal.isOpen && (
        <TransactionModal
          date={modal.date}
          transactions={modal.transactions}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}