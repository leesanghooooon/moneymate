'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Bars3Icon, ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import styles from '@/styles/css/Header.module.css';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/main': 'Main',
  '/chart': 'Chart',
  '/wallets': '지갑 관리',
  '/transactions': '거래 등록',
  '/transactions/list': '거래 조회',
  '/transactions/summary': '거래 현황',
  '/components': 'Components',
  '/board': 'Board',
  '/account': 'Account',
};

const pageDescriptions: Record<string, string> = {
  '/': '메인페이지입니다.',
  '/main': '메인 페이지입니다.',
  '/chart': '차트 페이지입니다.',
  '/wallets': '사용자의 지갑 목록을 조회하고 관리할 수 있습니다.',
  '/transactions': '수입/지출 거래를 등록할 수 있습니다.',
  '/transactions/list': '등록된 거래를 엑셀 스타일로 조회할 수 있습니다.',
  '/transactions/summary': '월별, 지갑별 거래 통계를 한눈에 확인할 수 있습니다.',
  '/components': '컴포넌트 샘플 모음입니다.',
  '/board': '게시판 페이지입니다.',
  '/account': '계정 페이지입니다.',
};

export default function Header({ sidebarCollapsed = false, onMenuToggle }: HeaderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const pageTitle = pageTitles[pathname] || 'Home';
  const pageDescription = pageDescriptions[pathname] || '메인페이지입니다.';

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleLogin = () => {
    router.push('/login');
  };

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
          {status === 'authenticated' && session ? (
            <div className={styles.userProfileContainer} ref={dropdownRef}>
              <button
                className={styles.userProfile}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className={styles.userName}>
                  {session?.user?.nickname || session?.user?.email || 'test01'}
                </span>
                <ChevronDownIcon className={styles.dropdownIcon} />
              </button>
              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownItem}>
                    <span className={styles.dropdownItemLabel}>이메일:</span>
                    <span className={styles.dropdownItemValue}>{session?.user?.email || '-'}</span>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <button
                    className={styles.dropdownButton}
                    onClick={handleLogout}
                  >
                    <ArrowRightOnRectangleIcon className={styles.dropdownButtonIcon} />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className={styles.loginButton}
              onClick={handleLogin}
            >
              로그인
            </button>
          )}
          
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
