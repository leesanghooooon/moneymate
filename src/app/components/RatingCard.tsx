'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/RatingCard.module.css';

const RatingCard = () => {
  const ratings = [
    { label: 'Hygiene', percentage: 85, color: '#8b5cf6' },
    { label: 'Food Taste', percentage: 85, color: '#f59e0b' },
    { label: 'Packaging', percentage: 92, color: '#06b6d4' },
  ];

  return (
    <DashboardCard title="Your Rating" cardSize="card-4">
      <div className={styles.description}>
        Lorem ipsum dolor sit amet, consectetur
      </div>
      
      <div className={styles.ratingsContainer}>
        {ratings.map((rating, index) => (
          <div key={rating.label} className={styles.ratingItem}>
            <div className={styles.circleProgress}>
              <svg className={styles.progressSvg} viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke={rating.color}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - rating.percentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className={styles.percentageText}>{rating.percentage}%</div>
            </div>
            <div className={styles.ratingLabel}>{rating.label}</div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default RatingCard; 