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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = expenses.find(exp => exp.id === params.id);
    
    if (!expense) {
      return NextResponse.json(
        { message: '지출을 찾을 수 없습니다.', code: 'EXPENSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json(
      { message: '지출 조회 중 오류가 발생했습니다.', code: 'GET_EXPENSE_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const expenseIndex = expenses.findIndex(exp => exp.id === params.id);
    
    if (expenseIndex === -1) {
      return NextResponse.json(
        { message: '지출을 찾을 수 없습니다.', code: 'EXPENSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...body,
      id: params.id, // ID는 변경하지 않음
    };

    return NextResponse.json({
      message: '지출이 성공적으로 수정되었습니다.',
      data: expenses[expenseIndex],
    });
  } catch (error) {
    return NextResponse.json(
      { message: '지출 수정 중 오류가 발생했습니다.', code: 'UPDATE_EXPENSE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseIndex = expenses.findIndex(exp => exp.id === params.id);
    
    if (expenseIndex === -1) {
      return NextResponse.json(
        { message: '지출을 찾을 수 없습니다.', code: 'EXPENSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    expenses.splice(expenseIndex, 1);

    return NextResponse.json({
      message: '지출이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      { message: '지출 삭제 중 오류가 발생했습니다.', code: 'DELETE_EXPENSE_ERROR' },
      { status: 500 }
    );
  }
}
