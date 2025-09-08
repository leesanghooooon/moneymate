import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const specs = {
    openapi: '3.0.0',
    info: {
      title: 'MoneyMate API',
      version: '1.0.0',
      description: '가계부 애플리케이션 API 문서',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    paths: {
      '/common-codes': {
        get: {
          summary: '공통 코드 조회',
          description: 'MMT_CMM_CD_MST 테이블에서 공통 코드를 조회합니다.',
          tags: ['CommonCodes'],
          parameters: [
            {
              in: 'query',
              name: 'grp_cd',
              required: true,
              schema: { type: 'string' },
              description: '코드 그룹 (예: CATEGORY, BANK 등)'
            },
            {
              in: 'query',
              name: 'use_yn',
              required: false,
              schema: { type: 'string', enum: ['Y', 'N'], default: 'Y' },
              description: '사용 여부 (기본값: Y)'
            }
          ],
          responses: {
            '200': {
              description: '조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CommonCode' }
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: '서버 오류',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/wallets': {
        get: {
          summary: '지갑 목록 조회',
          description: '사용자의 지갑 목록을 조회합니다. 지갑 유형을 지정하면 해당 유형의 지갑만 조회됩니다.',
          tags: ['Wallets'],
          parameters: [
            {
              in: 'query',
              name: 'usr_id',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            },
            {
              in: 'query',
              name: 'wlt_type',
              required: false,
              schema: {
                type: 'string',
                enum: ['CASH', 'CHECK_CARD', 'CREDIT_CARD']
              },
              description: '지갑 유형 (현금, 체크카드, 신용카드)'
            }
          ],
          responses: {
            '200': {
              description: '지갑 목록 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Wallet' }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: '잘못된 요청',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: '서버 오류',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          summary: '지갑 등록',
          description: 'MMT_WLT_MST 테이블에 새로운 지갑을 등록합니다.',
          tags: ['Wallets'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WalletCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '지갑 등록 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '지갑이 등록되었습니다.' }
                    }
                  }
                }
              }
            },
            '400': {
              description: '잘못된 요청',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '500': {
              description: '서버 오류',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Wallet: {
          type: 'object',
          properties: {
            wlt_id: { type: 'integer', description: '지갑 ID' },
            usr_id: { type: 'string', description: '사용자 ID' },
            wlt_type: {
              type: 'string',
              enum: ['CASH', 'CHECK_CARD', 'CREDIT_CARD'],
              description: '지갑 유형'
            },
            wlt_name: { type: 'string', description: '지갑 이름' },
            bank_cd: {
              type: 'string',
              nullable: true,
              description: '은행/카드사 코드'
            },
            is_default: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '기본 지갑 여부'
            },
            use_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '사용 여부'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성 시각'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정 시각'
            }
          },
          required: ['wlt_id', 'usr_id', 'wlt_type', 'wlt_name', 'is_default', 'use_yn']
        },
        CommonCode: {
          type: 'object',
          properties: {
            grp_cd: { type: 'string', description: '코드 그룹' },
            cd: { type: 'string', description: '코드 값' },
            cd_nm: { type: 'string', description: '코드 이름' },
            cd_desc: { type: 'string', nullable: true, description: '코드 설명' },
            sort_order: { type: 'integer', description: '정렬 순서' },
            use_yn: { type: 'string', enum: ['Y', 'N'], description: '사용 여부' },
            created_at: { type: 'string', format: 'date-time', description: '생성 시각' },
            updated_at: { type: 'string', format: 'date-time', description: '수정 시각' }
          },
          required: ['grp_cd', 'cd', 'cd_nm']
        },
        WalletCreateRequest: {
          type: 'object',
          properties: {
            usr_id: { type: 'string', description: '사용자 ID' },
            wlt_type: { type: 'string', enum: ['CARD', 'CASH', 'ACCOUNT', 'SIMPLE_PAY'], description: '지갑 유형' },
            wlt_name: { type: 'string', description: '지갑 이름' },
            bank_cd: { type: 'string', nullable: true, description: '은행(카드사) 코드' },
            card_number: { type: 'string', nullable: true, description: '카드번호' },
            is_default: { type: 'string', enum: ['Y', 'N'], default: 'N', description: '기본 지갑 여부' },
            use_yn: { type: 'string', enum: ['Y', 'N'], default: 'Y', description: '사용 여부' }
          },
          required: ['usr_id', 'wlt_type', 'wlt_name']
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  };

  return NextResponse.json(specs);
}
