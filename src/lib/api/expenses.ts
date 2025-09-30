import { get, put, del } from './common';

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

export interface ExpenseUpdateRequest {
  trx_date: string;
  amount: number;
  category_cd: string;
  wlt_id: string;
  memo?: string;
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

/**
 * 거래 내역 수정
 * @param transactionId 거래 ID
 * @param data 수정할 거래 데이터
 * @returns Promise<void>
 */
export async function updateExpense(transactionId: string, data: ExpenseUpdateRequest): Promise<void> {
  await put<{ message: string; data: any }>(`/expenses/${transactionId}`, data);
}

/**
 * 거래 내역 삭제
 * @param transactionId 거래 ID
 * @returns Promise<void>
 */
export async function deleteExpense(transactionId: string): Promise<void> {
  await del<{ message: string; data: any }>(`/expenses/${transactionId}`);
}
