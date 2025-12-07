import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: 거래 목록 조회
 *     description: 사용자의 수입/지출 거래 목록을 조회합니다.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: usr_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *       - in: query
 *         name: trx_type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         description: 거래 유형 (수입/지출)
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회 시작일 (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회 종료일 (YYYY-MM-DD)
 *       - in: query
 *         name: wlt_id
 *         required: false
 *         schema:
 *           type: string
 *         description: 지갑 ID (특정 지갑의 거래만 조회)
 *       - in: query
 *         name: category_cd
 *         required: false
 *         schema:
 *           type: string
 *         description: 카테고리 코드
 *       - in: query
 *         name: is_fixed
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Y, N]
 *         description: 고정 지출 여부
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
 *         description: 거래 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const usr_id = searchParams.get('usr_id');
    const trx_type = searchParams.get('trx_type');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const wlt_id = searchParams.get('wlt_id');
    const category_cd = searchParams.get('category_cd');
    const is_fixed = searchParams.get('is_fixed');
    const use_yn = searchParams.get('use_yn') || 'Y';

    if (!usr_id) {
      return NextResponse.json(
        { message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        t.trx_id,
        t.wlt_id,
        w.wlt_name,
        w.wlt_type,
        t.usr_id,
        t.trx_type,
        t.trx_date,
        t.amount,
        t.category_cd,
        c.cd_nm as category_name,
        t.memo,
        t.is_fixed,
        t.is_installment,
        t.installment_months,
        t.installment_seq,
        t.installment_group_id,
        t.use_yn,
        t.created_at,
        t.updated_at
      FROM moneymate.MMT_TRX_TRN t
      LEFT JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id
      LEFT JOIN moneymate.MMT_CMM_CD_MST c ON t.category_cd = c.cd AND c.grp_cd = 'CATEGORY'
      WHERE t.usr_id = ?
    `;

    const params: any[] = [usr_id];

    if (use_yn) {
      sql += ` AND t.use_yn = ?`;
      params.push(use_yn);
    }

    if (trx_type) {
      sql += ` AND t.trx_type = ?`;
      params.push(trx_type);
    }

    if (start_date) {
      sql += ` AND t.trx_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      sql += ` AND t.trx_date <= ?`;
      params.push(end_date);
    }

    if (wlt_id) {
      sql += ` AND t.wlt_id = ?`;
      params.push(wlt_id);
    }

    if (category_cd) {
      sql += ` AND t.category_cd = ?`;
      params.push(category_cd);
    }

    if (is_fixed) {
      sql += ` AND t.is_fixed = ?`;
      params.push(is_fixed);
    }

    sql += ` ORDER BY t.trx_date DESC, t.created_at DESC`;

    const rows = await query(sql, params);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('거래 목록 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '거래 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: 거래 등록
 *     description: 새로운 수입/지출 거래를 등록합니다.
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionCreateRequest'
 *     responses:
 *       201:
 *         description: 거래 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 거래가 등록되었습니다.
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wlt_id,
      usr_id,
      trx_type,
      trx_date,
      amount,
      category_cd,
      memo,
      is_fixed,
    } = body;

    // 필수 필드 검증
    if (!wlt_id || !usr_id || !trx_type || !trx_date || !amount || !category_cd) {
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다. (wlt_id, usr_id, trx_type, trx_date, amount, category_cd)' },
        { status: 400 }
      );
    }

    // 거래 유형 검증
    const validTrxTypes = ['INCOME', 'EXPENSE'];
    if (!validTrxTypes.includes(trx_type)) {
      return NextResponse.json(
        { message: '유효하지 않은 거래 유형입니다. (INCOME, EXPENSE)' },
        { status: 400 }
      );
    }

    // 지갑 존재 확인
    const walletCheckSql = `
      SELECT wlt_id FROM moneymate.MMT_WLT_MST 
      WHERE wlt_id = ? AND usr_id = ? AND use_yn = 'Y'
    `;
    const wallets = await query(walletCheckSql, [wlt_id, usr_id]);

    if (wallets.length === 0) {
      return NextResponse.json(
        { message: '유효하지 않은 지갑입니다.' },
        { status: 400 }
      );
    }

    // 거래 등록
    const insertSql = `
      INSERT INTO moneymate.MMT_TRX_TRN (
        trx_id,
        wlt_id,
        usr_id,
        trx_type,
        trx_date,
        amount,
        category_cd,
        memo,
        is_fixed,
        is_installment,
        installment_months,
        installment_seq,
        installment_group_id,
        use_yn
      ) VALUES (
        UUID(),
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'N',
        NULL,
        NULL,
        NULL,
        'Y'
      )
    `;

    await query(insertSql, [
      wlt_id,
      usr_id,
      trx_type,
      trx_date,
      amount,
      category_cd,
      memo || null,
      is_fixed || 'N',
    ]);

    // 등록된 거래 조회
    const selectSql = `
      SELECT 
        t.trx_id,
        t.wlt_id,
        w.wlt_name,
        w.wlt_type,
        t.usr_id,
        t.trx_type,
        t.trx_date,
        t.amount,
        t.category_cd,
        c.cd_nm as category_name,
        t.memo,
        t.is_fixed,
        t.is_installment,
        t.installment_months,
        t.installment_seq,
        t.installment_group_id,
        t.use_yn,
        t.created_at,
        t.updated_at
      FROM moneymate.MMT_TRX_TRN t
      LEFT JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id
      LEFT JOIN moneymate.MMT_CMM_CD_MST c ON t.category_cd = c.cd AND c.grp_cd = 'CATEGORY'
      WHERE t.usr_id = ? AND t.trx_date = ? AND t.amount = ?
      ORDER BY t.created_at DESC
      LIMIT 1
    `;

    const [newTransaction] = await query(selectSql, [usr_id, trx_date, amount]);

    return NextResponse.json(
      {
        message: '거래가 등록되었습니다.',
        data: newTransaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('거래 등록 오류:', error);
    return NextResponse.json(
      { message: error?.message || '거래 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

