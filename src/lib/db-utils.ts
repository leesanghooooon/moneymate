import { query } from './db';

interface JoinOptions {
  type: 'LEFT' | 'RIGHT' | 'INNER';
  table: string;
  on: string;
}

interface ColumnOptions {
  name: string;
  alias: string;
}

interface SelectOptions {
  table: string;
  columns: (string | ColumnOptions)[];
  filters?: Record<string, any>;
  allowedFilterFields?: string[];
  orderBy?: string;
  joins?: JoinOptions[];
}

export async function dbSelect(options: SelectOptions) {
  const { table, columns, filters = {}, allowedFilterFields = [], orderBy } = options;

  // 컬럼 처리 - 문자열과 객체 모두 지원
  const columnStrings = columns.map(col => {
    if (typeof col === 'string') {
      return col;
    } else {
      return `${col.name} AS ${col.alias}`;
    }
  });

  let sql = `SELECT ${columnStrings.join(', ')} FROM ${table}`;

  // JOIN 절 추가
  if (options.joins) {
    for (const join of options.joins) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }
  }
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
  filters?: Record<string, any>;
  allowedFilterFields?: string[];
  where?: string;
  params?: any[];
}

export async function dbUpdate(options: UpdateOptions) {
  const { table, data, filters = {}, allowedFilterFields = [], where, params = [] } = options;
  const setColumns = Object.keys(data);
  const setValues = Object.values(data);

  let sql = `UPDATE ${table} SET ${setColumns.map(col => `${col} = ?`).join(', ')}`;
  let whereValues: any[] = [];

  // WHERE 절 구성
  if (where) {
    // 직접 WHERE 절을 제공한 경우
    sql += ` WHERE ${where}`;
    whereValues = params;
  } else if (filters && allowedFilterFields.length > 0) {
    // filters를 사용한 WHERE 절 구성 (dbSelect와 동일한 방식)
    const whereConditions: string[] = [];
    for (const field of allowedFilterFields) {
      if (filters[field] !== undefined) {
        whereConditions.push(`${field} = ?`);
        whereValues.push(filters[field]);
      }
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    } else {
      throw new Error('업데이트 조건이 필요합니다.');
    }
  } else {
    throw new Error('WHERE 절이 필요합니다. (where 또는 filters를 제공해주세요)');
  }

  // 쿼리 로깅
  console.log('=== UPDATE Query ===');
  console.log('SQL:', sql);
  console.log('Parameters:', [...setValues, ...whereValues]);
  console.log('==================');

  return query(sql, [...setValues, ...whereValues]);
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
