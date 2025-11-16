import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type TxRow = {
  wlt_id: string;
  wlt_name: string;
  trx_date: string;
  memo: string | null;
  category_name: string;
  amount: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const wlt_type = searchParams.get('wlt_type'); // optional

    if (!usr_id) {
      return NextResponse.json({ success: false, message: 'usr_id가 필요합니다.' }, { status: 400 });
    }

    const today = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : today.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : (today.getMonth() + 1);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ success: false, message: 'year, month 파라미터가 올바르지 않습니다.' }, { status: 400 });
    }

    const mm = String(month).padStart(2, '0');
    const startDate = `${year}-${mm}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 말일
    // 1) 지갑 목록을 기준으로 조회 (없어도 한 로우씩 나오도록)
    let walletSql = `
      SELECT wlt_id, wlt_name, wlt_type
      FROM MMT_WLT_MST
      WHERE usr_id = ?
        AND use_yn = 'Y'
    `;
    const walletParams: any[] = [usr_id];
    if (wlt_type) {
      if (wlt_type === 'CASH') {
        walletSql += " AND wlt_type IN ('CASH', 'CHECK_CARD')";
      } else {
        walletSql += ' AND wlt_type = ?';
        walletParams.push(wlt_type);
      }
    }
    walletSql += ' ORDER BY created_at ASC';
    const wallets = await query(walletSql, walletParams) as Array<{ wlt_id: string; wlt_name: string }>;

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        period: { year, month, display: `${year}년 ${month}월` }
      });
    }

    // 2) 해당 지갑들의 월별 지출 트랜잭션 조회
    const wltIds = wallets.map(w => w.wlt_id);
    // IN 절 파라미터 구성
    const inPlaceholders = wltIds.map(() => '?').join(',');
    const txSql = `
      SELECT
        t2.wlt_id,
        t2.wlt_name,
        t1.trx_date,
        t1.memo,
        (CASE
          WHEN t1.trx_type = 'EXPENSE' THEN (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'CATEGORY' AND cd = t1.category_cd)
          WHEN t1.trx_type = 'INCOME' THEN (SELECT cd_nm FROM MMT_CMM_CD_MST WHERE grp_cd = 'INCOME' AND cd = t1.category_cd)
          ELSE ''
        END) AS category_name,
        t1.amount
      FROM MMT_TRX_TRN t1
      JOIN MMT_WLT_MST t2 ON t1.wlt_id = t2.wlt_id
      WHERE t1.usr_id = ?
        AND t1.use_yn = 'Y'
        AND t1.trx_type = 'EXPENSE'
        AND t1.trx_date >= ?
        AND t1.trx_date <= ?
        AND t1.wlt_id IN (${inPlaceholders})
      ORDER BY t2.wlt_name ASC, t1.trx_date ASC, t1.trx_id ASC
    `;
    const txParams: any[] = [usr_id, startDate, endDate, ...wltIds];
    const rows = (await query(txSql, txParams)) as TxRow[];

    // 3) 지갑 기준으로 그룹화 (없어도 빈 transactions로 한 로우 생성)
    const map = new Map<string, { wlt_id: string; wlt_name: string; transactions: Array<{ date: number; item: string; category: string; amount: number }> }>();
    // 먼저 모든 지갑 엔트리 생성
    for (const w of wallets) {
      map.set(String(w.wlt_id), { wlt_id: String(w.wlt_id), wlt_name: String(w.wlt_name), transactions: [] });
    }
    // 거래 채우기
    for (const r of rows) {
      const day = Number(r.trx_date.split('-')[2]);
      const key = String(r.wlt_id);
      const entry = map.get(key);
      if (!entry) continue;
      entry.transactions.push({
        date: day,
        item: r.memo || '',
        category: r.category_name || '',
        amount: Number(r.amount) || 0
      });
    }
    const data = Array.from(map.values());

    return NextResponse.json({
      success: true,
      data,
      period: { year, month, display: `${year}년 ${month}월` }
    });
  } catch (error: any) {
    console.error('월별 지갑별 지출 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: error?.message || '월별 지갑별 지출 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


