import { query } from './db';

export type WhereFilters = Record<string, any>;

function buildWhereClause(filters: WhereFilters = {}, allowedFields: string[] = []) {
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.length > 0 && !allowedFields.includes(key)) continue;
    if (value === undefined || value === null || value === '') continue;
    conditions.push(`${key} = ?`);
    params.push(value);
  }

  const clause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

export async function dbSelect(options: {
  table: string;
  columns?: string[];
  filters?: WhereFilters;
  allowedFilterFields?: string[];
  orderBy?: string;
  limit?: number;
}): Promise<any[]> {
  const { table, columns = ['*'], filters = {}, allowedFilterFields = [], orderBy, limit } = options;
  const { clause, params } = buildWhereClause(filters, allowedFilterFields);
  const cols = columns.join(', ');
  const order = orderBy ? ` ORDER BY ${orderBy}` : '';
  const lim = limit && limit > 0 ? ` LIMIT ${limit}` : '';
  const sql = `SELECT ${cols} FROM ${table}${clause}${order}${lim}`;
  return query<any>(sql, params);
}

export async function dbInsert(options: { table: string; data: Record<string, any> }) {
  const { table, data } = options;
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const params = keys.map((k) => data[k]);
  const rows: any = await query<any>(sql, params);
  return rows;
}

export async function dbUpdate(options: { table: string; data: Record<string, any>; filters: WhereFilters; allowedFilterFields?: string[] }) {
  const { table, data, filters, allowedFilterFields = [] } = options;
  const setKeys = Object.keys(data);
  const setClause = setKeys.map((k) => `${k} = ?`).join(', ');
  const setParams = setKeys.map((k) => data[k]);
  const { clause, params } = buildWhereClause(filters, allowedFilterFields);
  const sql = `UPDATE ${table} SET ${setClause}${clause}`;
  const rows: any = await query<any>(sql, [...setParams, ...params]);
  return rows;
}

export async function dbDelete(options: { table: string; filters: WhereFilters; allowedFilterFields?: string[] }) {
  const { table, filters, allowedFilterFields = [] } = options;
  const { clause, params } = buildWhereClause(filters, allowedFilterFields);
  const sql = `DELETE FROM ${table}${clause}`;
  const rows: any = await query<any>(sql, params);
  return rows;
}
