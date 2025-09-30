import { get } from './common';

export interface Transaction {
  trx_id: string;
  wlt_id: string;
  wlt_name: string;
  wlt_type: string;
  trx_date: string;
  amount: number;
  category_name: string;
  category_cd: string;
  memo: string;
  is_installment: string;
  installment_info: string | null;
  trx_type: 'INCOME' | 'EXPENSE';
  trx_type_name: string;
  wlt_type_name: string;
}

export interface ExpenseQueryParams {
  usr_id: string;
  trx_type?: 'INCOME' | 'EXPENSE';
  start_date?: string;
  end_date?: string;
  wlt_type?: string;
  wlt_id?: string;
}

/**
 * 지출/수입 목록 조회
 * @param params 조회 파라미터
 * @returns Promise<Transaction[]>
 */
export async function getExpenses(params: ExpenseQueryParams): Promise<Transaction[]> {
  const queryParams: Record<string, string> = {
    usr_id: params.usr_id
  };
  
  if (params.trx_type) {
    queryParams.trx_type = params.trx_type;
  }
  if (params.start_date) {
    queryParams.start_date = params.start_date;
  }
  if (params.end_date) {
    queryParams.end_date = params.end_date;
  }
  if (params.wlt_type) {
    queryParams.wlt_type = params.wlt_type;
  }
  if (params.wlt_id) {
    queryParams.wlt_id = params.wlt_id;
  }
  
  const response = await get<{ data: Transaction[] }>('/expenses', { params: queryParams });
  return response.data.data || [];
}
