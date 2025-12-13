import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { lookup } from 'dns/promises';
import { createConnection } from 'net';

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 헬스체크 및 DB 연결 상태 확인
 *     description: 서버 상태와 데이터베이스 연결 상태를 확인합니다.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 헬스체크 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     connectionTime:
 *                       type: number
 *                       description: 연결 시간 (ms)
 *                 environment:
 *                   type: object
 *                   properties:
 *                     nodeEnv:
 *                       type: string
 *                     dbHost:
 *                       type: string
 *                     dbPort:
 *                       type: string
 *                     dbDatabase:
 *                       type: string
 *                     dbUser:
 *                       type: string
 *       500:
 *         description: 헬스체크 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 timestamp:
 *                   type: string
 *                 error:
 *                   type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     error:
 *                       type: string
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Health check started`);
  
  const healthStatus = {
    status: 'ok' as 'ok' | 'error',
    timestamp,
    database: {
      connected: false,
      connectionTime: 0,
      error: null as string | null,
    },
    network: {
      dnsResolved: false,
      dnsAddresses: [] as string[],
      portReachable: false,
      portCheckError: null as string | null,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'not set',
      // dbHost: process.env.DB_HOST ? '***' : 'not set',
      dbHost: process.env.DB_HOST || 'not set',
      dbPort: process.env.DB_PORT || 'not set',
      dbDatabase: process.env.DB_DATABASE || 'not set',
      dbUser: process.env.DB_USER ? '***' : 'not set',
      dbPassword: process.env.DB_PASSWORD ? '***' : 'not set',
    },
  };

  // 환경변수 확인
  console.log(`[${timestamp}] Environment variables check:`, {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
    DB_PORT: process.env.DB_PORT || 'not set',
    DB_DATABASE: process.env.DB_DATABASE || 'not set',
    DB_USER: process.env.DB_USER ? 'set' : 'not set',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'set' : 'not set',
  });

  // 필수 환경변수 확인
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD'];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  
  if (missingEnvVars.length > 0) {
    console.error(`[${timestamp}] Missing required environment variables:`, missingEnvVars);
    healthStatus.status = 'error';
    healthStatus.database.error = `Missing environment variables: ${missingEnvVars.join(', ')}`;
    
    return NextResponse.json(healthStatus, { status: 500 });
  }

  // 1. DNS 해석 테스트
  const dbHost = process.env.DB_HOST!;
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  
  try {
    console.log(`[${timestamp}] Testing DNS resolution for ${dbHost}...`);
    const dnsStartTime = Date.now();
    const addresses = await lookup(dbHost, { all: true });
    const dnsTime = Date.now() - dnsStartTime;
    
    healthStatus.network.dnsResolved = true;
    healthStatus.network.dnsAddresses = addresses.map(addr => addr.address);
    
    console.log(`[${timestamp}] DNS resolution successful in ${dnsTime}ms:`, healthStatus.network.dnsAddresses);
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown DNS error';
    console.error(`[${timestamp}] DNS resolution failed:`, {
      message: errorMessage,
      code: error?.code,
      hostname: dbHost,
    });
    
    healthStatus.network.dnsResolved = false;
    healthStatus.network.dnsAddresses = [];
    healthStatus.status = 'error';
    healthStatus.database.error = `DNS resolution failed: ${errorMessage}`;
    
    // DNS 해석 실패 시 DB 연결 테스트는 건너뜀
    const totalTime = Date.now() - startTime;
    console.log(`[${timestamp}] Health check completed in ${totalTime}ms. Status: ${healthStatus.status}`);
    return NextResponse.json(healthStatus, { status: 500 });
  }

  // 2. 포트 연결 가능 여부 테스트
  try {
    console.log(`[${timestamp}] Testing port connectivity to ${dbHost}:${dbPort}...`);
    const portStartTime = Date.now();
    
    await new Promise<void>((resolve, reject) => {
      const socket = createConnection({ host: dbHost, port: dbPort }, () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('error', (error) => {
        reject(error);
      });
      
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('Port connection timeout'));
      });
    });
    
    const portTime = Date.now() - portStartTime;
    healthStatus.network.portReachable = true;
    console.log(`[${timestamp}] Port connectivity test successful in ${portTime}ms`);
    
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown port connection error';
    console.error(`[${timestamp}] Port connectivity test failed:`, {
      message: errorMessage,
      code: error?.code,
      host: dbHost,
      port: dbPort,
    });
    
    healthStatus.network.portReachable = false;
    healthStatus.network.portCheckError = errorMessage;
    healthStatus.status = 'error';
    healthStatus.database.error = `Port connection failed: ${errorMessage}`;
    
    // 포트 연결 실패 시 DB 연결 테스트는 건너뜀
    const totalTime = Date.now() - startTime;
    console.log(`[${timestamp}] Health check completed in ${totalTime}ms. Status: ${healthStatus.status}`);
    return NextResponse.json(healthStatus, { status: 500 });
  }

  // 3. DB 연결 테스트
  let connection = null;
  try {
    console.log(`[${timestamp}] Attempting database connection...`);
    const dbStartTime = Date.now();
    
    const pool = getPool();
    connection = await pool.getConnection();
    console.log(`[${timestamp}] Database connection acquired`);
    
    // 간단한 쿼리 실행 (SELECT 1)
    const [rows] = await connection.query('SELECT 1 as test, NOW() as currentDate');
    console.log(`[${timestamp}] Database query successful:`, rows);
    
    const dbEndTime = Date.now();
    healthStatus.database.connected = true;
    healthStatus.database.connectionTime = dbEndTime - dbStartTime;
    
    console.log(`[${timestamp}] Database connection test completed in ${healthStatus.database.connectionTime}ms`);
    
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown database error';
    console.error(`[${timestamp}] Database connection failed:`, {
      message: errorMessage,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      stack: error?.stack,
    });
    
    healthStatus.status = 'error';
    healthStatus.database.connected = false;
    healthStatus.database.error = errorMessage;
    healthStatus.database.connectionTime = Date.now() - startTime;
    
  } finally {
    if (connection) {
      connection.release();
      console.log(`[${timestamp}] Database connection released`);
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`[${timestamp}] Health check completed in ${totalTime}ms. Status: ${healthStatus.status}`);

  const statusCode = healthStatus.status === 'ok' ? 200 : 500;
  return NextResponse.json(healthStatus, { status: statusCode });
}

