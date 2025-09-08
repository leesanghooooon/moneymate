import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: 지출 상세 조회
 *     description: 지출 ID로 상세 정보를 조회합니다.
 *     tags: [Expenses]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 지출 ID (trx_id)
 *     responses:
 *       200:
 *         description: 지출 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     trx_id:
 *                       type: string
 *                       description: 지출 ID
 *                     wlt_type:
 *                       type: string
 *                       description: 지갑 유형
 *                     wlt_name:
 *                       type: string
 *                       description: 지갑 이름
 *                     bank_cd:
 *                       type: string
 *                       description: 은행/카드사 코드
 *                     usr_id:
 *                       type: string
 *                       description: 사용자 ID
 *                     trx_type:
 *                       type: string
 *                       description: 거래 유형
 *                     trx_type_name:
 *                       type: string
 *                       description: 거래 유형명
 *                     trx_date:
 *                       type: string
 *                       format: date
 *                       description: 거래 일자
 *                     amount:
 *                       type: number
 *                       description: 거래 금액
 *                     category_cd:
 *                       type: string
 *                       description: 카테고리 코드
 *                     category_name:
 *                       type: string
 *                       description: 카테고리명
 *                     memo:
 *                       type: string
 *                       description: 메모
 *                     is_fixed:
 *                       type: string
 *                       description: 고정 지출 여부
 *                     is_installment:
 *                       type: string
 *                       description: 할부 여부
 *                     installment_months:
 *                       type: integer
 *                       description: 할부 개월 수
 *                     installment_seq:
 *                       type: integer
 *                       description: 할부 회차
 *                     installment_group_id:
 *                       type: string
 *                       description: 할부 그룹 ID
 *       404:
 *         description: 지출 정보를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = `
      SELECT 
        t1.trx_id
        , t2.wlt_type
        , t2.wlt_name
        , t2.bank_cd
        , t1.usr_id
        , t1.trx_type
        , (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'TRX_TYPE' AND cd = t1.trx_type) trx_type_name
        , t1.trx_date
        , t1.amount
        , t1.category_cd
        , (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'CATEGORY' AND cd = t1.category_cd) category_name
        , t1.memo
        , t1.is_fixed
        , t1.is_installment
        , t1.installment_months
        , t1.installment_seq
        , t1.installment_group_id
      FROM MMT_TRX_TRN t1
      JOIN MMT_WLT_MST t2 ON t1.wlt_id = t2.wlt_id
      WHERE t1.trx_id = ?
    `;

    const rows = await query(sql, [params.id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: '지출 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error('지출 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지출 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}