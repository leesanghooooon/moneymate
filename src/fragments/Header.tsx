'use client';

import styles from '../styles/css/Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
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
          <span className={styles.userIcon}>🍔</span>
          <span className={styles.userName}>Delicious Burger</span>
          <span className={styles.dropdownIcon}>▼</span>
        </div>
        <div className={styles.notificationIcon}>
          🔔
        </div>
      </div>
    </header>
  );
};

export default Header; 