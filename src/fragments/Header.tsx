'use client';

import { useState } from 'react';
import styles from '../styles/css/Header.module.css';
import { useRouter } from 'next/navigation';

const Header = () => {
  const [activeMenu, setActiveMenu] = useState('home');
  const router = useRouter();

  const menuItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'expenses', label: 'Expenses', path: '/expenses' },
    { id: 'income', label: 'Income' },
    { id: 'statistics', label: 'Statistics' },
  ];

  const handleClick = (item: { id: string; path?: string }) => {
    setActiveMenu(item.id);
    if (item.path) {
      router.push(item.path);
    }
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
          
          <div className={styles.userSection}>
            <div className={styles.userProfile}>
              <span className={styles.userIcon}>👤</span>
              <span className={styles.userName}>User</span>
              <span className={styles.dropdownIcon}>▼</span>
            </div>
            <div className={styles.notificationIcon}>
              🔔
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 