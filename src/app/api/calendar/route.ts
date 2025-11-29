import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CalendarData {
  cal_dt: string;
  dow: string;
  is_holiday: string;
  holiday_name: string | null;
  income_sum: number;
  expense_sum: number;
  trx_list: Array<{
    trx_id: string;
    trx_type: string;
    amount: number;
    category_cd: string;
    category_cd_nm: string;
    memo: string | null;
    wlt_id: string;
    wlt_name: string;
    usr_id: string;
    is_shared: boolean;
    created_at: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const yyyy = searchParams.get('yyyy');
    const mm = searchParams.get('mm');

    if (!usr_id || !yyyy || !mm) {
      return NextResponse.json(
        { message: '필수 파라미터가 누락되었습니다. (usr_id, yyyy, mm)' },
        { status: 400 }
      );
    }

    // 1. 캘린더 기본 정보와 합계 조회
    const calendarSql = `
      SELECT
        c.cal_dt,
        c.dow,
        c.is_holiday,
        c.holiday_name,
        COALESCE(SUM(CASE WHEN combined_trx.trx_type='INCOME'  THEN combined_trx.amount END), 0) AS income_sum,
        COALESCE(SUM(CASE WHEN combined_trx.trx_type='EXPENSE' THEN combined_trx.amount END), 0) AS expense_sum
      FROM moneymate.MMT_CAL_MST c
      LEFT JOIN (
        -- 본인의 모든 거래 (공유/비공유 포함)
        SELECT 
          t.trx_date,
          t.trx_type,
          t.amount
        FROM moneymate.MMT_TRX_TRN t
        INNER JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id
        WHERE t.usr_id = ?
          AND t.use_yn = 'Y'
          AND w.use_yn = 'Y'
        
        UNION ALL
        
        -- 공유 그룹 멤버들의 공유 지갑 거래 (본인 제외)
        SELECT 
          t.trx_date,
          t.trx_type,
          t.amount
        FROM moneymate.MMT_TRX_TRN t
        INNER JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id AND w.share_yn = 'Y'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m1 ON t.usr_id = m1.usr_id AND m1.status = 'ACCEPTED'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m2 ON m1.grp_id = m2.grp_id AND m2.usr_id = ? AND m2.status = 'ACCEPTED'
        WHERE t.usr_id != ?
          AND t.use_yn = 'Y'
          AND w.use_yn = 'Y'
      ) combined_trx ON combined_trx.trx_date = c.cal_dt
      WHERE c.yyyy = ?
        AND c.mm = ?
      GROUP BY c.cal_dt, c.dow, c.is_holiday, c.holiday_name
      ORDER BY c.cal_dt
    `;

    // 2. 거래 상세 내역 조회
    const transactionsSql = `
      SELECT 
        combined_trx.*,
        COALESCE(
          (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'CATEGORY' AND cd = combined_trx.category_cd),
          combined_trx.category_cd
        ) as category_cd_nm
      FROM (
        -- 본인의 모든 거래 (공유/비공유 포함)
        SELECT 
          t.trx_id,
          t.trx_type,
          t.amount,
          t.category_cd,
          t.memo,
          t.wlt_id,
          w.wlt_name,
          t.usr_id,
          t.trx_date,
          DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
          false as is_shared
        FROM moneymate.MMT_TRX_TRN t
        INNER JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id
        WHERE t.usr_id = ?
          AND t.use_yn = 'Y'
          AND w.use_yn = 'Y'
          AND DATE_FORMAT(t.trx_date, '%Y') = ?
          AND DATE_FORMAT(t.trx_date, '%m') = LPAD(?, 2, '0')
        
        UNION ALL
        
        -- 공유 그룹 멤버들의 공유 지갑 거래 (본인 제외)
        SELECT 
          t.trx_id,
          t.trx_type,
          t.amount,
          t.category_cd,
          t.memo,
          t.wlt_id,
          w.wlt_name,
          t.usr_id,
          t.trx_date,
          DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
          true as is_shared
        FROM moneymate.MMT_TRX_TRN t
        INNER JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id AND w.share_yn = 'Y'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m1 ON t.usr_id = m1.usr_id AND m1.status = 'ACCEPTED'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m2 ON m1.grp_id = m2.grp_id AND m2.usr_id = ? AND m2.status = 'ACCEPTED'
        WHERE t.usr_id != ?
          AND t.use_yn = 'Y'
          AND w.use_yn = 'Y'
          AND DATE_FORMAT(t.trx_date, '%Y') = ?
          AND DATE_FORMAT(t.trx_date, '%m') = LPAD(?, 2, '0')
      ) combined_trx
      ORDER BY combined_trx.trx_date, combined_trx.created_at
    `;

    // console.log('=== Calendar Query with Shared Transactions ===');
    // console.log('Calendar SQL:', calendarSql);
    // console.log('Transactions SQL:', transactionsSql);
    // console.log('Parameters:', [usr_id, usr_id, usr_id, yyyy, mm]);
    // console.log('==========================================');

    // 쿼리 실행
    const [calendarRows, transactionRows] = await Promise.all([
      query(calendarSql, [usr_id, usr_id, usr_id, yyyy, mm]),
      query(transactionsSql, [usr_id, yyyy, mm, usr_id, usr_id, yyyy, mm])
    ]);

    // 거래 내역을 날짜별로 그룹화
    const transactionsByDate = transactionRows.reduce((acc: any, trx: any) => {
      const date = trx.trx_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(trx);
      return acc;
    }, {});

    // 캘린더 데이터에 거래 내역 추가
    const data = calendarRows.map((row: any) => ({
      ...row,
      trx_list: transactionsByDate[row.cal_dt] || []
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('캘린더 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '캘린더 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
