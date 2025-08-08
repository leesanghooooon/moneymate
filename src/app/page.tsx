'use client';

import { useState } from 'react';
import Sidebar from '../fragments/Sidebar';
import Header from '../fragments/Header';
import RevenueCard from './components/RevenueCard';
import OrderTimeCard from './components/OrderTimeCard';
import RatingCard from './components/RatingCard';
import MostOrderedCard from './components/MostOrderedCard';
import OrderCard from './components/OrderCard';
import styles from '../styles/css/page.module.css';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className={`${styles.mainContent} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
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
    </div>
  );
}
