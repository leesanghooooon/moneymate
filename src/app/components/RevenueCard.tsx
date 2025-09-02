'use client';

import DashboardCard from './DashboardCard';
import styles from '../../styles/css/RevenueCard.module.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const RevenueCard = () => {
  // 12개월 데이터 (카테고리별 지출 금액) - 다양한 비율로 구성
  const monthlyData = [
    { month: '1월', food: 250000, transport: 80000, shopping: 120000, entertainment: 60000, others: 30000 },
    { month: '2월', food: 180000, transport: 150000, shopping: 200000, entertainment: 40000, others: 50000 },
    { month: '3월', food: 300000, transport: 60000, shopping: 80000, entertainment: 120000, others: 25000 },
    { month: '4월', food: 220000, transport: 120000, shopping: 150000, entertainment: 80000, others: 40000 },
    { month: '5월', food: 160000, transport: 200000, shopping: 180000, entertainment: 50000, others: 60000 },
    { month: '6월', food: 280000, transport: 90000, shopping: 100000, entertainment: 150000, others: 35000 },
    { month: '7월', food: 140000, transport: 220000, shopping: 250000, entertainment: 30000, others: 70000 },
    { month: '8월', food: 320000, transport: 70000, shopping: 70000, entertainment: 180000, others: 20000 },
    { month: '9월', food: 200000, transport: 180000, shopping: 220000, entertainment: 70000, others: 45000 },
    { month: '10월', food: 240000, transport: 110000, shopping: 130000, entertainment: 100000, others: 38000 },
    { month: '11월', food: 170000, transport: 190000, shopping: 125000, entertainment: 60000, others: 55000 },
    { month: '12월', food: 260000, transport: 100000, shopping: 160000, entertainment: 140000, others: 42000 },
  ];

  const categories = [
    { name: 'Food', color: '#8b5cf6' },
    { name: 'Transport', color: '#a855f7' },
    { name: 'Shopping', color: '#ec4899' },
    { name: 'Entertainment', color: '#f97316' },
    { name: 'Others', color: '#fbbf24' },
  ];

  // Y축 눈금 값들 (0원 ~ 최대값)
  const maxValue = Math.max(...monthlyData.map(data => 
    data.food + data.transport + data.shopping + data.entertainment + data.others
  ));
  const yAxisTicks = [0, Math.round(maxValue * 0.25), Math.round(maxValue * 0.5), Math.round(maxValue * 0.75), maxValue];

  // 금액을 원화로 포맷팅
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  // 툴팁 HTML 생성
  const createTooltipHtml = (labelKo: string, amount: number, total: number) => {
    const percentage = ((amount / total) * 100).toFixed(1);
    return `<div class=\"mm-tooltip\"><div class=\"mm-tooltip-title\">${labelKo}</div><div class=\"mm-tooltip-price\">${formatCurrency(amount)}</div><div class=\"mm-tooltip-percent\">${percentage}%</div></div>`;
  };

  return (
    <DashboardCard title="Monthly Expenses by Category" showViewReport={true} cardSize="card-9">
      <div className={styles.revenueInfo}>
        <div className={styles.amount}>Total: 2,450,000원</div>
        <div className={styles.change}>
          <span className={styles.changeIcon}>↑</span>
          <span className={styles.changeText}>8.5% vs last year</span>
        </div>
        <div className={styles.period}>Expenses from Jan-Dec, 2024</div>
      </div>
      
      <div className={styles.chart}>
        <div className={styles.chartContainer}>
          {/* Y축 */}
          <div className={styles.yAxis}>
            {yAxisTicks.map((tick) => (
              <div key={tick} className={styles.yAxisTick}>
                <span className={styles.yAxisLabel}>{formatCurrency(tick)}</span>
                <div className={styles.yAxisLine}></div>
              </div>
            ))}
          </div>
          
          {/* 차트 영역 */}
          <div className={styles.chartArea}>
            <div className={styles.chartBars}>
              {monthlyData.map((data, index) => {
                const total = data.food + data.transport + data.shopping + data.entertainment + data.others;
                return (
                  <div key={index} className={styles.barGroup}>
                    <div className={styles.barStack}>
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${(data.food / maxValue) * 100}%`,
                          backgroundColor: categories[0].color
                        }}
                        data-tooltip-id="mm-tooltip"
                        data-tooltip-place="bottom"
                        data-tooltip-html={createTooltipHtml('음식', data.food, total)}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${(data.transport / maxValue) * 100}%`,
                          backgroundColor: categories[1].color
                        }}
                        data-tooltip-id="mm-tooltip"
                        data-tooltip-place="bottom"
                        data-tooltip-html={createTooltipHtml('교통', data.transport, total)}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${(data.shopping / maxValue) * 100}%`,
                          backgroundColor: categories[2].color
                        }}
                        data-tooltip-id="mm-tooltip"
                        data-tooltip-place="bottom"
                        data-tooltip-html={createTooltipHtml('쇼핑', data.shopping, total)}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${(data.entertainment / maxValue) * 100}%`,
                          backgroundColor: categories[3].color
                        }}
                        data-tooltip-id="mm-tooltip"
                        data-tooltip-place="bottom"
                        data-tooltip-html={createTooltipHtml('엔터테인먼트', data.entertainment, total)}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${(data.others / maxValue) * 100}%`,
                          backgroundColor: categories[4].color
                        }}
                        data-tooltip-id="mm-tooltip"
                        data-tooltip-place="bottom"
                        data-tooltip-html={createTooltipHtml('기타', data.others, total)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X축 */}
            <div className={styles.xAxis}>
              {monthlyData.map((data, index) => (
                <div key={index} className={styles.xAxisTick}>
                  <span className={styles.xAxisLabel}>{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className={styles.legend}>
          {categories.map((category, index) => (
            <div key={index} className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: category.color }}></div>
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      <Tooltip
        id="mm-tooltip"
        className="mm-tooltip-container"
        opacity={1}
        float
        offset={8}
      />
    </DashboardCard>
  );
};

export default RevenueCard; 