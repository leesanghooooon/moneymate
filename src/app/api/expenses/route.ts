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
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    let filteredExpenses = expenses;
    if (category) {
      filteredExpenses = expenses.filter(expense => expense.category === category);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedExpenses,
      total: filteredExpenses.length,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { message: '지출 목록 조회 중 오류가 발생했습니다.', code: 'GET_EXPENSES_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    const requiredFields = ['amount', 'category', 'paymentType', 'date'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `${field} 필드는 필수입니다.`, code: 'MISSING_REQUIRED_FIELD' },
          { status: 400 }
        );
      }
    }

    // 새 지출 생성
    const newExpense = {
      id: (expenses.length + 1).toString(),
      ...body,
      createdAt: new Date().toISOString(),
    };

    expenses.push(newExpense);

    return NextResponse.json(
      { message: '지출이 성공적으로 등록되었습니다.', data: newExpense },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: '지출 등록 중 오류가 발생했습니다.', code: 'CREATE_EXPENSE_ERROR' },
      { status: 500 }
    );
  }
}
