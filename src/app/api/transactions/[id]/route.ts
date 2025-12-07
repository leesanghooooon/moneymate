import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: 거래 상세 조회
 *     description: 거래 ID로 거래 상세 정보를 조회합니다.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 거래 ID
 *     responses:
 *       200:
 *         description: 거래 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: 거래를 찾을 수 없음
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
    const trx_id = resolvedParams.id;

    const sql = `
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
      WHERE t.trx_id = ?
    `;

    const rows = await query(sql, [trx_id]);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: '거래를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error('거래 상세 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '거래 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: 거래 수정
 *     description: 거래 정보를 수정합니다.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 거래 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionUpdateRequest'
 *     responses:
 *       200:
 *         description: 거래 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 거래가 수정되었습니다.
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 거래를 찾을 수 없음
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
    const trx_id = resolvedParams.id;
    const body = await request.json();
    const {
      wlt_id,
      trx_type,
      trx_date,
      amount,
      category_cd,
      memo,
      is_fixed,
    } = body;

    // 거래 존재 확인
    const checkSql = `
      SELECT usr_id, wlt_id FROM moneymate.MMT_TRX_TRN WHERE trx_id = ?
    `;
    const existing = await query(checkSql, [trx_id]);

    if (existing.length === 0) {
      return NextResponse.json(
        { message: '거래를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const usr_id = existing[0].usr_id;
    const current_wlt_id = existing[0].wlt_id;

    // 지갑 변경 시 지갑 존재 확인
    if (wlt_id && wlt_id !== current_wlt_id) {
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
    }

    // 거래 유형 검증
    if (trx_type) {
      const validTrxTypes = ['INCOME', 'EXPENSE'];
      if (!validTrxTypes.includes(trx_type)) {
        return NextResponse.json(
          { message: '유효하지 않은 거래 유형입니다. (INCOME, EXPENSE)' },
          { status: 400 }
        );
      }
    }

    // 거래 수정
    const updateSql = `
      UPDATE moneymate.MMT_TRX_TRN
      SET 
        wlt_id = ?,
        trx_type = ?,
        trx_date = ?,
        amount = ?,
        category_cd = ?,
        memo = ?,
        is_fixed = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE trx_id = ?
    `;

    await query(updateSql, [
      wlt_id || current_wlt_id,
      trx_type || existing[0].trx_type,
      trx_date,
      amount,
      category_cd,
      memo !== undefined ? memo : null,
      is_fixed || 'N',
      trx_id,
    ]);

    // 수정된 거래 조회
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
      WHERE t.trx_id = ?
    `;

    const [updatedTransaction] = await query(selectSql, [trx_id]);

    return NextResponse.json({
      message: '거래가 수정되었습니다.',
      data: updatedTransaction,
    });
  } catch (error: any) {
    console.error('거래 수정 오류:', error);
    return NextResponse.json(
      { message: error?.message || '거래 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: 거래 삭제
 *     description: 거래를 삭제합니다. (실제로는 use_yn을 'N'으로 변경)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 거래 ID
 *     responses:
 *       200:
 *         description: 거래 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 거래가 삭제되었습니다.
 *       404:
 *         description: 거래를 찾을 수 없음
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
    const trx_id = resolvedParams.id;

    // 거래 존재 확인
    const checkSql = `
      SELECT trx_id FROM moneymate.MMT_TRX_TRN WHERE trx_id = ?
    `;
    const existing = await query(checkSql, [trx_id]);

    if (existing.length === 0) {
      return NextResponse.json(
        { message: '거래를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 거래 삭제 (use_yn을 'N'으로 변경)
    const deleteSql = `
      UPDATE moneymate.MMT_TRX_TRN
      SET use_yn = 'N', updated_at = CURRENT_TIMESTAMP
      WHERE trx_id = ?
    `;

    await query(deleteSql, [trx_id]);

    return NextResponse.json({
      message: '거래가 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('거래 삭제 오류:', error);
    return NextResponse.json(
      { message: error?.message || '거래 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

