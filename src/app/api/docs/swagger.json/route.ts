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
          summary: '공통코드 목록 조회',
          description: '공통코드를 그룹 코드별로 조회합니다.',
          tags: ['CommonCodes'],
          parameters: [
            {
              in: 'query',
              name: 'grp_cd',
              required: false,
              schema: { type: 'string' },
              description: '코드 그룹 (예: BANK, CATEGORY, GOAL_TYPE)'
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
          description: '사용자의 지갑 목록을 조회합니다.',
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
                        items: { $ref: '#/components/schemas/Wallet' }
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
                      message: { type: 'string', example: '지갑이 등록되었습니다.' },
                      data: { $ref: '#/components/schemas/Wallet' }
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
      },
      '/wallets/{id}': {
        get: {
          summary: '지갑 상세 조회',
          description: '특정 지갑의 상세 정보를 조회합니다.',
          tags: ['Wallets'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: '지갑 ID'
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
                      data: { $ref: '#/components/schemas/Wallet' }
                    }
                  }
                }
              }
            },
            '404': {
              description: '지갑을 찾을 수 없음',
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
        put: {
          summary: '지갑 수정',
          description: '지갑 정보를 수정합니다.',
          tags: ['Wallets'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: '지갑 ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WalletUpdateRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: '수정 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '지갑이 수정되었습니다.' },
                      data: { $ref: '#/components/schemas/Wallet' }
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
            '404': {
              description: '지갑을 찾을 수 없음',
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
        delete: {
          summary: '지갑 삭제',
          description: '지갑을 삭제합니다 (실제로는 use_yn을 N으로 변경).',
          tags: ['Wallets'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: '지갑 ID'
            }
          ],
          responses: {
            '200': {
              description: '삭제 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '지갑이 삭제되었습니다.' }
                    }
                  }
                }
              }
            },
            '404': {
              description: '지갑을 찾을 수 없음',
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
      },
      '/transactions': {
        get: {
          summary: '거래 목록 조회',
          description: '사용자의 수입/지출 거래 목록을 조회합니다.',
          tags: ['Transactions'],
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
              name: 'trx_type',
              required: false,
              schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
              description: '거래 유형 (수입/지출)'
            },
            {
              in: 'query',
              name: 'start_date',
              required: false,
              schema: { type: 'string', format: 'date' },
              description: '조회 시작일 (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'end_date',
              required: false,
              schema: { type: 'string', format: 'date' },
              description: '조회 종료일 (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'wlt_id',
              required: false,
              schema: { type: 'string' },
              description: '지갑 ID (특정 지갑의 거래만 조회)'
            },
            {
              in: 'query',
              name: 'category_cd',
              required: false,
              schema: { type: 'string' },
              description: '카테고리 코드'
            },
            {
              in: 'query',
              name: 'is_fixed',
              required: false,
              schema: { type: 'string', enum: ['Y', 'N'] },
              description: '고정 지출 여부'
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
                        items: { $ref: '#/components/schemas/Transaction' }
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
          summary: '거래 등록',
          description: '새로운 수입/지출 거래를 등록합니다.',
          tags: ['Transactions'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '거래 등록 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '거래가 등록되었습니다.' },
                      data: { $ref: '#/components/schemas/Transaction' }
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
      },
      '/transactions/{id}': {
        get: {
          summary: '거래 상세 조회',
          description: '특정 거래의 상세 정보를 조회합니다.',
          tags: ['Transactions'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: '거래 ID'
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
                      data: { $ref: '#/components/schemas/Transaction' }
                    }
                  }
                }
              }
            },
            '404': {
              description: '거래를 찾을 수 없음',
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
        put: {
          summary: '거래 수정',
          description: '거래 정보를 수정합니다.',
          tags: ['Transactions'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: '거래 ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionUpdateRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: '수정 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '거래가 수정되었습니다.' },
                      data: { $ref: '#/components/schemas/Transaction' }
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
            '404': {
              description: '거래를 찾을 수 없음',
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
        delete: {
          summary: '거래 삭제',
          description: '거래를 삭제합니다 (실제로는 use_yn을 N으로 변경).',
          tags: ['Transactions'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: '거래 ID'
            }
          ],
          responses: {
            '200': {
              description: '삭제 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '거래가 삭제되었습니다.' }
                    }
                  }
                }
              }
            },
            '404': {
              description: '거래를 찾을 수 없음',
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
      },
      '/health': {
        get: {
          summary: '헬스체크 및 DB 연결 상태 확인',
          description: '서버 상태와 데이터베이스 연결 상태를 확인합니다.',
          tags: ['Health'],
          responses: {
            '200': {
              description: '헬스체크 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                      database: {
                        type: 'object',
                        properties: {
                          connected: { type: 'boolean' },
                          connectionTime: { type: 'number' }
                        }
                      },
                      network: {
                        type: 'object',
                        properties: {
                          dnsResolved: { type: 'boolean' },
                          portReachable: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: '헬스체크 실패',
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
  };

  return NextResponse.json(specs);
}

