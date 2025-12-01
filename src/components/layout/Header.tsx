'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Bars3Icon, ChevronDownIcon } from '@heroicons/react/24/outline';
import styles from '@/styles/css/Header.module.css';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/main': 'Main',
  '/chart': 'Chart',
  '/board': 'Board',
  '/calendar': 'Calendar',
  '/account': 'Account',
};

const pageDescriptions: Record<string, string> = {
  '/': '메인페이지입니다.',
  '/main': '메인 페이지입니다.',
  '/chart': '차트 페이지입니다.',
  '/board': '게시판 페이지입니다.',
  '/calendar': '캘린더 페이지입니다.',
  '/account': '계정 페이지입니다.',
};

export default function Header({ sidebarCollapsed = false, onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const pageTitle = pageTitles[pathname] || 'Home';
  const pageDescription = pageDescriptions[pathname] || '메인페이지입니다.';

  return (
    <header
      className={`${styles.header} ${
        sidebarCollapsed ? styles.headerCollapsed : styles.headerExpanded
      }`}
    >
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <button
            onClick={onMenuToggle}
            className={styles.menuToggleButton}
            aria-label="메뉴 토글"
          >
            <Bars3Icon className={styles.menuToggleIcon} />
          </button>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            <span className={styles.pageDescription}>{pageDescription}</span>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.userProfile}>
            <span className={styles.userName}>
              {session?.user?.nickname || session?.user?.email || 'test01'}
            </span>
            <ChevronDownIcon className={styles.dropdownIcon} />
          </div>
          
          <div className={styles.breadcrumb}>
            <span>Main</span>
            <span>/</span>
            <span className={styles.breadcrumbItem}>{pageTitle}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
