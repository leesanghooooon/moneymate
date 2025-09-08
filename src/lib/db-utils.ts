import { query } from './db';

interface SelectOptions {
  table: string;
  columns: string[];
  filters?: Record<string, any>;
  allowedFilterFields?: string[];
  orderBy?: string;
}

export async function dbSelect(options: SelectOptions) {
  const { table, columns, filters = {}, allowedFilterFields = [], orderBy } = options;

  let sql = `SELECT ${columns.join(', ')} FROM ${table}`;
  const params: any[] = [];

  // WHERE 절 구성
  const whereConditions: string[] = [];
  if (filters && allowedFilterFields.length > 0) {
    for (const field of allowedFilterFields) {
      if (filters[field] !== undefined) {
        whereConditions.push(`${field} = ?`);
        params.push(filters[field]);
      }
    }
  }

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // ORDER BY 절 추가
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  // 쿼리 로깅
  console.log('=== SELECT Query ===');
  console.log('SQL:', sql);
  console.log('Parameters:', params);
  console.log('==================');

  return query(sql, params);
}

interface InsertOptions {
  table: string;
  data: Record<string, any>;
}

export async function dbInsert(options: InsertOptions) {
  const { table, data } = options;
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = new Array(values.length).fill('?').join(', ');

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

  // 쿼리 로깅
  console.log('=== INSERT Query ===');
  console.log('SQL:', sql);
  console.log('Parameters:', values);
  console.log('==================');

  return query(sql, values);
}

interface UpdateOptions {
  table: string;
  data: Record<string, any>;
  filters: Record<string, any>;
  allowedFilterFields: string[];
}

export async function dbUpdate(options: UpdateOptions) {
  const { table, data, filters, allowedFilterFields } = options;
  const setColumns = Object.keys(data);
  const values = Object.values(data);

  let sql = `UPDATE ${table} SET ${setColumns.map(col => `${col} = ?`).join(', ')}`;
  
  // WHERE 절 구성
  const whereConditions: string[] = [];
  const whereValues: any[] = [];
  for (const field of allowedFilterFields) {
    if (filters[field] !== undefined) {
      whereConditions.push(`${field} = ?`);
      whereValues.push(filters[field]);
    }
  }

  if (whereConditions.length === 0) {
    throw new Error('업데이트 조건이 필요합니다.');
  }

  sql += ` WHERE ${whereConditions.join(' AND ')}`;

  // 쿼리 로깅
  console.log('=== UPDATE Query ===');
  console.log('SQL:', sql);
  console.log('Parameters:', [...values, ...whereValues]);
  console.log('==================');

  return query(sql, [...values, ...whereValues]);
}

interface DeleteOptions {
  table: string;
  filters: Record<string, any>;
  allowedFilterFields: string[];
}

export async function dbDelete(options: DeleteOptions) {
  const { table, filters, allowedFilterFields } = options;
  
  // WHERE 절 구성
  const whereConditions: string[] = [];
  const values: any[] = [];
  for (const field of allowedFilterFields) {
    if (filters[field] !== undefined) {
      whereConditions.push(`${field} = ?`);
      values.push(filters[field]);
    }
  }

  if (whereConditions.length === 0) {
    throw new Error('삭제 조건이 필요합니다.');
  }

  const sql = `DELETE FROM ${table} WHERE ${whereConditions.join(' AND ')}`;

  // 쿼리 로깅
  console.log('=== DELETE Query ===');
  console.log('SQL:', sql);
  console.log('Parameters:', values);
  console.log('==================');

  return query(sql, values);
}
