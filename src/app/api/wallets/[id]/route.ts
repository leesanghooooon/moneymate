import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbSelect, dbUpdate } from '@/lib/db-utils';
import { ApiError } from '@/lib/api/common';

/**
 * 지갑 정보 수정
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: 지갑 정보 수정
 *     description: 지정된 ID의 지갑 정보를 수정합니다.
 *     tags:
 *       - Wallets
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 수정할 지갑의 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usr_id
 *               - wlt_type
 *               - wlt_name
 *             properties:
 *               usr_id:
 *                 type: string
 *                 description: 사용자 ID
 *               wlt_type:
 *                 type: string
 *                 description: 지갑 유형 (CASH, CHECK_CARD, CREDIT_CARD)
 *               wlt_name:
 *                 type: string
 *                 description: 지갑 이름
 *               bank_cd:
 *                 type: string
 *                 nullable: true
 *                 description: 은행/카드사 코드
 *               is_default:
 *                 type: string
 *                 enum: [Y, N]
 *                 default: N
 *                 description: 기본 지갑 여부
 *     responses:
 *       200:
 *         description: 지갑 정보가 성공적으로 수정됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 지갑이 수정되었습니다.
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 필수 정보가 누락되었습니다.
 *       401:
 *         description: 인증되지 않은 요청
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 지갑을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    // }

    const body = await request.json();
    const { usr_id, wlt_type, wlt_name, bank_cd, is_default } = body;

    // 필수 필드 검증
    if (!usr_id || !wlt_type || !wlt_name) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 권한 검증
    // if (session.user.id !== usr_id) {
    //   return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    // }

    // 지갑 존재 여부 확인
    const existingWallets = await dbSelect({
      table: 'MMT_WLT_MST',
      columns: ['wlt_id'],
      filters: {
        wlt_id: params.id,
        usr_id: usr_id,
        use_yn: 'Y'
      }
    });

    if (!existingWallets.length) {
      return NextResponse.json({ error: '지갑을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 기본 지갑으로 설정하는 경우, 기존 기본 지갑의 상태를 변경
    if (is_default === 'Y') {
      await dbUpdate({
        table: 'MMT_WLT_MST',
        data: { is_default: 'N' },
        where: 'usr_id = ? AND wlt_id != ? AND use_yn = ?',
        params: [usr_id, params.id, 'Y']
      });
    }

    // 지갑 정보 업데이트
    await dbUpdate({
        table: 'MMT_WLT_MST',
        data: {
            wlt_type,
            wlt_name,
            bank_cd: bank_cd || null,
            is_default: is_default || 'N',
            updated_at: new Date()
        },
        where: 'wlt_id = ? AND usr_id = ?',
        params: [params.id, usr_id]
    });

    return NextResponse.json({ message: '지갑이 수정되었습니다.' });

  } catch (error) {
    console.error('지갑 수정 중 오류 발생:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: '지갑 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 지갑 삭제
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: 지갑 삭제
 *     description: 지정된 ID의 지갑을 삭제합니다.
 *     tags:
 *       - Wallets
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 삭제할 지갑의 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 지갑이 성공적으로 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 지갑이 삭제되었습니다.
 *       401:
 *         description: 인증되지 않은 요청
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 지갑을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    // 지갑 존재 여부 및 소유권 확인
    const wallets = await dbSelect({
      table: 'MMT_WLT_MST',
      columns: ['usr_id'],
      filters: {
        wlt_id: params.id,
        use_yn: 'Y'
      }
    });

    if (!wallets.length) {
      return NextResponse.json({ error: '지갑을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (wallets[0].usr_id !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 지갑 논리적 삭제 (use_yn = 'N')
    await dbUpdate({
      table: 'MMT_WLT_MST',
      data: {
        use_yn: 'N',
        upd_dt: new Date()
      },
      where: 'wlt_id = ?',
      params: [params.id]
    });

    return NextResponse.json({ message: '지갑이 삭제되었습니다.' });

  } catch (error) {
    console.error('지갑 삭제 중 오류 발생:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: '지갑 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
