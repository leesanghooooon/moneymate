// OrderTimeCard.tsx
'use client';

import DashboardCard from './DashboardCard';
// import styles from '../../styles/css/OrderTimeCard.module.css';
import styles from '../../styles/css/MostOrderedCard.module.css';

const OrderTimeCard = () => {
    const expenditures = [
        { id: '0', name: '골프 라운딩', price: 180000, icon: '🏌️‍♂️' },
        { id: '1', name: '고급 레스토랑 외식', price: 220000, icon: '🍷' },
        { id: '2', name: '백화점 쇼핑', price: 350000, icon: '🛍️' },
        { id: '3', name: '국내 호텔 숙박', price: 280000, icon: '🏨' },
        { id: '4', name: '노트북 구매', price: 1500000, icon: '💻' },
    ];

    // KRW 포맷 함수 (3자리 콤마 + '원')
    const formatKRW = (v: number) => `${v.toLocaleString('ko-KR')}원`;

    // 금액 내림차순 정렬 후 TOP5만 사용
    const topFive = [...expenditures]
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);

    return (
        <DashboardCard title="The largest expenditure Top 5" cardSize="card-4">
            <div className={styles.foodList}>
                {topFive.map((item, idx) => (
                    <div key={item.id} className={styles.foodItem} style={{ alignItems: 'center', gap: 12 }}>
                        {/* 순위 뱃지 */}
                        <div
                            aria-label={`rank-${idx + 1}`}
                            style={{
                                minWidth: 20,
                                fontSize: 25,
                                fontWeight: 700,
                                color: '#000',
                                textAlign: 'center',
                            }}
                        >
                            {idx + 1}
                        </div>

                        {/* 아이콘 */}
                        <div className={styles.foodIcon} style={{ fontSize: 22 }}>{item.icon}</div>

                        {/* 이름/금액 */}
                        <div className={styles.foodInfo} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className={styles.foodName} style={{ fontWeight: 600 }}>{item.name}</div>
                            <div className={styles.foodPrice} style={{ opacity: 0.8 }}>
                                {formatKRW(item.price)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
};

export default OrderTimeCard;
