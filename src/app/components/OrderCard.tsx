'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/OrderCard.module.css';

const OrderCard = () => {
  const orderData = [
    { day: 1, current: 420, previous: 400 },
    { day: 2, current: 380, previous: 420 },
    { day: 3, current: 450, previous: 380 },
    { day: 4, current: 400, previous: 450 },
    { day: 5, current: 480, previous: 400 },
    { day: 6, current: 438, previous: 480 },
  ];

  const maxValue = Math.max(...orderData.map(d => Math.max(d.current, d.previous)));

  return (
    <DashboardCard title="Order" showViewReport={true} cardSize="card-4">
      <div className={styles.orderInfo}>
        <div className={styles.amount}>2.568</div>
        <div className={styles.change}>
          <span className={styles.changeIcon}>↓</span>
          <span className={styles.changeText}>2.1% vs last week</span>
        </div>
        <div className={styles.period}>Sales from 1-6 Dec, 2020</div>
      </div>
      
      <div className={styles.chart}>
        <svg className={styles.lineChart} viewBox="0 0 300 100">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="300"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Current week line */}
          <polyline
            points={orderData.map((data, index) => 
              `${(index / (orderData.length - 1)) * 300},${100 - (data.current / maxValue) * 100}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Previous week line */}
          <polyline
            points={orderData.map((data, index) => 
              `${(index / (orderData.length - 1)) * 300},${100 - (data.previous / maxValue) * 100}`
            ).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {orderData.map((data, index) => (
            <circle
              key={index}
              cx={(index / (orderData.length - 1)) * 300}
              cy={100 - (data.current / maxValue) * 100}
              r="3"
              fill="#3b82f6"
            />
          ))}
        </svg>
        
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

export default OrderCard; 