export interface Transaction {
  trx_id: string;
  trx_type: 'INCOME' | 'EXPENSE';
  amount: number;
  category_cd: string;
  memo: string | null;
  wlt_id: string;
  created_at: string;
}

export interface CalendarDay {
  cal_dt: string;
  dow: string;
  is_holiday: 'Y' | 'N';
  holiday_name: string | null;
  income_sum: number;
  expense_sum: number;
  trx_list: Transaction[];
}
