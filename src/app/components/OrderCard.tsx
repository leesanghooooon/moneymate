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
import { getWeekDateRanges } from '@/lib/date-utils';

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

  // 샘플 데이터 생성 함수
  const generateSampleData = () => {
    const weekRanges = getWeekDateRanges();
    
    // 이번 주와 지난 달의 같은 주 날짜 범위
    const thisWeekStart = new Date(weekRanges.thisWeekStart.slice(0, 4) + '-' + weekRanges.thisWeekStart.slice(4, 6) + '-' + weekRanges.thisWeekStart.slice(6, 8));
    const thisWeekEnd = new Date(weekRanges.thisWeekEnd.slice(0, 4) + '-' + weekRanges.thisWeekEnd.slice(4, 6) + '-' + weekRanges.thisWeekEnd.slice(6, 8));
    const lastWeekStart = new Date(weekRanges.lastWeekStart.slice(0, 4) + '-' + weekRanges.lastWeekStart.slice(4, 6) + '-' + weekRanges.lastWeekStart.slice(6, 8));
    const lastWeekEnd = new Date(weekRanges.lastWeekEnd.slice(0, 4) + '-' + weekRanges.lastWeekEnd.slice(4, 6) + '-' + weekRanges.lastWeekEnd.slice(6, 8));

    // 일주일 데이터 생성
    const dailyData = [];
    const currentDate = new Date(thisWeekStart);
    
    while (currentDate <= thisWeekEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      
      // 요일별로 다른 패턴의 지출 데이터 생성
      let currentAmount = 0;
      let previousAmount = 0;
      
      switch (dayOfWeek) {
        case 0: // 일요일
          currentAmount = Math.floor(Math.random() * 50000) + 20000;
          previousAmount = Math.floor(Math.random() * 60000) + 15000;
          break;
        case 1: // 월요일
          currentAmount = Math.floor(Math.random() * 80000) + 30000;
          previousAmount = Math.floor(Math.random() * 90000) + 25000;
          break;
        case 2: // 화요일
          currentAmount = Math.floor(Math.random() * 70000) + 25000;
          previousAmount = Math.floor(Math.random() * 80000) + 20000;
          break;
        case 3: // 수요일
          currentAmount = Math.floor(Math.random() * 60000) + 20000;
          previousAmount = Math.floor(Math.random() * 70000) + 18000;
          break;
        case 4: // 목요일
          currentAmount = Math.floor(Math.random() * 90000) + 35000;
          previousAmount = Math.floor(Math.random() * 100000) + 30000;
          break;
        case 5: // 금요일
          currentAmount = Math.floor(Math.random() * 120000) + 50000;
          previousAmount = Math.floor(Math.random() * 130000) + 45000;
          break;
        case 6: // 토요일
          currentAmount = Math.floor(Math.random() * 100000) + 40000;
          previousAmount = Math.floor(Math.random() * 110000) + 35000;
          break;
      }
      
      dailyData.push({
        date: dateStr,
        current_amount: currentAmount,
        previous_amount: previousAmount
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 요약 데이터 계산
    const thisWeekTotal = dailyData.reduce((sum, day) => sum + day.current_amount, 0);
    const lastWeekTotal = dailyData.reduce((sum, day) => sum + day.previous_amount, 0);
    const changeRate = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

    return {
      daily: dailyData,
      summary: {
        thisWeekTotal,
        lastWeekTotal,
        changeRate
      }
    };
  };

  useEffect(() => {
    const fetchWeeklyExpenses = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        
        // 실제 API 호출 (현재는 주석 처리)
        const response = await get('/stats/weekly-expenses', {
          params: {
            usr_id: session.user.id
          }
        });
        
        // 샘플 데이터 사용
        // const sampleData = generateSampleData();
        // console.log('샘플 데이터:', sampleData);
        // console.log('샘플 데이터:', response.data.data);
        
        if (response.data.success) {
          setOrderData(response.data.data.daily);
          setSummary(response.data.data.summary);
        }
        
        // 샘플 데이터 설정
        // setOrderData(sampleData.daily);
        // setSummary(sampleData.summary);
        
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
    labels: orderData.map(d => {
      const date = new Date(d.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    }),
    datasets: [
      {
        label: '이번 주',
        data: orderData.map(d => d.current_amount),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      },
      {
        label: '지난 달 같은 주',
        data: orderData.map(d => d.previous_amount),
        borderColor: '#E5E7EB',
        backgroundColor: 'rgba(229, 231, 235, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
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
          <span style={{padding:'6px'}}>
            <span className={`${styles.changeIcon} ${summary.changeRate >= 0 ? styles.increase : ''}`}>
              {summary.changeRate >= 0 ? '↑' : '↓'}
            </span>
              <span className={styles.changeText}>
              {Math.abs(summary.changeRate).toFixed(1)}%
            </span>
          </span>
        </div>
        {/*<div className={styles.change}>*/}
        {/*  <span className={`${styles.changeIcon} ${summary.changeRate >= 0 ? styles.increase : ''}`}>*/}
        {/*    {summary.changeRate >= 0 ? '↑' : '↓'}*/}
        {/*  </span>*/}
        {/*  <span className={styles.changeText}>*/}
        {/*    {Math.abs(summary.changeRate).toFixed(1)}% vs 지난달 같은주*/}
        {/*  </span>*/}
        {/*</div>*/}
        <div className={styles.period}>
          {orderData.length > 0 && (
            <>
              {new Date(orderData[0].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~ {new Date(orderData[orderData.length - 1].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </>
          )}
          &nbsp;vs 지난달 같은주
        </div>
      </div>
      
      <div className={styles.chart}>
        <Line data={data} options={options} />
      </div>
    </DashboardCard>
  );
};

export default OrderCard; 