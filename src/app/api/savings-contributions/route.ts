import { NextRequest, NextResponse } from 'next/server';
import { dbSelect } from '../../../lib/db-common';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const sav_goal_id = searchParams.get('sav_goal_id');

    if (!usr_id) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let query = `
      SELECT c.*
      FROM MMT_SAV_GOL_CONTRIB c
      INNER JOIN MMT_SAV_GOL_MST sg ON c.sav_goal_id = sg.sav_goal_id
      WHERE sg.usr_id = ?
    `;
    
    const params = [usr_id];

    if (sav_goal_id) {
      query += ' AND c.sav_goal_id = ?';
      params.push(sav_goal_id);
    }

    query += ' ORDER BY c.contrib_date DESC, c.created_at DESC';

    const contributions = await dbSelect(query, params);

    return NextResponse.json({
      success: true,
      data: contributions
    });

  } catch (error) {
    console.error('납입내역 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '납입내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sav_goal_id,
      trx_id,
      contrib_date,
      amount,
      memo
    } = body;

    // 필수 필드 검증
    if (!sav_goal_id || !contrib_date || !amount) {
      return NextResponse.json(
        { success: false, message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // UUID 생성
    const contrib_id = crypto.randomUUID();

    const insertQuery = `
      INSERT INTO MMT_SAV_GOL_CONTRIB (
        contrib_id, sav_goal_id, trx_id, contrib_date, amount, memo
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await dbSelect(insertQuery, [
      contrib_id, sav_goal_id, trx_id, contrib_date, amount, memo
    ]);

    return NextResponse.json({
      success: true,
      message: '납입내역이 등록되었습니다.',
      data: { contrib_id }
    });

  } catch (error) {
    console.error('납입내역 등록 오류:', error);
    return NextResponse.json(
      { success: false, message: '납입내역 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
