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
      '/expenses/{id}': {
        get: {
          summary: '지출 상세 조회',
          description: '지출 ID로 상세 정보를 조회합니다.',
          tags: ['Expenses'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '지출 ID (trx_id)'
            }
          ],
          responses: {
            '200': {
              description: '지출 상세 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ExpenseDetail' }
                    }
                  }
                }
              }
            },
            '404': {
              description: '지출 정보를 찾을 수 없음',
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
      '/expenses': {
        get: {
          summary: '지출 목록 조회',
          description: '사용자의 지출 목록을 조회합니다.',
          tags: ['Expenses'],
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
              schema: {
                type: 'string',
                enum: ['INCOME', 'EXPENSE']
              },
              description: '거래 유형 (수입/지출)'
            },
            {
              in: 'query',
              name: 'start_date',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: '조회 시작일 (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'end_date',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: '조회 종료일 (YYYY-MM-DD)'
            }
          ],
          responses: {
            '200': {
              description: '지출 목록 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ExpenseListItem' }
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
          summary: '지출 등록',
          description: '지출 내역을 등록합니다. 할부 결제의 경우 과거 회차도 자동으로 등록됩니다.',
          tags: ['Expenses'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExpenseCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '지출 등록 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { 
                        type: 'string',
                        example: '지출이 등록되었습니다.'
                      },
                      data: {
                        type: 'object',
                        properties: {
                          registered_count: {
                            type: 'integer',
                            description: '등록된 지출 건수'
                          }
                        }
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
        }
      },
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
      '/calendar': {
        get: {
          summary: '캘린더 조회',
          description: '월별 캘린더 데이터를 조회합니다. 각 날짜별 수입/지출 합계와 상세 내역을 포함합니다.',
          tags: ['Calendar'],
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
              name: 'yyyy',
              required: true,
              schema: { type: 'string' },
              description: '연도 (예: 2024)'
            },
            {
              in: 'query',
              name: 'mm',
              required: true,
              schema: { type: 'string' },
              description: '월 (예: 03)'
            }
          ],
          responses: {
            '200': {
              description: '캘린더 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CalendarDay' }
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
        }
      },
      '/users/{id}': {
        get: {
          summary: '회원 정보 조회',
          description: '사용자 ID로 회원 정보를 조회합니다.',
          tags: ['Users'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          responses: {
            '200': {
              description: '회원 정보 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            '404': {
              description: '사용자를 찾을 수 없음',
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
          summary: '로그인 검증',
          description: '사용자 ID와 비밀번호로 로그인을 검증합니다.',
          tags: ['Users'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserLoginRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: '로그인 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: '로그인에 성공했습니다.'
                      },
                      data: { $ref: '#/components/schemas/User' }
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
            '401': {
              description: '인증 실패',
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
      '/users': {
        post: {
          summary: '회원가입',
          description: '새로운 사용자를 등록합니다.',
          tags: ['Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '회원가입 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: '회원가입이 완료되었습니다.'
                      },
                      data: {
                        $ref: '#/components/schemas/User'
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
            '409': {
              description: '중복된 이메일',
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
        put: {
          summary: '지갑 수정',
          description: '지정된 ID의 지갑 정보를 수정합니다.',
          tags: ['Wallets'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '수정할 지갑의 ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['usr_id', 'wlt_type', 'wlt_name'],
                  properties: {
                    usr_id: {
                      type: 'string',
                      description: '사용자 ID'
                    },
                    wlt_type: {
                      type: 'string',
                      enum: ['CASH', 'CHECK_CARD', 'CREDIT_CARD'],
                      description: '지갑 유형'
                    },
                    wlt_name: {
                      type: 'string',
                      description: '지갑 이름'
                    },
                    bank_cd: {
                      type: 'string',
                      nullable: true,
                      description: '은행/카드사 코드'
                    },
                    is_default: {
                      type: 'string',
                      enum: ['Y', 'N'],
                      default: 'N',
                      description: '기본 지갑 여부'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '지갑 수정 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: '지갑이 수정되었습니다.'
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
            '401': {
              description: '인증되지 않은 요청',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '403': {
              description: '권한 없음',
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
          description: '지정된 ID의 지갑을 삭제합니다.',
          tags: ['Wallets'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '삭제할 지갑의 ID'
            }
          ],
          responses: {
            '200': {
              description: '지갑 삭제 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: '지갑이 삭제되었습니다.'
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: '인증되지 않은 요청',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '403': {
              description: '권한 없음',
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
      },
      '/savings-goals': {
        get: {
          summary: '저축목표 목록 조회',
          description: '사용자의 저축목표 목록을 조회합니다.',
          tags: ['SavingsGoals'],
          parameters: [
            {
              in: 'query',
              name: 'usr_id',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          responses: {
            '200': {
              description: '저축목표 목록 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SavingsGoal' }
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
          summary: '저축목표 생성',
          description: '새로운 저축목표를 생성합니다.',
          tags: ['SavingsGoals'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SavingsGoalCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '저축목표 생성 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '저축목표가 생성되었습니다.' },
                      data: {
                        type: 'object',
                        properties: {
                          sav_goal_id: { type: 'string', description: '생성된 저축목표 ID' }
                        }
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
        }
      },
      '/savings-contributions': {
        get: {
          summary: '저축 납입내역 조회',
          description: '사용자의 저축 납입내역을 조회합니다.',
          tags: ['SavingsContributions'],
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
              name: 'sav_goal_id',
              required: false,
              schema: { type: 'string' },
              description: '저축목표 ID (특정 목표의 납입내역만 조회)'
            }
          ],
          responses: {
            '200': {
              description: '납입내역 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SavingsContribution' }
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
          summary: '저축 납입내역 등록',
          description: '저축목표에 대한 납입내역을 등록합니다.',
          tags: ['SavingsContributions'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SavingsContributionCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '납입내역 등록 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: '납입내역이 등록되었습니다.' },
                      data: {
                        type: 'object',
                        properties: {
                          contrib_id: { type: 'string', description: '생성된 납입내역 ID' }
                        }
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
        }
      },
      '/share-groups': {
        get: {
          summary: '공유 그룹 목록 조회',
          description: '사용자가 속한 가계부 공유 그룹 목록을 조회합니다.',
          tags: ['ShareGroups'],
          parameters: [
            {
              in: 'query',
              name: 'usr_id',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          responses: {
            '200': {
              description: '공유 그룹 목록 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ShareGroup' }
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
          summary: '공유 그룹 생성',
          description: '새로운 가계부 공유 그룹을 생성합니다.',
          tags: ['ShareGroups'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShareGroupCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '공유 그룹 생성 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string', example: '공유 그룹이 생성되었습니다.' },
                      data: {
                        type: 'object',
                        properties: {
                          grp_id: { type: 'string', description: '생성된 그룹 ID' }
                        }
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
        }
      },
      '/share-groups/invite': {
        post: {
          summary: '공유 그룹 초대',
          description: '사용자를 가계부 공유 그룹에 초대합니다.',
          tags: ['ShareGroups'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShareGroupInviteRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: '초대 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string', example: '초대가 완료되었습니다.' }
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
            '403': {
              description: '권한 없음',
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
      '/share-groups/invite/respond': {
        post: {
          summary: '공유 그룹 초대 응답',
          description: '가계부 공유 그룹 초대에 대한 응답(수락/거절/철회)을 처리합니다.',
          tags: ['ShareGroups'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShareGroupInviteResponseRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: '응답 처리 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string', example: '초대를 수락했습니다.' }
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
              description: '초대를 찾을 수 없음',
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
      '/stats/weekly-expenses': {
        get: {
          summary: '주간 지출 비교 통계',
          description: '이번 주와 지난 주의 일별 지출을 비교합니다.',
          tags: ['Stats'],
          parameters: [
            {
              in: 'query',
              name: 'usr_id',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          responses: {
            '200': {
              description: '주간 지출 비교 통계 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          daily: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                date: {
                                  type: 'string',
                                  description: '날짜 (예: "12월 15일")'
                                },
                                current_amount: {
                                  type: 'number',
                                  description: '이번 주 지출액'
                                },
                                previous_amount: {
                                  type: 'number',
                                  description: '지난 주 지출액'
                                }
                              }
                            }
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              thisWeekTotal: {
                                type: 'number',
                                description: '이번 주 총 지출액'
                              },
                              lastWeekTotal: {
                                type: 'number',
                                description: '지난 주 총 지출액'
                              },
                              changeRate: {
                                type: 'number',
                                description: '전주 대비 증감률 (%)'
                              }
                            }
                          }
                        }
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
        }
      },
      '/stats/monthly-expenses': {
        get: {
          summary: '월간 지출 통계 조회',
          description: '월별 카테고리별 지출 통계를 조회합니다.',
          tags: ['Stats'],
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
              name: 'year',
              required: false,
              schema: { type: 'string' },
              description: '조회 연도 (기본값: 현재 연도)'
            }
          ],
          responses: {
            '200': {
              description: '월간 지출 통계 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: {
                              type: 'string',
                              description: '월 (예: "1월")'
                            },
                            additionalProperties: {
                              type: 'number',
                              description: '카테고리별 지출 금액'
                            }
                          }
                        }
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
        }
      },
      '/loans': {
        get: {
          summary: '대출현황 목록 조회',
          description: '사용자의 대출현황 목록을 조회합니다. goal_type_cd가 LOAN인 저축목표만 조회됩니다.',
          tags: ['Loans'],
          parameters: [
            {
              in: 'query',
              name: 'usr_id',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          responses: {
            '200': {
              description: '대출현황 목록 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Loan' }
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
          summary: '대출 등록',
          description: '새로운 대출을 등록합니다. goal_type_cd는 자동으로 LOAN으로 설정됩니다.',
          tags: ['Loans'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoanCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: '대출 등록 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string', example: '대출이 등록되었습니다.' },
                      data: {
                        type: 'object',
                        properties: {
                          sav_goal_id: { type: 'string', description: '생성된 대출 ID' }
                        }
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
        }
      },
      '/share-groups/invitations': {
      },
      "/expenses/template": {
        get: {
          summary: "엑셀 거래 등록 템플릿 다운로드",
          description: "엑셀 파일로 거래를 일괄 등록하기 위한 템플릿을 다운로드합니다. 헤더는 한글 컬럼명으로 구성되며, 거래유형과 카테고리는 드롭다운으로 선택 가능합니다.",
          tags: ["Expenses"],
          responses: {
            "200": {
              description: "엑셀 템플릿 파일 다운로드",
              content: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                  schema: {
                    type: "string",
                    format: "binary"
                  },
                  example: "expenses_import_template.xlsx"
                }
              }
            },
            "500": {
              description: "서버 오류",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        }
      },
      "/expenses/bulk": {
        post: {
          summary: "엑셀 파일로 다건 거래 등록",
          description: "엑셀 파일을 업로드하여 여러 거래를 한번에 등록합니다. 템플릿의 한글명을 서버에서 코드로 매핑하며, is_fixed, is_installment는 기본값 N으로 설정됩니다.",
          tags: ["Expenses"],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "usr_id", "wlt_id"],
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "엑셀 파일 (.xlsx)"
                    },
                    usr_id: {
                      type: "string",
                      description: "사용자 ID"
                    },
                    wlt_id: {
                      type: "string",
                      description: "지갑 ID"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "다건 거래 등록 성공",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "총 5건의 거래가 등록되었습니다."
                      },
                      data: {
                        type: "object",
                        properties: {
                          total_count: {
                            type: "integer",
                            description: "등록된 총 거래 건수"
                          },
                          success_count: {
                            type: "integer",
                            description: "성공한 거래 건수"
                          },
                          failed_count: {
                            type: "integer",
                            description: "실패한 거래 건수"
                          },
                          errors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                row: {
                                  type: "integer",
                                  description: "실패한 행 번호"
                                },
                                error: {
                                  type: "string",
                                  description: "오류 메시지"
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "잘못된 요청 (파일 형식 오류, 필수 필드 누락 등)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            },
            "500": {
              description: "서버 오류",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        },
        get: {
          summary: '공유 그룹 초대 목록 조회',
          description: '사용자가 받은 공유 그룹 초대 목록을 조회합니다.',
          tags: ['ShareGroups'],
          parameters: [
            {
              in: 'query',
              name: 'usr_id',
              required: true,
              schema: { type: 'string' },
              description: '사용자 ID'
            }
          ],
          responses: {
            '200': {
              description: '초대 목록 조회 성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ShareGroupInvitation' }
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
        }
      }
    },
    components: {
      schemas: {
        ExpenseDetail: {
          type: 'object',
          properties: {
            trx_id: {
              type: 'string',
              description: '지출 ID'
            },
            wlt_type: {
              type: 'string',
              description: '지갑 유형'
            },
            wlt_name: {
              type: 'string',
              description: '지갑 이름'
            },
            bank_cd: {
              type: 'string',
              description: '은행/카드사 코드'
            },
            usr_id: {
              type: 'string',
              description: '사용자 ID'
            },
            trx_type: {
              type: 'string',
              description: '거래 유형'
            },
            trx_type_name: {
              type: 'string',
              description: '거래 유형명'
            },
            trx_date: {
              type: 'string',
              format: 'date',
              description: '거래 일자'
            },
            amount: {
              type: 'number',
              description: '거래 금액'
            },
            category_cd: {
              type: 'string',
              description: '카테고리 코드'
            },
            category_name: {
              type: 'string',
              description: '카테고리명'
            },
            memo: {
              type: 'string',
              description: '메모'
            },
            is_fixed: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '고정 지출 여부'
            },
            is_installment: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '할부 여부'
            },
            installment_months: {
              type: 'integer',
              description: '할부 개월 수'
            },
            installment_seq: {
              type: 'integer',
              description: '할부 회차'
            },
            installment_group_id: {
              type: 'string',
              description: '할부 그룹 ID'
            }
          }
        },
        ExpenseListItem: {
          type: 'object',
          properties: {
            trx_id: {
              type: 'string',
              description: '지출 ID'
            },
            wlt_name: {
              type: 'string',
              description: '지갑 이름'
            },
            trx_date: {
              type: 'string',
              format: 'date',
              description: '거래 일자'
            },
            amount: {
              type: 'number',
              description: '거래 금액'
            },
            category_name: {
              type: 'string',
              description: '카테고리명'
            },
            memo: {
              type: 'string',
              description: '메모'
            },
            is_installment: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '할부 여부'
            },
            installment_info: {
              type: 'string',
              description: '할부 정보 (예: 3/12)'
            },
            trx_type: {
              type: 'string',
              description: '거래 유형'
            },
            trx_type_name: {
              type: 'string',
              description: '거래 유형명'
            }
          }
        },
        ExpenseCreateRequest: {
          type: 'object',
          required: ['usr_id', 'wlt_id', 'trx_type', 'trx_date', 'amount', 'category_cd'],
          properties: {
            usr_id: {
              type: 'string',
              description: '사용자 ID'
            },
            wlt_id: {
              type: 'string',
              description: '지갑 ID'
            },
            trx_type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
              description: '거래 유형'
            },
            trx_date: {
              type: 'string',
              format: 'date',
              description: '거래 일자 (YYYY-MM-DD)'
            },
            amount: {
              type: 'number',
              description: '거래 금액'
            },
            category_cd: {
              type: 'string',
              description: '카테고리 코드'
            },
            memo: {
              type: 'string',
              description: '메모 (선택사항)'
            },
            is_fixed: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '고정 지출 여부'
            },
            is_installment: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '할부 여부'
            },
            installment_months: {
              type: 'integer',
              minimum: 2,
              maximum: 60,
              description: '할부 개월 수 (할부인 경우 필수)'
            },
            installment_seq: {
              type: 'integer',
              minimum: 1,
              description: '현재 할부 회차 (할부인 경우 필수)'
            }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            wlt_id: { type: 'string', description: '지갑 ID' },
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
        CalendarDay: {
          type: 'object',
          properties: {
            cal_dt: {
              type: 'string',
              format: 'date',
              description: '날짜'
            },
            dow: {
              type: 'string',
              description: '요일 (1: 일요일, 2: 월요일, ..., 7: 토요일)'
            },
            is_holiday: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '공휴일 여부'
            },
            holiday_name: {
              type: 'string',
              nullable: true,
              description: '공휴일 이름'
            },
            income_sum: {
              type: 'number',
              description: '해당 일자의 수입 합계'
            },
            expense_sum: {
              type: 'number',
              description: '해당 일자의 지출 합계'
            },
            trx_list: {
              type: 'array',
              description: '해당 일자의 거래 내역 목록',
              items: {
                type: 'object',
                properties: {
                  trx_id: {
                    type: 'string',
                    description: '거래 ID'
                  },
                  trx_type: {
                    type: 'string',
                    enum: ['INCOME', 'EXPENSE'],
                    description: '거래 유형'
                  },
                  amount: {
                    type: 'number',
                    description: '거래 금액'
                  },
                  category_cd: {
                    type: 'string',
                    description: '카테고리 코드'
                  },
                  memo: {
                    type: 'string',
                    nullable: true,
                    description: '메모'
                  },
                  wlt_id: {
                    type: 'string',
                    description: '지갑 ID'
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    description: '생성 시각'
                  }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '사용자 ID (로그인 아이디)'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: '앱 내에서 사용하는 고유 식별자'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '사용자 이메일 주소'
            },
            nickname: {
              type: 'string',
              description: '사용자 닉네임'
            },
            profile_image_url: {
              type: 'string',
              nullable: true,
              description: '사용자 프로필 이미지 URL'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'SUSPENDED', 'WITHDRAWN'],
              description: '계정 상태'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '계정 생성 시각'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '계정 정보 최종 수정 시각'
            },
            last_login_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: '최근 로그인 시각'
            }
          }
        },
        UserCreateRequest: {
          type: 'object',
          required: ['id', 'email', 'nickname', 'password'],
          properties: {
            id: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]{4,20}$',
              description: '사용자 ID (영문, 숫자 4-20자)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '사용자 이메일 주소'
            },
            nickname: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: '사용자 닉네임 (2-50자)'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: '비밀번호 (8자 이상)'
            },
            profile_image_url: {
              type: 'string',
              nullable: true,
              description: '사용자 프로필 이미지 URL'
            }
          }
        },
        UserLoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              description: '사용자 비밀번호'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
        },
        SavingsGoal: {
          type: 'object',
          properties: {
            sav_goal_id: {
              type: 'string',
              description: '저축목표 ID'
            },
            usr_id: {
              type: 'string',
              description: '사용자 ID'
            },
            wlt_id: {
              type: 'string',
              nullable: true,
              description: '연결 지갑/계좌 ID'
            },
            goal_name: {
              type: 'string',
              description: '목표명'
            },
            goal_type_cd: {
              type: 'string',
              description: '목표 유형'
            },
            purpose_cd: {
              type: 'string',
              nullable: true,
              description: '목적 코드'
            },
            target_amount: {
              type: 'number',
              description: '목표 금액'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: '시작일'
            },
            end_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: '목표 종료일'
            },
            deposit_cycle_cd: {
              type: 'string',
              nullable: true,
              description: '납입 주기'
            },
            plan_amount: {
              type: 'number',
              nullable: true,
              description: '회차별 계획 납입액'
            },
            alarm_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '알림 사용 여부'
            },
            alarm_day: {
              type: 'integer',
              nullable: true,
              description: '알림 기준일'
            },
            is_paused: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '일시중지 여부'
            },
            is_completed: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '달성 여부'
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모'
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
            },
            wlt_name: {
              type: 'string',
              nullable: true,
              description: '연결된 지갑 이름'
            },
            goal_type_cd_nm: {
              type: 'string',
              nullable: true,
              description: '목표 유형명'
            },
            purpose_cd_nm: {
              type: 'string',
              nullable: true,
              description: '목적 코드명'
            },
            deposit_cycle_cd_nm: {
              type: 'string',
              nullable: true,
              description: '납입 주기명'
            }
          },
          required: ['sav_goal_id', 'usr_id', 'goal_name', 'target_amount', 'start_date']
        },
        SavingsGoalCreateRequest: {
          type: 'object',
          required: ['usr_id', 'goal_name', 'target_amount', 'start_date'],
          properties: {
            usr_id: {
              type: 'string',
              description: '사용자 ID'
            },
            wlt_id: {
              type: 'string',
              nullable: true,
              description: '연결 지갑/계좌 ID'
            },
            goal_name: {
              type: 'string',
              description: '목표명'
            },
            goal_type_cd: {
              type: 'string',
              default: 'SAVINGS',
              description: '목표 유형'
            },
            purpose_cd: {
              type: 'string',
              nullable: true,
              description: '목적 코드'
            },
            target_amount: {
              type: 'number',
              description: '목표 금액'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: '시작일'
            },
            end_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: '목표 종료일'
            },
            deposit_cycle_cd: {
              type: 'string',
              nullable: true,
              description: '납입 주기 (DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY/IRREGULAR)'
            },
            plan_amount: {
              type: 'number',
              nullable: true,
              description: '회차별 계획 납입액'
            },
            alarm_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '알림 사용 여부'
            },
            alarm_day: {
              type: 'integer',
              nullable: true,
              description: '알림 기준일'
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모'
            }
          }
        },
        SavingsContribution: {
          type: 'object',
          properties: {
            contrib_id: {
              type: 'string',
              description: '납입내역 ID'
            },
            sav_goal_id: {
              type: 'string',
              description: '저축목표 ID'
            },
            trx_id: {
              type: 'string',
              nullable: true,
              description: '연결 거래 ID'
            },
            contrib_date: {
              type: 'string',
              format: 'date',
              description: '납입일'
            },
            amount: {
              type: 'number',
              description: '납입 금액'
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모'
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
          required: ['contrib_id', 'sav_goal_id', 'contrib_date', 'amount']
        },
        SavingsContributionCreateRequest: {
          type: 'object',
          required: ['sav_goal_id', 'contrib_date', 'amount'],
          properties: {
            sav_goal_id: {
              type: 'string',
              description: '저축목표 ID'
            },
            trx_id: {
              type: 'string',
              nullable: true,
              description: '연결 거래 ID'
            },
            contrib_date: {
              type: 'string',
              format: 'date',
              description: '납입일'
            },
            amount: {
              type: 'number',
              description: '납입 금액'
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모'
            }
          }
        },
        ShareGroup: {
          type: 'object',
          properties: {
            grp_id: {
              type: 'string',
              description: '공유 그룹 ID'
            },
            grp_name: {
              type: 'string',
              description: '그룹명'
            },
            owner_usr_id: {
              type: 'string',
              description: '그룹 생성자 사용자 ID'
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
            },
            member_count: {
              type: 'integer',
              description: '그룹 멤버 수'
            },
            user_role: {
              type: 'string',
              enum: ['OWNER', 'PARTNER'],
              description: '현재 사용자의 그룹 내 역할'
            }
          },
          required: ['grp_id', 'grp_name', 'owner_usr_id', 'user_role']
        },
        ShareGroupCreateRequest: {
          type: 'object',
          required: ['grp_name', 'owner_usr_id'],
          properties: {
            grp_name: {
              type: 'string',
              description: '그룹명',
              example: '우리 가족 가계부'
            },
            owner_usr_id: {
              type: 'string',
              description: '그룹 생성자 사용자 ID'
            }
          }
        },
        ShareGroupInviteRequest: {
          type: 'object',
          required: ['grp_id', 'invited_usr_id', 'inviter_usr_id'],
          properties: {
            grp_id: {
              type: 'string',
              description: '공유 그룹 ID'
            },
            invited_usr_id: {
              type: 'string',
              description: '초대받을 사용자 ID'
            },
            inviter_usr_id: {
              type: 'string',
              description: '초대하는 사용자 ID'
            },
            role: {
              type: 'string',
              enum: ['OWNER', 'PARTNER'],
              default: 'PARTNER',
              description: '그룹 내 역할'
            }
          }
        },
        ShareGroupInviteResponseRequest: {
          type: 'object',
          required: ['grp_id', 'usr_id', 'response'],
          properties: {
            grp_id: {
              type: 'string',
              description: '공유 그룹 ID'
            },
            usr_id: {
              type: 'string',
              description: '응답하는 사용자 ID'
            },
            response: {
              type: 'string',
              enum: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
              description: '초대 응답 (수락/거절/철회)'
            }
          }
        },
        ShareGroupInvitation: {
          type: 'object',
          properties: {
            grp_id: {
              type: 'string',
              description: '공유 그룹 ID'
            },
            usr_id: {
              type: 'string',
              description: '초대받은 사용자 ID'
            },
            role: {
              type: 'string',
              enum: ['OWNER', 'PARTNER'],
              description: '그룹 내 역할'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
              description: '초대 상태'
            },
            invited_at: {
              type: 'string',
              format: 'date-time',
              description: '초대 시각'
            },
            accepted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: '수락 시각'
            },
            grp_name: {
              type: 'string',
              description: '그룹명'
            },
            owner_usr_id: {
              type: 'string',
              description: '그룹 소유자 ID'
            },
            owner_usr_nickname: {
              type: 'string',
              description: '그룹 소유자 닉네임'
            },
            member_count: {
              type: 'integer',
              description: '그룹 멤버 수'
            }
          },
          required: ['grp_id', 'usr_id', 'role', 'status', 'invited_at', 'grp_name', 'owner_usr_id', 'member_count']
        },
        Loan: {
          type: 'object',
          properties: {
            sav_goal_id: {
              type: 'string',
              description: '대출 ID (저축목표 테이블의 ID 사용)'
            },
            usr_id: {
              type: 'string',
              description: '사용자 ID'
            },
            wlt_id: {
              type: 'string',
              nullable: true,
              description: '연결 지갑/계좌 ID'
            },
            goal_name: {
              type: 'string',
              description: '대출명'
            },
            goal_type_cd: {
              type: 'string',
              enum: ['LOAN'],
              description: '목표 유형 (대출로 고정)'
            },
            purpose_cd: {
              type: 'string',
              nullable: true,
              description: '대출 목적 코드'
            },
            target_amount: {
              type: 'number',
              description: '대출 원금'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: '대출 시작일'
            },
            end_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: '대출 만료일'
            },
            deposit_cycle_cd: {
              type: 'string',
              nullable: true,
              description: '상환 주기'
            },
            plan_amount: {
              type: 'number',
              nullable: true,
              description: '월 상환액'
            },
            alarm_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '알림 사용 여부'
            },
            alarm_day: {
              type: 'integer',
              nullable: true,
              description: '알림 기준일'
            },
            is_paused: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '일시중지 여부'
            },
            is_completed: {
              type: 'string',
              enum: ['Y', 'N'],
              description: '상환 완료 여부'
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모'
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
            },
            wlt_name: {
              type: 'string',
              nullable: true,
              description: '연결된 지갑 이름'
            },
            goal_type_cd_nm: {
              type: 'string',
              nullable: true,
              description: '목표 유형명'
            },
            purpose_cd_nm: {
              type: 'string',
              nullable: true,
              description: '대출 목적 코드명'
            },
            deposit_cycle_cd_nm: {
              type: 'string',
              nullable: true,
              description: '상환 주기명'
            },
            current_amount: {
              type: 'number',
              description: '누적 상환 금액'
            }
          },
          required: ['sav_goal_id', 'usr_id', 'goal_name', 'target_amount', 'start_date', 'goal_type_cd']
        },
        LoanCreateRequest: {
          type: 'object',
          required: ['usr_id', 'goal_name', 'target_amount', 'start_date'],
          properties: {
            usr_id: {
              type: 'string',
              description: '사용자 ID'
            },
            wlt_id: {
              type: 'string',
              nullable: true,
              description: '연결 지갑/계좌 ID'
            },
            goal_name: {
              type: 'string',
              description: '대출명',
              example: '주택 담보 대출'
            },
            purpose_cd: {
              type: 'string',
              nullable: true,
              description: '대출 목적 코드'
            },
            target_amount: {
              type: 'number',
              description: '대출 원금'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: '대출 시작일'
            },
            end_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: '대출 만료일'
            },
            deposit_cycle_cd: {
              type: 'string',
              nullable: true,
              description: '상환 주기 (DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY/IRREGULAR)'
            },
            plan_amount: {
              type: 'number',
              nullable: true,
              description: '월 상환액'
            },
            alarm_yn: {
              type: 'string',
              enum: ['Y', 'N'],
              default: 'N',
              description: '알림 사용 여부'
            },
            alarm_day: {
              type: 'integer',
              nullable: true,
              description: '알림 기준일'
            },
            memo: {
              type: 'string',
              nullable: true,
              description: '메모'
            }
          }
        }
      };

  return NextResponse.json(specs);
}
