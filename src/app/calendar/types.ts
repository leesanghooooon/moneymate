export interface Transaction {
  trx_id: string;
  trx_type: 'INCOME' | 'EXPENSE';
  amount: number;
  category_cd: string;
  category_cd_nm: string;
  memo: string | null;
  wlt_id: string;
  wlt_name: string;
  usr_id: string;
  is_shared: boolean;
  created_at: string;
  trx_date: string;
  is_installment?: 'Y' | 'N';
  installment_info?: string;
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
