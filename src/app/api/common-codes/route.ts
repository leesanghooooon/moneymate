import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /common-codes:
 *   get:
 *     summary: 공통코드 목록 조회
 *     description: 공통코드를 그룹 코드별로 조회합니다.
 *     tags: [CommonCodes]
 *     parameters:
 *       - in: query
 *         name: grp_cd
 *         required: false
 *         schema:
 *           type: string
 *         description: 코드 그룹 (예: BANK, CATEGORY, GOAL_TYPE)
 *       - in: query
 *         name: use_yn
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Y, N]
 *           default: Y
 *         description: 사용 여부 (기본값: Y)
 *     responses:
 *       200:
 *         description: 공통코드 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommonCode'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grp_cd = searchParams.get('grp_cd');
    const use_yn = searchParams.get('use_yn') || 'Y';

    let sql = `
      SELECT 
        grp_cd,
        cd,
        cd_nm,
        cd_desc,
        sort_order,
        use_yn,
        created_at,
        updated_at
      FROM moneymate.MMT_CMM_CD_MST
      WHERE 1=1
    `;

    const params: any[] = [];

    if (use_yn) {
      sql += ` AND use_yn = ?`;
      params.push(use_yn);
    }

    if (grp_cd) {
      sql += ` AND grp_cd = ?`;
      params.push(grp_cd);
    }

    sql += ` ORDER BY grp_cd, sort_order, cd`;

    const rows = await query(sql, params);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('공통코드 목록 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '공통코드 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

