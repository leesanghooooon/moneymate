import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();

    if (!usr_id) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 지갑별 당월 카드지출 통계 조회 SQL (공유지갑 포함)
    const sql = `
      SELECT 
        combined_wallets.wlt_id,
        combined_wallets.wlt_name,
        combined_wallets.wlt_type,
        combined_wallets.is_shared,
        COALESCE(SUM(combined_trx.amount), 0) as total_amount,
        COUNT(combined_trx.trx_id) as transaction_count
      FROM (
        -- 본인의 모든 지갑
        SELECT 
          w.wlt_id,
          w.wlt_name,
          w.wlt_type,
          'N' as is_shared
        FROM moneymate.MMT_WLT_MST w
        WHERE w.usr_id = ? 
          AND w.use_yn = 'Y'
          AND w.wlt_type = 'CREDIT_CARD'
        
        UNION ALL
        
        -- 공유 그룹의 공유 지갑들 (본인 지갑 제외)
        SELECT DISTINCT
          w.wlt_id,
          w.wlt_name,
          w.wlt_type,
          'Y' as is_shared
        FROM moneymate.MMT_WLT_MST w
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m1 ON w.usr_id = m1.usr_id AND m1.status = 'ACCEPTED'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m2 ON m1.grp_id = m2.grp_id AND m2.usr_id = ? AND m2.status = 'ACCEPTED'
        WHERE w.share_yn = 'Y'
          AND w.use_yn = 'Y'
          AND w.wlt_type = 'CREDIT_CARD'
          AND w.usr_id != ?
      ) combined_wallets
      LEFT JOIN (
        -- 본인의 모든 거래
        SELECT 
          t.wlt_id,
          t.amount,
          t.trx_id
        FROM moneymate.MMT_TRX_TRN t
        WHERE t.usr_id = ?
          AND t.trx_type = 'EXPENSE'
          AND t.use_yn = 'Y'
          AND YEAR(t.trx_date) = ?
          AND MONTH(t.trx_date) = ?
        
        UNION ALL
        
        -- 공유 그룹 멤버들의 공유 지갑 거래 (본인 제외)
        SELECT 
          t.wlt_id,
          t.amount,
          t.trx_id
        FROM moneymate.MMT_TRX_TRN t
        INNER JOIN moneymate.MMT_WLT_MST w ON t.wlt_id = w.wlt_id AND w.share_yn = 'Y'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m1 ON t.usr_id = m1.usr_id AND m1.status = 'ACCEPTED'
        INNER JOIN moneymate.MMT_USR_SHARE_MEMBER m2 ON m1.grp_id = m2.grp_id AND m2.usr_id = ? AND m2.status = 'ACCEPTED'
        WHERE t.usr_id != ?
          AND t.trx_type = 'EXPENSE'
          AND t.use_yn = 'Y'
          AND YEAR(t.trx_date) = ?
          AND MONTH(t.trx_date) = ?
      ) combined_trx ON combined_wallets.wlt_id = combined_trx.wlt_id
      GROUP BY combined_wallets.wlt_id, combined_wallets.wlt_name, combined_wallets.wlt_type, combined_wallets.is_shared
      ORDER BY combined_wallets.is_shared ASC, combined_wallets.wlt_name ASC;
    `;

    console.log('=== Wallet Expenses Query with Shared Wallets ===');
    console.log('SQL:', sql);
    console.log('Parameters:', [
      usr_id, usr_id, usr_id, usr_id, year, month,
      usr_id, usr_id, year, month
    ]);
    console.log('===============================================');

    const result = await query(sql, [
      usr_id,        // 본인 지갑 조회용
      usr_id,        // 공유 그룹 멤버 조회용 (m2)
      usr_id,        // 공유 그룹 멤버 조회용 (본인 제외)
      usr_id,        // 본인 거래 조회용
      year,          // 본인 거래 연도
      month,         // 본인 거래 월
      usr_id,        // 공유 그룹 멤버 거래 조회용 (m2)
      usr_id,        // 공유 그룹 멤버 거래 조회용 (본인 제외)
      year,          // 공유 그룹 멤버 거래 연도
      month          // 공유 그룹 멤버 거래 월
    ]);

    // 내지갑과 공유지갑으로 분류
    const myWallets = result.filter((row: any) => row.is_shared === 'N' || row.is_shared === 0);
    const sharedWallets = result.filter((row: any) => row.is_shared === 'Y' || row.is_shared === 1);

    // 각 그룹의 총합 계산 (데이터 타입 보장)
    const myWalletsTotal = myWallets.reduce((sum: number, wallet: any) => {
      const amount = typeof wallet.total_amount === 'string' ? parseFloat(wallet.total_amount) : wallet.total_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const sharedWalletsTotal = sharedWallets.reduce((sum: number, wallet: any) => {
      const amount = typeof wallet.total_amount === 'string' ? parseFloat(wallet.total_amount) : wallet.total_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        period: {
          year: Number(year),
          month: Number(month),
          display: `${year}년 ${month}월`
        },
        myWallets: {
          wallets: myWallets.map((wallet: any) => ({
            ...wallet,
            total_amount: typeof wallet.total_amount === 'string' ? parseFloat(wallet.total_amount) : wallet.total_amount,
            transaction_count: typeof wallet.transaction_count === 'string' ? parseInt(wallet.transaction_count) : wallet.transaction_count
          })),
          totalAmount: myWalletsTotal,
          totalTransactions: myWallets.reduce((sum: number, wallet: any) => {
            const count = typeof wallet.transaction_count === 'string' ? parseInt(wallet.transaction_count) : wallet.transaction_count;
            return sum + (isNaN(count) ? 0 : count);
          }, 0)
        },
        sharedWallets: {
          wallets: sharedWallets.map((wallet: any) => ({
            ...wallet,
            total_amount: typeof wallet.total_amount === 'string' ? parseFloat(wallet.total_amount) : wallet.total_amount,
            transaction_count: typeof wallet.transaction_count === 'string' ? parseInt(wallet.transaction_count) : wallet.transaction_count
          })),
          totalAmount: sharedWalletsTotal,
          totalTransactions: sharedWallets.reduce((sum: number, wallet: any) => {
            const count = typeof wallet.transaction_count === 'string' ? parseInt(wallet.transaction_count) : wallet.transaction_count;
            return sum + (isNaN(count) ? 0 : count);
          }, 0)
        },
        grandTotal: myWalletsTotal + sharedWalletsTotal
      }
    });

  } catch (error) {
    console.error('지갑별 지출 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '지갑별 지출 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
