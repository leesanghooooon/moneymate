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

    const sql = `
      SELECT
        c.cal_dt,
        c.dow,
        c.is_holiday,
        c.holiday_name,
        COALESCE(SUM(CASE WHEN t.trx_type='INCOME'  THEN t.amount END), 0) AS income_sum,
        COALESCE(SUM(CASE WHEN t.trx_type='EXPENSE' THEN t.amount END), 0) AS expense_sum,
        COALESCE(
          CAST(
            CONCAT(
              '[',
              GROUP_CONCAT(
                IF(
                  t.trx_id IS NULL, NULL,
                  JSON_OBJECT(
                    'trx_id',      t.trx_id,
                    'trx_type',    t.trx_type,
                    'amount',      t.amount,
                    'category_cd', t.category_cd,
                    'category_cd_nm', (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'CATEGORY' AND cd = 'FOOD'),
                    'memo',        t.memo,
                    'wlt_id',      t.wlt_id,
                    'created_at',  DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s')
                  )
                )
                ORDER BY t.created_at SEPARATOR ','
              ),
              ']'
            ) AS JSON
          ),
          JSON_ARRAY()
        ) AS trx_list
      FROM moneymate.MMT_CAL_MST c
      LEFT JOIN moneymate.MMT_TRX_TRN t
        ON t.trx_date = c.cal_dt
       AND t.usr_id   = ?
       AND t.use_yn   = 'Y'
      WHERE c.yyyy = ?
        AND c.mm = ?
      GROUP BY c.cal_dt, c.dow, c.is_holiday, c.holiday_name
      ORDER BY c.cal_dt
    `;

    console.log('=== Calendar Query ===');
    console.log('SQL:', sql);
    console.log('Parameters:', [usr_id, yyyy, mm]);
    console.log('==================');

    const rows = await query<CalendarData>(sql, [usr_id, yyyy, mm]);

    // trx_list를 JSON으로 파싱
    const data = rows.map(row => ({
      ...row,
      trx_list: typeof row.trx_list === 'string' ? JSON.parse(row.trx_list) : row.trx_list
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
