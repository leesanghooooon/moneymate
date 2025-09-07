import { NextRequest, NextResponse } from 'next/server';

// 임시 데이터 저장소 (실제로는 데이터베이스 사용)
let expenses: any[] = [
  {
    id: '1',
    amount: 5200,
    category: '식비',
    paymentType: '현금',
    merchant: '스타벅스',
    spendingType: '일시불',
    date: '2024-09-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    amount: 125000,
    category: '쇼핑',
    paymentType: '카드',
    cardBrand: '신한',
    merchant: '온라인 쇼핑',
    spendingType: '일시불',
    date: '2024-09-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    amount: 48000,
    category: '교통',
    paymentType: '카드',
    cardBrand: '현대',
    merchant: '지하철',
    spendingType: '일시불',
    date: '2024-09-02',
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // 기간별 필터링 로직 (간단한 예시)
    let filteredExpenses = expenses;
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filteredExpenses = expenses.filter(exp => exp.date === today);
        break;
      case 'week':
        // 최근 7일
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredExpenses = expenses.filter(exp => new Date(exp.date) >= weekAgo);
        break;
      case 'month':
        // 최근 30일
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredExpenses = expenses.filter(exp => new Date(exp.date) >= monthAgo);
        break;
      case 'year':
        // 최근 1년
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredExpenses = expenses.filter(exp => new Date(exp.date) >= yearAgo);
        break;
    }

    // 총 지출 금액
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 카테고리별 통계
    const categoryStats = calculateStats(filteredExpenses, 'category', totalAmount);

    // 결제수단별 통계
    const paymentTypeStats = calculateStats(filteredExpenses, 'paymentType', totalAmount);

    // 카드사별 통계 (카드 결제만)
    const cardExpenses = filteredExpenses.filter(exp => exp.paymentType === '카드' && exp.cardBrand);
    const cardTotalAmount = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const cardBrandStats = calculateStats(cardExpenses, 'cardBrand', cardTotalAmount);

    return NextResponse.json({
      totalAmount,
      categoryStats,
      paymentTypeStats,
      cardBrandStats,
      period,
    });
  } catch (error) {
    return NextResponse.json(
      { message: '통계 조회 중 오류가 발생했습니다.', code: 'GET_STATS_ERROR' },
      { status: 500 }
    );
  }
}

function calculateStats(expenses: any[], field: string, totalAmount: number) {
  const stats: { [key: string]: number } = {};
  
  expenses.forEach(expense => {
    const value = expense[field];
    if (value) {
      stats[value] = (stats[value] || 0) + expense.amount;
    }
  });

  return Object.entries(stats).map(([key, amount]) => ({
    [field]: key,
    amount,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
  }));
}
