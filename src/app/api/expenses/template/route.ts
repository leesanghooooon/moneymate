import { NextRequest } from 'next/server';
import ExcelJS, { Cell } from 'exceljs';
import { dbSelect } from '../../../../lib/db-utils';

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
  const sheet = workbook.addWorksheet('지출등록');

  // 요구사항: 헤더는 한글명, usr_id/wlt_id 제거, 할부 관련 및 is_* 제거
  const columns: { header: string; key: string; width?: number }[] = [
    { header: '거래유형', key: 'trx_type', width: 12 },
    { header: '거래일자', key: 'trx_date', width: 14 },
    { header: '금액', key: 'amount', width: 12 },
    { header: '카테고리', key: 'category_cd', width: 22 },
    { header: '메모', key: 'memo', width: 40 }
  ];
  sheet.columns = columns;

  // 스타일: 헤더(1행)
  const headerRow = sheet.getRow(1);
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

  const maxRows = 10001;
  const ws: any = sheet; // dataValidations 타입 미정으로 any 캐스팅

  // 거래유형 드롭다운: 코드 한글명으로 구성 (TRX_TYPE → 수입/지출)
  ws.dataValidations.add('A2:A' + maxRows, {
    type: 'list',
    allowBlank: false,
    formulae: ['"수입,지출"']
  });

  // 날짜 포맷 (YYYY-MM-DD)
  sheet.getColumn('trx_date').numFmt = 'yyyy-mm-dd';

  // 금액: 숫자만 허용 (0 초과)
  ws.dataValidations.add('C2:C' + maxRows, {
    type: 'whole',
    operator: 'greaterThan',
    allowBlank: false,
    formulae: [0]
  });

  // 카테고리 드롭다운: 카테고리 한글명 목록으로 구성
  // Excel 데이터 유효성의 formula 길이 제한을 고려해 255자 초과시 일부만 사용
  const joined = categoryNames.join(',');
  const categoryFormula = joined.length > 255 ? '"' + categoryNames.slice(0, 20).join(',') + '"' : '"' + joined + '"';
  ws.dataValidations.add('D2:D' + maxRows, {
    type: 'list',
    allowBlank: false,
    formulae: [categoryFormula]
  });

  // 주석 및 안내
  // is_fixed, is_installment은 템플릿에서 제거되었으며, 엑셀 업로드 API에서 기본값 'N'으로 처리 예정
  headerRow.getCell(5).note = '선택 입력 (비워둘 수 있음)';

  // 첫 행 고정 및 필터
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
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
