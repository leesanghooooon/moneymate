'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/RevenueCard.module.css';

const RevenueCard = () => {
  const revenueData = [
    { day: 1, current: 1200, previous: 1100 },
    { day: 2, current: 1400, previous: 1300 },
    { day: 3, current: 1600, previous: 1500 },
    { day: 4, current: 1800, previous: 1700 },
    { day: 5, current: 2000, previous: 1900 },
    { day: 6, current: 2200, previous: 2100 },
    { day: 7, current: 2400, previous: 2300 },
    { day: 8, current: 2600, previous: 2500 },
    { day: 9, current: 2800, previous: 2700 },
    { day: 10, current: 3000, previous: 2900 },
    { day: 11, current: 3200, previous: 3100 },
    { day: 12, current: 3400, previous: 3300 },
  ];

  const maxValue = Math.max(...revenueData.map(d => Math.max(d.current, d.previous)));

  return (
    <DashboardCard title="Revenue" showViewReport={true} cardSize="card-9">
      <div className={styles.revenueInfo}>
        <div className={styles.amount}>IDR 7.852.000</div>
        <div className={styles.change}>
          <span className={styles.changeIcon}>↑</span>
          <span className={styles.changeText}>2.1% vs last week</span>
        </div>
        <div className={styles.period}>Sales from 1-12 Dec, 2020</div>
      </div>
      
      <div className={styles.chart}>
        <div className={styles.chartBars}>
          {revenueData.map((data, index) => (
            <div key={index} className={styles.barGroup}>
              <div 
                className={styles.bar}
                style={{ 
                  height: `${(data.current / maxValue) * 100}%`,
                  backgroundColor: '#3b82f6'
                }}
              />
              <div 
                className={`${styles.bar} ${styles.previousBar}`}
                style={{ 
                  height: `${(data.previous / maxValue) * 100}%`,
                  backgroundColor: '#e5e7eb'
                }}
              />
            </div>
          ))}
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Last 6 days</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#e5e7eb' }}></div>
            <span>Last Week</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default RevenueCard; 