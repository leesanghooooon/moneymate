import { NextRequest, NextResponse } from 'next/server';
import { dbInsert } from '../../../lib/db-utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: 지출 등록
 *     description: |
 *       지출 내역을 등록합니다. 할부 결제의 경우 과거 회차도 자동으로 등록됩니다.
 *       - 할부 결제 시 할부그룹ID가 자동 생성됩니다.
 *       - 현재 회차 이전의 회차들도 자동으로 등록됩니다.
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usr_id
 *               - wlt_id
 *               - trx_type
 *               - trx_date
 *               - amount
 *               - category_cd
 *             properties:
 *               usr_id:
 *                 type: string
 *                 description: 사용자 ID
*               wlt_id:
*                 type: string
*                 description: 지갑 ID
 *               trx_type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 description: 거래 유형
 *               trx_date:
 *                 type: string
 *                 format: date
 *                 description: 거래 일자 (YYYY-MM-DD)
 *               amount:
 *                 type: number
 *                 description: 거래 금액
 *               category_cd:
 *                 type: string
 *                 description: 카테고리 코드
 *               memo:
 *                 type: string
 *                 description: 메모 (선택사항)
 *               is_fixed:
 *                 type: string
 *                 enum: [Y, N]
 *                 default: N
 *                 description: 고정 지출 여부
 *               is_installment:
 *                 type: string
 *                 enum: [Y, N]
 *                 default: N
 *                 description: 할부 여부
 *               installment_months:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 60
 *                 description: 할부 개월 수 (할부인 경우 필수)
 *               installment_seq:
 *                 type: integer
 *                 minimum: 1
 *                 description: 현재 할부 회차 (할부인 경우 필수)
 *     responses:
 *       201:
 *         description: 지출 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 지출이 등록되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     registered_count:
 *                       type: integer
 *                       description: 등록된 지출 건수 (할부의 경우 1보다 클 수 있음)
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const requiredFields = ['usr_id', 'wlt_id', 'trx_type', 'trx_date', 'amount', 'category_cd'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `필수 정보가 누락되었습니다: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // 할부 관련 필드 검증
    if (body.is_installment === 'Y') {
      if (!body.installment_months || !body.installment_seq) {
        return NextResponse.json(
          { message: '할부 결제 시 할부 개월 수와 현재 회차 정보가 필요합니다.' },
          { status: 400 }
        );
      }

      if (body.installment_months < 2 || body.installment_months > 60) {
        return NextResponse.json(
          { message: '할부 개월 수는 2~60개월 사이여야 합니다.' },
          { status: 400 }
        );
      }

      if (body.installment_seq < 1 || body.installment_seq > body.installment_months) {
        return NextResponse.json(
          { message: '잘못된 할부 회차입니다.' },
          { status: 400 }
        );
      }
    }

    let registeredCount = 0;
    const baseData = {
      trx_id: uuidv4(), // UUID로 trx_id 생성
      usr_id: body.usr_id,
      wlt_id: body.wlt_id,
      trx_type: body.trx_type,
      amount: body.amount,
      category_cd: body.category_cd,
      memo: body.memo || null,
      is_fixed: body.is_fixed || 'N',
      use_yn: 'Y'
    };

    if (body.is_installment === 'Y') {
      // 할부 결제인 경우
      const installmentGroupId = uuidv4(); // 할부 그룹 ID 생성
      const monthlyAmount = Math.floor(Number(body.amount) / body.installment_months);
      const currentDate = new Date(body.trx_date);

      // 현재 회차까지의 모든 회차 등록
      for (let seq = 1; seq <= body.installment_seq; seq++) {
        const seqDate = new Date(currentDate);
        seqDate.setMonth(seqDate.getMonth() - (body.installment_seq - seq));

        await dbInsert({
          table: 'MMT_TRX_TRN',
          data: {
            ...baseData,
            trx_id: uuidv4(), // 각 회차별로 새로운 trx_id 생성
            trx_date: seqDate.toISOString().split('T')[0],
            is_installment: 'Y',
            installment_months: body.installment_months,
            installment_seq: seq,
            installment_group_id: installmentGroupId,
            amount: monthlyAmount // 마지막 회차에서 금액 조정이 필요할 수 있음
          }
        });
        registeredCount++;
      }
    } else {
      // 일반 결제인 경우
      await dbInsert({
        table: 'MMT_TRX_TRN',
        data: {
          ...baseData,
          trx_date: body.trx_date,
          is_installment: 'N',
          installment_months: null,
          installment_seq: null,
          installment_group_id: null
        }
      });
      registeredCount = 1;
    }

    return NextResponse.json({
      message: '지출이 등록되었습니다.',
      data: { registered_count: registeredCount }
    }, { status: 201 });

  } catch (error: any) {
    console.error('지출 등록 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지출 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}