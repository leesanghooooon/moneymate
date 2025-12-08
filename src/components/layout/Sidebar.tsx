'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  CubeIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import styles from '@/styles/css/Sidebar.module.css';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'MAIN',
    items: [
      { name: 'Home', path: '/', icon: HomeIcon },
      { name: 'Main', path: '/main', icon: Squares2X2Icon },
      { name: 'Chart', path: '/chart', icon: ChartBarIcon },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: '지갑', path: '/wallets', icon: WalletIcon },
      { name: '거래등록', path: '/transactions', icon: ClipboardDocumentIcon },
      { name: '거래조회', path: '/transactions/list', icon: ClipboardDocumentIcon },
      { name: '거래현황', path: '/transactions/summary', icon: ChartBarIcon },
    ],
  },
  {
    title: 'COMPONENTS',
    items: [
      { name: 'Components', path: '/components', icon: CubeIcon },
    ],
  },
  {
    title: 'BOARD',
    items: [
      { name: 'Board', path: '/board', icon: ClipboardDocumentIcon },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { name: 'Account', path: '/account', icon: UserIcon },
    ],
  },
];

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className={`${styles.sidebar} ${
        isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
      }`}
    >
      <div className={styles.sidebarHeader}>
        {!isCollapsed && (
          <h1 className={styles.sidebarTitle}>ADMIN PAGE</h1>
        )}
        <button
          onClick={handleToggle}
          className={styles.toggleButton}
          aria-label="사이드바 토글"
        >
          {isCollapsed ? (
            <Bars3Icon className={styles.toggleIcon} />
          ) : (
            <XMarkIcon className={styles.toggleIcon} />
          )}
        </button>
      </div>

      <nav className={styles.nav}>
        {menuSections.map((section) => (
          <div key={section.title} className={styles.section}>
            {!isCollapsed && (
              <div className={styles.sectionTitle}>
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              // 정확한 경로 일치만 활성화 (부분 일치 제거)
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`${styles.menuButton} ${
                    isActive ? styles.menuButtonActive : ''
                  } ${isCollapsed ? styles.menuButtonCollapsed : ''}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={styles.menuIcon} />
                  {!isCollapsed && <span className={styles.menuText}>{item.name}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
