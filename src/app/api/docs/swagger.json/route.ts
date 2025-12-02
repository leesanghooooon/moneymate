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
    paths: {},
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  };

  return NextResponse.json(specs);
}
