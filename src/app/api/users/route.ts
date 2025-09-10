import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbInsert } from '@/lib/db-utils';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.id || !body.email || !body.nickname || !body.password) {
      return NextResponse.json(
        { message: '필수 정보가 누락되었습니다. (id, email, nickname, password)' },
        { status: 400 }
      );
    }

    // ID 형식 검증 (영문, 숫자만 허용, 4~20자)
    const idRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!idRegex.test(body.id)) {
      return NextResponse.json(
        { message: 'ID는 영문과 숫자만 사용하여 4~20자로 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: '유효하지 않은 이메일 형식입니다.' },
        { status: 400 }
      );
    }

    // 닉네임 길이 검증 (2~50자)
    if (body.nickname.length < 2 || body.nickname.length > 50) {
      return NextResponse.json(
        { message: '닉네임은 2자 이상 50자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증 (8자 이상)
    if (body.password.length < 8) {
      return NextResponse.json(
        { message: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(body.password, salt);

    const userData = {
      id: body.id,
      uuid: uuidv4(),
      email: body.email,
      nickname: body.nickname,
      password_hash,
      profile_image_url: body.profile_image_url || null,
      status: 'ACTIVE'
    };

    await dbInsert({
      table: 'MMT_USR_MST',
      data: userData
    });

    // 비밀번호 해시는 응답에서 제외
    const { password_hash: _, ...responseData } = userData;

    return NextResponse.json(
      { 
        message: '회원가입이 완료되었습니다.',
        data: responseData
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('회원가입 오류:', error);

    // 중복 키 오류 처리
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('id')) {
        return NextResponse.json(
          { message: '이미 사용 중인 ID입니다.' },
          { status: 409 }
        );
      }
      if (error.message.includes('email')) {
        return NextResponse.json(
          { message: '이미 등록된 이메일입니다.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: error?.message || '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}