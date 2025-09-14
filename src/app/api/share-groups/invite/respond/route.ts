import { NextRequest, NextResponse } from 'next/server';
import { dbSelect, dbUpdate } from '../../../../../lib/db-utils';

// 가계부 공유 그룹 초대 응답
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      grp_id,
      usr_id,
      response // 'ACCEPTED', 'REJECTED', 'WITHDRAWN'
    } = body;

    // 필수 필드 검증
    if (!grp_id || !usr_id || !response) {
      return NextResponse.json(
        { success: false, message: '그룹 ID, 사용자 ID, 응답이 필요합니다.' },
        { status: 400 }
      );
    }

    // 유효한 응답인지 확인
    const validResponses = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'];
    if (!validResponses.includes(response)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 응답입니다.' },
        { status: 400 }
      );
    }

    // 초대 상태 확인
    const invitation = await dbSelect({
      table: 'MMT_USR_SHARE_MEMBER',
      columns: ['*'],
      filters: {
        'grp_id': grp_id,
        'usr_id': usr_id,
        'status': 'PENDING'
      },
      allowedFilterFields: ['grp_id', 'usr_id', 'status']
    });

    if (!invitation || invitation.length === 0) {
      return NextResponse.json(
        { success: false, message: '처리할 초대가 없습니다.' },
        { status: 404 }
      );
    }

    // 응답에 따른 업데이트 데이터 준비
    const updateData: any = {
      status: response
    };

    if (response === 'ACCEPTED') {
      updateData.accepted_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    // 초대 응답 업데이트
    await dbUpdate({
      table: 'MMT_USR_SHARE_MEMBER',
      data: updateData,
      filters: {
        'grp_id': grp_id,
        'usr_id': usr_id,
        'status': 'PENDING'
      },
      allowedFilterFields: ['grp_id', 'usr_id', 'status']
    });

    const responseMessages = {
      'ACCEPTED': '초대를 수락했습니다.',
      'REJECTED': '초대를 거절했습니다.',
      'WITHDRAWN': '초대를 철회했습니다.'
    };

    return NextResponse.json({
      success: true,
      message: responseMessages[response as keyof typeof responseMessages]
    });

  } catch (error) {
    console.error('공유 그룹 초대 응답 오류:', error);
    return NextResponse.json(
      { success: false, message: '공유 그룹 초대 응답 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 