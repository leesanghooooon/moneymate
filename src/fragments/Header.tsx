'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/css/Header.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const Header = () => {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('home');
  const router = useRouter();
  const { data: session } = useSession();

  const menuItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'expenses', label: 'Expenses', path: '/expenses' },
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
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search"
                className={styles.searchInput}
              />
            </div>
          </div>
          
          <div className={styles.authSection}>
            {session?.user ? (
              <>
                <div className={styles.userInfo}>
                  <span className={styles.userIcon}>👤</span>
                  <span className={styles.userName}>
                    {session.user.nickname || session.user.email}
                  </span>
                </div>
                <button 
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
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