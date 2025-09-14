import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbInsert } from '../../../../lib/db-utils';

// 가계부 공유 그룹 초대
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      grp_id,
      invited_usr_id,
      inviter_usr_id,
      role = 'PARTNER'
    } = body;

    // 필수 필드 검증
    if (!grp_id || !invited_usr_id || !inviter_usr_id) {
      return NextResponse.json(
        { success: false, message: '그룹 ID, 초대받을 사용자 ID, 초대하는 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 초대하는 사용자가 해당 그룹의 멤버이고 권한이 있는지 확인
    const inviterMember = await dbSelect({
      table: 'MMT_USR_SHARE_MEMBER',
      columns: ['*'],
      filters: {
        'grp_id': grp_id,
        'usr_id': inviter_usr_id,
        'status': 'ACCEPTED'
      },
      allowedFilterFields: ['grp_id', 'usr_id', 'status']
    });

    if (!inviterMember || inviterMember.length === 0) {
      return NextResponse.json(
        { success: false, message: '초대 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 초대된 사용자인지 확인
    const existingMember = await dbSelect({
      table: 'MMT_USR_SHARE_MEMBER',
      columns: ['*'],
      filters: {
        'grp_id': grp_id,
        'usr_id': invited_usr_id
      },
      allowedFilterFields: ['grp_id', 'usr_id']
    });

    if (existingMember && existingMember.length > 0) {
      const status = existingMember[0].status;
      if (status === 'ACCEPTED') {
        return NextResponse.json(
          { success: false, message: '이미 그룹에 참여한 사용자입니다.' },
          { status: 400 }
        );
      } else if (status === 'PENDING') {
        return NextResponse.json(
          { success: false, message: '이미 초대가 진행 중인 사용자입니다.' },
          { status: 400 }
        );
      }
    }

    // 초대 생성
    await dbInsert({
      table: 'MMT_USR_SHARE_MEMBER',
      data: {
        grp_id,
        usr_id: invited_usr_id,
        role,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      message: '초대가 완료되었습니다.'
    });

  } catch (error) {
    console.error('공유 그룹 초대 오류:', error);
    return NextResponse.json(
      { success: false, message: '공유 그룹 초대 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 