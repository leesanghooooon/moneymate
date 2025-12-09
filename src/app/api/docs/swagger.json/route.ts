import { NextRequest, NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';

// 기본 옵션 (서버 URL은 동적으로 설정)
const getOptions = (baseUrl: string) => ({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoneyMate API',
      version: '1.0.0',
      description: '가계부 애플리케이션 API 문서',
    },
    servers: [
      {
        url: `${baseUrl}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
      ...(baseUrl !== 'http://localhost:3000' ? [{
        url: 'http://localhost:3000/api',
        description: 'Local development server',
      }] : []),
    ],
    components: {
      schemas: {
        Wallet: {
          type: 'object',
          properties: {
            wlt_id: {
              type: 'string',
              description: '지갑 ID',
            },
            usr_id: {
              type: 'string',
              description: '사용자 ID',
            },
            wlt_type: {
              type: 'string',
              enum: ['CARD', 'CASH', 'ACCOUNT', 'SIMPLE_PAY'],
              description: '지갑 유형',
            },
            wlt_name: {
              type: 'string',
              description: '지갑 이름',
            },
            bank_cd: {
              type: 'string',
              nullable: true,
              description: '은행 코드',
            },
            card_number: {
              type: 'string',
              nullable: true,
              description: '카드 번호',
            },
            is_default: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '기본 지갑 여부',
            },
            use_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '사용 여부',
            },
            share_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '지갑 공유 여부',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성 시각',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정 시각',
            },
          },
          required: ['wlt_id', 'usr_id', 'wlt_type', 'wlt_name'],
        },
        WalletCreateRequest: {
          type: 'object',
          required: ['usr_id', 'wlt_type', 'wlt_name'],
          properties: {
            usr_id: {
              type: 'string',
              description: '사용자 ID',
            },
            wlt_type: {
              type: 'string',
              enum: ['CARD', 'CASH', 'ACCOUNT', 'SIMPLE_PAY'],
              description: '지갑 유형',
            },
            wlt_name: {
              type: 'string',
              description: '지갑 이름',
            },
            bank_cd: {
              type: 'string',
              nullable: true,
              description: '은행 코드',
            },
            card_number: {
              type: 'string',
              nullable: true,
              description: '카드 번호',
            },
            is_default: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '기본 지갑 여부',
            },
            use_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'Y',
              description: '사용 여부',
            },
            share_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '지갑 공유 여부',
            },
          },
        },
        WalletUpdateRequest: {
          type: 'object',
          properties: {
            wlt_type: {
              type: 'string',
              enum: ['CARD', 'CASH', 'ACCOUNT', 'SIMPLE_PAY'],
              description: '지갑 유형',
            },
            wlt_name: {
              type: 'string',
              description: '지갑 이름',
            },
            bank_cd: {
              type: 'string',
              nullable: true,
              description: '은행 코드',
            },
            card_number: {
              type: 'string',
              nullable: true,
              description: '카드 번호',
            },
            is_default: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '기본 지갑 여부',
            },
            use_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '사용 여부',
            },
            share_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '지갑 공유 여부',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            trx_id: {
              type: 'string',
              description: '거래 ID',
            },
            wlt_id: {
              type: 'string',
              description: '지갑 ID',
            },
            wlt_name: {
              type: 'string',
              description: '지갑 이름',
            },
            wlt_type: {
              type: 'string',
              description: '지갑 유형',
            },
            usr_id: {
              type: 'string',
              description: '사용자 ID',
            },
            trx_type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
              description: '거래 유형',
            },
            trx_date: {
              type: 'string',
              format: 'date',
              description: '거래 일자',
            },
            amount: {
              type: 'number',
              description: '거래 금액',
            },
            category_cd: {
              type: 'string',
              description: '카테고리 코드',
            },
            category_name: {
              type: 'string',
              description: '카테고리명',
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모',
            },
            is_fixed: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '고정 지출 여부',
            },
            is_installment: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '할부 여부',
            },
            installment_months: {
              type: 'integer',
              nullable: true,
              description: '할부 개월 수',
            },
            installment_seq: {
              type: 'integer',
              nullable: true,
              description: '할부 회차',
            },
            installment_group_id: {
              type: 'string',
              nullable: true,
              description: '할부 그룹 ID',
            },
            use_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '사용 여부',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성 시각',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정 시각',
            },
          },
          required: ['trx_id', 'wlt_id', 'usr_id', 'trx_type', 'trx_date', 'amount', 'category_cd'],
        },
        TransactionCreateRequest: {
          type: 'object',
          required: ['wlt_id', 'usr_id', 'trx_type', 'trx_date', 'amount', 'category_cd'],
          properties: {
            wlt_id: {
              type: 'string',
              description: '지갑 ID',
            },
            usr_id: {
              type: 'string',
              description: '사용자 ID',
            },
            trx_type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
              description: '거래 유형',
            },
            trx_date: {
              type: 'string',
              format: 'date',
              description: '거래 일자 (YYYY-MM-DD)',
            },
            amount: {
              type: 'number',
              description: '거래 금액',
            },
            category_cd: {
              type: 'string',
              description: '카테고리 코드',
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모',
            },
            is_fixed: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '고정 지출 여부',
            },
          },
        },
        TransactionUpdateRequest: {
          type: 'object',
          properties: {
            wlt_id: {
              type: 'string',
              description: '지갑 ID',
            },
            trx_type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
              description: '거래 유형',
            },
            trx_date: {
              type: 'string',
              format: 'date',
              description: '거래 일자 (YYYY-MM-DD)',
            },
            amount: {
              type: 'number',
              description: '거래 금액',
            },
            category_cd: {
              type: 'string',
              description: '카테고리 코드',
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모',
            },
            is_fixed: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '고정 지출 여부',
            },
          },
        },
        CommonCode: {
          type: 'object',
          properties: {
            grp_cd: {
              type: 'string',
              description: '코드 그룹 (예: BANK, CATEGORY, GOAL_TYPE)',
            },
            cd: {
              type: 'string',
              description: '코드 값 (예: 004, FOOD, SAVINGS)',
            },
            cd_nm: {
              type: 'string',
              description: '코드 이름 (예: 국민은행, 식비, 저축)',
            },
            cd_desc: {
              type: 'string',
              nullable: true,
              description: '코드 설명 (선택적)',
            },
            sort_order: {
              type: 'integer',
              description: '정렬 순서',
            },
            use_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '사용 여부 (Y/N)',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성 시각',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정 시각',
            },
          },
          required: ['grp_cd', 'cd'],
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '에러 메시지',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/app/api/**/*.ts', // API 라우트 파일 경로 (개발 환경)
    './app/api/**/*.ts', // 빌드 환경 경로
  ],
});

export async function GET(request: NextRequest) {
  try {
    // 환경 변수 또는 요청 헤더에서 base URL 동적으로 추출
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    // 환경 변수가 없으면 요청 헤더나 URL에서 추출
    if (!baseUrl) {
      // X-Forwarded-Host 또는 Host 헤더 확인 (프록시 환경 대응)
      const host = request.headers.get('x-forwarded-host') || 
                   request.headers.get('host') || 
                   null;
      const protocol = request.headers.get('x-forwarded-proto') || 
                       (request.url.startsWith('https') ? 'https' : 'http');
      
      if (host) {
        baseUrl = `${protocol}://${host}`;
      } else {
        const url = new URL(request.url);
        baseUrl = `${url.protocol}//${url.host}`;
      }
    }
    
    // 동적으로 서버 URL 설정
    const options = getOptions(baseUrl);
    
    const specs = swaggerJSDoc(options);
    return NextResponse.json(specs);
  } catch (error: any) {
    console.error('Swagger 문서 생성 오류:', error);
    return NextResponse.json(
      { message: 'Swagger 문서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

