'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/savings.module.css';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import SavingsTab from './SavingsTab';
import LoansTab from './LoansTab';
import { BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

export default function SavingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'savings' | 'loans'>('savings');

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
        <div className={styles.savingsPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>저축 & 대출 현황</h1>
                  <p className={styles.subtitle}>나의 저축목표와 대출현황을 확인하세요.</p>
                </div>
              </div>
            </header>

            {/* 탭 네비게이션 */}
            <div className={styles.tabNavigation}>
              <button
                className={`${styles.tabButton} ${activeTab === 'savings' ? styles.active : ''}`}
                onClick={() => setActiveTab('savings')}
              >
                <BanknotesIcon className={styles.tabIcon} />
                <span className={styles.tabLabel}>저축현황</span>
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'loans' ? styles.active : ''}`}
                onClick={() => setActiveTab('loans')}
              >
                <BuildingLibraryIcon className={styles.tabIcon} />
                <span className={styles.tabLabel}>대출현황</span>
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className={styles.tabContent}>
              {activeTab === 'savings' && <SavingsTab userId={session?.user?.id || ''} />}
              {activeTab === 'loans' && <LoansTab userId={session?.user?.id || ''} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
