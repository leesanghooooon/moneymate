import Sidebar from '../fragments/Sidebar';
import Header from '../fragments/Header';
import RevenueCard from './components/RevenueCard';
import OrderTimeCard from './components/OrderTimeCard';
import RatingCard from './components/RatingCard';
import MostOrderedCard from './components/MostOrderedCard';
import OrderCard from './components/OrderCard';
import styles from '../styles/css/page.module.css';

export default function Home() {
  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.dashboardBody}>
          <div className={styles.dashboardGrid}>
            <RevenueCard />
            <OrderTimeCard />
            <RatingCard />
            <MostOrderedCard />
            <OrderCard />
          </div>
        </main>
      </div>
    </div>
  );
}
