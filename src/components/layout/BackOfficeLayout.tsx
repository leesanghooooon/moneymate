'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from '@/styles/css/BackOfficeLayout.module.css';

interface BackOfficeLayoutProps {
  children: React.ReactNode;
}

export default function BackOfficeLayout({ children }: BackOfficeLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMenuToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={styles.layout}>
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      <div
        className={`${styles.mainContent} ${
          sidebarCollapsed ? styles.mainContentCollapsed : styles.mainContentExpanded
        }`}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMenuToggle={handleMenuToggle}
        />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
