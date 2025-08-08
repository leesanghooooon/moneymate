'use client';

import { ReactNode } from 'react';
import styles from '../../styles/css/DashboardCard.module.css';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  showViewReport?: boolean;
  cardSize?: 'card-1' | 'card-2' | 'card-3' | 'card-4' | 'card-5' | 'card-6' | 'card-7' | 'card-8' | 'card-9' | 'card-10' | 'card-11' | 'card-12';
}

const DashboardCard = ({ title, children, className = '', showViewReport = false, cardSize = 'card-4' }: DashboardCardProps) => {
  return (
    <div className={`${styles.card} ${className} ${cardSize}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{title}</h3>
        {showViewReport && (
          <button className={styles.viewReportBtn}>
            View Report
          </button>
        )}
      </div>
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default DashboardCard; 