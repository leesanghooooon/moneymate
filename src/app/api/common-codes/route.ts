import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '../../../lib/db-common';

// GET /api/common-codes?grp_cd=CATEGORY&use_yn=Y
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grp_cd = searchParams.get('grp_cd') || undefined;
    const use_yn = searchParams.get('use_yn') || 'Y';

    const rows = await dbSelect({
      table: 'MMT_CMM_CD_MST',
      columns: ['grp_cd', 'cd', 'cd_nm', 'cd_desc', 'sort_order', 'use_yn', 'created_at', 'updated_at'],
      filters: { grp_cd, use_yn },
      allowedFilterFields: ['grp_cd', 'use_yn'],
      orderBy: 'grp_cd, sort_order, cd',
    });

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || '공통코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/common-codes  { grp_cd, cd, cd_nm, ... }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await dbInsert({ table: 'MMT_CMM_CD_MST', data: body });
    return NextResponse.json({ message: '생성되었습니다.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || '생성 실패' }, { status: 500 });
  }
}

// PUT /api/common-codes  { data: {...}, filters: { grp_cd, cd } }
export async function PUT(request: NextRequest) {
  try {
    const { data, filters } = await request.json();
    await dbUpdate({ table: 'MMT_CMM_CD_MST', data, filters, allowedFilterFields: ['grp_cd', 'cd'] });
    return NextResponse.json({ message: '수정되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || '수정 실패' }, { status: 500 });
  }
}

// DELETE /api/common-codes  { filters: { grp_cd, cd } }
export async function DELETE(request: NextRequest) {
  try {
    const { filters } = await request.json();
    await dbDelete({ table: 'MMT_CMM_CD_MST', filters, allowedFilterFields: ['grp_cd', 'cd'] });
    return NextResponse.json({ message: '삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || '삭제 실패' }, { status: 500 });
  }
}
