import { NextRequest, NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
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
    components: {
      schemas: {
        Expense: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '지출 ID',
            },
            amount: {
              type: 'number',
              description: '지출 금액',
            },
            category: {
              type: 'string',
              description: '카테고리',
              enum: ['식비', '교통', '쇼핑', '여가', '고정비', '기타'],
            },
            paymentType: {
              type: 'string',
              description: '결제 수단',
              enum: ['현금', '카드', '이체', '간편결제'],
            },
            cardBrand: {
              type: 'string',
              description: '카드사',
              enum: ['신한', '현대', '국민', '롯데', '기타'],
            },
            merchant: {
              type: 'string',
              description: '가맹점/메모',
            },
            spendingType: {
              type: 'string',
              description: '지출 형태',
              enum: ['일시불', '구독', '할부'],
            },
            installmentMonths: {
              type: 'number',
              description: '할부 개월수',
            },
            date: {
              type: 'string',
              format: 'date',
              description: '지출 날짜',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
          },
          required: ['amount', 'category', 'paymentType', 'date'],
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '에러 메시지',
            },
            code: {
              type: 'string',
              description: '에러 코드',
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'],
};

const specs = swaggerJSDoc(options);

export async function GET(request: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MoneyMate API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '/api/docs/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            });
          };
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
