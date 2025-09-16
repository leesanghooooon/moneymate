'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/OrderCard.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { get } from '@/lib/api/common';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const OrderCard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<Array<{
    date: string;
    current_amount: number;
    previous_amount: number;
  }>>([]);
  const [summary, setSummary] = useState<{
    thisWeekTotal: number;
    lastWeekTotal: number;
    changeRate: number;
  }>({
    thisWeekTotal: 0,
    lastWeekTotal: 0,
    changeRate: 0
  });

  useEffect(() => {
    const fetchWeeklyExpenses = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await get('/stats/weekly-expenses', {
          params: {
            usr_id: session.user.id
          }
        });
        console.log(response)
        if (response.data.success) {
          setOrderData(response.data.data.daily);
          setSummary(response.data.data.summary);
        }
      } catch (err) {
        console.error('주간 지출 통계 조회 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyExpenses();
  }, [session?.user?.id]);

  // 차트 데이터 설정
  const data = {
    labels: orderData.map(d => d.date),
    datasets: [
      {
        label: '이번 주',
        data: orderData.map(d => d.current_amount),
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '지난 주',
        data: orderData.map(d => d.previous_amount),
        borderColor: '#E5E7EB',
        backgroundColor: '#E5E7EB',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  // 차트 옵션 설정
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        padding: 10,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ko-KR', {
                style: 'decimal',
                maximumFractionDigits: 0
              }).format(context.parsed.y) + '원';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6'
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('ko-KR', {
              style: 'decimal',
              maximumFractionDigits: 0
            }).format(value) + '원';
          }
        }
      }
    }
  };

  // 총액 계산
  if (loading) {
    return (
      <DashboardCard title="주간 지출 비교" cardSize="card-4">
        <div className={styles.loading}>Loading...</div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="주간 지출 비교" cardSize="card-4">
        <div className={styles.error}>{error}</div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="주간 지출 비교" cardSize="card-4">
      <div className={styles.orderInfo}>
        <div className={styles.amount}>
          {new Intl.NumberFormat('ko-KR', {
            style: 'decimal',
            maximumFractionDigits: 0
          }).format(summary.thisWeekTotal)}원
        </div>
        <div className={styles.change}>
          <span className={`${styles.changeIcon} ${summary.changeRate >= 0 ? styles.increase : ''}`}>
            {summary.changeRate >= 0 ? '↑' : '↓'}
          </span>
          <span className={styles.changeText}>
            {Math.abs(summary.changeRate).toFixed(1)}% vs 지난주
          </span>
        </div>
        <div className={styles.period}>
          {orderData[0].date} ~ {orderData[orderData.length - 1].date}
        </div>
      </div>
      
      <div className={styles.chart}>
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
};

export default OrderCard; 