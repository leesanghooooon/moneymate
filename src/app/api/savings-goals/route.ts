import { NextRequest, NextResponse } from 'next/server';
import { dbSelect } from '../../../lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');

    if (!usr_id) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 저축목표 조회 (지갑 정보 포함)
    const goalsQuery = `
      SELECT 
        sg.*,
        w.wlt_name
      FROM MMT_SAV_GOL_MST sg
      LEFT JOIN MMT_WLT_MST w ON sg.wlt_id = w.wlt_id
      WHERE sg.usr_id = ? AND sg.use_yn = 'Y'
      ORDER BY sg.created_at DESC
    `;

    const goals = await dbSelect(goalsQuery, [usr_id]);

    return NextResponse.json({
      success: true,
      data: goals
    });

  } catch (error) {
    console.error('저축목표 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '저축목표 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      usr_id,
      wlt_id,
      goal_name,
      goal_type_cd = 'SAVINGS',
      purpose_cd,
      target_amount,
      start_date,
      end_date,
      deposit_cycle_cd,
      plan_amount,
      alarm_yn = 'N',
      alarm_day,
      memo
    } = body;

    // 필수 필드 검증
    if (!usr_id || !goal_name || !target_amount || !start_date) {
      return NextResponse.json(
        { success: false, message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // UUID 생성
    const sav_goal_id = crypto.randomUUID();

    const insertQuery = `
      INSERT INTO MMT_SAV_GOL_MST (
        sav_goal_id, usr_id, wlt_id, goal_name, goal_type_cd, purpose_cd,
        target_amount, start_date, end_date, deposit_cycle_cd, plan_amount,
        alarm_yn, alarm_day, memo, use_yn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y')
    `;

    const result = await dbSelect(insertQuery, [
      sav_goal_id, usr_id, wlt_id, goal_name, goal_type_cd, purpose_cd,
      target_amount, start_date, end_date, deposit_cycle_cd, plan_amount,
      alarm_yn, alarm_day, memo
    ]);

    return NextResponse.json({
      success: true,
      message: '저축목표가 생성되었습니다.',
      data: { sav_goal_id }
    });

  } catch (error) {
    console.error('저축목표 생성 오류:', error);
    return NextResponse.json(
      { success: false, message: '저축목표 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
