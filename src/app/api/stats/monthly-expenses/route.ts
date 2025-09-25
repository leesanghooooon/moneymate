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
        SELECT 1 AS mm
        UNION ALL
        SELECT mm + 1 FROM months WHERE mm < 12
      ),
      totals AS (
        SELECT
            MONTH(trx_date) AS mm,
            category_cd,
            SUM(amount) AS total
        FROM moneymate.MMT_TRX_TRN
        WHERE usr_id = ?           -- usr_id
          AND trx_type = 'EXPENSE'
          AND use_yn = 'Y'
          AND YEAR(trx_date) = ?   -- year
        GROUP BY MONTH(trx_date), category_cd
      )
      SELECT
        CONCAT(m.mm, '월') AS month,
        /* 합계가 존재하는 카테고리만, 동일한 정렬 기준으로 */
        GROUP_CONCAT(t.total ORDER BY t.category_cd SEPARATOR ',')           AS amounts,
        GROUP_CONCAT(t.category_cd ORDER BY t.category_cd SEPARATOR ',')     AS categories,
        GROUP_CONCAT(c.cd_nm ORDER BY t.category_cd SEPARATOR ',')           AS category_names
      FROM months m
      LEFT JOIN totals t
        ON t.mm = m.mm
      LEFT JOIN moneymate.MMT_CMM_CD_MST c
        ON c.grp_cd = 'CATEGORY'
       AND c.cd = t.category_cd
      GROUP BY m.mm
      ORDER BY m.mm;
    `;

    const result = await query(sql, [usr_id, year]);

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