import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /wallets/{id}:
 *   get:
 *     summary: 지갑 상세 조회
 *     description: 지갑 ID로 지갑 상세 정보를 조회합니다.
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 지갑 ID
 *     responses:
 *       200:
 *         description: 지갑 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       404:
 *         description: 지갑을 찾을 수 없음
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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const wlt_id = resolvedParams.id;

    const sql = `
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
      WHERE wlt_id = ?
    `;

    const rows = await query(sql, [wlt_id]);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error('지갑 상세 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지갑 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /wallets/{id}:
 *   put:
 *     summary: 지갑 수정
 *     description: 지갑 정보를 수정합니다.
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 지갑 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletUpdateRequest'
 *     responses:
 *       200:
 *         description: 지갑 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 지갑이 수정되었습니다.
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 지갑을 찾을 수 없음
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const wlt_id = resolvedParams.id;
    const body = await request.json();
    const { wlt_type, wlt_name, bank_cd, card_number, is_default, use_yn, share_yn } = body;

    // 지갑 존재 확인
    const checkSql = `
      SELECT usr_id FROM moneymate.MMT_WLT_MST WHERE wlt_id = ?
    `;
    const existing = await query(checkSql, [wlt_id]);

    if (existing.length === 0) {
      return NextResponse.json(
        { message: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const usr_id = existing[0].usr_id;

    // 기본 지갑 설정 시 기존 기본 지갑 해제
    if (is_default === 'Y') {
      const updateDefaultSql = `
        UPDATE moneymate.MMT_WLT_MST
        SET is_default = 'N'
        WHERE usr_id = ? AND is_default = 'Y' AND wlt_id != ?
      `;
      await query(updateDefaultSql, [usr_id, wlt_id]);
    }

    // 지갑 수정
    const updateSql = `
      UPDATE moneymate.MMT_WLT_MST
      SET 
        wlt_type = ?,
        wlt_name = ?,
        bank_cd = ?,
        card_number = ?,
        is_default = ?,
        use_yn = ?,
        share_yn = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE wlt_id = ?
    `;

    await query(updateSql, [
      wlt_type,
      wlt_name,
      bank_cd || null,
      card_number || null,
      is_default || 'N',
      use_yn || 'Y',
      share_yn || 'N',
      wlt_id,
    ]);

    // 수정된 지갑 조회
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
      WHERE wlt_id = ?
    `;

    const [updatedWallet] = await query(selectSql, [wlt_id]);

    return NextResponse.json({
      message: '지갑이 수정되었습니다.',
      data: updatedWallet,
    });
  } catch (error: any) {
    console.error('지갑 수정 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지갑 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: 지갑 삭제
 *     description: 지갑을 삭제합니다. (실제로는 use_yn을 'N'으로 변경)
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 지갑 ID
 *     responses:
 *       200:
 *         description: 지갑 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 지갑이 삭제되었습니다.
 *       404:
 *         description: 지갑을 찾을 수 없음
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const wlt_id = resolvedParams.id;

    // 지갑 존재 확인
    const checkSql = `
      SELECT wlt_id FROM moneymate.MMT_WLT_MST WHERE wlt_id = ?
    `;
    const existing = await query(checkSql, [wlt_id]);

    if (existing.length === 0) {
      return NextResponse.json(
        { message: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 지갑 삭제 (use_yn을 'N'으로 변경)
    const deleteSql = `
      UPDATE moneymate.MMT_WLT_MST
      SET use_yn = 'N', updated_at = CURRENT_TIMESTAMP
      WHERE wlt_id = ?
    `;

    await query(deleteSql, [wlt_id]);

    return NextResponse.json({
      message: '지갑이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('지갑 삭제 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지갑 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

