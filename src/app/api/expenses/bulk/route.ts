import { NextRequest, NextResponse } from 'next/server';
import { dbInsert, dbSelect } from '../../../../lib/db-utils';
import { v4 as uuidv4 } from 'uuid';

interface BulkExpenseRow {
  거래유형: string;
  거래일자: string;
  금액: number;
  카테고리: string;
  메모?: string;
}

interface ProcessedRow {
  trx_id: string;
  usr_id: string;
  wlt_id: string;
  trx_type: 'INCOME' | 'EXPENSE';
  trx_date: string;
  amount: number;
  category_cd: string;
  memo: string | null;
  is_fixed: 'N';
  is_installment: 'N';
  installment_months: null;
  installment_seq: null;
  installment_group_id: null;
  use_yn: 'Y';
}

/**
 * @swagger
 * /api/expenses/bulk:
 *   post:
 *     summary: 엑셀 파일로 다건 거래 등록
 *     description: |
 *       엑셀 파일을 업로드하여 여러 거래를 한번에 등록합니다.
 *       - 템플릿의 한글명을 서버에서 코드로 매핑합니다.
 *       - is_fixed, is_installment는 기본값 'N'으로 설정됩니다.
 *       - 할부 관련 필드는 현재 지원하지 않습니다.
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - usr_id
 *               - wlt_id
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 엑셀 파일 (.xlsx)
 *               usr_id:
 *                 type: string
 *                 description: 사용자 ID
 *               wlt_id:
 *                 type: string
 *                 description: 지갑 ID
 *     responses:
 *       200:
 *         description: 다건 거래 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "총 5건의 거래가 등록되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_count:
 *                       type: integer
 *                       description: 등록된 총 거래 건수
 *                     success_count:
 *                       type: integer
 *                       description: 성공한 거래 건수
 *                     failed_count:
 *                       type: integer
 *                       description: 실패한 거래 건수
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                             description: 실패한 행 번호
 *                           error:
 *                             type: string
 *                             description: 오류 메시지
 *       400:
 *         description: 잘못된 요청 (파일 형식 오류, 필수 필드 누락 등)
 *       500:
 *         description: 서버 오류
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const usr_id = formData.get('usr_id') as string;
    const wlt_id = formData.get('wlt_id') as string;

    // 필수 필드 검증
    if (!file || !usr_id || !wlt_id) {
      return NextResponse.json(
        { message: '파일, 사용자 ID, 지갑 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { message: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // ExcelJS를 사용하여 파일 읽기
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { message: '엑셀 파일에 워크시트가 없습니다.' },
        { status: 400 }
      );
    }

    // 헤더 검증
    const expectedHeaders = ['거래유형', '거래일자', '금액', '메모', '카테고리'];
    const actualHeaders: string[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      actualHeaders[colNumber - 1] = cell.value as string;
    });

    const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { message: `필수 컬럼이 누락되었습니다: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // 카테고리 매핑을 위한 공통코드 조회
    const categories = await dbSelect({
      table: 'MMT_CMM_CD_MST',
      columns: ['cd', 'cd_nm'],
      filters: { grp_cd: 'CATEGORY', use_yn: 'Y' },
      allowedFilterFields: ['grp_cd', 'use_yn']
    });

    const categoryMapping: Record<string, string> = {};
    categories.forEach((cat: any) => {
      categoryMapping[cat.cd_nm] = cat.cd;
    });

    // 데이터 처리
    const processedRows: ProcessedRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    let rowNumber = 2; // 헤더 다음 행부터 시작

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // 헤더 건너뛰기

      try {
        const rowData: BulkExpenseRow = {
          거래유형: row.getCell(1).value as string,
          거래일자: row.getCell(2).value as string,
          금액: Number(row.getCell(3).value),
          메모: row.getCell(4).value as string || '',
          카테고리: row.getCell(5).value as string
        };

        // 데이터 검증
        if (!rowData.거래유형 || !rowData.거래일자 || !rowData.금액 || !rowData.카테고리) {
          throw new Error('필수 필드가 누락되었습니다.');
        }

        if (rowData.금액 <= 0) {
          throw new Error('금액은 0보다 커야 합니다.');
        }

        // 거래유형 매핑
        const trx_type = rowData.거래유형 === '수입' ? 'INCOME' : 
                        rowData.거래유형 === '지출' ? 'EXPENSE' : null;
        if (!trx_type) {
          throw new Error('거래유형은 "수입" 또는 "지출"이어야 합니다.');
        }

        // 카테고리 매핑
        const category_cd = categoryMapping[rowData.카테고리];
        if (!category_cd) {
          throw new Error(`알 수 없는 카테고리입니다: ${rowData.카테고리}`);
        }

        // 날짜 형식 검증
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(rowData.거래일자)) {
          throw new Error('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
        }

        const processedRow: ProcessedRow = {
          trx_id: uuidv4(),
          usr_id,
          wlt_id,
          trx_type,
          trx_date: rowData.거래일자,
          amount: rowData.금액,
          category_cd,
          memo: rowData.메모 || null,
          is_fixed: 'N', // 기본값
          is_installment: 'N', // 기본값
          installment_months: null,
          installment_seq: null,
          installment_group_id: null,
          use_yn: 'Y'
        };

        processedRows.push(processedRow);
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          error: error.message || '알 수 없는 오류'
        });
      }

      rowNumber++;
    });

    // 데이터베이스에 일괄 등록
    let successCount = 0;
    for (const row of processedRows) {
      try {
        await dbInsert({
          table: 'MMT_TRX_TRN',
          data: row
        });
        successCount++;
      } catch (error: any) {
        errors.push({
          row: processedRows.indexOf(row) + 2,
          error: `데이터베이스 등록 실패: ${error.message}`
        });
      }
    }

    const totalCount = processedRows.length + errors.length;
    const failedCount = errors.length;

    return NextResponse.json({
      message: `총 ${totalCount}건 중 ${successCount}건의 거래가 등록되었습니다.`,
      data: {
        total_count: totalCount,
        success_count: successCount,
        failed_count: failedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('엑셀 등록 오류:', error);
    return NextResponse.json(
      { message: error?.message || '엑셀 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
