import { NextRequest } from 'next/server';
import ExcelJS, { Cell } from 'exceljs';
import { dbSelect } from '../../../../lib/db-utils';
import { categoryMappingData } from '../../../../lib/category-mapping';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/expenses/template:
 *   get:
 *     summary: 엑셀 거래 등록 템플릿 다운로드
 *     description: |
 *       엑셀 파일로 거래를 일괄 등록하기 위한 템플릿을 다운로드합니다.
 *       - 헤더는 한글 컬럼명으로 구성됩니다.
 *       - 거래유형과 카테고리는 드롭다운으로 선택 가능합니다.
 *       - 메모 입력 시 카테고리 자동 매핑 기능이 포함됩니다.
 *       - is_fixed, is_installment는 제거되었으며 서버에서 기본값 'N'으로 처리됩니다.
 *       - 할부 관련 필드는 현재 지원하지 않습니다.
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: 엑셀 템플릿 파일 다운로드
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *             example: "expenses_import_template.xlsx"
 *       500:
 *         description: 서버 오류
 */
export async function GET(_req: NextRequest) {
  // 카테고리(한글명) 조회
  const categories = await dbSelect({
    table: 'MMT_CMM_CD_MST',
    columns: ['cd_nm'],
    filters: { grp_cd: 'CATEGORY', use_yn: 'Y' },
    allowedFilterFields: ['grp_cd', 'use_yn'],
    orderBy: 'sort_order, cd'
  });
  const categoryNames: string[] = (categories || []).map((c: any) => String(c.cd_nm)).filter(Boolean);

  const workbook = new ExcelJS.Workbook();
  
  // 첫 번째 시트: 거래 등록
  const mainSheet = workbook.addWorksheet('거래등록');
  
  // 두 번째 시트: 카테고리 매핑
  const mappingSheet = workbook.addWorksheet('카테고리매핑');

  // 메인 시트 컬럼 설정
  const columns: { header: string; key: string; width?: number }[] = [
    { header: '거래유형', key: 'trx_type', width: 12 },
    { header: '거래일자', key: 'trx_date', width: 14 },
    { header: '금액', key: 'amount', width: 12 },
    { header: '카테고리', key: 'category_cd', width: 22 },
    { header: '메모', key: 'memo', width: 40 }
  ];
  mainSheet.columns = columns;

  // 메인 시트 헤더 스타일
  const headerRow = mainSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF111827' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;
  headerRow.eachCell((cell: Cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    } as any;
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    } as any;
  });

  // 카테고리 매핑 시트 설정
  const mappingColumns = [
    { header: '메모 키워드', key: 'memo_keyword', width: 30 },
    { header: '카테고리', key: 'category', width: 20 }
  ];
  mappingSheet.columns = mappingColumns;

  // 카테고리 매핑 시트 헤더 스타일
  const mappingHeaderRow = mappingSheet.getRow(1);
  mappingHeaderRow.font = { bold: true, color: { argb: 'FF111827' } };
  mappingHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  mappingHeaderRow.height = 20;
  mappingHeaderRow.eachCell((cell: Cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    } as any;
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    } as any;
  });

  // 카테고리 매핑 데이터 추가 (예시)
  const mappingData = categoryMappingData;

  // 매핑 데이터를 시트에 추가
  mappingData.forEach((item, index) => {
    const row = mappingSheet.getRow(index + 2);
    row.getCell(1).value = item.memo_keyword;
    row.getCell(2).value = item.category;
    
    // 매핑 데이터 스타일
    row.eachCell((cell: Cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      } as any;
    });
  });

  const maxRows = 10001;
  const ws: any = mainSheet; // dataValidations 타입 미정으로 any 캐스팅

  // 거래유형 드롭다운: 코드 한글명으로 구성 (TRX_TYPE → 수입/지출)
  ws.dataValidations.add('A2:A' + maxRows, {
    type: 'list',
    allowBlank: false,
    formulae: ['"수입,지출"']
  });

  // 날짜 포맷 (YYYY-MM-DD)
  mainSheet.getColumn('trx_date').numFmt = 'yyyy-mm-dd';

  // 금액: 숫자만 허용 (0 초과)
  ws.dataValidations.add('C2:C' + maxRows, {
    type: 'whole',
    operator: 'greaterThan',
    allowBlank: false,
    formulae: [0]
  });

  // 카테고리 드롭다운: 카테고리 한글명 목록으로 구성
  const joined = categoryNames.join(',');
  const categoryFormula = joined.length > 255 ? '"' + categoryNames.slice(0, 20).join(',') + '"' : '"' + joined + '"';
  ws.dataValidations.add('D2:D' + maxRows, {
    type: 'list',
    allowBlank: false,
    formulae: [categoryFormula]
  });

  // 카테고리 자동 매핑을 위한 수식 추가 (E열 메모 입력 시 D열 카테고리 자동 설정)
  // VLOOKUP 함수를 사용하여 메모에서 키워드를 찾아 카테고리 자동 설정
  for (let i = 2; i <= maxRows; i++) {
    const categoryCell = mainSheet.getRow(i).getCell(4); // D열 (카테고리)
    const memoCell = mainSheet.getRow(i).getCell(5); // E열 (메모)
    
    // 메모가 입력되면 자동으로 카테고리를 설정하는 수식
    // categoryCell.value = {
    //   formula: `=IF(E${i}<>"",VLOOKUP(E${i},카테고리매핑!A:B,2,FALSE),"")`
    // };
    categoryCell.value = {
      formula: `=IF(E${i}<>"",
        IFERROR(
          VLOOKUP(E${i},카테고리매핑!A:B,2,FALSE),
          IFERROR(
            INDEX(카테고리매핑!B:B, MATCH(TRUE, ISNUMBER(SEARCH(카테고리매핑!A:A, E${i})), 0)),
            "기타"
          )
        ),
      "")`
    };
  }

  // 주석 및 안내
  headerRow.getCell(5).note = '메모 입력 시 카테고리가 자동으로 설정됩니다. 수동으로 변경도 가능합니다.';

  // 첫 행 고정 및 필터
  mainSheet.views = [{ state: 'frozen', ySplit: 1 }];
  mainSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length }
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="expenses_import_template.xlsx"',
      'Cache-Control': 'no-store'
    }
  });
}
