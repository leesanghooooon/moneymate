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

    console.log('specificWeekRanges:',specificWeekRanges)

    // 이번 주의 종료일 (오늘)
    const thisWeekStart = specificWeekRanges.thisWeekStart;
    const thisWeekEnd = specificWeekRanges.thisWeekEnd;

    // 지난 주의 시작일과 종료일
    const lastWeekStart = specificWeekRanges.lastWeekStart
    const lastWeekEnd = specificWeekRanges.lastWeekEnd

    // SQL 쿼리 작성
    const sql = `
      WITH RECURSIVE dates AS (
        SELECT DATE(?) as date
        UNION ALL
        SELECT DATE_ADD(date, INTERVAL 1 DAY)
        FROM dates
        WHERE date < ?
      ),
      this_week AS (
        SELECT 
          d.date,
          COALESCE(SUM(t.amount), 0) as amount
        FROM dates d
        LEFT JOIN MMT_TRX_TRN t ON DATE(t.trx_date) = d.date 
          AND t.usr_id = ?
          AND t.trx_type = 'EXPENSE'
          AND t.use_yn = 'Y'
        GROUP BY d.date
      ),
      last_week AS (
        SELECT 
          DATE_ADD(d.date, INTERVAL 7 DAY) as date,
          COALESCE(SUM(t.amount), 0) as amount
        FROM dates d
        LEFT JOIN MMT_TRX_TRN t ON DATE(t.trx_date) = d.date 
          AND t.usr_id = ?
          AND t.trx_type = 'EXPENSE'
          AND t.use_yn = 'Y'
        WHERE d.date BETWEEN ? AND ?
        GROUP BY d.date
      )
      SELECT 
        tw.date,
        tw.amount as current_amount,
        lw.amount as previous_amount
      FROM this_week tw
      LEFT JOIN last_week lw ON tw.date = lw.date
      ORDER BY tw.date;
    `;

    const params = [
      thisWeekStart,
      thisWeekEnd,
      usr_id,
      usr_id,
      lastWeekStart,
      lastWeekEnd
    ];

    const rows = await query(sql, params);

    // 집계 데이터 계산
    const thisWeekTotal = rows.reduce((sum: number, row: any) => sum + row.current_amount, 0);
    const lastWeekTotal = rows.reduce((sum: number, row: any) => sum + row.previous_amount, 0);
    
    // 날짜 포맷팅
    const formattedRows = rows.map((row: any) => ({
      ...row,
      date: new Date(row.date).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })
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
