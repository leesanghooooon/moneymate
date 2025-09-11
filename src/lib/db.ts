import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+09:00',
  dateStrings: true,
  // 연결 관리 개선을 위한 설정 추가
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 유휴 연결 정리
  idleTimeout: 60000, // 60초
  // 연결 재사용
  namedPlaceholders: true,
  resetAfterUse: false
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// 애플리케이션 종료 시 pool 정리
process.on('SIGINT', () => {
  pool.end().then(() => {
    console.log('Pool connections terminated');
    process.exit(0);
  });
});

export default pool;