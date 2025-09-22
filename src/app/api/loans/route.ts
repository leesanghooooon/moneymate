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

    // 대출현황 조회 (지갑 정보와 누적 상환금액 포함)
    const loans = await dbSelect({
      table: 'MMT_SAV_GOL_MST lg',
      columns: [
        'lg.*',
        'w.wlt_name',
        {
          name: '(SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = \'TRX_TYPE\' AND cd = lg.goal_type_cd)',
          alias: 'goal_type_cd_nm'
        },
        {
          name: '(SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = \'GOAL_TYPE\' AND cd = lg.purpose_cd)',
          alias: 'purpose_cd_nm'
        },
        {
          name: '(SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = \'SAV_CYCLE\' AND cd = lg.deposit_cycle_cd)',
          alias: 'deposit_cycle_cd_nm'
        },
        {
          name: 'COALESCE((SELECT SUM(amount) FROM MMT_SAV_GOL_CONTRIB sc WHERE sc.sav_goal_id = lg.sav_goal_id), 0)',
          alias: 'current_amount'
        }
      ],
      filters: {
        'lg.usr_id': usr_id,
        'lg.goal_type_cd': 'LOAN',
        'lg.use_yn': 'Y'
      },
      allowedFilterFields: ['lg.usr_id', 'lg.goal_type_cd', 'lg.use_yn'],
      orderBy: 'lg.created_at DESC',
      joins: [
        {
          type: 'LEFT',
          table: 'MMT_WLT_MST w',
          on: 'lg.wlt_id = w.wlt_id'
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: loans
    });

  } catch (error) {
    console.error('대출현황 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '대출현황 조회 중 오류가 발생했습니다.' },
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
      purpose_cd,
      target_amount, // 대출 원금
      start_date,
      end_date,
      deposit_cycle_cd, // 상환 주기
      plan_amount, // 월 상환액
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

    // 대출 등록 (goal_type_cd는 LOAN으로 고정)
    await dbInsert({
      table: 'MMT_SAV_GOL_MST',
      data: {
        sav_goal_id,
        usr_id,
        wlt_id,
        goal_name,
        goal_type_cd: 'LOAN', // 대출로 고정
        purpose_cd,
        target_amount, // 대출 원금
        start_date,
        end_date,
        deposit_cycle_cd, // 상환 주기
        plan_amount, // 월 상환액
        alarm_yn,
        alarm_day,
        memo,
        use_yn: 'Y'
      }
    });

    return NextResponse.json({
      success: true,
      message: '대출이 등록되었습니다.',
      data: { sav_goal_id }
    });

  } catch (error) {
    console.error('대출 등록 오류:', error);
    return NextResponse.json(
      { success: false, message: '대출 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
