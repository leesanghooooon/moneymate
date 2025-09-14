import { NextRequest, NextResponse } from 'next/server';
import { dbSelect } from '../../../../lib/db-utils';

// 사용자가 받은 공유 그룹 초대 목록 조회
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

    // 사용자가 받은 PENDING 상태의 초대 목록 조회 (그룹 정보 포함)
    const invitations = await dbSelect({
      table: 'MMT_USR_SHARE_MEMBER m',
      columns: [
        'm.*',
        'g.grp_name',
        'g.owner_usr_id',
        'u.nickname as owner_usr_nickname',
        {
          name: '(SELECT COUNT(*) FROM MMT_USR_SHARE_MEMBER WHERE grp_id = m.grp_id AND status = \'ACCEPTED\')',
          alias: 'member_count'
        }
      ],
      joins: [
        {
          type: 'INNER',
          table: 'MMT_USR_SHARE_GRP g',
          on: 'm.grp_id = g.grp_id'
        },
        {
          type: 'LEFT',
          table: 'MMT_USR_MST u',
          on: 'g.owner_usr_id = u.id'
        }
      ],
      filters: {
        'm.usr_id': usr_id,
        'm.status': 'PENDING'
      },
      allowedFilterFields: ['m.usr_id', 'm.status'],
      orderBy: 'm.invited_at DESC'
    });

    return NextResponse.json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('초대 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '초대 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 