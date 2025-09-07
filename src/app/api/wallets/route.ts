import { NextRequest, NextResponse } from 'next/server';
import { dbInsert } from '../../../lib/db-common';

// POST /api/wallets
// body: { usr_id, wlt_type, wlt_name, bank_cd?, card_number?, is_default?, use_yn? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const required = ['usr_id', 'wlt_type', 'wlt_name'];
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ message: `${k} is required` }, { status: 400 });
      }
    }

    const data = {
      usr_id: body.usr_id,
      wlt_type: body.wlt_type, // CARD | CASH | ACCOUNT | SIMPLE_PAY
      wlt_name: body.wlt_name,
      bank_cd: body.bank_cd ?? null,
      card_number: body.card_number ?? null,
      is_default: body.is_default ?? 'N',
      use_yn: body.use_yn ?? 'Y',
    } as any;

    await dbInsert({ table: 'MMT_WLT_MST', data });
    return NextResponse.json({ message: '지갑이 등록되었습니다.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || '지갑 등록 실패' }, { status: 500 });
  }
}
