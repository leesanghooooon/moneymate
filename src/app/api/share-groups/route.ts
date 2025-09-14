import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert } from '../../../lib/db-utils';

// 가계부 공유 그룹 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usr_id = searchParams.get('usr_id');

    if (!usr_id) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자가 속한 공유 그룹 목록 조회
    const groups = await dbSelect({
      table: 'MMT_USR_SHARE_GRP g',
      columns: [
        'g.*',
        'm.role as user_role',
        {
          name: '(SELECT COUNT(*) FROM MMT_USR_SHARE_MEMBER WHERE grp_id = g.grp_id AND status = \'ACCEPTED\')',
          alias: 'member_count'
        }
      ],
      joins: [
        {
          type: 'INNER',
          table: 'MMT_USR_SHARE_MEMBER m',
          on: 'g.grp_id = m.grp_id'
        }
      ],
      filters: {
        'm.usr_id': usr_id,
        'm.status': 'ACCEPTED'
      },
      allowedFilterFields: ['m.usr_id', 'm.status'],
      orderBy: 'g.created_at DESC'
    });

    return NextResponse.json({
      success: true,
      data: groups
    });

  } catch (error) {
    console.error('공유 그룹 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '공유 그룹 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 가계부 공유 그룹 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      grp_name,
      owner_usr_id
    } = body;

    // 필수 필드 검증
    if (!grp_name || !owner_usr_id) {
      return NextResponse.json(
        { success: false, message: '그룹명과 소유자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // UUID 생성
    const grp_id = crypto.randomUUID();

    // 공유 그룹 생성
    await dbInsert({
      table: 'MMT_USR_SHARE_GRP',
      data: {
        grp_id,
        grp_name,
        owner_usr_id
      }
    });

    // 그룹 생성자를 OWNER로 멤버에 추가
    await dbInsert({
      table: 'MMT_USR_SHARE_MEMBER',
      data: {
        grp_id,
        usr_id: owner_usr_id,
        role: 'OWNER',
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    });

    return NextResponse.json({
      success: true,
      message: '공유 그룹이 생성되었습니다.',
      data: { grp_id }
    });

  } catch (error) {
    console.error('공유 그룹 생성 오류:', error);
    return NextResponse.json(
      { success: false, message: '공유 그룹 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 