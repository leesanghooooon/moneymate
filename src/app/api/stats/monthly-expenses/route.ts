import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    if (!usr_id) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 카테고리별 월간 지출 통계 조회 SQL
    const sql = `
      WITH RECURSIVE months AS (
        SELECT 1 AS mm UNION ALL SELECT mm + 1 FROM months WHERE mm < 12
      ),
      ucats AS (
        SELECT DISTINCT t.category_cd, c.cd_nm as category_cd_nm
        FROM moneymate.MMT_TRX_TRN t
        LEFT JOIN moneymate.MMT_CMM_CD_MST c 
          ON c.grp_cd = 'CATEGORY' 
          AND c.cd = t.category_cd
        WHERE t.usr_id = ?
          AND t.trx_type = 'EXPENSE'
          AND t.use_yn = 'Y'
      ),
      grid AS (
        SELECT m.mm, u.category_cd, u.category_cd_nm 
        FROM months m CROSS JOIN ucats u
      ),
      totals AS (
        SELECT MONTH(trx_date) AS mm, category_cd, SUM(amount) AS total
        FROM moneymate.MMT_TRX_TRN
        WHERE usr_id = ?
          AND trx_type = 'EXPENSE'
          AND use_yn = 'Y'
          AND YEAR(trx_date) = ?
        GROUP BY MONTH(trx_date), category_cd
      )
      SELECT 
        CONCAT(g.mm, '월') AS month,
        GROUP_CONCAT(
          DISTINCT
          COALESCE(
            CASE WHEN g.category_cd = t.category_cd THEN COALESCE(t.total, 0) END,
            0
          )
          ORDER BY g.category_cd
          SEPARATOR ','
        ) AS amounts,
        GROUP_CONCAT(
          DISTINCT g.category_cd
          ORDER BY g.category_cd
          SEPARATOR ','
        ) AS categories,
        GROUP_CONCAT(
          DISTINCT g.category_cd_nm
          ORDER BY g.category_cd
          SEPARATOR ','
        ) AS category_names
      FROM grid g
      LEFT JOIN totals t ON t.mm = g.mm AND t.category_cd = g.category_cd
      GROUP BY g.mm
      ORDER BY g.mm;
    `;

    const result = await query(sql, [usr_id, usr_id, year]);

    // 결과 데이터 가공
    const processedResult = result.map((row: any) => {
      const amounts = (row.amounts || '').split(',').map(Number);
      const categories = (row.categories || '').split(',').filter(Boolean);  // 빈 문자열 제거
      const categoryNames = (row.category_names || '').split(',');
      
      const categoryData = categories.reduce((acc: any, cat: string, idx: number) => {
        acc[cat] = {
          amount: amounts[idx] || 0,  // 금액이 없으면 0으로 설정
          name: categoryNames[idx] || cat  // 이름이 없으면 코드값으로 설정
        };
        return acc;
      }, {});

      return {
        month: row.month,
        ...categoryData
      };
    });

    return NextResponse.json({
      success: true,
      data: processedResult
    });

  } catch (error) {
    console.error('월간 지출 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '월간 지출 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}