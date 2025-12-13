import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST as string;
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER as string;
    const password = process.env.DB_PASSWORD as string;
    const database = process.env.DB_DATABASE as string;

    // 환경변수 확인 및 로깅
    console.log('[DB] Initializing connection pool...', {
      hasHost: !!host,
      hasUser: !!user,
      hasPassword: !!password,
      hasDatabase: !!database,
      port,
      host: host || 'not set',
      user: user || 'not set',
      database: database || 'not set',
    });

    if (!host || !user || !password || !database) {
      const missing = [];
      if (!host) missing.push('DB_HOST');
      if (!user) missing.push('DB_USER');
      if (!password) missing.push('DB_PASSWORD');
      if (!database) missing.push('DB_DATABASE');
      
      const errorMsg = `DB env vars are missing: ${missing.join(', ')}. Please set all required environment variables.`;
      console.error('[DB]', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+09:00',
        dateStrings: true,
        // 연결 타임아웃 설정
        connectTimeout: 30000, // 30초
        timeout: 30000, // 30초
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      
      console.log('[DB] Connection pool created successfully', {
        host,
        port,
        database,
        user,
      });
    } catch (error: any) {
      console.error('[DB] Failed to create connection pool:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      throw error;
    }
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const p = getPool();
    const [rows] = await p.query(sql, params);
    return rows as T[];
  } catch (error: any) {
    console.error('[DB] Query error:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sql: sql.substring(0, 100), // SQL 일부만 로깅
      paramsCount: params.length,
    });
    throw error;
  }
}

// default export for backward compatibility (lazy initialization)
const getDefaultPool = () => getPool();
export default getDefaultPool;
