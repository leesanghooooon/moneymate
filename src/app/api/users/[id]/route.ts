import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const sql = `
      SELECT 
        id,
        uuid,
        email,
        nickname,
        password_hash,
        profile_image_url,
        status,
        created_at,
        updated_at,
        last_login_at
      FROM MMT_USR_MST
      WHERE id = ?
        AND status = 'ACTIVE'
    `;

    const users = await query(sql, [id]);

    if (users.length === 0) {
      return NextResponse.json(
        { message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = users[0];

    // 비밀번호 해시는 응답에서 제외
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({ data: userWithoutPassword });

  } catch (error: any) {
    console.error('사용자 조회 오류:', error);
    return NextResponse.json(
      { message: error?.message || '사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 로그인 검증용 API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    if (!body.password) {
      return NextResponse.json(
        { message: '비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const sql = `
      SELECT 
        id,
        uuid,
        email,
        nickname,
        password_hash,
        profile_image_url,
        status,
        created_at,
        updated_at,
        last_login_at
      FROM MMT_USR_MST
      WHERE id = ?
        AND status = 'ACTIVE'
    `;

    const users = await query(sql, [id]);

    if (users.length === 0) {
      return NextResponse.json(
        { message: '아이디 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 비밀번호 검증
    const isValid = await bcrypt.compare(body.password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { message: '아이디 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 마지막 로그인 시간 업데이트
    const updateSql = `
      UPDATE MMT_USR_MST
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await query(updateSql, [id]);

    // 비밀번호 해시는 응답에서 제외
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({ 
      message: '로그인에 성공했습니다.',
      data: userWithoutPassword 
    });

  } catch (error: any) {
    console.error('로그인 검증 오류:', error);
    return NextResponse.json(
      { message: error?.message || '로그인 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
