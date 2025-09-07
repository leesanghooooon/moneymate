import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST as string;
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER as string;
    const password = process.env.DB_PASSWORD as string;
    const database = process.env.DB_DATABASE as string;

    if (!host || !user || !password || !database) {
      throw new Error('DB env vars are missing. Please set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE');
    }

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
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getPool();
  const [rows] = await p.query(sql, params);
  return rows as T[];
}
