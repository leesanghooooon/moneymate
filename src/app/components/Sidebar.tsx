'use client';

import { useState } from 'react';
import styles from '../../styles/css/Sidebar.module.css';

const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'food-order', label: 'Food Order', icon: '🛒' },
    { id: 'manage-menu', label: 'Manage Menu', icon: '📄' },
    { id: 'customer-review', label: 'Customer Review', icon: '💬' },
  ];

  const otherItems = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'accounts', label: 'Accounts', icon: '👤' },
    { id: 'help', label: 'Help', icon: '❓' },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>GOODFOOD</h2>
      </div>
      
      <div className={styles.menuSection}>
        <h3>MENU</h3>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.menuSection}>
        <h3>OTHERS</h3>
        <ul className={styles.menuList}>
          {otherItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar; 