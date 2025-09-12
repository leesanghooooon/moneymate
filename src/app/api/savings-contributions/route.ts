import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert } from '../../../lib/db-utils';

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

    // 납입내역 조회
    const filters: Record<string, any> = {
      'sg.usr_id': usr_id
    };

    if (sav_goal_id) {
      filters['c.sav_goal_id'] = sav_goal_id;
    }

    const contributions = await dbSelect({
      table: 'MMT_SAV_GOL_CONTRIB c',
      columns: ['c.*'],
      filters,
      allowedFilterFields: ['sg.usr_id', 'c.sav_goal_id'],
      orderBy: 'c.contrib_date DESC, c.created_at DESC',
      joins: [
        {
          type: 'INNER',
          table: 'MMT_SAV_GOL_MST sg',
          on: 'c.sav_goal_id = sg.sav_goal_id'
        }
      ]
    });

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

    // 납입내역 등록
    await dbInsert({
      table: 'MMT_SAV_GOL_CONTRIB',
      data: {
        contrib_id,
        sav_goal_id,
        trx_id,
        contrib_date,
        amount,
        memo
      }
    });

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