'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../styles/css/Header.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

const Header = () => {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('home');
  const router = useRouter();
  const { data: session, status } = useSession(); // status 추가
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const menuItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'expenses', label: 'Expenses', path: '/expenses' },
    { id: 'savings', label: 'Goal', path: '/savings' },
    { id: 'calendar', label: 'Calendar', path: '/calendar' },
    { id: 'statistics', label: 'Statistics' },
  ];

  // URL 경로에 따라 active 메뉴 설정
  useEffect(() => {
    const currentPath = pathname;
    const currentMenuItem = menuItems.find(item => item.path === currentPath);
    if (currentMenuItem) {
      setActiveMenu(currentMenuItem.id);
    } else {
      // 기본값으로 home 설정
      setActiveMenu('home');
    }
  }, [pathname]);

  const handleClick = (item: { id: string; path?: string }) => {
    setActiveMenu(item.id);
    if (item.path) {
      router.push(item.path);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <h2>MoneyMate</h2>
          </div>
        </div>
        
        <div className={styles.headerCenter}>
          <nav className={styles.navigation}>
            <ul className={styles.menuList}>
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                    onClick={() => handleClick(item)}
                  >
                    <span className={styles.label}>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.authSection}>
            {/* 세션 로딩 중일 때는 아무것도 표시하지 않음 */}
            {status === 'loading' ? (
              <div style={{ width: '120px', height: '40px' }}></div>
            ) : session?.user ? (
              <div className={styles.profileContainer} ref={profileRef}>
                <button 
                  className={styles.profileButton}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className={styles.profileImage}>
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className={styles.defaultProfile}>
                        {(session.user.nickname || session.user.email || '').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={`${styles.dropdownArrow} ${isProfileOpen ? styles.open : ''}`}>▼</span>
                </button>
                
                <div className={`${styles.dropdownMenu} ${isProfileOpen ? styles.show : ''}`}>
                  <div className={styles.dropdownHeader}>
                    <strong>{session.user.nickname || session.user.email}</strong>
                    <span>{session.user.email}</span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} onClick={() => router.push('/profile')}>
                    계정 관리
                  </button>
                  <button className={styles.dropdownItem}>
                    비밀번호 변경
                  </button>
                  <button className={styles.dropdownItem}>
                    활동 기록
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} onClick={() => router.push('/wallets')}>
                    지갑 관리
                  </button>
                  <button className={styles.dropdownItem} onClick={() => router.push('/share-groups')}>
                    가계부 공유
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  className={styles.loginButton}
                  onClick={() => router.push('/login')}
                >
                  로그인
                </button>
                <button 
                  className={styles.signupButton}
                  onClick={() => router.push('/signup')}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;