'use client';

import { useSession } from 'next-auth/react';
import RevenueCard from './components/RevenueCard';
import OrderTimeCard from './components/OrderTimeCard';
import RatingCard from './components/RatingCard';
import MostOrderedCard from './components/MostOrderedCard';
import OrderCard from './components/OrderCard';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import styles from '../styles/css/page.module.css';

export default function Home() {
  const { data: session, status } = useSession();

  // 비로그인 상태에서는 로그인 유도 모달 표시
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  return (
    <div className={styles.dashboard}>
      <main className={styles.dashboardBody}>
        <div className={styles.dashboardGrid}>
          <RevenueCard />
          <OrderTimeCard />
          <RatingCard />
          <MostOrderedCard />
          <OrderCard />
        </div>
      </main>
    </div>
  );
}
