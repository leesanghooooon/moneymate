'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/assets.module.css';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  BanknotesIcon, 
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  WalletIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HomeIcon,
  LightBulbIcon,
  FlagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

interface AssetData {
  date: string;
  totalAssets: number;
  cash: number;
  bank: number;
  card: number;
  investment: number;
  realEstate: number;
}

interface AssetGrowth {
  period: string;
  growthRate: number;
  amount: number;
}

interface AssetSummary {
  totalAssets: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  assetDistribution: {
    cash: number;
    bank: number;
    card: number;
    investment: number;
    realEstate: number;
  };
  goals: {
    monthlyGoal: number;
    yearlyGoal: number;
    monthlyProgress: number;
    yearlyProgress: number;
  };
  recommendations: string[];
}

export default function AssetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'3M' | '6M' | '1Y' | '2Y'>('1Y');

  // 샘플 데이터 생성
  const generateSampleData = (): {
    assetHistory: AssetData[];
    growthData: AssetGrowth[];
    summary: AssetSummary;
  } => {
    const assetHistory: AssetData[] = [];
    const startDate = new Date();
    const months = selectedPeriod === '3M' ? 3 : selectedPeriod === '6M' ? 6 : selectedPeriod === '1Y' ? 12 : 24;
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // 재산 성장 시뮬레이션
      const baseAmount = 10000000 + (months - i) * 500000 + Math.random() * 1000000;
      const cash = baseAmount * 0.15 + Math.random() * 500000;
      const bank = baseAmount * 0.25 + Math.random() * 1000000;
      const card = baseAmount * 0.05 + Math.random() * 200000;
      const investment = baseAmount * 0.25 + Math.random() * 2000000;
      const realEstate = baseAmount * 0.3 + Math.random() * 3000000;
      
      assetHistory.push({
        date: dateStr,
        totalAssets: cash + bank + card + investment + realEstate,
        cash,
        bank,
        card,
        investment,
        realEstate
      });
    }

    const current = assetHistory[assetHistory.length - 1];
    const previous = assetHistory[assetHistory.length - 2];
    const yearlyPrevious = assetHistory.length > 12 ? assetHistory[assetHistory.length - 13] : assetHistory[0];
    
    const monthlyGrowth = previous ? ((current.totalAssets - previous.totalAssets) / previous.totalAssets) * 100 : 0;
    const yearlyGrowth = yearlyPrevious ? ((current.totalAssets - yearlyPrevious.totalAssets) / yearlyPrevious.totalAssets) * 100 : 0;

    const growthData: AssetGrowth[] = [
      { period: '1개월', growthRate: monthlyGrowth, amount: current.totalAssets - previous?.totalAssets || 0 },
      { period: '3개월', growthRate: 5.2, amount: 520000 },
      { period: '6개월', growthRate: 12.8, amount: 1280000 },
      { period: '1년', growthRate: yearlyGrowth, amount: current.totalAssets - yearlyPrevious?.totalAssets || 0 }
    ];

    const monthlyGoal = 500000;
    const yearlyGoal = 6000000;
    
    const summary: AssetSummary = {
      totalAssets: current.totalAssets,
      monthlyGrowth,
      yearlyGrowth,
      assetDistribution: {
        cash: current.cash,
        bank: current.bank,
        card: current.card,
        investment: current.investment,
        realEstate: current.realEstate
      },
      goals: {
        monthlyGoal,
        yearlyGoal,
        monthlyProgress: Math.min(100, (Math.abs(monthlyGrowth) * current.totalAssets / 100 / monthlyGoal) * 100),
        yearlyProgress: Math.min(100, (Math.abs(yearlyGrowth) * current.totalAssets / 100 / yearlyGoal) * 100)
      },
      recommendations: [
        "현재 월 저축률이 목표를 달성하고 있습니다!",
        "부동산 비중이 높아 안정적인 포트폴리오입니다.",
        "투자 비중을 조금 더 늘려보는 것을 고려해보세요.",
        "현금 비중이 적절하여 유동성이 좋습니다."
      ]
    };

    return { assetHistory, growthData, summary };
  };

  const { assetHistory, growthData, summary } = generateSampleData();

  // 차트 데이터 설정
  const assetGrowthChartData = {
    labels: assetHistory.map(item => item.date),
    datasets: [
      {
        label: '총 재산',
        data: assetHistory.map(item => item.totalAssets),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const assetDistributionChartData = {
    labels: ['현금', '은행', '카드', '투자', '부동산'],
    datasets: [
      {
        data: [
          summary.assetDistribution.cash,
          summary.assetDistribution.bank,
          summary.assetDistribution.card,
          summary.assetDistribution.investment,
          summary.assetDistribution.realEstate
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const growthRateChartData = {
    labels: growthData.map(item => item.period),
    datasets: [
      {
        label: '성장률 (%)',
        data: growthData.map(item => item.growthRate),
        backgroundColor: growthData.map(item => 
          item.growthRate >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: growthData.map(item => 
          item.growthRate >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      title: {
        display: false,
      },
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          drawBorder: false,
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW',
              minimumFractionDigits: 0
            }).format(value);
          },
          padding: 10
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 10
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
          padding: 10
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 10
        }
      }
    }
  };

  const formatKRW = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 비로그인 상태에서는 로그인 유도 모달 표시
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중에는 아무것도 표시하지 않음
  if (status === 'loading') {
    return null;
  }

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.assetsPage}>
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>재산현황</h1>
              <p className={styles.subtitle}>나의 재산 현황과 성장률을 확인하세요</p>
            </div>
            
            {/* 기간 선택 */}
            <div className={styles.periodSelector}>
              {(['3M', '6M', '1Y', '2Y'] as const).map(period => (
                <button
                  key={period}
                  className={`${styles.periodButton} ${selectedPeriod === period ? styles.active : ''}`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* 요약 카드 */}
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <BanknotesIcon className={styles.icon} />
              </div>
              <div className={styles.summaryContent}>
                <div className={styles.summaryLabel}>총 재산</div>
                <div className={styles.summaryAmount}>{formatKRW(summary.totalAssets)}</div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <ArrowTrendingDownIcon className={styles.icon} />
              </div>
              <div className={styles.summaryContent}>
                <div className={styles.summaryLabel}>월간 성장률</div>
                <div className={`${styles.summaryGrowth} ${summary.monthlyGrowth >= 0 ? styles.positive : styles.negative}`}>
                  {summary.monthlyGrowth >= 0 ? <ArrowUpIcon className={styles.growthIcon} /> : <ArrowDownIcon className={styles.growthIcon} />}
                  {Math.abs(summary.monthlyGrowth).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <ChartBarIcon className={styles.icon} />
              </div>
              <div className={styles.summaryContent}>
                <div className={styles.summaryLabel}>연간 성장률</div>
                <div className={`${styles.summaryGrowth} ${summary.yearlyGrowth >= 0 ? styles.positive : styles.negative}`}>
                  {summary.yearlyGrowth >= 0 ? <ArrowUpIcon className={styles.growthIcon} /> : <ArrowDownIcon className={styles.growthIcon} />}
                  {Math.abs(summary.yearlyGrowth).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className={styles.chartsSection}>
            {/* 재산 성장 추이 */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>재산 성장 추이</h3>
                <ArrowTrendingDownIcon className={styles.chartIcon} />
              </div>
              <div className={styles.chartContainer}>
                <Line data={assetGrowthChartData} options={chartOptions}/>
              </div>
            </div>

            {/* 재산 구성 */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>재산 구성</h3>
                <ChartBarIcon className={styles.chartIcon} />
              </div>
              <div className={styles.chartContainer}>
                <Doughnut data={assetDistributionChartData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* 성장률 분석 */}
          <div className={styles.growthSection}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>성장률 분석</h3>
                <ArrowTrendingDownIcon className={styles.chartIcon} />
              </div>
              <div className={styles.chartContainer}>
                <Bar data={growthRateChartData} options={barOptions} />
              </div>
            </div>

            {/* 재산 상세 */}
            <div className={styles.assetDetailsCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>재산 상세</h3>
                <WalletIcon className={styles.chartIcon} />
              </div>
              <div className={styles.assetList}>
                <div className={styles.assetItem}>
                  <div className={styles.assetInfo}>
                    <CurrencyDollarIcon className={styles.assetIcon} />
                    <span className={styles.assetName}>현금</span>
                  </div>
                  <span className={styles.assetAmount}>{formatKRW(summary.assetDistribution.cash)}</span>
                </div>
                <div className={styles.assetItem}>
                  <div className={styles.assetInfo}>
                    <BuildingLibraryIcon className={styles.assetIcon} />
                    <span className={styles.assetName}>은행</span>
                  </div>
                  <span className={styles.assetAmount}>{formatKRW(summary.assetDistribution.bank)}</span>
                </div>
                <div className={styles.assetItem}>
                  <div className={styles.assetInfo}>
                    <WalletIcon className={styles.assetIcon} />
                    <span className={styles.assetName}>카드</span>
                  </div>
                  <span className={styles.assetAmount}>{formatKRW(summary.assetDistribution.card)}</span>
                </div>
                <div className={styles.assetItem}>
                  <div className={styles.assetInfo}>
                    <ArrowTrendingDownIcon className={styles.assetIcon} />
                    <span className={styles.assetName}>투자</span>
                  </div>
                  <span className={styles.assetAmount}>{formatKRW(summary.assetDistribution.investment)}</span>
                </div>
                <div className={styles.assetItem}>
                  <div className={styles.assetInfo}>
                    <HomeIcon className={styles.assetIcon} />
                    <span className={styles.assetName}>부동산</span>
                  </div>
                  <span className={styles.assetAmount}>{formatKRW(summary.assetDistribution.realEstate)}</span>
                </div>
              </div>
            </div>

            {/* 목표 달성률 */}
            <div className={styles.goalsCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>목표 달성률</h3>
                <FlagIcon className={styles.chartIcon} />
              </div>
              <div className={styles.goalsList}>
                <div className={styles.goalItem}>
                  <div className={styles.goalInfo}>
                    <span className={styles.goalName}>월 저축 목표</span>
                    <span className={styles.goalTarget}>{formatKRW(summary.goals.monthlyGoal)}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${summary.goals.monthlyProgress}%` }}
                    ></div>
                  </div>
                  <span className={styles.goalProgress}>{summary.goals.monthlyProgress.toFixed(1)}%</span>
                </div>
                <div className={styles.goalItem}>
                  <div className={styles.goalInfo}>
                    <span className={styles.goalName}>연 저축 목표</span>
                    <span className={styles.goalTarget}>{formatKRW(summary.goals.yearlyGoal)}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${summary.goals.yearlyProgress}%` }}
                    ></div>
                  </div>
                  <span className={styles.goalProgress}>{summary.goals.yearlyProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 추천사항 */}
            <div className={styles.recommendationsCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>추천사항</h3>
                <LightBulbIcon className={styles.chartIcon} />
              </div>
              <div className={styles.recommendationsList}>
                {summary.recommendations.map((recommendation, index) => (
                  <div key={index} className={styles.recommendationItem}>
                    <div className={styles.recommendationIcon}>
                      {index === 0 ? (
                        <ExclamationTriangleIcon className={styles.recommendationIconSvg} />
                      ) : (
                        <LightBulbIcon className={styles.recommendationIconSvg} />
                      )}
                    </div>
                    <span className={styles.recommendationText}>{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
