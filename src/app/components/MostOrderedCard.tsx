'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/MostOrderedCard.module.css';

const MostOrderedCard = () => {
  const foods = [
    { name: 'Fresh Salad Bowl', price: 'IDR 45.000', icon: '🥗' },
    { name: 'Chicken Noodles', price: 'IDR 75.000', icon: '🍜' },
    { name: 'Smoothie Fruits', price: 'IDR 45.000', icon: '🥤' },
    { name: 'Hot Chicken Wings', price: 'IDR 45.000', icon: '🍗' },
  ];

  return (
    <DashboardCard title="Most Ordered Food" cardSize="card-4">
      <div className={styles.description}>
        Adipiscing elit, sed do eiusmod tempor
      </div>
      
      <div className={styles.foodList}>
        {foods.map((food, index) => (
          <div key={food.name} className={styles.foodItem}>
            <div className={styles.foodIcon}>{food.icon}</div>
            <div className={styles.foodInfo}>
              <div className={styles.foodName}>{food.name}</div>
              <div className={styles.foodPrice}>{food.price}</div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default MostOrderedCard; 