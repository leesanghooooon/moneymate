import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert } from '../../../lib/db-utils';

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
    const goals = await dbSelect({
      table: 'MMT_SAV_GOL_MST sg',
      columns: [
        'sg.*',
        'w.wlt_name',
        {
          name: '(SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = \'GOAL_TYPE\' AND cd = sg.goal_type_cd)',
          alias: 'goal_type_cd_nm'
        },
        {
          name: '(SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = \'GOAL_TYPE\' AND cd = sg.purpose_cd)',
          alias: 'purpose_cd_nm'
        },
        {
          name: '(SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = \'SAV_CYCLE\' AND cd = sg.deposit_cycle_cd)',
          alias: 'deposit_cycle_cd_nm'
        }
      ],
      filters: {
        'sg.usr_id': usr_id,
        'sg.use_yn': 'Y'
      },
      allowedFilterFields: ['sg.usr_id', 'sg.use_yn'],
      orderBy: 'sg.created_at DESC',
      joins: [
        {
          type: 'LEFT',
          table: 'MMT_WLT_MST w',
          on: 'sg.wlt_id = w.wlt_id'
        }
      ]
    });

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

    // 저축목표 등록
    await dbInsert({
      table: 'MMT_SAV_GOL_MST',
      data: {
        sav_goal_id,
        usr_id,
        wlt_id,
        goal_name,
        goal_type_cd,
        purpose_cd,
        target_amount,
        start_date,
        end_date,
        deposit_cycle_cd,
        plan_amount,
        alarm_yn,
        alarm_day,
        memo,
        use_yn: 'Y'
      }
    });

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