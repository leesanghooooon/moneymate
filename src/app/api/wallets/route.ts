import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /wallets:
 *   get:
 *     summary: 지갑 목록 조회
 *     description: 사용자의 지갑 목록을 조회합니다.
 *     tags: [Wallets]
 *     parameters:
 *       - in: query
 *         name: usr_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *       - in: query
 *         name: use_yn
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Y, N]
 *           default: Y
 *         description: 사용 여부 (Y/N)
 *     responses:
 *       200:
 *         description: 지갑 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wallet'
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
    const use_yn = searchParams.get('use_yn') || 'Y';

    if (!usr_id) {
      return NextResponse.json(
        { message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        wlt_id,
        usr_id,
        wlt_type,
        wlt_name,
        bank_cd,
        card_number,
        is_default,
        use_yn,
        share_yn,
        created_at,
        updated_at
      FROM moneymate.MMT_WLT_MST
      WHERE usr_id = ?
    `;

    const params: any[] = [usr_id];

    if (use_yn) {
      sql += ` AND use_yn = ?`;
      params.push(use_yn);
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = await query(sql, params);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('지갑 목록 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지갑 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /wallets:
 *   post:
 *     summary: 지갑 등록
 *     description: 새로운 지갑을 등록합니다.
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletCreateRequest'
 *     responses:
 *       201:
 *         description: 지갑 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 지갑이 등록되었습니다.
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
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
    const { usr_id, wlt_type, wlt_name, bank_cd, card_number, is_default, use_yn, share_yn } = body;

    // 필수 필드 검증
    if (!usr_id || !wlt_type || !wlt_name) {
      return NextResponse.json(
        { message: '사용자 ID, 지갑 유형, 지갑 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 지갑 유형 검증
    const validWltTypes = ['CARD', 'CASH', 'ACCOUNT', 'SIMPLE_PAY'];
    if (!validWltTypes.includes(wlt_type)) {
      return NextResponse.json(
        { message: '유효하지 않은 지갑 유형입니다.' },
        { status: 400 }
      );
    }

    // 기본 지갑 설정 시 기존 기본 지갑 해제
    if (is_default === 'Y') {
      const updateDefaultSql = `
        UPDATE moneymate.MMT_WLT_MST
        SET is_default = 'N'
        WHERE usr_id = ? AND is_default = 'Y'
      `;
      await query(updateDefaultSql, [usr_id]);
    }

    // 지갑 등록
    const insertSql = `
      INSERT INTO moneymate.MMT_WLT_MST (
        wlt_id,
        usr_id,
        wlt_type,
        wlt_name,
        bank_cd,
        card_number,
        is_default,
        use_yn,
        share_yn
      ) VALUES (
        UUID(),
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
    `;

    await query(insertSql, [
      usr_id,
      wlt_type,
      wlt_name,
      bank_cd || null,
      card_number || null,
      is_default || 'N',
      use_yn || 'Y',
      share_yn || 'N',
    ]);

    // 등록된 지갑 조회
    const selectSql = `
      SELECT 
        wlt_id,
        usr_id,
        wlt_type,
        wlt_name,
        bank_cd,
        card_number,
        is_default,
        use_yn,
        share_yn,
        created_at,
        updated_at
      FROM moneymate.MMT_WLT_MST
      WHERE usr_id = ? AND wlt_name = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [newWallet] = await query(selectSql, [usr_id, wlt_name]);

    return NextResponse.json(
      {
        message: '지갑이 등록되었습니다.',
        data: newWallet,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('지갑 등록 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지갑 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

