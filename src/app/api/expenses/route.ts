import { NextRequest, NextResponse } from 'next/server';
import { dbInsert } from '../../../lib/db-utils';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const trx_type = searchParams.get('trx_type');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const wlt_type = searchParams.get('wlt_type');

    if (!usr_id) {
      return NextResponse.json(
        { message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        t1.trx_id
        , t2.wlt_id
        , t2.wlt_name
        , t2.wlt_type
        , t1.trx_date
        , t1.amount
        , (CASE
            WHEN t1.trx_type = 'EXPENSE' THEN (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'CATEGORY' AND cd = t1.category_cd)
            WHEN t1.trx_type = 'INCOME' THEN (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'INCOME' AND cd = t1.category_cd)
            ELSE ''
        END) AS category_name
        , t1.memo
        , t1.is_installment
        , CASE 
            WHEN t1.is_installment = 'Y' 
            THEN CONCAT(t1.installment_seq, '/', t1.installment_months)
            ELSE NULL 
          END installment_info
        , t1.trx_type
        , (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'TRX_TYPE' AND cd = t1.trx_type) trx_type_name
        , (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'WLT_TYPE' AND cd = t2.wlt_type) wlt_type_name
      FROM MMT_TRX_TRN t1
      JOIN MMT_WLT_MST t2 ON t1.wlt_id = t2.wlt_id
      WHERE t1.usr_id = ?
        AND t1.use_yn = 'Y'
    `;
    const params: any[] = [usr_id];

    if (trx_type) {
      sql += ' AND t1.trx_type = ?';
      params.push(trx_type);
    }

    if (start_date) {
      sql += ' AND t1.trx_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND t1.trx_date <= ?';
      params.push(end_date);
    }

    if (wlt_type) {
      if (wlt_type === 'CASH') {
        sql += ' AND t2.wlt_type IN (\'CASH\', \'CHECK_CARD\')';
      } else {
        sql += ' AND t2.wlt_type = ?';
        params.push(wlt_type);
      }
    }

    sql += ' ORDER BY t1.trx_date DESC, t1.trx_id DESC';

    const rows = await query(sql, params);
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('지출 목록 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '지출 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ... POST 메서드는 그대로 유지 ...