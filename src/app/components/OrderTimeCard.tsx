'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/OrderTimeCard.module.css';

const OrderTimeCard = () => {
  const timeData = [
    { time: 'Morning', percentage: 28, color: '#f59e0b' },
    { time: 'Afternoon', percentage: 40, color: '#3b82f6' },
    { time: 'Evening', percentage: 32, color: '#8b5cf6' },
  ];

  const totalOrders = 1890;

  return (
    <DashboardCard title="Order Time" showViewReport={true} cardSize="card-3">
      <div className={styles.period}>From 1-6 Dec, 2020</div>
      
      <div className={styles.chartContainer}>
        <div className={styles.donutChart}>
          <div className={styles.donutCenter}>
            <div className={styles.totalOrders}>{totalOrders}</div>
            <div className={styles.ordersLabel}>orders</div>
          </div>
          <svg className={styles.donutSvg} viewBox="0 0 120 120">
            {timeData.map((data, index) => {
              const radius = 50;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference - (data.percentage / 100) * circumference;
              const startAngle = index * 120; // 360 / 3 = 120 degrees
              const x1 = 60 + radius * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 60 + radius * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 60 + radius * Math.cos((startAngle + 120 - 90) * Math.PI / 180);
              const y2 = 60 + radius * Math.sin((startAngle + 120 - 90) * Math.PI / 180);
              
              const largeArcFlag = data.percentage > 50 ? 1 : 0;
              const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
              
              return (
                <path
                  key={data.time}
                  d={pathData}
                  fill="none"
                  stroke={data.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
          </svg>
        </div>
        
        <div className={styles.legend}>
          {timeData.map((data) => (
            <div key={data.time} className={styles.legendItem}>
              <div 
                className={styles.legendColor} 
                style={{ backgroundColor: data.color }}
              ></div>
              <span className={styles.legendText}>{data.time} ({data.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

export default OrderTimeCard; 