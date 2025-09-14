import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert } from '../../../lib/db-utils';

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: 사용자의 지갑 목록 조회
 *     description: 사용자 ID와 지갑 유형으로 지갑 목록을 조회합니다.
 *     parameters:
 *       - name: usr_id
 *         in: query
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: wlt_type
 *         in: query
 *         description: 지갑 유형 (CASH, CHECK_CARD, CREDIT_CARD)
 *         required: false
 *         schema:
 *           type: string
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
 *                     type: object
 *                     properties:
 *                       wlt_id:
 *                         type: integer
 *                         description: 지갑 ID
 *                       wlt_name:
 *                         type: string
 *                         description: 지갑 이름
 *                       wlt_type:
 *                         type: string
 *                         description: 지갑 유형
 *                       bank_cd:
 *                         type: string
 *                         description: 은행/카드사 코드
 *                       is_default:
 *                         type: string
 *                         description: 기본 지갑 여부 (Y/N)
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.usr_id || !body.wlt_type || !body.wlt_name) {
      return NextResponse.json(
        { message: '필수 정보가 누락되었습니다. (usr_id, wlt_type, wlt_name)' },
        { status: 400 }
      );
    }

    await dbInsert({
      table: 'MMT_WLT_MST',
      data: {
        usr_id: body.usr_id,
        wlt_type: body.wlt_type,
        wlt_name: body.wlt_name,
        bank_cd: body.bank_cd || null,
        is_default: body.is_default || 'N',
        share_yn: body.share_yn || 'N',
        use_yn: 'Y'
      }
    });
    
    return NextResponse.json(
      { message: '지갑이 등록되었습니다.' },
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const wlt_type = searchParams.get('wlt_type');

    if (!usr_id) {
      return NextResponse.json(
        { message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const filters: Record<string, any> = {
      usr_id,
      use_yn: 'Y'
    };

    if (wlt_type) {
      filters.wlt_type = wlt_type;
    }

    const rows = await dbSelect({
      table: 'MMT_WLT_MST',
      columns: ['wlt_id', 'wlt_name', 'wlt_type', 'bank_cd', 'is_default', 'share_yn'],
      filters,
      allowedFilterFields: ['usr_id', 'wlt_type', 'use_yn'],
      orderBy: 'wlt_id'
    });

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || '지갑 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}