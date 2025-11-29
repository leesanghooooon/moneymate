'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/expenses.module.css';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import FinancialOverviewSlide from './FinancialOverviewSlide';
import ExcelTableSlide from './ExcelTableSlide';

export default function ExpensesPage() {
  const { data: session, status } = useSession();

  // 슬라이드 상태 관리
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  // 비로그인 상태에서는 데이터 로딩하지 않음
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

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

            {/* 첫 번째 슬라이드 페이지: 재무 현황 (기본 화면, isSlideOpen이 false일 때 보임) */}
            <FinancialOverviewSlide
              isOpen={isSlideOpen}
            />

            {/* 두 번째 슬라이드 페이지: 엑셀 테이블 (isSlideOpen이 true일 때 보임) */}
            <ExcelTableSlide
              isOpen={isSlideOpen}
            />
          </div>
        </main>
      </div>
  );
}
