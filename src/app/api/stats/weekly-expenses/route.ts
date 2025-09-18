import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getWeekDateRanges } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');

    if (!usr_id) {
      return NextResponse.json(
        { message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 날짜 기준으로 이번 주와 지난 주의 시작일, 종료일 계산
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 이번 주의 시작일 (일요일)
    const specificDate = new Date(today);
    const specificWeekRanges = getWeekDateRanges(specificDate);


    // 이번 주의 종료일 (오늘)
    const thisWeekStart = specificWeekRanges.thisWeekStart;
    const thisWeekEnd = specificWeekRanges.thisWeekEnd;

    // 지난 주의 시작일과 종료일
    const lastWeekStart = specificWeekRanges.lastWeekStart
    const lastWeekEnd = specificWeekRanges.lastWeekEnd

    // SQL 쿼리 작성
    const sql = `
      WITH RECURSIVE dates AS (
        SELECT DATE(?) AS d
      UNION ALL
      SELECT DATE_ADD(d, INTERVAL 1 DAY)
      FROM dates
      WHERE d < DATE(?)
        ),
        this_week AS (
      SELECT
        d.d AS date,
        COALESCE(SUM(t.amount), 0) AS amount
      FROM dates d
        LEFT JOIN MMT_TRX_TRN t
      ON t.usr_id   = ?
        AND t.trx_type = 'EXPENSE'
        AND t.use_yn   = 'Y'
        AND t.trx_date >= d.d
        AND t.trx_date <  d.d + INTERVAL 1 DAY
      GROUP BY d.d
        ),
        last_month_same_week AS (
      SELECT
        DATE_ADD(DATE(t.trx_date), INTERVAL DATEDIFF(?, ?) DAY) AS date_cur,
        COALESCE(SUM(t.amount), 0) AS amount
      FROM MMT_TRX_TRN t
      WHERE t.usr_id   = ?
        AND t.trx_type = 'EXPENSE'
        AND t.use_yn   = 'Y'
        AND t.trx_date >= DATE(?)
        AND t.trx_date <  DATE(?) + INTERVAL 1 DAY
      GROUP BY DATE_ADD(DATE(t.trx_date), INTERVAL DATEDIFF(?, ?) DAY)
        )
      SELECT
        tw.date,
        tw.amount AS current_amount,
        COALESCE(lm.amount, 0) AS previous_amount
      FROM this_week tw
             LEFT JOIN last_month_same_week lm
                       ON lm.date_cur = tw.date
      ORDER BY tw.date;
    `;

    const params = [
      thisWeekStart,
      thisWeekEnd,
      usr_id,
      thisWeekStart,
      lastWeekStart,
      usr_id,
      lastWeekStart,
      lastWeekEnd,
      thisWeekStart,
      lastWeekStart,
    ];

    const rows = await query(sql, params);

    // 집계 데이터 계산 (문자열 누적 방지)
    const thisWeekTotal = rows.reduce((sum: number, row: any) => sum + Number(row.current_amount || 0), 0);
    const lastWeekTotal = rows.reduce((sum: number, row: any) => sum + Number(row.previous_amount || 0), 0);

    console.log('thisWeekTotal:', thisWeekTotal)

    // 날짜 포맷팅
    const formattedRows = rows.map((row: any) => ({
      ...row,
      // date: new Date(row.date).toLocaleDateString('ko-KR', {
      //   month: 'long',
      //   day: 'numeric'
      // })
    }));

    return NextResponse.json({
      success: true,
      data: {
        daily: formattedRows,
        summary: {
          thisWeekTotal,
          lastWeekTotal,
          changeRate: lastWeekTotal ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0
        }
      }
    });
  } catch (error: any) {
    console.error('주간 지출 통계 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error?.message || '주간 지출 통계 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
