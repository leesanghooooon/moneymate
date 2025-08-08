'use client';

import { useState } from 'react';
import styles from '../styles/css/Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
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
    <>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <h2 className={isOpen ? styles.show : styles.hide}>GOODFOOD</h2>
          </div>
        </div>
        
        <div className={styles.menuSection}>
          <h3 className={`${styles.sectionTitle} ${isOpen ? styles.show : styles.hide}`}>MENU</h3>
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                  onClick={() => setActiveMenu(item.id)}
                  title={isOpen ? item.label : item.label}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={`${styles.label} ${isOpen ? styles.show : styles.hide}`}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.menuSection}>
          <h3 className={`${styles.sectionTitle} ${isOpen ? styles.show : styles.hide}`}>OTHERS</h3>
          <ul className={styles.menuList}>
            {otherItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                  onClick={() => setActiveMenu(item.id)}
                  title={isOpen ? item.label : item.label}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={`${styles.label} ${isOpen ? styles.show : styles.hide}`}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button className={styles.toggleButton} onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={onToggle} />
      )}
    </>
  );
};

export default Sidebar; 