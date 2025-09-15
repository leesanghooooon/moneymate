'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import DashboardCard from './DashboardCard';
import styles from '../../styles/css/RevenueCard.module.css';
import { get } from '@/lib/api/common';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// API 응답 데이터 타입 정의
interface CategoryData {
  amount: number;
  name: string;
}

interface ApiMonthlyData {
  month: string;
  [key: string]: CategoryData | string;
}

// 샘플 데이터 (테스트용)
const sampleData = {
  labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  datasets: [
    {
      label: '식비',
      data: [300000, 250000, 280000, 320000, 280000, 300000, 290000, 310000, 285000, 295000, 280000, 320000],
      backgroundColor: '#8b5cf6',
    },
    {
      label: '교통',
      data: [150000, 140000, 145000, 155000, 148000, 152000, 147000, 153000, 149000, 151000, 146000, 154000],
      backgroundColor: '#a855f7',
    },
    {
      label: '쇼핑',
      data: [200000, 180000, 220000, 190000, 210000, 195000, 205000, 215000, 198000, 208000, 192000, 218000],
      backgroundColor: '#ec4899',
    },
    {
      label: '의료',
      data: [100000, 90000, 95000, 105000, 98000, 102000, 97000, 103000, 99000, 101000, 96000, 104000],
      backgroundColor: '#f97316',
    }
  ]
};

// 차트 데이터 변환 함수
const transformApiDataToChartData = (apiDatas: ApiMonthlyData[]) => {
  const apiData = apiDatas.data;

  if (!apiData.length) return null;

  // 첫 번째 데이터에서 카테고리 목록 추출 (month 키 제외)
  const firstMonth = apiData[0];
  const categories = Object.entries(firstMonth)
    .filter(([key]) => key !== 'month')
    .map(([code, value]) => ({
      code,
      name: (value as CategoryData).name
    }));

  // 카테고리별 색상 매핑
  const categoryColors = [
    '#8b5cf6', '#a855f7', '#ec4899', '#f97316', '#fbbf24',
    '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1'
  ];

  // Chart.js 데이터 포맷으로 변환
  return {
    labels: apiData.map((data: { month: string; }) => data.month),
    datasets: categories.map((category, index) => ({
      label: category.name,
      data: apiData.map((monthData: { [x: string]: CategoryData; }) => {
        const categoryData = monthData[category.code] as CategoryData;
        return categoryData?.amount || 0;
      }),
      backgroundColor: categoryColors[index % categoryColors.length],
    }))
  };
};

const RevenueCard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  
  // 테스트 모드 설정 (true: 샘플 데이터 사용, false: API 데이터 사용)
  const useTestData = false;

  useEffect(() => {
    const fetchData = async () => {
      if (useTestData) {
        setChartData(sampleData);
        setLoading(false);
        return;
      }

      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await get('/stats/monthly-expenses', {
          params: {
            usr_id: session.user.id,
            year: new Date().getFullYear().toString()
          }
        });

        console.log(response)
        console.log(transformApiDataToChartData(response.data))
        if (response.data.success && response.data) {
          const transformedData = transformApiDataToChartData(response.data);
          if (transformedData) {
            setChartData(transformedData);
          }
        }
      } catch (err) {
        console.error('월간 지출 통계 조회 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id, useTestData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        stacked: true,
        grid: {
          color: '#f0f0f0',
        },
        border: {
          display: false,
        },
        ticks: {
          callback: (value: number) => {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value;
          },
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.dataset.label}: ${new Intl.NumberFormat('ko-KR').format(value)}원`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  // 총 지출액 계산
  const totalExpense = chartData?.datasets.reduce((total: number, dataset: any) => {
    return total + dataset.data.reduce((sum: number, value: number) => sum + value, 0);
  }, 0) || 0;

  if (loading) {
    return <DashboardCard title="Monthly Expenses by Category" showViewReport={true} cardSize="card-9">
      <div className={styles.loading}>Loading...</div>
    </DashboardCard>;
  }

  if (error) {
    return <DashboardCard title="Monthly Expenses by Category" showViewReport={true} cardSize="card-9">
      <div className={styles.error}>{error}</div>
    </DashboardCard>;
  }

  if (!chartData) {
    return <DashboardCard title="Monthly Expenses by Category" showViewReport={true} cardSize="card-9">
      <div className={styles.error}>No data available</div>
    </DashboardCard>;
  }

  return (
    <DashboardCard title="Monthly Expenses by Category" showViewReport={true} cardSize="card-9">
      <div className={styles.revenueInfo}>
        <div className={styles.amount}>
          Total: {new Intl.NumberFormat('ko-KR').format(totalExpense)}원
        </div>
        <div className={styles.period}>
          Expenses from Jan-Dec, {new Date().getFullYear()}
        </div>
      </div>
      
      <div className={styles.chartContainer}>
        <Bar data={chartData} options={options} height={300} />
      </div>

      <div className={styles.legend}>
        {chartData.datasets.map((dataset: any, index: number) => (
          <div key={index} className={styles.legendItem}>
            <span 
              className={styles.legendColor} 
              style={{ backgroundColor: dataset.backgroundColor }}
            />
            <span className={styles.legendLabel}>{dataset.label}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default RevenueCard;