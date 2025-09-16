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

    // 저축목표 조회 (지갑 정보와 누적 납입금액 포함)
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
        },
        {
          name: 'COALESCE((SELECT SUM(amount) FROM MMT_SAV_GOL_CONTRIB sc WHERE sc.sav_goal_id = sg.sav_goal_id), 0)',
          alias: 'current_amount'
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

// ... POST 메서드는 그대로 유지 ...