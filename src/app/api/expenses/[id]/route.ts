import { NextRequest, NextResponse } from 'next/server';
import { dbUpdate, dbSelect } from '../../../../lib/db-utils';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 필수 필드 검증
    const requiredFields = ['trx_date', 'amount', 'category_cd', 'wlt_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
          { message: `필수 정보가 누락되었습니다: ${missingFields.join(', ')}` },
          { status: 400 }
      );
    }

    // 금액 검증
    if (body.amount <= 0) {
      return NextResponse.json(
          { message: '금액은 0보다 커야 합니다.' },
          { status: 400 }
      );
    }

    // 거래 내역 존재 여부 확인
    const existingTransaction = await dbSelect({
      table: 'MMT_TRX_TRN',
      columns: ['trx_id', 'usr_id', 'trx_type', 'is_installment', 'installment_group_id'],
      filters: {
        trx_id: id,
        use_yn: 'Y'
      },
      allowedFilterFields: ['trx_id', 'use_yn']
    });

    if (!existingTransaction || existingTransaction.length === 0) {
      return NextResponse.json(
          { message: '수정할 거래 내역을 찾을 수 없습니다.' },
          { status: 404 }
      );
    }

    const transaction = existingTransaction[0];

    // 할부 거래인 경우 할부 그룹 전체 수정 여부 확인
    if (transaction.is_installment === 'Y' && transaction.installment_group_id) {
      // 할부 그룹의 모든 거래 내역 조회
      const installmentGroup = await dbSelect({
        table: 'MMT_TRX_TRN',
        columns: ['trx_id', 'installment_seq', 'amount'],
        filters: {
          installment_group_id: transaction.installment_group_id,
          use_yn: 'Y'
        },
        allowedFilterFields: ['installment_group_id', 'use_yn'],
        orderBy: 'installment_seq ASC'
      });

      if (installmentGroup && installmentGroup.length > 0) {
        // 할부 그룹의 총 금액 계산
        const totalAmount = installmentGroup.reduce((sum, item) => sum + Number(item.amount), 0);
        const monthlyAmount = Math.floor(Number(body.amount) / installmentGroup.length);

        // 할부 그룹의 모든 거래 내역 수정
        for (const installmentItem of installmentGroup) {
          await dbUpdate({
            table: 'MMT_TRX_TRN',
            data: {
              trx_date: body.trx_date,
              amount: monthlyAmount,
              category_cd: body.category_cd,
              memo: body.memo || null,
              wlt_id: body.wlt_id,
              updated_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
            },
            filters: {
              trx_id: installmentItem.trx_id
            },
            allowedFilterFields: ['trx_id']
          });
        }

        return NextResponse.json({
          message: '할부 거래가 수정되었습니다.',
          data: {
            updated_count: installmentGroup.length,
            is_installment: true
          }
        });
      }
    }

    // 일반 거래 또는 할부가 아닌 경우 단일 거래 수정
    await dbUpdate({
      table: 'MMT_TRX_TRN',
      data: {
        trx_date: body.trx_date,
        amount: body.amount,
        category_cd: body.category_cd,
        memo: body.memo || null,
        wlt_id: body.wlt_id,
        updated_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
      },
      filters: {
        trx_id: id
      },
      allowedFilterFields: ['trx_id']
    });

    return NextResponse.json({
      message: '거래가 수정되었습니다.',
      data: {
        updated_count: 1,
        is_installment: false
      }
    });

  } catch (error: any) {
    console.error('거래 수정 오류:', error);
    return NextResponse.json(
        { message: error?.message || '거래 수정 중 오류가 발생했습니다.' },
        { status: 500 }
    );
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 거래 내역 존재 여부 확인
    const existingTransaction = await dbSelect({
      table: 'MMT_TRX_TRN',
      columns: ['trx_id', 'usr_id', 'is_installment', 'installment_group_id'],
      filters: {
        trx_id: id,
        use_yn: 'Y'
      },
      allowedFilterFields: ['trx_id', 'use_yn']
    });

    if (!existingTransaction || existingTransaction.length === 0) {
      return NextResponse.json(
          { message: '삭제할 거래 내역을 찾을 수 없습니다.' },
          { status: 400 }
      );
    }

    const transaction = existingTransaction[0];

    // 할부 거래인 경우 할부 그룹 전체 삭제 여부 확인
    if (transaction.is_installment === 'Y' && transaction.installment_group_id) {
      // 할부 그룹의 모든 거래 내역 조회
      const installmentGroup = await dbSelect({
        table: 'MMT_TRX_TRN',
        columns: ['trx_id'],
        filters: {
          installment_group_id: transaction.installment_group_id,
          use_yn: 'Y'
        },
        allowedFilterFields: ['installment_group_id', 'use_yn']
      });

      if (installmentGroup && installmentGroup.length > 0) {
        // 할부 그룹의 모든 거래 내역 삭제 (use_yn = 'N'으로 변경)
        for (const installmentItem of installmentGroup) {
          await dbUpdate({
            table: 'MMT_TRX_TRN',
            data: {
              use_yn: 'N',
              updated_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
            },
            filters: {
              trx_id: installmentItem.trx_id
            },
            allowedFilterFields: ['trx_id']
          });
        }

        return NextResponse.json({
          message: '할부 거래가 삭제되었습니다.',
          data: {
            deleted_count: installmentGroup.length,
            is_installment: true
          }
        });
      }
    }

    // 일반 거래 또는 할부가 아닌 경우 단일 거래 삭제
    await dbUpdate({
      table: 'MMT_TRX_TRN',
      data: {
        use_yn: 'N',
        updated_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
      },
      filters: {
        trx_id: id
      },
      allowedFilterFields: ['trx_id']
    });

    return NextResponse.json({
      message: '거래가 삭제되었습니다.',
      data: {
        deleted_count: 1,
        is_installment: false
      }
    });

  } catch (error: any) {
    console.error('거래 삭제 오류:', error);
    return NextResponse.json(
        { message: error?.message || '거래 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
    );
  }
}
